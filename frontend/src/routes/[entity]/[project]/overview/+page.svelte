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
			variables: { entityName: entity, projectName: project, first: 5, order: 'created_at DESC' }
		})
	);

	const projectData = $derived($result.data?.project);
	const recentRuns = $derived(projectData?.runs?.edges?.map((e: { node: unknown }) => e.node) ?? []);
</script>

<div class="overview">
	{#if $result.fetching}
		<p class="loading">Loading...</p>
	{:else if !projectData}
		<p class="error">Project not found.</p>
	{:else}
		<div class="cards">
			<div class="card">
				<div class="card-label">Total Runs</div>
				<div class="card-value">{projectData.runs.totalCount}</div>
			</div>
			<div class="card">
				<div class="card-label">Project</div>
				<div class="card-value">{projectData.name}</div>
			</div>
		</div>

		<section>
			<h2>Recent Runs</h2>
			{#if recentRuns.length === 0}
				<p class="dim">No runs yet.</p>
			{:else}
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>State</th>
							<th>Created</th>
						</tr>
					</thead>
					<tbody>
						{#each recentRuns as run}
							<tr>
								<td><a href="/{entity}/{project}/runs/{run.name}">{run.displayName || run.name}</a></td>
								<td><StateBadge state={run.state} /></td>
								<td>{relativeTime(run.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				{#if projectData.runs.totalCount > 5}
					<a href="/{entity}/{project}/table" class="see-all">See all {projectData.runs.totalCount} runs →</a>
				{/if}
			{/if}
		</section>
	{/if}
</div>

<style>
	.cards {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.card {
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 1rem 1.5rem;
		min-width: 150px;
	}

	.card-label {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #8899aa;
		margin-bottom: 0.25rem;
	}

	.card-value {
		font-size: 1.5rem;
		font-weight: 600;
		color: #e0e0e0;
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

	th {
		text-align: left;
		padding: 0.5rem;
		border-bottom: 2px solid #0f3460;
		color: #667788;
		font-size: 0.8rem;
		text-transform: uppercase;
	}

	td {
		padding: 0.5rem;
		border-bottom: 1px solid #1e2d4a;
	}

	tr:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.see-all {
		display: block;
		text-align: center;
		padding: 0.75rem;
		font-size: 0.85rem;
		color: #64b5f6;
	}

	.dim {
		color: #556677;
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
</style>
