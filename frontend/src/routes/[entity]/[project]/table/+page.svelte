<script lang="ts">
	import { page } from '$app/state';
	import { queryStore, gql } from '@urql/svelte';
	import { client } from '$lib/graphql';

	const entity = $derived(page.params.entity);
	const project = $derived(page.params.project);

	const RUNS_QUERY = gql`
		query ProjectRuns($name: String, $entityName: String) {
			project(name: $name, entityName: $entityName) {
				runs(first: 50) {
					edges {
						node {
							name
							displayName
							state
							config
							summaryMetrics
							createdAt
						}
					}
					totalCount
				}
			}
		}
	`;

	const variables = $derived({ name: project, entityName: entity });

	const runs = queryStore({
		client,
		query: RUNS_QUERY,
		variables,
	});

	function stateColor(state: string | null): string {
		switch (state) {
			case 'finished': return '#4caf50';
			case 'crashed': return '#f44336';
			case 'running': return '#2196f3';
			default: return '#888';
		}
	}

	function truncate(s: string | null, max = 40): string {
		if (!s) return '';
		return s.length > max ? s.slice(0, max) + '...' : s;
	}

	function formatDate(iso: string | null): string {
		if (!iso) return '';
		return new Date(iso).toLocaleString();
	}
</script>

<h2>Runs</h2>

{#if $runs.fetching}
	<p>Loading...</p>
{:else if $runs.error}
	<p class="error">Error: {$runs.error.message}</p>
{:else if $runs.data?.project}
	{@const edges = $runs.data.project.runs.edges}
	{@const total = $runs.data.project.runs.totalCount}
	<p class="count">{total} run{total !== 1 ? 's' : ''}</p>
	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th>State</th>
				<th>Created</th>
				<th>Config</th>
				<th>Summary</th>
			</tr>
		</thead>
		<tbody>
			{#each edges as { node }}
				<tr>
					<td>
						<a href="/{entity}/{project}/runs/{node.name}/overview">
							{node.displayName || node.name}
						</a>
					</td>
					<td>
						<span class="badge" style="background: {stateColor(node.state)}">
							{node.state}
						</span>
					</td>
					<td class="mono">{formatDate(node.createdAt)}</td>
					<td class="mono">{truncate(node.config)}</td>
					<td class="mono">{truncate(node.summaryMetrics)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p>Project not found.</p>
{/if}

<style>
	.count {
		color: #888;
		margin-bottom: 0.5rem;
	}
	.error {
		color: #f44336;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th, td {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #2a2a4a;
	}
	th {
		color: #888;
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
	}
	td a {
		color: #7eb8da;
	}
	td a:hover {
		text-decoration: underline;
	}
	.badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		color: #fff;
	}
	.mono {
		font-family: monospace;
		font-size: 0.8rem;
		color: #aaa;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
