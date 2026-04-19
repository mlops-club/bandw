<script lang="ts">
	import { page } from '$app/state';
	import { queryStore, getContextClient } from '@urql/svelte';
	import { RUN_DETAIL_QUERY, SAMPLED_HISTORY_QUERY, RUN_LOGS_QUERY } from '$lib/graphql/queries';
	import { relativeTime } from '$lib/utils/time';
	import { getColor } from '$lib/utils/colors';
	import StateBadge from '$lib/components/StateBadge.svelte';
	import LineChart from '$lib/components/LineChart.svelte';

	const client = getContextClient();
	const entity = $derived(page.params.entity);
	const project = $derived(page.params.project);
	const runId = $derived(page.params.runId);

	let activeTab: 'overview' | 'charts' | 'logs' = $state('charts');

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

	const historyResult = $derived(
		specs.length > 0
			? queryStore({
					client,
					query: SAMPLED_HISTORY_QUERY,
					variables: { entityName: entity, projectName: project, runName: runId, specs }
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
		activeTab === 'logs'
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

	const configParsed = $derived(run ? parseConfig(run.config) : {});
	const summaryParsed = $derived(run ? parseSummary(run.summaryMetrics) : {});

	function fmtVal(v: unknown): string {
		if (typeof v === 'number') {
			if (Number.isInteger(v)) return String(v);
			if (Math.abs(v) < 0.001) return v.toExponential(3);
			return v.toFixed(4);
		}
		return String(v);
	}
</script>

{#if $detail.fetching}
	<p class="loading">Loading run...</p>
{:else if !run}
	<p class="error">Run not found.</p>
{:else}
	<div class="header">
		<h1>{run.displayName || run.name}</h1>
		<StateBadge state={run.state} />
	</div>
	<p class="meta">
		<a href="/{entity}/projects">{entity}</a> /
		<a href="/{entity}/{project}/table">{project}</a> /
		{run.name}
		&middot; Created {relativeTime(run.createdAt)}
		{#if run.user?.username}
			&middot; by {run.user.username}
		{/if}
	</p>

	<div class="tabs">
		<button class:active={activeTab === 'charts'} onclick={() => (activeTab = 'charts')}>Charts</button>
		<button class:active={activeTab === 'overview'} onclick={() => (activeTab = 'overview')}>Overview</button>
		<button class:active={activeTab === 'logs'} onclick={() => (activeTab = 'logs')}>Logs</button>
	</div>

	{#if activeTab === 'overview'}
		<div class="sections">
			<section>
				<h2>Config</h2>
				{#if Object.keys(configParsed).length}
					<table><tbody>
						{#each Object.entries(configParsed) as [k, v]}
							<tr><td class="key">{k}</td><td>{fmtVal(v)}</td></tr>
						{/each}
					</tbody></table>
				{:else}
					<p class="dim">No config</p>
				{/if}
			</section>

			<section>
				<h2>Summary Metrics</h2>
				{#if Object.keys(summaryParsed).length}
					<table><tbody>
						{#each Object.entries(summaryParsed) as [k, v]}
							<tr><td class="key">{k}</td><td>{fmtVal(v)}</td></tr>
						{/each}
					</tbody></table>
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
	{:else}
		<div class="charts-grid">
			{#if chartData.length === 0}
				<p class="loading">Loading charts...</p>
			{:else}
				{#each chartData as { key, series }}
					<LineChart title={key} {series} />
				{/each}
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

	h1 {
		font-size: 1.5rem;
		margin: 0;
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
		width: 40%;
		font-weight: 500;
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
</style>
