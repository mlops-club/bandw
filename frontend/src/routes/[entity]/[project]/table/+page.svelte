<script lang="ts">
	import { page } from '$app/state';
	import { queryStore, getContextClient } from '@urql/svelte';
	import { RUNS_QUERY } from '$lib/graphql/queries';
	import { relativeTime } from '$lib/utils/time';
	import StateBadge from '$lib/components/StateBadge.svelte';

	const client = getContextClient();

	const entity = $derived(page.params.entity);
	const project = $derived(page.params.project);

	const result = $derived(
		queryStore({
			client,
			query: RUNS_QUERY,
			variables: { entityName: entity, projectName: project, first: 100 }
		})
	);

	// Filters
	let searchQuery = $state('');
	let stateFilter = $state('all');
	let sortBy = $state('created');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let showSortPanel = $state(false);
	let showFilterPanel = $state(false);
	let showGroupDropdown = $state(false);
	let showColumnsDropdown = $state(false);
	let groupByKey = $state<string | null>(null);
	let hiddenColumns = $state<Set<string>>(new Set());

	// Row selection
	let selectedRuns = $state<Set<string>>(new Set());

	type RunNode = {
		name: string;
		displayName: string | null;
		state: string | null;
		createdAt: string | null;
		updatedAt: string | null;
		config: string | null;
		summaryMetrics: string | null;
		tags: string[] | null;
		user: { username: string } | null;
	};

	const allRuns = $derived<RunNode[]>(
		$result.data?.project?.runs?.edges?.map((e: { node: RunNode }) => e.node) ?? []
	);

	const states = $derived([...new Set(allRuns.map((r) => r.state).filter(Boolean))]);

	const filteredRuns = $derived.by(() => {
		let runs = allRuns;

		// Search filter
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			runs = runs.filter(
				(r) =>
					(r.displayName || r.name).toLowerCase().includes(q) ||
					r.tags?.some((t) => t.toLowerCase().includes(q))
			);
		}

		// State filter
		if (stateFilter !== 'all') {
			runs = runs.filter((r) => r.state === stateFilter);
		}

		// Sort
		runs = [...runs].sort((a, b) => {
			let cmp = 0;
			if (sortBy === 'name') {
				cmp = (a.displayName || a.name).localeCompare(b.displayName || b.name);
			} else if (sortBy === 'state') {
				cmp = (a.state ?? '').localeCompare(b.state ?? '');
			} else {
				cmp = (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
			}
			return sortDir === 'asc' ? cmp : -cmp;
		});

		return runs;
	});

	function toggleSort(col: string) {
		if (sortBy === col) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = col;
			sortDir = col === 'name' ? 'asc' : 'desc';
		}
	}

	function sortIndicator(col: string): string {
		if (sortBy !== col) return '';
		return sortDir === 'asc' ? ' ▲' : ' ▼';
	}

	function parseSummary(raw: string | null): Record<string, number> {
		if (!raw) return {};
		try {
			const parsed = JSON.parse(raw);
			const out: Record<string, number> = {};
			for (const [k, v] of Object.entries(parsed)) {
				if (k.startsWith('_')) continue;
				if (typeof v === 'number') out[k] = v;
			}
			return out;
		} catch {
			return {};
		}
	}

	function fmt(n: number): string {
		if (Number.isInteger(n)) return String(n);
		if (Math.abs(n) < 0.001) return n.toExponential(2);
		return n.toFixed(4);
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
		} catch {
			return {};
		}
	}

	function fmtValue(v: unknown): string {
		if (v === null || v === undefined) return '-';
		if (typeof v === 'number') return fmt(v);
		return String(v);
	}

	const allConfigKeys = $derived.by(() => {
		const keys = new Set<string>();
		for (const run of allRuns) {
			for (const k of Object.keys(parseConfig(run.config))) keys.add(k);
		}
		return Array.from(keys).sort();
	});

	const allSummaryKeys = $derived.by(() => {
		const keys = new Set<string>();
		for (const run of allRuns) {
			for (const k of Object.keys(parseSummary(run.summaryMetrics))) keys.add(k);
		}
		return Array.from(keys).sort();
	});

	const allSelected = $derived(
		filteredRuns.length > 0 && filteredRuns.every((r) => selectedRuns.has(r.name))
	);

	function toggleSelectAll() {
		if (allSelected) {
			selectedRuns = new Set();
		} else {
			selectedRuns = new Set(filteredRuns.map((r) => r.name));
		}
	}

	function toggleRunSelection(runName: string) {
		const next = new Set(selectedRuns);
		if (next.has(runName)) {
			next.delete(runName);
		} else {
			next.add(runName);
		}
		selectedRuns = next;
	}

	// Grouping
	type GroupedRuns = { key: string; runs: RunNode[] }[];

	const groupedRuns = $derived.by((): GroupedRuns | null => {
		if (!groupByKey) return null;
		const groups = new Map<string, RunNode[]>();
		for (const run of filteredRuns) {
			const config = parseConfig(run.config);
			const val = String(config[groupByKey] ?? '(none)');
			if (!groups.has(val)) groups.set(val, []);
			groups.get(val)!.push(run);
		}
		return Array.from(groups.entries()).map(([key, runs]) => ({ key, runs }));
	});
</script>

<h1>Runs</h1>

{#if $result.fetching}
	<p class="loading">Loading runs...</p>
{:else if $result.error}
	<p class="error">Error: {$result.error.message}</p>
{:else if $result.data?.project}
	<div class="controls">
		<input type="text" placeholder="Search runs..." class="search" bind:value={searchQuery} />
		<button class="toolbar-btn" onclick={() => { showFilterPanel = !showFilterPanel }}>Filter</button>
		<button class="toolbar-btn" onclick={() => { showSortPanel = !showSortPanel }}>Sort</button>
		<div class="dropdown-wrap">
			<button class="toolbar-btn" onclick={() => { showColumnsDropdown = !showColumnsDropdown }}>Columns</button>
			{#if showColumnsDropdown}
				<div class="dropdown-menu">
					<div class="dropdown-label">Toggle columns</div>
					{#each ['Name', 'State', 'Tags', 'Created', ...allConfigKeys, ...allSummaryKeys] as col}
						<label class="dropdown-item">
							<input type="checkbox" checked={!hiddenColumns.has(col)} onchange={() => {
								const next = new Set(hiddenColumns);
								if (next.has(col)) next.delete(col); else next.add(col);
								hiddenColumns = next;
							}} />
							{col}
						</label>
					{/each}
				</div>
			{/if}
		</div>
		<div class="dropdown-wrap">
			<button class="toolbar-btn" onclick={() => { showGroupDropdown = !showGroupDropdown }}>Group</button>
			{#if showGroupDropdown}
				<div class="dropdown-menu">
					<div class="dropdown-label">Group runs by</div>
					<button class="dropdown-item" class:active={groupByKey === null} onclick={() => { groupByKey = null; showGroupDropdown = false; }}>None</button>
					{#each allConfigKeys as key}
						<button class="dropdown-item" class:active={groupByKey === key} onclick={() => { groupByKey = key; showGroupDropdown = false; }}>{key}</button>
					{/each}
				</div>
			{/if}
		</div>
		<span class="count">{filteredRuns.length} of {allRuns.length} runs</span>
	</div>
	{#if showFilterPanel}
		<div class="filter-panel">
			<label>
				State:
				<select class="filter" bind:value={stateFilter}>
					<option value="all">All states</option>
					{#each states as s}
						<option value={s}>{s}</option>
					{/each}
				</select>
			</label>
			<button class="toolbar-btn" onclick={() => {}}>Add filter</button>
		</div>
	{/if}
	{#if showSortPanel}
		<div class="sort-panel">
			<span>Sort by:</span>
			<button class:active={sortBy === 'name'} onclick={() => toggleSort('name')}>Name</button>
			<button class:active={sortBy === 'state'} onclick={() => toggleSort('state')}>State</button>
			<button class:active={sortBy === 'created'} onclick={() => toggleSort('created')}>Created</button>
			<span class="sort-dir">{sortDir === 'asc' ? '↑ Ascending' : '↓ Descending'}</span>
		</div>
	{/if}

	{#if filteredRuns.length === 0}
		<p class="empty">{allRuns.length === 0 ? 'No runs yet.' : 'No runs match filters.'}</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th class="checkbox-col"><input type="checkbox" checked={allSelected} onchange={() => toggleSelectAll()} /></th>
						<th class="sortable" onclick={() => toggleSort('name')}>Name{sortIndicator('name')}</th>
						<th class="sortable" onclick={() => toggleSort('state')}>State{sortIndicator('state')}</th>
						{#each allConfigKeys as key}
							<th>{key}</th>
						{/each}
						{#each allSummaryKeys as key}
							<th>{key}</th>
						{/each}
						<th>Tags</th>
						<th class="sortable" onclick={() => toggleSort('created')}>Created{sortIndicator('created')}</th>
					</tr>
				</thead>
				<tbody>
					{#if groupedRuns}
						{#each groupedRuns as group}
							<tr class="group-header">
								<td colspan={4 + allConfigKeys.length + allSummaryKeys.length}>
									<strong>{groupByKey}: {group.key}</strong> ({group.runs.length} runs)
								</td>
							</tr>
							{#each group.runs as run}
								{@const config = parseConfig(run.config)}
								{@const summary = parseSummary(run.summaryMetrics)}
								<tr>
									<td class="checkbox-col"><input type="checkbox" checked={selectedRuns.has(run.name)} onchange={() => toggleRunSelection(run.name)} /></td>
									<td>
										<a href="/{entity}/{project}/runs/{run.name}">
											{run.displayName || run.name}
										</a>
									</td>
									<td><StateBadge state={run.state} /></td>
									{#each allConfigKeys as key}
										<td class="metric-cell">{fmtValue(config[key])}</td>
									{/each}
									{#each allSummaryKeys as key}
										<td class="metric-cell">{fmtValue(summary[key])}</td>
									{/each}
									<td class="tags">
										{#if run.tags?.length}
											{#each run.tags as tag}
												<span class="tag">{tag}</span>
											{/each}
										{:else}
											<span class="dim">-</span>
										{/if}
									</td>
									<td>{relativeTime(run.createdAt)}</td>
								</tr>
							{/each}
						{/each}
					{:else}
						{#each filteredRuns as run}
							{@const config = parseConfig(run.config)}
							{@const summary = parseSummary(run.summaryMetrics)}
							<tr>
								<td class="checkbox-col"><input type="checkbox" checked={selectedRuns.has(run.name)} onchange={() => toggleRunSelection(run.name)} /></td>
								<td>
									<a href="/{entity}/{project}/runs/{run.name}">
										{run.displayName || run.name}
									</a>
								</td>
								<td><StateBadge state={run.state} /></td>
								{#each allConfigKeys as key}
									<td class="metric-cell">{fmtValue(config[key])}</td>
								{/each}
								{#each allSummaryKeys as key}
									<td class="metric-cell">{fmtValue(summary[key])}</td>
								{/each}
								<td class="tags">
									{#if run.tags?.length}
										{#each run.tags as tag}
											<span class="tag">{tag}</span>
										{/each}
									{:else}
										<span class="dim">-</span>
									{/if}
								</td>
								<td>{relativeTime(run.createdAt)}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
{:else}
	<p class="error">Project not found.</p>
{/if}

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 0.75rem;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
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

	.sort-panel {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		margin-bottom: 0.75rem;
		font-size: 0.85rem;
		color: #8899aa;
	}

	.sort-panel button { padding: 0.3rem 0.6rem; background: transparent; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; }
	.sort-panel button.active { color: #4fc3f7; border-color: #4fc3f7; }

	.filter-panel {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		margin-bottom: 0.75rem;
		font-size: 0.85rem;
		color: #8899aa;
	}

	.filter-panel label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.dropdown-wrap {
		position: relative;
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		z-index: 10;
		min-width: 160px;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		margin-top: 4px;
		padding: 4px 0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	.dropdown-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.4rem 0.75rem;
		background: transparent;
		border: none;
		color: #8899aa;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.dropdown-item:hover { background: rgba(79, 195, 247, 0.1); color: #e0e0e0; }
	.dropdown-item.active { color: #4fc3f7; }

	.checkbox-col {
		width: 32px;
		text-align: center;
	}

	.group-header td {
		background: #0f1a2e;
		padding: 0.5rem 0.75rem;
		color: #4fc3f7;
		font-size: 0.85rem;
		border-bottom: 1px solid #1e2d4a;
	}

	.search {
		flex: 1;
		max-width: 300px;
		padding: 0.5rem 0.75rem;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		color: #e0e0e0;
		font-size: 0.85rem;
	}

	.search::placeholder {
		color: #556677;
	}

	.filter {
		padding: 0.5rem 0.75rem;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		color: #e0e0e0;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.count {
		color: #8899aa;
		font-size: 0.85rem;
		margin-left: auto;
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 700px;
	}

	th {
		text-align: left;
		padding: 0.75rem;
		border-bottom: 2px solid #0f3460;
		color: #8899aa;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		white-space: nowrap;
	}

	th.sortable {
		cursor: pointer;
		user-select: none;
	}

	th.sortable:hover {
		color: #c0d0e0;
	}

	td {
		padding: 0.75rem;
		border-bottom: 1px solid #1e2d4a;
		vertical-align: top;
	}

	tr:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.metric-cell {
		font-size: 0.8rem;
		color: #90caf9;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.tag {
		font-size: 0.75rem;
		background: rgba(255, 215, 0, 0.15);
		color: #ffd700;
		padding: 1px 6px;
		border-radius: 3px;
	}

	.dim {
		color: #556677;
	}

	.loading,
	.empty {
		color: #8899aa;
		padding: 2rem;
		text-align: center;
	}

	.error {
		color: #ef5350;
		padding: 2rem;
		text-align: center;
	}
</style>
