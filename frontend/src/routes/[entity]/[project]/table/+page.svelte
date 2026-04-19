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

	type RunNode = {
		name: string;
		displayName: string | null;
		state: string | null;
		createdAt: string | null;
		updatedAt: string | null;
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
</script>

<h1>Runs</h1>

{#if $result.fetching}
	<p class="loading">Loading runs...</p>
{:else if $result.error}
	<p class="error">Error: {$result.error.message}</p>
{:else if $result.data?.project}
	<div class="controls">
		<input type="text" placeholder="Search runs..." class="search" bind:value={searchQuery} />
		<select class="filter" bind:value={stateFilter}>
			<option value="all">All states</option>
			{#each states as s}
				<option value={s}>{s}</option>
			{/each}
		</select>
		<span class="count">{filteredRuns.length} of {allRuns.length} runs</span>
	</div>

	{#if filteredRuns.length === 0}
		<p class="empty">{allRuns.length === 0 ? 'No runs yet.' : 'No runs match filters.'}</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th class="sortable" onclick={() => toggleSort('name')}>Name{sortIndicator('name')}</th>
						<th class="sortable" onclick={() => toggleSort('state')}>State{sortIndicator('state')}</th>
						<th>Summary</th>
						<th>Tags</th>
						<th class="sortable" onclick={() => toggleSort('created')}>Created{sortIndicator('created')}</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredRuns as run}
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
		margin-bottom: 0.75rem;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
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
