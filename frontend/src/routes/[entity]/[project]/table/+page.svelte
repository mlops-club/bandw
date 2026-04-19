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
</script>

<h1>Runs</h1>

{#if $result.fetching}
	<p class="loading">Loading runs...</p>
{:else if $result.error}
	<p class="error">Error: {$result.error.message}</p>
{:else if $result.data?.project}
	{@const runs = $result.data.project.runs}
	<p class="count">{runs.totalCount} run{runs.totalCount !== 1 ? 's' : ''}</p>

	{#if runs.edges.length === 0}
		<p class="empty">No runs yet.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>State</th>
						<th>Summary</th>
						<th>Tags</th>
						<th>Created</th>
						<th>Duration</th>
					</tr>
				</thead>
				<tbody>
					{#each runs.edges as { node: run }}
						{@const summary = parseSummary(run.summaryMetrics)}
						<tr>
							<td>
								<a href="/{entity}/{project}/runs/{run.name}">
									{run.displayName || run.name}
								</a>
							</td>
							<td><StateBadge state={run.state} /></td>
							<td class="summary">
								{#each Object.entries(summary).slice(0, 4) as [k, v]}
									<span class="metric">{k}: {fmt(v)}</span>
								{/each}
								{#if Object.keys(summary).length === 0}
									<span class="dim">-</span>
								{/if}
							</td>
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
							<td>{relativeTime(run.createdAt)}</td>
						</tr>
					{/each}
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
		margin-bottom: 0.5rem;
	}

	.count {
		color: #8899aa;
		margin-bottom: 1rem;
		font-size: 0.9rem;
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

	td {
		padding: 0.75rem;
		border-bottom: 1px solid #1e2d4a;
		vertical-align: top;
	}

	tr:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.summary {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.metric {
		font-size: 0.8rem;
		color: #90caf9;
		background: rgba(100, 181, 246, 0.1);
		padding: 1px 6px;
		border-radius: 3px;
		font-variant-numeric: tabular-nums;
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
