<script lang="ts">
	import { page } from '$app/state';
	import { queryStore, getContextClient } from '@urql/svelte';
	import { RUNS_QUERY, SAMPLED_HISTORY_QUERY } from '$lib/graphql/queries';
	import { getColor } from '$lib/utils/colors';
	import StateBadge from '$lib/components/StateBadge.svelte';
	import LineChart from '$lib/components/LineChart.svelte';

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

	const keysQuery = $derived(
		visibleRuns.length > 0
			? queryStore({
					client,
					query: gql(HISTORY_KEYS_QUERY),
					variables: { entity, project, run: visibleRuns[0].name }
				})
			: null
	);

	const allMetricKeys = $derived.by(() => {
		if (!keysQuery || !$keysQuery?.data?.project?.run?.historyKeys) return [];
		const hk = $keysQuery.data.project.run.historyKeys;
		return Object.keys(hk.keys || {}).filter((k: string) => !k.startsWith('_'));
	});

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
</script>

<h1>Workspace</h1>

{#if $runsResult.fetching}
	<p class="loading">Loading...</p>
{:else}
	<div class="workspace">
		<aside class="sidebar">
			<h2>Runs ({runs.length})</h2>
			{#each runs as run, i}
				<button
					class="run-row"
					class:visible={visibleRunIds.has(run.name)}
					onclick={() => toggleRun(run.name)}
				>
					<span class="eye">{visibleRunIds.has(run.name) ? '●' : '○'}</span>
					<span class="dot" style="background: {getColor(i)}"></span>
					<span class="run-name">{run.displayName || run.name}</span>
					<StateBadge state={run.state} />
				</button>
			{/each}
		</aside>

		<div class="charts-area">
			{#if chartsByMetric.length === 0}
				<p class="loading">
					{visibleRuns.length === 0 ? 'Select runs to compare.' : 'Loading charts...'}
				</p>
			{:else}
				<div class="charts-grid">
					{#each chartsByMetric as { key, series }}
						{#if series.length > 0}
							<LineChart title={key} {series} />
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

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
