<script lang="ts">
	import { page } from '$app/state';
	import { queryStore, getContextClient } from '@urql/svelte';
	import { PROJECTS_QUERY } from '$lib/graphql/queries';
	import { relativeTime } from '$lib/utils/time';

	const client = getContextClient();

	const projects = $derived(
		queryStore({
			client,
			query: PROJECTS_QUERY,
			variables: { entityName: page.params.entity }
		})
	);
</script>

<h1>Projects</h1>

{#if $projects.fetching}
	<p class="loading">Loading projects...</p>
{:else if $projects.error}
	<p class="error">Error: {$projects.error.message}</p>
{:else if $projects.data}
	{@const edges = $projects.data.projects.edges}
	{#if edges.length === 0}
		<p class="empty">No projects yet. Use the wandb SDK to create your first project.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Description</th>
					<th>Runs</th>
					<th>Last Run</th>
					<th>Created</th>
				</tr>
			</thead>
			<tbody>
				{#each edges as { node }}
					<tr>
						<td>
							<a href="/{page.params.entity}/{node.name}/workspace">{node.name}</a>
						</td>
						<td class="desc">{node.description || '-'}</td>
						<td class="num">{node.runCount}</td>
						<td>{relativeTime(node.lastRunAt)}</td>
						<td>{relativeTime(node.createdAt)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
{/if}

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		text-align: left;
		padding: 0.75rem;
		border-bottom: 2px solid #0f3460;
		color: #8899aa;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	td {
		padding: 0.75rem;
		border-bottom: 1px solid #1e2d4a;
	}

	tr:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.desc {
		color: #8899aa;
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.num {
		font-variant-numeric: tabular-nums;
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
