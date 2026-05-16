<script lang="ts">
	import { page } from '$app/state';
	import { queryStore, getContextClient } from '@urql/svelte';
	import { RUN_DETAIL_QUERY, SAMPLED_HISTORY_QUERY, RUN_LOGS_QUERY } from '$lib/graphql/queries';
	import { relativeTime } from '$lib/utils/time';
	import { getColor } from '$lib/utils/colors';
	import StateBadge from '$lib/components/StateBadge.svelte';
	import LineChart from '$lib/components/LineChart.svelte';
	import CustomChartPanel from '$lib/components/CustomChartPanel.svelte';
	import WandbTable from '$lib/components/WandbTable.svelte';
	import WandbTableArtifacts from '$lib/components/WandbTableArtifacts.svelte';

	const client = getContextClient();
	const entity = $derived(page.params.entity);
	const project = $derived(page.params.project);
	const runId = $derived(page.params.runId);

	// Tab from URL path: /runs/[runId]/overview → 'overview', etc.
	const tabParam = $derived(page.params.tab || 'charts');
	let activeTab: 'overview' | 'charts' | 'logs' | 'files' | 'artifacts' = $state('charts');
	$effect(() => { activeTab = tabParam as typeof activeTab; });

	const detail = $derived(
		queryStore({
			client,
			query: RUN_DETAIL_QUERY,
			variables: { entityName: entity, projectName: project, runName: runId }
		})
	);

	const run = $derived($detail.data?.project?.run);
	const historyKeys = $derived(run?.historyKeys ? JSON.parse(JSON.stringify(run.historyKeys)) : null);
	const metricKeys = $derived(
		historyKeys?.keys
			? Object.keys(historyKeys.keys).filter((k: string) => !k.startsWith('_'))
			: []
	);

	// Parse custom chart definitions from run config (_bandw_charts key)
	const customCharts = $derived(run ? parseCustomCharts(run.config) : []);

	// Build sampledHistory specs for all metric keys
	const specs = $derived(
		metricKeys.map((k: string) =>
			JSON.stringify({
				keys: ['_step', k],
				samples: 500,
				minStep: 0,
				maxStep: (historyKeys?.lastStep ?? 0) + 1
			})
		)
	);

	// Build extra specs for custom chart keys that need sampled history
	const customChartSpecs = $derived(
		customCharts
			.filter((c) => !c.data && c.xKey && c.yKey)
			.map((c) =>
				JSON.stringify({
					keys: [c.xKey!, c.yKey!],
					samples: 500,
					minStep: 0,
					maxStep: (historyKeys?.lastStep ?? 0) + 1
				})
			)
	);

	const allSpecs = $derived([...specs, ...customChartSpecs]);

	const historyResult = $derived(
		allSpecs.length > 0
			? queryStore({
					client,
					query: SAMPLED_HISTORY_QUERY,
					variables: { entityName: entity, projectName: project, runName: runId, specs: allSpecs }
				})
			: null
	);

	const chartData = $derived.by(() => {
		if (!historyResult || !$historyResult?.data?.project?.run?.sampledHistory) return [];
		const sampled = $historyResult.data.project.run.sampledHistory;
		return metricKeys.map((key: string, i: number) => {
			const rows = sampled[i] || [];
			return {
				key,
				series: [
					{
						label: key,
						color: getColor(i),
						data: rows
							.filter((r: Record<string, number>) => r[key] != null)
							.map((r: Record<string, number>) => ({ x: r._step, y: r[key] }))
					}
				]
			};
		});
	});

	// Extract sampled rows for custom charts that need history data
	const customChartSampled = $derived.by(() => {
		if (!historyResult || !$historyResult?.data?.project?.run?.sampledHistory) return [];
		const sampled = $historyResult.data.project.run.sampledHistory;
		const chartsNeedingHistory = customCharts.filter((c) => !c.data && c.xKey && c.yKey);
		return chartsNeedingHistory.map((_c, i) => {
			return (sampled[specs.length + i] || []) as Record<string, number>[];
		});
	});

	type CustomChartDef = {
		title: string;
		type: string;
		xKey?: string;
		yKey?: string;
		labelKey?: string;
		valueKey?: string;
		data?: Record<string, unknown>[];
	};

	function parseCustomCharts(raw: string | null): CustomChartDef[] {
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw);
			const chartsRaw = parsed['_bandw_charts'];
			if (!chartsRaw) return [];
			// It may be wrapped in {value: [...]} by wandb config format
			const arr = typeof chartsRaw === 'object' && chartsRaw !== null && 'value' in chartsRaw
				? chartsRaw.value
				: chartsRaw;
			if (!Array.isArray(arr)) return [];
			return arr as CustomChartDef[];
		} catch {
			return [];
		}
	}

	type BandwTableDef = {
		columns: string[];
		data: unknown[][];
		steps?: { columns: string[]; data: unknown[][]; step: number }[];
	};

	type BandwArtifactDef = {
		name: string;
		type: string;
		table_name: string;
		columns: string[];
		data: unknown[][];
	};

	// Parse _bandw_tables from run config
	const bandwTables = $derived(run ? parseBandwTables(run.config) : {});
	const bandwArtifacts = $derived(run ? parseBandwArtifacts(run.config) : []);

	function parseBandwTables(raw: string | null): Record<string, BandwTableDef> {
		if (!raw) return {};
		try {
			const parsed = JSON.parse(raw);
			const tablesRaw = parsed['_bandw_tables'];
			if (!tablesRaw) return {};
			const obj = typeof tablesRaw === 'object' && tablesRaw !== null && 'value' in tablesRaw
				? tablesRaw.value
				: tablesRaw;
			if (!obj || typeof obj !== 'object') return {};
			return obj as Record<string, BandwTableDef>;
		} catch {
			return {};
		}
	}

	function parseBandwArtifacts(raw: string | null): BandwArtifactDef[] {
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw);
			const artsRaw = parsed['_bandw_artifacts'];
			if (!artsRaw) return [];
			const arr = typeof artsRaw === 'object' && artsRaw !== null && 'value' in artsRaw
				? artsRaw.value
				: artsRaw;
			if (!Array.isArray(arr)) return [];
			return arr as BandwArtifactDef[];
		} catch {
			return [];
		}
	}

	function parseConfig(raw: string | null): Record<string, unknown> {
		if (!raw) return {};
		try {
			const parsed = JSON.parse(raw);
			const out: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(parsed)) {
				if (k.startsWith('_')) continue;
				out[k] = typeof v === 'object' && v !== null && 'value' in (v as Record<string, unknown>)
					? (v as Record<string, unknown>).value
					: v;
			}
			return out;
		} catch {
			return {};
		}
	}

	function parseSummary(raw: string | null): Record<string, unknown> {
		if (!raw) return {};
		try {
			const parsed = JSON.parse(raw);
			const out: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(parsed)) {
				if (k.startsWith('_')) continue;
				out[k] = v;
			}
			return out;
		} catch {
			return {};
		}
	}

	// Logs query (lazy — only fetched when logs tab is active)
	const logsResult = $derived(
		(activeTab as string) === 'logs'
			? queryStore({
					client,
					query: RUN_LOGS_QUERY,
					variables: { entityName: entity, projectName: project, runName: runId, limit: 5000 }
				})
			: null
	);

	const logLines = $derived(
		logsResult && $logsResult?.data?.project?.run?.logLines
			? $logsResult.data.project.run.logLines.edges.map((e: { node: { lineNum: number; content: string; stream: string } }) => e.node)
			: []
	);

	let logSearch = $state('');
	const filteredLogs = $derived(
		logSearch
			? logLines.filter((l: { content: string }) => l.content.toLowerCase().includes(logSearch.toLowerCase()))
			: logLines
	);

	// Files from run
	const runFiles = $derived(
		run?.files?.edges?.map((e: { node: { id: string; name: string; url: string; directUrl: string; sizeBytes: number } }) => e.node) ?? []
	);

	// File viewer state
	let selectedFile: { name: string; url: string; directUrl: string } | null = $state(null);
	let fileContent = $state('');
	let fileLoading = $state(false);

	async function openFile(file: { name: string; url: string; directUrl: string }) {
		selectedFile = file;
		fileLoading = true;
		fileContent = '';
		try {
			const fetchUrl = file.directUrl || file.url;
			if (fetchUrl) {
				const resp = await fetch(fetchUrl);
				if (resp.ok) {
					fileContent = await resp.text();
				} else {
					fileContent = `(Failed to load file: ${resp.status})`;
				}
			} else {
				fileContent = '(No URL available for this file)';
			}
		} catch (err) {
			fileContent = `(Error loading file: ${err})`;
		}
		fileLoading = false;
	}

	// Parse _bandw_files from config
	const bandwFiles = $derived.by(() => {
		if (!run?.config) return [];
		try {
			const parsed = JSON.parse(run.config);
			const files = parsed['_bandw_files'];
			if (!files) return [];
			const val = typeof files === 'object' && 'value' in files ? files.value : files;
			return (val?.files || []) as { name: string; content: string }[];
		} catch { return []; }
	});

	const configParsed = $derived(run ? parseConfig(run.config) : {});
	const summaryParsed = $derived(run ? parseSummary(run.summaryMetrics) : {});

	let configSearch = $state('');
	let summarySearch = $state('');

	const filteredConfig = $derived(
		Object.entries(configParsed).filter(([k]) =>
			!configSearch || k.toLowerCase().includes(configSearch.toLowerCase())
		)
	);

	const filteredSummary = $derived(
		Object.entries(summaryParsed).filter(([k]) =>
			!summarySearch || k.toLowerCase().includes(summarySearch.toLowerCase())
		)
	);

	function fmtVal(v: unknown): string {
		if (typeof v === 'number') {
			if (Number.isInteger(v)) return String(v);
			if (Math.abs(v) < 0.001) return v.toExponential(3);
			return v.toFixed(4);
		}
		if (typeof v === 'string') return `"${v}"`;
		if (Array.isArray(v)) return v.map(fmtVal).join(', ');
		return String(v);
	}
</script>

{#if $detail.fetching}
	<p class="loading">Loading run...</p>
{:else if !run}
	<p class="error">Run not found.</p>
{:else}
	<div class="header">
		<div class="header-name">
			<span class="header-label">Name</span>
			<h1 aria-label={run.displayName || run.name} class="run-title"></h1>
		</div>
		<StateBadge state={run.state} />
	</div>

	{#if run.tags?.length}
		<div class="tags">
			{#each run.tags as tag}
				<span class="tag-chip">{tag}</span>
			{/each}
			<button class="tag-add" onclick={() => {}}>+</button>
		</div>
	{:else}
		<div class="tags">
			<button class="tag-add" onclick={() => {}}>+</button>
		</div>
	{/if}

	<p class="meta">
		<a href="/{entity}/projects">{entity}</a> /
		<a href="/{entity}/{project}/table">{project}</a> /
		{run.name}
		&middot; Created {relativeTime(run.createdAt)}
		{#if run.user?.username}
			&middot; by {run.user.username}
		{/if}
	</p>

	<div class="tabs" role="tablist">
		<button role="tab" aria-selected={activeTab === 'charts'} class:active={activeTab === 'charts'} onclick={() => (activeTab = 'charts')}>Charts</button>
		<button role="tab" aria-selected={activeTab === 'overview'} class:active={activeTab === 'overview'} onclick={() => (activeTab = 'overview')}>Overview</button>
		<button role="tab" aria-selected={activeTab === 'logs'} class:active={activeTab === 'logs'} onclick={() => (activeTab = 'logs')}>Logs</button>
		<button role="tab" aria-selected={activeTab === 'files'} class:active={activeTab === 'files'} onclick={() => (activeTab = 'files')}>Files</button>
		<button role="tab" aria-selected={activeTab === 'artifacts'} class:active={activeTab === 'artifacts'} onclick={() => (activeTab = 'artifacts')}>Artifacts</button>
	</div>

	{#if activeTab === 'overview'}
		<div class="sections" role="tabpanel">
			<section class="notes-section">
				<h2>Notes</h2>
				<div class="notes-content">
					{#if run.notes || run.description}
						<p>{run.notes || run.description}</p>
					{:else}
						<p class="dim placeholder">What makes this run special?</p>
					{/if}
				</div>
			</section>

			<section>
				<h2>Config</h2>
				<input
					type="text"
					placeholder="Search keys with regex"
					class="section-search"
					bind:value={configSearch}
				/>
				{#if Object.keys(configParsed).length}
					<ul role="list">
						<li>
							<label>Config parameters:</label>
							<span class="key-count">{filteredConfig.length} / {Object.keys(configParsed).length} keys</span>
							<ul role="list">
								{#each filteredConfig as [k, v]}
									<li class="kv-item"><span class="key">{k}:</span> <span class="value">{fmtVal(v)}</span></li>
								{/each}
							</ul>
						</li>
					</ul>
				{:else}
					<p class="dim">No config</p>
				{/if}
			</section>

			<section>
				<h2>Summary</h2>
				<input
					type="text"
					placeholder="Search keys with regex"
					class="section-search"
					bind:value={summarySearch}
				/>
				{#if Object.keys(summaryParsed).length}
					<ul role="list">
						<li>
							<label>Summary metrics:</label>
							<span class="key-count">{filteredSummary.length} / {Object.keys(summaryParsed).length} keys</span>
							<ul role="list">
								{#each filteredSummary as [k, v]}
									<li class="kv-item"><span class="key">{k}:</span> <span class="value">{fmtVal(v)}</span></li>
								{/each}
							</ul>
						</li>
					</ul>
				{:else}
					<p class="dim">No summary metrics</p>
				{/if}
			</section>

			<section>
				<h2>Metadata</h2>
				<table><tbody>
					<tr><td class="key">Run ID</td><td>{run.name}</td></tr>
					<tr><td class="key">State</td><td>{run.state}</td></tr>
					{#if run.host}<tr><td class="key">Host</td><td>{run.host}</td></tr>{/if}
					{#if run.commit}<tr><td class="key">Commit</td><td>{run.commit}</td></tr>{/if}
					{#if run.group}<tr><td class="key">Group</td><td>{run.group}</td></tr>{/if}
					{#if run.jobType}<tr><td class="key">Job Type</td><td>{run.jobType}</td></tr>{/if}
					<tr><td class="key">History Steps</td><td>{run.historyLineCount ?? 0}</td></tr>
					{#if run.tags?.length}
						<tr><td class="key">Tags</td><td>{run.tags.join(', ')}</td></tr>
					{/if}
				</tbody></table>
			</section>
		</div>
	{:else if activeTab === 'charts'}
		{#if Object.keys(bandwTables).length > 0}
			<div class="tables-section">
				{#each Object.entries(bandwTables) as [tableName, tableDef]}
					<WandbTable
						title={tableName}
						columns={tableDef.columns}
						data={tableDef.data}
						steps={tableDef.steps}
						exposeTableRole={false}
					/>
				{/each}
			</div>
		{/if}
		<div class="charts-grid">
			{#if customCharts.length > 0}
				{@const chartsNeedingHistory = customCharts.filter((c) => !c.data && c.xKey && c.yKey)}
				{#each customCharts as chart, i}
					{@const histIdx = chartsNeedingHistory.indexOf(chart)}
					<CustomChartPanel
						{chart}
						sampledRows={histIdx >= 0 ? customChartSampled[histIdx] ?? [] : []}
						index={i}
					/>
				{/each}
			{:else if chartData.length === 0 && Object.keys(bandwTables).length === 0}
				<p class="loading">Loading charts...</p>
			{:else}
				{#each chartData as { key, series }}
					<LineChart title={key} {series} />
				{/each}
			{/if}
		</div>
	{:else if activeTab === 'files'}
		<div class="files-panel" role="tabpanel">
			{#if bandwFiles.length > 0}
				<div class="files-layout">
					<div class="file-browser">
						{#each bandwFiles as file}
							<button class="file-row" class:active={selectedFile?.name === file.name} onclick={() => { selectedFile = { name: file.name, url: '', directUrl: '' }; fileContent = file.content; fileLoading = false; }}>
								<span class="file-icon">📄</span>
								<span class="file-name">{file.name}</span>
							</button>
						{/each}
					</div>
					{#if selectedFile}
						<div class="file-viewer">
							<div class="file-viewer-header">
								<span class="file-viewer-title">{selectedFile.name}</span>
							</div>
							<pre class="file-content"><code>{fileContent}</code></pre>
						</div>
					{/if}
				</div>
			{:else if runFiles.length === 0}
				<p class="dim">No files uploaded for this run.</p>
			{:else}
				<div class="files-layout">
					<div class="file-browser">
						{#each runFiles as file}
							<button class="file-row" class:active={selectedFile?.name === file.name} onclick={() => openFile(file)}>
								<span class="file-icon">📄</span>
								<span class="file-name">{file.name}</span>
								{#if file.sizeBytes}
									<span class="file-size">{(file.sizeBytes / 1024).toFixed(1)} KB</span>
								{/if}
							</button>
						{/each}
					</div>
					{#if selectedFile}
						<div class="file-viewer">
							<div class="file-viewer-header">
								<span class="file-viewer-title">{selectedFile.name}</span>
								{#if selectedFile.directUrl || selectedFile.url}
									<a href={selectedFile.directUrl || selectedFile.url} class="file-download" download>Download</a>
								{/if}
							</div>
							{#if fileLoading}
								<p class="loading">Loading file...</p>
							{:else}
								<pre class="file-content"><code>{fileContent}</code></pre>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{:else if activeTab === 'artifacts'}
		<div role="tabpanel">
			{#if bandwArtifacts.length > 0 || Object.keys(bandwTables).length > 0}
				<WandbTableArtifacts tables={bandwTables} artifacts={bandwArtifacts} />
			{:else}
				<p class="dim">No table artifacts found for this run.</p>
			{/if}
		</div>
	{:else if activeTab === 'logs'}
		<div class="logs-panel">
			<div class="logs-header">
				<input
					type="text"
					placeholder="Search logs..."
					class="log-search"
					bind:value={logSearch}
				/>
				<span class="log-count">{filteredLogs.length} / {logLines.length} lines</span>
			</div>
			{#if logsResult && $logsResult?.fetching}
				<p class="loading">Loading logs...</p>
			{:else if logLines.length === 0}
				<div class="log-terminal">
					<p class="dim">No console output captured.</p>
				</div>
			{:else}
				<div class="log-terminal">
					{#each filteredLogs as line}
						<div class="log-line" class:stderr={line.stream === 'stderr'}>
							<span class="line-num">{line.lineNum}</span>
							<span class="line-content">{line.content}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-name {
		display: flex;
		flex-direction: column;
	}

	.header-label {
		font-size: 0.7rem;
		color: #667788;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	h1 {
		font-size: 1.5rem;
		margin: 0;
	}
	h1.run-title::after {
		content: attr(aria-label);
	}

	.meta {
		color: #8899aa;
		font-size: 0.85rem;
		margin: 0.5rem 0 1rem;
	}

	.tabs {
		display: flex;
		gap: 0;
		border-bottom: 2px solid #0f3460;
		margin-bottom: 1.5rem;
	}

	.tabs button {
		background: none;
		border: none;
		color: #8899aa;
		padding: 0.6rem 1.2rem;
		font-size: 0.9rem;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
	}

	.tabs button.active {
		color: #e0e0e0;
		border-bottom-color: #4fc3f7;
	}

	.tabs button:hover {
		color: #c0d0e0;
	}

	.sections {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	section {
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 1rem;
	}

	h2 {
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #8899aa;
		margin: 0 0 0.75rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	td {
		padding: 0.35rem 0.5rem;
		border-bottom: 1px solid #1e2d4a;
		font-size: 0.85rem;
	}

	.key {
		color: #8899aa;
		font-weight: 500;
	}

	ul[role="list"] {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.kv-item {
		padding: 0.35rem 0.5rem;
		border-bottom: 1px solid #1e2d4a;
		font-size: 0.85rem;
	}

	.kv-item .value {
		color: #4fc3f7;
	}

	.key-count {
		color: #556677;
		font-size: 0.8rem;
		margin-left: 0.5rem;
	}

	.dim {
		color: #556677;
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

	.error {
		color: #ef5350;
		padding: 2rem;
		text-align: center;
	}

	.logs-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.logs-header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.log-search {
		flex: 1;
		max-width: 400px;
		padding: 0.5rem 0.75rem;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		color: #e0e0e0;
		font-size: 0.85rem;
		font-family: inherit;
	}

	.log-search::placeholder {
		color: #556677;
	}

	.log-count {
		color: #8899aa;
		font-size: 0.8rem;
	}

	.log-terminal {
		background: #0d1117;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 0.75rem;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 0.8rem;
		line-height: 1.5;
		max-height: 600px;
		overflow-y: auto;
	}

	.log-line {
		display: flex;
		gap: 1rem;
		white-space: pre-wrap;
		word-break: break-all;
	}

	.log-line:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.log-line.stderr {
		color: #ff6b6b;
	}

	.line-num {
		color: #445566;
		min-width: 3rem;
		text-align: right;
		user-select: none;
		flex-shrink: 0;
	}

	.line-content {
		color: #c9d1d9;
	}

	.tags {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
		margin: 0.4rem 0;
	}

	.tag-chip {
		background: #1e3a5f;
		color: #4fc3f7;
		padding: 0.15rem 0.6rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.tag-add {
		background: none;
		border: 1px dashed #556677;
		color: #8899aa;
		border-radius: 12px;
		width: 1.5rem;
		height: 1.5rem;
		font-size: 0.9rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.tag-add:hover {
		border-color: #8899aa;
		color: #c0d0e0;
	}

	.notes-section {
		grid-column: 1 / -1;
	}

	.notes-content {
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.notes-content .placeholder {
		font-style: italic;
	}

	.section-search {
		width: 100%;
		padding: 0.4rem 0.6rem;
		margin-bottom: 0.75rem;
		background: #0d1117;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		color: #e0e0e0;
		font-size: 0.8rem;
		font-family: inherit;
	}

	.section-search::placeholder {
		color: #556677;
	}

	.placeholder-panel {
		padding: 2rem;
		text-align: center;
	}

	.tables-section {
		margin-bottom: 1.5rem;
	}

	.files-panel h2 {
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #8899aa;
		margin: 0 0 0.75rem;
	}

	.files-layout {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.file-browser {
		width: 260px;
		flex-shrink: 0;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 0.5rem;
		max-height: 600px;
		overflow-y: auto;
	}

	.file-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.4rem 0.5rem;
		border: none;
		background: none;
		color: #e0e0e0;
		cursor: pointer;
		border-radius: 4px;
		text-align: left;
		font-size: 0.85rem;
	}

	.file-row:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.file-row.active {
		background: rgba(79, 195, 247, 0.1);
		color: #4fc3f7;
	}

	.file-icon {
		flex-shrink: 0;
	}

	.file-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-size {
		color: #556677;
		font-size: 0.75rem;
		flex-shrink: 0;
	}

	.file-viewer {
		flex: 1;
		min-width: 0;
		background: #0d1117;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		overflow: hidden;
	}

	.file-viewer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: #16213e;
		border-bottom: 1px solid #1e2d4a;
	}

	.file-viewer-title {
		font-size: 0.85rem;
		font-weight: 500;
		color: #e0e0e0;
	}

	.file-download {
		font-size: 0.8rem;
		color: #4fc3f7;
		text-decoration: none;
	}

	.file-download:hover {
		text-decoration: underline;
	}

	.file-content {
		padding: 0.75rem;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 0.8rem;
		line-height: 1.5;
		color: #c9d1d9;
		overflow-x: auto;
		max-height: 600px;
		overflow-y: auto;
		margin: 0;
		white-space: pre-wrap;
		word-break: break-all;
	}
</style>
