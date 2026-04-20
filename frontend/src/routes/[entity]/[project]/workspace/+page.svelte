<script lang="ts">
	import { page } from '$app/state';
	import { queryStore, getContextClient } from '@urql/svelte';
	import { RUNS_QUERY, SAMPLED_HISTORY_QUERY } from '$lib/graphql/queries';
	import { getColor } from '$lib/utils/colors';
	import StateBadge from '$lib/components/StateBadge.svelte';
	import LineChart from '$lib/components/LineChart.svelte';
	import ParameterImportance from '$lib/components/ParameterImportance.svelte';

	const client = getContextClient();
	const entity = $derived(page.params.entity);
	const project = $derived(page.params.project);

	// Fetch runs
	const runsResult = $derived(
		queryStore({
			client,
			query: RUNS_QUERY,
			variables: { entityName: entity, projectName: project, first: 50 }
		})
	);

	const runs = $derived($runsResult.data?.project?.runs?.edges?.map((e: { node: unknown }) => e.node) ?? []);

	// Track visible runs (default: first 10)
	let visibleRunIds: Set<string> = $state(new Set());
	let initialized = $state(false);

	$effect(() => {
		if (runs.length > 0 && !initialized) {
			visibleRunIds = new Set(runs.slice(0, 10).map((r: { name: string }) => r.name));
			initialized = true;
		}
	});

	const visibleRuns = $derived(runs.filter((r: { name: string }) => visibleRunIds.has(r.name)));

	function toggleRun(name: string) {
		const next = new Set(visibleRunIds);
		if (next.has(name)) next.delete(name);
		else next.add(name);
		visibleRunIds = next;
	}

	function runColor(name: string): string {
		const idx = runs.findIndex((r: { name: string }) => r.name === name);
		return getColor(idx >= 0 ? idx : 0);
	}

	// For each visible run, query historyKeys via RUN_DETAIL_QUERY to discover metric keys
	// Then query sampledHistory for all keys. We'll use a simplified approach:
	// fetch sampledHistory for each visible run using common metric keys.

	// First, discover keys from the first visible run's historyKeys
	const HISTORY_KEYS_QUERY = `
		query HistoryKeys($entity: String!, $project: String!, $run: String!) {
			project(name: $project, entityName: $entity) {
				run(name: $run) {
					historyKeys
				}
			}
		}
	`;

	import { gql } from '@urql/svelte';

	// Query historyKeys for ALL visible runs and merge the metric key sets
	let discoveredKeys: Set<string> = $state(new Set());
	let showSettings = $state(false);
	let settingsTab: 'layout' | 'line-plots' = $state('layout');
	let settingsSubTab: 'data' | 'display' = $state('data');
	let showSectionSettings: Record<string, boolean> = $state({});
	let showPanelEdit = $state(false);
	let panelEditTab: 'data' | 'grouping' | 'chart' | 'legend' | 'expressions' = $state('data');
	let keysDiscovered = $state(false);
	let layoutMode: 'automated' | 'manual' = $state('automated');
	let sectionOrg: 'first' | 'last' = $state('first');

	// Workspace name & menu
	let workspaceName = $state('Personal workspace');
	let showWorkspaceMenu = $state(false);

	// Sidebar state
	let sidebarCollapsed = $state(false);
	let searchQuery = $state('');
	let regexMode = $state(false);
	let showExpandedTable = $state(false);
	let showColorPicker = $state(false);

	// Section state
	let collapsedSections: Record<string, boolean> = $state({});
	let showSectionActions: Record<string, boolean> = $state({});
	let deletedSections: Set<string> = $state(new Set());

	// Report creation
	let showCreateReport = $state(false);

	// Panel picker
	let showPanelPicker = $state(false);
	let panelPickerCategory = $state('');
	let selectedPanelType = $state('');
	let addedPanels: string[] = $state([]);

	// Extract config keys from runs
	const configKeys = $derived.by(() => {
		const keys = new Set<string>();
		for (const run of runs) {
			const config = parseConfig(run.config);
			for (const k of Object.keys(config)) keys.add(k);
		}
		return Array.from(keys);
	});

	// Extract summary metric keys
	const summaryMetricKeys = $derived.by(() => {
		const keys = new Set<string>();
		for (const run of runs) {
			try {
				const summary = JSON.parse(run.summaryMetrics || '{}');
				for (const k of Object.keys(summary)) {
					if (!k.startsWith('_')) keys.add(k);
				}
			} catch {}
		}
		return Array.from(keys);
	});

	// Panel state
	let showPanelMenu: string | null = $state(null);
	let deletedPanels: Set<string> = $state(new Set());

	function deletePanel(key: string) {
		const next = new Set(deletedPanels);
		next.add(key);
		deletedPanels = next;
		showPanelMenu = null;
		pushUndo({ type: 'delete-panel', data: key });
	}

	// Filter/Group/Sort/Columns
	let showFilter = $state(false);
	let showGroup = $state(false);
	let showSort = $state(false);
	let showColumns = $state(false);
	let groupByColumn = $state('');
	let sortByColumn = $state('');

	// Saved views (persisted in localStorage)
	let savedViews: { name: string }[] = $state([]);
	let activeViewName = $state('');
	let showWorkspaceActions = $state(false);
	let showSaveViewDialog = $state(false);
	let showDeleteConfirm = $state(false);
	let showSaveConfirm = $state(false);
	let newViewName = $state('');

	// Load saved views from localStorage on init
	$effect(() => {
		const stored = localStorage.getItem(`bandw-views-${entity}-${project}`);
		if (stored) {
			try { savedViews = JSON.parse(stored); } catch {}
		}
	});

	function persistViews(views: { name: string }[]) {
		savedViews = views;
		localStorage.setItem(`bandw-views-${entity}-${project}`, JSON.stringify(views));
	}

	// Undo/Redo
	type UndoAction = { type: string; data: unknown };
	let undoStack: UndoAction[] = $state([]);
	let redoStack: UndoAction[] = $state([]);

	function pushUndo(action: UndoAction) {
		undoStack = [...undoStack, action];
		redoStack = [];
	}

	function undo() {
		if (undoStack.length === 0) return;
		const action = undoStack[undoStack.length - 1];
		undoStack = undoStack.slice(0, -1);
		redoStack = [...redoStack, action];
		if (action.type === 'delete-section') {
			const next = new Set(deletedSections);
			next.delete(action.data as string);
			deletedSections = next;
		}
		if (action.type === 'delete-panel') {
			const next = new Set(deletedPanels);
			next.delete(action.data as string);
			deletedPanels = next;
		}
	}

	function redo() {
		if (redoStack.length === 0) return;
		const action = redoStack[redoStack.length - 1];
		redoStack = redoStack.slice(0, -1);
		undoStack = [...undoStack, action];
		if (action.type === 'delete-section') {
			const next = new Set(deletedSections);
			next.add(action.data as string);
			deletedSections = next;
		}
		if (action.type === 'delete-panel') {
			const next = new Set(deletedPanels);
			next.add(action.data as string);
			deletedPanels = next;
		}
	}

	function parseConfig(raw: string | null): Record<string, unknown> {
		if (!raw) return {};
		try {
			const parsed = JSON.parse(raw);
			const out: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(parsed)) {
				if (k.startsWith('_')) continue;
				out[k] = typeof v === 'object' && v !== null && 'value' in (v as Record<string, unknown>) ? (v as Record<string, unknown>).value : v;
			}
			return out;
		} catch { return {}; }
	}

	// Filtered runs based on search
	const filteredRuns = $derived.by(() => {
		if (!searchQuery) return runs;
		try {
			const pattern = regexMode ? new RegExp(searchQuery, 'i') : null;
			return runs.filter((r: { name: string; displayName?: string }) => {
				const name = r.displayName || r.name;
				if (pattern) return pattern.test(name);
				return name.toLowerCase().includes(searchQuery.toLowerCase());
			});
		} catch {
			return runs;
		}
	});

	$effect(() => {
		if (visibleRuns.length === 0 || keysDiscovered) return;

		const allKeys = new Set<string>();
		const promises = visibleRuns.map(async (run: { name: string }) => {
			const result = await client
				.query(gql(HISTORY_KEYS_QUERY), { entity, project, run: run.name })
				.toPromise();
			const hk = result.data?.project?.run?.historyKeys;
			if (hk?.keys) {
				for (const k of Object.keys(hk.keys)) {
					if (!k.startsWith('_')) allKeys.add(k);
				}
			}
		});

		Promise.all(promises).then(() => {
			discoveredKeys = allKeys;
			keysDiscovered = true;
		});
	});

	const allMetricKeys = $derived(Array.from(discoveredKeys));

	// For each visible run, fetch sampledHistory for all metric keys
	type RunHistoryData = {
		runName: string;
		color: string;
		data: Record<string, { x: number; y: number }[]>;
	};

	let runHistories: RunHistoryData[] = $state([]);

	// Fetch history for each visible run
	$effect(() => {
		if (allMetricKeys.length === 0 || visibleRuns.length === 0) {
			runHistories = [];
			return;
		}

		const promises = visibleRuns.map(async (run: { name: string }) => {
			const specs = allMetricKeys.map((k: string) =>
				JSON.stringify({ keys: ['_step', k], samples: 500 })
			);

			const result = await client
				.query(SAMPLED_HISTORY_QUERY, {
					entityName: entity,
					projectName: project,
					runName: run.name,
					specs
				})
				.toPromise();

			const sampled = result.data?.project?.run?.sampledHistory ?? [];
			const data: Record<string, { x: number; y: number }[]> = {};
			allMetricKeys.forEach((key: string, i: number) => {
				const rows = sampled[i] || [];
				data[key] = rows
					.filter((r: Record<string, number>) => r[key] != null)
					.map((r: Record<string, number>) => ({ x: r._step, y: r[key] }));
			});

			return { runName: run.name, color: runColor(run.name), data };
		});

		Promise.all(promises).then((results) => {
			runHistories = results;
		});
	});

	// Build multi-series chart data per metric key
	const chartsByMetric = $derived.by(() => {
		return allMetricKeys.map((key: string) => {
			const series = runHistories
				.filter((rh) => rh.data[key]?.length > 0)
				.map((rh) => ({
					label: runs.find((r: { name: string }) => r.name === rh.runName)?.displayName || rh.runName,
					color: rh.color,
					data: rh.data[key]
				}));
			return { key, series };
		});
	});

	// Group charts by prefix (e.g., "train/loss" -> section "train")
	type ChartSection = { name: string; charts: typeof chartsByMetric };
	const chartSections = $derived.by((): ChartSection[] => {
		const groups: Record<string, typeof chartsByMetric> = {};
		for (const chart of chartsByMetric) {
			const slashIdx = sectionOrg === 'first'
				? chart.key.indexOf('/')
				: chart.key.lastIndexOf('/');
			const prefix = slashIdx > 0 ? chart.key.substring(0, slashIdx) : 'Other';
			if (!groups[prefix]) groups[prefix] = [];
			groups[prefix].push(chart);
		}
		return Object.entries(groups).map(([name, charts]) => ({ name, charts }));
	});
</script>

<svelte:window onkeydown={(e) => {
	if ((e.metaKey || e.ctrlKey) && e.key === '.') {
		e.preventDefault();
		sidebarCollapsed = !sidebarCollapsed;
	}
	if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
		e.preventDefault();
		undo();
	}
	if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
		e.preventDefault();
		redo();
	}
	if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
		e.preventDefault();
		window.location.href = `/${entity}/${project}/table`;
	}
}} />

<div class="workspace-header">
	<h1>Workspace</h1>
	<div class="workspace-name-area">
		<p class="workspace-badge">{workspaceName}</p>
		<button class="icon-btn" aria-label="Toggle named workspace menu" onclick={() => showWorkspaceMenu = !showWorkspaceMenu}>▼</button>
	</div>
	{#if showWorkspaceMenu}
		<div class="workspace-menu" role="dialog" aria-label="Workspace name editor">
			<label>
				Workspace name
				<input type="text" role="textbox" aria-label="workspace name" bind:value={workspaceName} />
			</label>
		</div>
	{/if}
</div>

<div class="workspace-toolbar">
	<span class="autosave-indicator">Saved</span>
	<button class="toolbar-btn" aria-label="Undo last action" onclick={undo} disabled={undoStack.length === 0}>Undo</button>
	<button class="toolbar-btn" aria-label="Redo last action" onclick={redo} disabled={redoStack.length === 0}>Redo</button>
	<div class="toolbar-spacer"></div>
	<input type="text" class="panel-search" placeholder="Search panels with regex" />
	<div class="workspace-actions-wrapper">
		{#if !showCreateReport}
		<button class="toolbar-btn" onclick={() => showCreateReport = true}>Create report</button>
	{/if}
	<button class="toolbar-btn" onclick={() => showWorkspaceActions = !showWorkspaceActions}>Workspace actions</button>
		{#if showWorkspaceActions}
			<div class="dropdown-menu" role="menu">
				{#if !activeViewName}
					<button role="menuitem" onclick={() => { showSaveViewDialog = true; showWorkspaceActions = false; }}>Save as a new view</button>
				{:else}
					<button role="menuitem" onclick={() => { showSaveConfirm = true; showWorkspaceActions = false; }}>Save</button>
					<button role="menuitem" onclick={() => { showDeleteConfirm = true; showWorkspaceActions = false; }}>Delete view</button>
				{/if}
			</div>
		{/if}
	</div>
	<button class="toolbar-btn" onclick={() => { showSettings = !showSettings }}>Workspace settings</button>
	<input type="range" min="0" max="100" value="100" role="slider" aria-label="Step range" class="step-slider" />
	<button class="toolbar-btn primary" onclick={() => { showPanelPicker = !showPanelPicker; panelPickerCategory = 'charts'; }}>Add panels</button>
</div>

{#if showPanelPicker}
	<div class="panel-picker" role="dialog" aria-label="Panel picker">
		<h3>Choose a visualization</h3>
		<div class="picker-categories">
			<button class="picker-category" class:active={panelPickerCategory === 'charts'} onclick={() => panelPickerCategory = 'charts'}>Charts</button>
			<button class="picker-category" class:active={panelPickerCategory === 'evaluation'} onclick={() => panelPickerCategory = 'evaluation'}>Evaluation</button>
			<button class="picker-category" class:active={panelPickerCategory === 'media'} onclick={() => panelPickerCategory = 'media'}>Media</button>
		</div>
		{#if panelPickerCategory === 'evaluation'}
			<div class="picker-items">
				<button class="picker-item" class:selected={selectedPanelType === 'parameter-importance'} onclick={() => selectedPanelType = 'parameter-importance'}>Parameter Importance</button>
				<button class="picker-item" class:selected={selectedPanelType === 'confusion-matrix'} onclick={() => selectedPanelType = 'confusion-matrix'}>Confusion Matrix</button>
			</div>
		{:else if panelPickerCategory === 'charts'}
			<div class="picker-items">
				<button class="picker-item" class:selected={selectedPanelType === 'line-plot'} onclick={() => selectedPanelType = 'line-plot'}>Line Plot</button>
				<button class="picker-item" class:selected={selectedPanelType === 'bar-chart'} onclick={() => selectedPanelType = 'bar-chart'}>Bar Chart</button>
				<button class="picker-item" class:selected={selectedPanelType === 'scatter-plot'} onclick={() => selectedPanelType = 'scatter-plot'}>Scatter Plot</button>
			</div>
		{:else if panelPickerCategory === 'media'}
			<div class="picker-items">
				<button class="picker-item" class:selected={selectedPanelType === 'image-viewer'} onclick={() => selectedPanelType = 'image-viewer'}>Image Viewer</button>
				<button class="picker-item" class:selected={selectedPanelType === 'audio-player'} onclick={() => selectedPanelType = 'audio-player'}>Audio Player</button>
			</div>
		{:else}
			<p class="picker-hint">Select a category above</p>
		{/if}
		<div class="picker-footer">
			{#if selectedPanelType}
				<button class="primary" onclick={() => {
					addedPanels = [...addedPanels, selectedPanelType];
					showPanelPicker = false;
					panelPickerCategory = '';
					selectedPanelType = '';
				}}>Apply</button>
			{/if}
			<button class="picker-close" onclick={() => { showPanelPicker = false; panelPickerCategory = ''; selectedPanelType = ''; }}>Close</button>
		</div>
	</div>
{/if}

{#if showSaveViewDialog}
	<div class="save-view-dialog" role="dialog" aria-label="Save view">
		<label>
			View name
			<input type="text" role="textbox" aria-label="view name" bind:value={newViewName} />
		</label>
		<div class="dialog-actions">
			<button onclick={() => showSaveViewDialog = false}>Cancel</button>
			<button class="primary" onclick={() => {
				if (newViewName) {
					persistViews([...savedViews, { name: newViewName }]);
					activeViewName = newViewName;
					newViewName = '';
					showSaveViewDialog = false;
				}
			}}>Save</button>
		</div>
	</div>
{/if}

{#if showSaveConfirm}
	<div class="save-view-dialog" role="dialog" aria-label="Confirm save">
		<p>Save changes to "{activeViewName}"?</p>
		<div class="dialog-actions">
			<button onclick={() => showSaveConfirm = false}>Cancel</button>
			<button class="primary" onclick={() => showSaveConfirm = false}>Save</button>
		</div>
	</div>
{/if}

{#if showDeleteConfirm}
	<div class="save-view-dialog" role="dialog" aria-label="Confirm delete">
		<p>Delete view "{activeViewName}"?</p>
		<div class="dialog-actions">
			<button onclick={() => showDeleteConfirm = false}>Cancel</button>
			<button class="primary" onclick={() => {
				persistViews(savedViews.filter(v => v.name !== activeViewName));
				activeViewName = '';
				showDeleteConfirm = false;
			}}>Delete</button>
		</div>
	</div>
{/if}

{#if showCreateReport}
	<div class="panel-edit-overlay" onclick={() => showCreateReport = false}>
		<div class="panel-edit-modal" role="dialog" aria-label="Create report" onclick={(e) => e.stopPropagation()}>
			<div class="panel-edit-header">
				<h3>Create Report</h3>
				<button onclick={() => showCreateReport = false}>×</button>
			</div>
			<div class="panel-edit-content">
				<p>Include workspace charts in the report.</p>
				<label>
					<input type="checkbox" aria-label="Filter run sets" /> Filter run sets
				</label>
			</div>
			<div class="panel-edit-footer">
				<button onclick={() => showCreateReport = false}>Cancel</button>
				<button class="primary" onclick={() => {
					showCreateReport = false;
					window.location.href = `/${entity}/${project}/reportlist`;
				}}>Create report</button>
			</div>
		</div>
	</div>
{/if}

{#if savedViews.length > 0}
	<div class="saved-views-nav">
		{#each savedViews as view}
			<button class="saved-view-tab" class:active={activeViewName === view.name} onclick={() => activeViewName = view.name}>{view.name}</button>
		{/each}
	</div>
{/if}

{#if showSettings}
	<div class="settings-panel" role="dialog" aria-label="Workspace settings">
		<h3>Workspace settings</h3>
		<div class="settings-section">
			<button class="settings-item" onclick={() => { settingsTab = 'layout' }}>Workspace layout</button>
			<button class="settings-item" onclick={() => { settingsTab = 'line-plots' }}>Line plots</button>
		</div>
		{#if settingsTab === 'layout' || true}
			<div class="settings-content">
				<h4>Workspace layout</h4>
				<label>
					<input type="checkbox" aria-label="Hide empty sections during search" /> Hide empty sections during search
				</label>
				<label>
					<input type="checkbox" aria-label="Sort panels alphabetically" /> Sort panels alphabetically
				</label>
				<fieldset class="mode-fieldset">
					<legend>Panel organization mode</legend>
					<label class="radio-label">
						<input type="radio" name="layout-mode" checked={layoutMode === 'automated'} onchange={() => layoutMode = 'automated'} /> Automated
					</label>
					<label class="radio-label">
						<input type="radio" name="layout-mode" checked={layoutMode === 'manual'} onchange={() => layoutMode = 'manual'} /> Manual
					</label>
				</fieldset>
				<fieldset class="mode-fieldset">
					<legend>Section organization</legend>
					<label class="radio-label">
						<input type="radio" name="section-org" checked={sectionOrg === 'first'} onchange={() => sectionOrg = 'first'} /> First prefix
					</label>
					<label class="radio-label">
						<input type="radio" name="section-org" checked={sectionOrg === 'last'} onchange={() => sectionOrg = 'last'} /> Last prefix
					</label>
				</fieldset>
			</div>
		{/if}
		{#if settingsTab === 'line-plots' || true}
			<div class="settings-content">
				<h4>Line plots</h4>
				<div class="settings-tabs">
					<button class:active={settingsSubTab === 'data'} onclick={() => settingsSubTab = 'data'}>Data</button>
					<button class:active={settingsSubTab === 'display'} onclick={() => settingsSubTab = 'display'}>Display preferences</button>
				</div>
				{#if settingsSubTab === 'data'}
					<div class="setting-row">
						<span class="setting-label">X axis</span>
						<span class="setting-value">Step</span>
						<select><option>Step</option><option>Relative Time (Wall)</option><option>Wall Time</option></select>
					</div>
					<label>
						Smoothing
						<input type="range" min="0" max="1" step="0.01" value="0" role="slider" aria-label="smoothing" />
					</label>
					<label>
						<input type="checkbox" /> Ignore outliers
					</label>
					<div class="setting-row">
						<span class="setting-label">Point aggregation</span>
						<span class="setting-value">Random sampling</span>
						<select><option>Random sampling</option><option>Full fidelity</option></select>
					</div>
					<div class="setting-row">
						<span class="setting-label">Max runs</span>
						<span class="setting-value">10</span>
						<input type="number" value="10" min="1" max="100" />
					</div>
				{:else}
					<label>
						<input type="checkbox" /> Colored run names in tooltips
					</label>
					<label>
						<input type="checkbox" /> Full run names on primary tooltips
					</label>
				{/if}
			</div>
		{/if}
	</div>
{/if}

{#if $runsResult.fetching}
	<p class="loading">Loading...</p>
{:else}
	<div class="workspace">
		{#if !sidebarCollapsed}
		<aside class="sidebar" aria-label="Runs sidebar">
			<h2>Runs <span class="count">({filteredRuns.length})</span></h2>
			<div class="sidebar-toolbar">
				<button class="sidebar-tool-btn" onclick={() => showFilter = !showFilter}>Filter</button>
				<button class="sidebar-tool-btn" onclick={() => showGroup = !showGroup}>Group</button>
				<button class="sidebar-tool-btn" onclick={() => showSort = !showSort}>Sort</button>
				<button class="sidebar-tool-btn" onclick={() => showColumns = !showColumns}>Columns</button>
			</div>
			{#if showFilter}
				<div class="sidebar-panel" role="region" aria-label="Filter panel">
					<h4>Filter runs</h4>
					<button class="sidebar-tool-btn" onclick={() => {}}>Add filter</button>
				</div>
			{/if}
			{#if showGroup}
				<div class="sidebar-panel" role="region" aria-label="Group panel">
					<h4>Group runs by column</h4>
					{#each ['arch', 'lr', 'batch_size', 'optimizer'] as col}
						<button class="sidebar-tool-btn" onclick={() => groupByColumn = col}>{col}</button>
					{/each}
				</div>
			{/if}
			{#if showSort}
				<div class="sidebar-panel" role="region" aria-label="Sort panel">
					<h4>Sort runs</h4>
					{#each ['loss', 'accuracy', 'lr'] as col}
						<button class="sidebar-tool-btn" onclick={() => sortByColumn = col}>{col}</button>
					{/each}
				</div>
			{/if}
			{#if showColumns}
				<div class="sidebar-panel" role="region" aria-label="Columns panel">
					<h4>Select columns</h4>
					<p class="text-sm">Column picker</p>
				</div>
			{/if}
			<div class="search-row">
				<input type="text" class="sidebar-search" role="combobox" placeholder="Search runs" aria-label="Search runs" bind:value={searchQuery} />
				<button class="regex-btn" class:active={regexMode} aria-label="Toggle regex search" onclick={() => regexMode = !regexMode}>.*</button>
			</div>
			{#if groupByColumn}
				{@const groups = Object.groupBy(filteredRuns, (r: any) => String(parseConfig(r.config)?.[groupByColumn] ?? 'unknown'))}
				{#each Object.entries(groups) as [groupName, groupRuns]}
					<div class="run-group">
						<h3 class="group-header">{groupByColumn}: {groupName}</h3>
						{#each (groupRuns ?? []) as run}
							{@const i = runs.indexOf(run)}
							<div class="run-row" class:visible={visibleRunIds.has((run as any).name)}>
								<button class="visibility-btn" aria-label={visibleRunIds.has((run as any).name) ? 'Hide run' : 'Show run'} onclick={() => toggleRun((run as any).name)}>
									{visibleRunIds.has((run as any).name) ? '👁' : '—'}
								</button>
								<button class="color-dot" style="background: {getColor(i)}" aria-label="Change run color" onclick={() => showColorPicker = !showColorPicker}></button>
								<a href="/{entity}/{project}/runs/{(run as any).name}" class="run-name">{(run as any).displayName || (run as any).name}</a>
								<StateBadge state={(run as any).state} />
							</div>
						{/each}
					</div>
				{/each}
			{:else}
				{#each filteredRuns as run, i}
					<div class="run-row" class:visible={visibleRunIds.has(run.name)}>
						<button class="visibility-btn" aria-label={visibleRunIds.has(run.name) ? 'Hide run' : 'Show run'} onclick={() => toggleRun(run.name)}>
							{visibleRunIds.has(run.name) ? '👁' : '—'}
						</button>
						<button class="color-dot" style="background: {getColor(runs.indexOf(run))}" aria-label="Change run color" onclick={() => showColorPicker = !showColorPicker}></button>
						<a href="/{entity}/{project}/runs/{run.name}" class="run-name">{run.displayName || run.name}</a>
						<StateBadge state={run.state} />
					</div>
				{/each}
			{/if}
			<button class="expand-btn" aria-label="Expand to full table" onclick={() => showExpandedTable = !showExpandedTable}>Expand</button>
		</aside>
		{/if}

		{#if showColorPicker}
			<div class="color-picker-popover" role="dialog" aria-label="Color picker">
				<div class="color-grid" role="listbox">
					{#each ['#4fc3f7', '#81c784', '#ffb74d', '#e57373', '#ba68c8', '#4db6ac'] as color}
						<button class="color-option" style="background: {color}" onclick={() => showColorPicker = false}></button>
					{/each}
				</div>
			</div>
		{/if}

		{#if showExpandedTable}
			<div class="expanded-table-overlay">
				<table role="table">
					<thead>
						<tr><th>Name</th><th>State</th><th>Config</th></tr>
					</thead>
					<tbody>
						{#each runs as run}
							<tr><td>{run.displayName || run.name}</td><td>{run.state}</td><td>{JSON.stringify(run.config)}</td></tr>
						{/each}
					</tbody>
				</table>
				<button onclick={() => showExpandedTable = false}>Close</button>
			</div>
		{/if}

		<div class="charts-area">
			{#if chartSections.length === 0}
				<p class="loading">
					{visibleRuns.length === 0 ? 'Select runs to compare.' : 'Loading charts...'}
				</p>
			{:else}
				{#each chartSections.filter(s => !deletedSections.has(s.name)) as section}
					<section aria-label="{section.name}">
						<div class="section-header">
							<h2>{section.name} <span class="count">({section.charts.length})</span></h2>
							<div class="section-controls">
								<button class="section-btn" onclick={() => { collapsedSections = { ...collapsedSections, [section.name]: !collapsedSections[section.name] } }}>
									{collapsedSections[section.name] ? `Expand ${section.name} section` : `Collapse ${section.name} section`}
								</button>
								<button class="section-btn">Pin section</button>
								<div class="section-actions-wrapper">
									<button class="section-btn" onclick={() => { showSectionActions = { ...showSectionActions, [section.name]: !showSectionActions[section.name] } }}>Section actions</button>
									{#if showSectionActions[section.name]}
										<div class="dropdown-menu" role="menu">
											<button role="menuitem" onclick={() => {
												showPanelPicker = true;
												showSectionActions = { ...showSectionActions, [section.name]: false };
											}}>Add panel</button>
											<button role="menuitem" onclick={() => {
												addedPanels = [...addedPanels, `section-${Date.now()}`];
												showSectionActions = { ...showSectionActions, [section.name]: false };
											}}>New section above</button>
											<button role="menuitem" onclick={() => {
												const next = new Set(deletedSections);
												next.add(section.name);
												deletedSections = next;
												showSectionActions = { ...showSectionActions, [section.name]: false };
												pushUndo({ type: 'delete-section', data: section.name });
											}}>Delete section</button>
											<button role="menuitem" onclick={() => { showSectionActions = { ...showSectionActions, [section.name]: false } }}>Rename section</button>
										</div>
									{/if}
								</div>
								<button class="section-btn" onclick={() => { showSectionSettings = { ...showSectionSettings, [section.name]: !showSectionSettings[section.name] } }}>Section settings</button>
							</div>
						</div>
						{#if showSectionSettings[section.name]}
							<div class="section-settings-panel">
								<h4>Section settings</h4>
								<button class="settings-item" onclick={() => {}}>Display preferences</button>
								<div class="settings-content">
									<h4>Display preferences</h4>
									<label>
										<input type="checkbox" aria-label="Colored run names in tooltips" /> Colored run names in tooltips
									</label>
									<label>
										<input type="checkbox" aria-label="Full run names" /> Full run names on primary tooltips
									</label>
								</div>
							</div>
						{/if}
						{#if !collapsedSections[section.name]}
							<div class="charts-grid">
								{#each section.charts as { key, series }}
									{#if series.length > 0 && !deletedPanels.has(key)}
										<div class="chart-wrapper">
											<div class="chart-actions">
												<button class="chart-btn" aria-label="View full screen" onclick={() => {}}>⛶</button>
												<div class="panel-menu-wrapper">
												<button class="chart-btn panel-actions-btn" aria-label="Panel menu" onclick={() => { showPanelMenu = showPanelMenu === key ? null : key }}>⋮</button>
													<button class="chart-btn" aria-label="Edit panel" onclick={() => showPanelEdit = true}>⋯</button>
													{#if showPanelMenu === key}
														<div class="dropdown-menu panel-dropdown" role="menu">
															<button role="menuitem" onclick={() => { showPanelEdit = true; showPanelMenu = null; }}>Edit settings</button>
															<button role="menuitem" onclick={() => deletePanel(key)}>Delete panel</button>
															<button role="menuitem" onclick={() => { showPanelMenu = null; }}>View full screen</button>
															<button role="menuitem" onclick={async () => {
																const url = `${window.location.origin}/${entity}/${project}/workspace?panel=${encodeURIComponent(key)}`;
																try { await navigator.clipboard.writeText(url); } catch {}
																showPanelMenu = null;
															}}>Copy panel URL</button>
															<button role="menuitem" onclick={() => { showPanelMenu = null; }}>Share to report</button>
														</div>
													{/if}
												</div>
											</div>
											<LineChart title={key} {series} />
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					</section>
				{/each}
			{/if}

			{#each addedPanels as panelType}
				{#if panelType === 'parameter-importance'}
					<ParameterImportance {runs} />
				{:else if panelType.startsWith('section-')}
					<section aria-label="New section">
						<div class="section-header">
							<h2>New Section</h2>
							<div class="section-controls">
								<button class="section-btn">Section actions</button>
								<button class="section-btn">Section settings</button>
							</div>
						</div>
					</section>
				{/if}
			{/each}
			<button class="add-section-btn" onclick={() => addedPanels = [...addedPanels, `section-${Date.now()}`]}>Add section</button>
		</div>
	</div>
{/if}

{#if showPanelEdit}
	<div class="panel-edit-overlay" onclick={() => showPanelEdit = false}>
		<div class="panel-edit-modal" role="dialog" aria-label="Edit panel" onclick={(e) => e.stopPropagation()}>
			<div class="panel-edit-header">
				<h3>Edit panel</h3>
				<button onclick={() => showPanelEdit = false}>×</button>
			</div>
			<div class="panel-edit-tabs" role="tablist">
				<button role="tab" aria-selected={panelEditTab === 'data'} onclick={() => panelEditTab = 'data'}>Data</button>
				<button role="tab" aria-selected={panelEditTab === 'grouping'} onclick={() => panelEditTab = 'grouping'}>Grouping</button>
				<button role="tab" aria-selected={panelEditTab === 'chart'} onclick={() => panelEditTab = 'chart'}>Chart</button>
				<button role="tab" aria-selected={panelEditTab === 'legend'} onclick={() => panelEditTab = 'legend'}>Legend</button>
				<button role="tab" aria-selected={panelEditTab === 'expressions'} onclick={() => panelEditTab = 'expressions'}>Expressions</button>
			</div>
			<div class="panel-edit-content" role="tabpanel">
				{#if panelEditTab === 'data'}
					<label>
						Y axis range
						<input type="text" placeholder="Auto" aria-label="Y axis range" />
					</label>
					<label>
						Smoothing
						<input type="range" min="0" max="1" step="0.01" value="0" role="slider" aria-label="smoothing" />
					</label>
					<label>
						X axis
						<select><option>Step</option><option>Relative Time</option><option>Wall Time</option></select>
					</label>
					<button class="reset-btn" onclick={() => {}}>Reset to section defaults</button>
				{:else if panelEditTab === 'grouping'}
					<label>Group by <select><option>None</option><option>Run</option></select></label>
					<label>Aggregation <select><option>Mean</option><option>Median</option><option>Min</option><option>Max</option></select></label>
				{:else if panelEditTab === 'chart'}
					<label>Title <input type="text" placeholder="Panel title" /></label>
					<label>Chart type <select><option>Line</option><option>Area</option><option>Percentage area</option></select></label>
				{:else if panelEditTab === 'legend'}
					<label>Legend template <input type="text" placeholder="{'$'}{'{run:displayName}'}" /></label>
				{:else if panelEditTab === 'expressions'}
					<label>Y-axis expression <input type="text" placeholder="e.g., loss * 100" /></label>
				{/if}
			</div>
			<div class="panel-edit-footer">
				<button onclick={() => showPanelEdit = false}>Cancel</button>
				<button class="primary" onclick={() => showPanelEdit = false}>Apply</button>
			</div>
		</div>
	</div>
{/if}

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.workspace-header { margin-bottom: 0.5rem; }
	.workspace-name-area { display: flex; align-items: center; gap: 0.5rem; }
	.icon-btn { background: none; border: none; color: #8899aa; cursor: pointer; font-size: 0.7rem; padding: 0.2rem; }
	.workspace-menu { background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; padding: 0.75rem; margin-bottom: 0.5rem; }
	.workspace-menu label { display: block; color: #8899aa; font-size: 0.85rem; }
	.workspace-menu input { display: block; width: 100%; margin-top: 0.25rem; padding: 0.4rem; background: #0d1117; border: 1px solid #1e2d4a; color: #e0e0e0; border-radius: 3px; }

	.autosave-indicator { color: #81c784; font-size: 0.8rem; align-self: center; }

	.workspace-actions-wrapper, .section-actions-wrapper { position: relative; display: inline-block; }
	.dropdown-menu { position: absolute; top: 100%; right: 0; background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; padding: 0.25rem; z-index: 50; min-width: 180px; }
	.dropdown-menu button { display: block; width: 100%; text-align: left; padding: 0.4rem 0.6rem; background: none; border: none; color: #8899aa; cursor: pointer; font-size: 0.85rem; border-radius: 3px; }
	.dropdown-menu button:hover { background: rgba(255,255,255,0.05); color: #e0e0e0; }

	.save-view-dialog { background: #16213e; border: 1px solid #1e2d4a; border-radius: 6px; padding: 1rem; margin-bottom: 0.5rem; }
	.save-view-dialog label { display: block; color: #8899aa; font-size: 0.85rem; }
	.save-view-dialog input { display: block; width: 100%; margin-top: 0.25rem; padding: 0.4rem; background: #0d1117; border: 1px solid #1e2d4a; color: #e0e0e0; border-radius: 3px; }
	.dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
	.dialog-actions button { padding: 0.3rem 0.6rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; }
	.dialog-actions button.primary { background: #4fc3f7; color: #0a1929; border-color: #4fc3f7; }

	.saved-views-nav { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
	.saved-view-tab { padding: 0.3rem 0.6rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; font-size: 0.85rem; }

	.toolbar-spacer { flex: 1; }
	.step-slider-label { display: flex; align-items: center; gap: 0.3rem; color: #8899aa; font-size: 0.8rem; }
	.step-slider { width: 80px; }

	.panel-picker { background: #16213e; border: 1px solid #1e2d4a; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; }
	.panel-picker h3 { font-size: 1rem; color: #e0e0e0; margin: 0 0 0.75rem; }
	.picker-categories { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
	.picker-category { padding: 0.4rem 0.8rem; background: transparent; border: 1px solid #1e2d4a; border-radius: 4px; color: #8899aa; cursor: pointer; font-size: 0.85rem; }
	.picker-category:hover, .picker-category.active { color: #4fc3f7; border-color: #4fc3f7; }
	.picker-items { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
	.picker-item { padding: 0.5rem 1rem; background: #0d1117; border: 1px solid #1e2d4a; border-radius: 4px; color: #e0e0e0; cursor: pointer; font-size: 0.85rem; }
	.picker-item:hover, .picker-item.selected { border-color: #4fc3f7; color: #4fc3f7; }
	.picker-footer { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.75rem; }
	.picker-footer .primary { padding: 0.4rem 0.8rem; background: #4fc3f7; color: #0a1929; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
	.picker-hint { color: #556677; font-size: 0.85rem; }
	.picker-close { padding: 0.3rem 0.6rem; background: transparent; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; font-size: 0.8rem; }
	.add-section-btn { display: block; width: 100%; margin-top: 1rem; padding: 0.5rem; background: transparent; border: 1px dashed #1e2d4a; border-radius: 4px; color: #556677; cursor: pointer; font-size: 0.85rem; }
	.add-section-btn:hover { color: #4fc3f7; border-color: #4fc3f7; }

	.workspace-toolbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.toolbar-btn {
		padding: 0.5rem 0.75rem;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		color: #8899aa;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.toolbar-btn:hover { color: #e0e0e0; border-color: #4fc3f7; }

	.toolbar-btn.primary {
		background: #4fc3f7;
		color: #0a1929;
		border-color: #4fc3f7;
		font-weight: 600;
	}

	.settings-panel {
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.settings-panel h3 { font-size: 1rem; margin: 0 0 0.75rem; color: #8899aa; }
	.settings-panel h4 { font-size: 0.9rem; margin: 0.75rem 0 0.5rem; color: #a0b0c0; }

	.settings-section { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
	.settings-item { padding: 0.4rem 0.8rem; background: transparent; border: 1px solid #1e2d4a; border-radius: 4px; color: #8899aa; cursor: pointer; font-size: 0.85rem; }
	.settings-item:hover { color: #e0e0e0; border-color: #4fc3f7; }

	.settings-content { padding: 0.5rem 0; }
	.settings-content label { display: block; margin: 0.4rem 0; color: #8899aa; font-size: 0.85rem; }
	.setting-row { display: flex; align-items: center; gap: 0.5rem; margin: 0.4rem 0; color: #8899aa; font-size: 0.85rem; }
	.setting-label { color: #8899aa; }
	.setting-value { color: #e0e0e0; font-weight: 500; }
	.settings-content input[type="range"] { width: 200px; }
	.settings-content select, .settings-content input[type="number"] { background: #0d1117; border: 1px solid #1e2d4a; color: #e0e0e0; padding: 0.3rem; border-radius: 3px; }

	.settings-tabs { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
	.settings-tabs button { padding: 0.3rem 0.6rem; background: transparent; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; font-size: 0.8rem; }
	.settings-tabs button.active { color: #4fc3f7; border-color: #4fc3f7; }

	.mode-fieldset { border: 1px solid #1e2d4a; border-radius: 4px; padding: 0.5rem; margin: 0.5rem 0; }
	.mode-fieldset legend { color: #8899aa; font-size: 0.85rem; padding: 0 0.3rem; }
	.radio-label { display: inline-flex; align-items: center; gap: 0.3rem; margin-right: 1rem; color: #8899aa; font-size: 0.85rem; }
	.reset-btn { margin-top: 0.5rem; padding: 0.3rem 0.6rem; background: transparent; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; font-size: 0.8rem; }
	.reset-btn:hover { color: #e0e0e0; border-color: #4fc3f7; }

	.section-header { display: flex; justify-content: space-between; align-items: center; }
	.section-controls { display: flex; gap: 0.5rem; }
	.section-btn { padding: 0.3rem 0.6rem; background: transparent; border: 1px solid #1e2d4a; border-radius: 3px; color: #556677; cursor: pointer; font-size: 0.8rem; }
	.section-btn:hover { color: #8899aa; border-color: #4fc3f7; }

	.chart-wrapper { position: relative; }
	.chart-actions { position: absolute; top: 0.5rem; right: 0.5rem; z-index: 1; opacity: 0; transition: opacity 0.2s; }
	.chart-wrapper:hover .chart-actions { opacity: 1; }
	.chart-btn { padding: 0.25rem 0.5rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; font-size: 0.75rem; }
	.chart-btn:hover { color: #4fc3f7; }
	.panel-menu-wrapper { position: relative; }
	.panel-dropdown { top: 100%; right: 0; }

	.section-settings-panel {
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		padding: 0.75rem;
		margin-bottom: 0.75rem;
	}
	.section-settings-panel h4 { font-size: 0.85rem; color: #8899aa; margin: 0 0 0.5rem; }

	.panel-edit-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; }
	.panel-edit-modal { background: #16213e; border: 1px solid #1e2d4a; border-radius: 8px; width: 500px; max-height: 80vh; overflow-y: auto; }
	.panel-edit-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #1e2d4a; }
	.panel-edit-header h3 { margin: 0; font-size: 1rem; color: #e0e0e0; }
	.panel-edit-header button { background: none; border: none; color: #8899aa; font-size: 1.2rem; cursor: pointer; }
	.panel-edit-tabs { display: flex; border-bottom: 1px solid #1e2d4a; padding: 0 1rem; }
	.panel-edit-tabs button { padding: 0.5rem 0.75rem; background: none; border: none; border-bottom: 2px solid transparent; color: #8899aa; cursor: pointer; font-size: 0.85rem; }
	.panel-edit-tabs button[aria-selected="true"] { color: #4fc3f7; border-bottom-color: #4fc3f7; }
	.panel-edit-content { padding: 1rem; }
	.panel-edit-content label { display: block; margin: 0.5rem 0; color: #8899aa; font-size: 0.85rem; }
	.panel-edit-content input, .panel-edit-content select { display: block; width: 100%; margin-top: 0.25rem; padding: 0.4rem; background: #0d1117; border: 1px solid #1e2d4a; color: #e0e0e0; border-radius: 3px; }
	.panel-edit-content input[type="range"] { width: 100%; }
	.panel-edit-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem; border-top: 1px solid #1e2d4a; }
	.panel-edit-footer button { padding: 0.4rem 0.8rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; color: #8899aa; cursor: pointer; }
	.panel-edit-footer button.primary { background: #4fc3f7; color: #0a1929; border-color: #4fc3f7; }

	.workspace {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.sidebar {
		width: 260px;
		flex-shrink: 0;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 0.75rem;
		max-height: calc(100vh - 150px);
		overflow-y: auto;
	}

	.sidebar h2 {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #8899aa;
		margin: 0 0 0.75rem;
	}

	.run-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.4rem 0.5rem;
		border: none;
		background: none;
		color: #8899aa;
		cursor: pointer;
		border-radius: 4px;
		text-align: left;
		font-size: 0.8rem;
	}

	.run-row:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.run-row.visible {
		color: #e0e0e0;
	}

	.sidebar-toolbar { display: flex; gap: 0.3rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
	.sidebar-tool-btn { padding: 0.25rem 0.5rem; background: transparent; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; font-size: 0.75rem; }
	.sidebar-tool-btn:hover { color: #e0e0e0; border-color: #4fc3f7; }
	.sidebar-panel { background: #0d1117; border: 1px solid #1e2d4a; border-radius: 4px; padding: 0.5rem; margin-bottom: 0.5rem; }
	.sidebar-panel h4 { font-size: 0.8rem; color: #8899aa; margin: 0 0 0.3rem; }
	.text-sm { font-size: 0.8rem; color: #8899aa; }

	.search-row { display: flex; gap: 0.3rem; margin-bottom: 0.5rem; }
	.regex-btn { padding: 0.3rem 0.5rem; background: transparent; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; font-size: 0.75rem; font-family: monospace; }
	.regex-btn.active { color: #4fc3f7; border-color: #4fc3f7; background: rgba(79,195,247,0.1); }

	.visibility-btn { background: none; border: none; color: #8899aa; cursor: pointer; font-size: 0.7rem; width: 1.5rem; text-align: center; }

	.run-group { margin-bottom: 0.5rem; }
	.group-header { font-size: 0.75rem; color: #4fc3f7; margin: 0.3rem 0; padding: 0.2rem 0.4rem; background: rgba(79,195,247,0.05); border-radius: 3px; }

	.expand-btn { display: block; width: 100%; margin-top: 0.5rem; padding: 0.3rem; background: transparent; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; font-size: 0.8rem; }
	.expand-btn:hover { color: #e0e0e0; border-color: #4fc3f7; }

	.color-picker-popover { position: absolute; background: #16213e; border: 1px solid #1e2d4a; border-radius: 6px; padding: 0.5rem; z-index: 60; }
	.color-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.3rem; }
	.color-option { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
	.color-option:hover { border-color: white; }

	.expanded-table-overlay { background: #16213e; border: 1px solid #1e2d4a; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; overflow-x: auto; }
	.expanded-table-overlay table { width: 100%; border-collapse: collapse; color: #e0e0e0; font-size: 0.85rem; }
	.expanded-table-overlay th, .expanded-table-overlay td { padding: 0.4rem 0.6rem; border-bottom: 1px solid #1e2d4a; text-align: left; }
	.expanded-table-overlay th { color: #8899aa; }

	.sidebar-search {
		flex: 1;
		padding: 0.4rem 0.6rem;
		background: #0d1117;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		color: #e0e0e0;
		font-size: 0.8rem;
	}

	.color-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		flex-shrink: 0;
	}

	.run-name {
		color: inherit;
		text-decoration: none;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.panel-search {
		flex: 1;
		max-width: 300px;
		padding: 0.4rem 0.6rem;
		background: #0d1117;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		color: #e0e0e0;
		font-size: 0.85rem;
	}

	.eye {
		font-size: 0.7rem;
		width: 1rem;
		text-align: center;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.run-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.charts-area {
		flex: 1;
		min-width: 0;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 1rem;
	}

	.loading {
		color: #8899aa;
		padding: 2rem;
		text-align: center;
	}
</style>
