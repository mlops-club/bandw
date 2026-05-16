<script lang="ts">
	type ArtifactDef = {
		name: string;
		type: string;
		table_name: string;
		columns: string[];
		data: unknown[][];
	};

	type TableDef = {
		columns: string[];
		data: unknown[][];
		steps?: { columns: string[]; data: unknown[][]; step: number }[];
	};

	let {
		tables = {},
		artifacts = []
	}: {
		tables: Record<string, TableDef>;
		artifacts: ArtifactDef[];
	} = $props();

	let selectedArtifact = $state<ArtifactDef | null>(null);
	let compareMode = $state(false);
	let compareArtifact = $state<ArtifactDef | null>(null);
	let viewMode = $state<'merged' | 'side-by-side'>('merged');
	let joinKey = $state('');
	let verticalLayout = $state(false);
	let filterOpen = $state(false);
	let filterText = $state('');
	let sortCol = $state<number | null>(null);
	let sortAsc = $state(true);
	let rowsPerPage = $state(50);

	// Find the second artifact for comparison
	const otherArtifacts = $derived(
		artifacts.filter((a) => a !== selectedArtifact)
	);

	// Join key options from shared columns
	const joinKeyOptions = $derived.by(() => {
		if (!selectedArtifact || !compareArtifact) return [];
		const colsA = new Set(selectedArtifact.columns);
		return compareArtifact.columns.filter((c) => colsA.has(c));
	});

	function handleSort(colIndex: number) {
		if (sortCol === colIndex) {
			sortAsc = !sortAsc;
		} else {
			sortCol = colIndex;
			sortAsc = true;
		}
	}

	function sortData(data: unknown[][]): unknown[][] {
		if (sortCol === null) return data;
		const col = sortCol;
		const asc = sortAsc;
		return [...data].sort((a, b) => {
			const va = a[col];
			const vb = b[col];
			if (typeof va === 'number' && typeof vb === 'number') return asc ? va - vb : vb - va;
			return asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
		});
	}

	function filterData(data: unknown[][]): unknown[][] {
		if (!filterText) return data;
		const lower = filterText.toLowerCase();
		return data.filter((row) => row.some((cell) => String(cell).toLowerCase().includes(lower)));
	}

	function openCompare() {
		compareMode = true;
		if (otherArtifacts.length > 0 && !compareArtifact) {
			compareArtifact = otherArtifacts[0];
		}
		if (joinKeyOptions.length > 0 && !joinKey) {
			joinKey = joinKeyOptions[0];
		}
	}
</script>

<div class="artifact-tables">
	{#if !selectedArtifact}
		<!-- Artifact list view -->
		<h2>Table Artifacts</h2>
		{#each artifacts as art}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="artifact-item" onclick={() => { selectedArtifact = art; }}>
				<span class="artifact-name">{art.name}</span>
				<span class="artifact-type">{art.type}</span>
			</div>
		{/each}

		<!-- Also show inline tables from config -->
		{#each Object.entries(tables) as [name, tbl]}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="artifact-item" onclick={() => {
				selectedArtifact = { name, type: 'table', table_name: name, columns: tbl.columns, data: tbl.data };
			}}>
				<span class="artifact-name">{name}</span>
				<span class="artifact-type">table</span>
				{#if tbl.steps}
					<span class="artifact-badge">v{tbl.steps.length}</span>
				{/if}
			</div>
		{/each}
	{:else if !compareMode}
		<!-- Single artifact view -->
		<div class="artifact-detail-header">
			<button class="back-btn" onclick={() => { selectedArtifact = null; }}>Back</button>
			<h2>{selectedArtifact.name}</h2>
			{#if otherArtifacts.length > 0}
				<button aria-label="Compare" onclick={openCompare}>Compare</button>
			{/if}
			<button aria-label="Filter" onclick={() => (filterOpen = !filterOpen)}>Filter</button>
		</div>

		{#if filterOpen}
			<div class="filter-bar">
				<input type="text" aria-label="Filter" placeholder="Filter rows..." bind:value={filterText} />
			</div>
		{/if}

		<div class="table-content">
			<span class="table-label">{selectedArtifact.table_name}</span>
			<table role="table">
				<thead>
					<tr role="row">
						{#each selectedArtifact.columns as col, i}
							<th role="columnheader" onclick={() => handleSort(i)}>{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each sortData(filterData(selectedArtifact.data)).slice(0, rowsPerPage) as row}
						<tr role="row">
							{#each row as cell}
								<td>{cell}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
			<div class="pagination">
				<button aria-label="Page size">Rows per page: {rowsPerPage}</button>
			</div>
		</div>
	{:else}
		<!-- Compare view -->
		<div class="artifact-detail-header">
			<button class="back-btn" onclick={() => { compareMode = false; }}>Back</button>
			<h2>Compare</h2>
			<div class="compare-controls">
				<label>
					View:
					<select aria-label="View" bind:value={viewMode}>
						<option value="merged">Merged</option>
						<option value="side-by-side">List of: Table (Side by Side)</option>
					</select>
				</label>
				{#if joinKeyOptions.length > 0}
					<label>
						Join key:
						<select aria-label="Join key" bind:value={joinKey}>
							{#each joinKeyOptions as opt}
								<option value={opt}>{opt}</option>
							{/each}
						</select>
					</label>
				{/if}
				<label>
					<input type="checkbox" role="switch" aria-label="Vertical layout" bind:checked={verticalLayout} />
					Vertical
				</label>
			</div>
			<button aria-label="Filter" onclick={() => (filterOpen = !filterOpen)}>Filter</button>
		</div>

		{#if filterOpen}
			<div class="filter-bar">
				<input type="text" aria-label="Filter" placeholder="Filter rows..." bind:value={filterText} />
			</div>
		{/if}

		<div class="compare-view" class:vertical={verticalLayout}>
			{#if selectedArtifact}
				<div class="compare-panel">
					<span class="table-label">{selectedArtifact.table_name}</span>
					<span>{selectedArtifact.name}</span>
					<table role="table">
						<thead>
							<tr role="row">
								{#each selectedArtifact.columns as col, i}
									<th role="columnheader" onclick={() => handleSort(i)}>{col}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each sortData(filterData(selectedArtifact.data)).slice(0, rowsPerPage) as row}
								<tr role="row">
									{#each row as cell}
										<td>{cell}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
			{#if compareArtifact}
				<div class="compare-panel">
					<span class="table-label">{compareArtifact.table_name}</span>
					<span>{compareArtifact.name}</span>
					<table role="table">
						<thead>
							<tr role="row">
								{#each compareArtifact.columns as col}
									<th role="columnheader">{col}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each filterData(compareArtifact.data).slice(0, rowsPerPage) as row}
								<tr role="row">
									{#each row as cell}
										<td>{cell}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
		<div class="pagination">
			<button aria-label="Page size">Rows per page: {rowsPerPage}</button>
		</div>
	{/if}
</div>

<style>
	.artifact-tables {
		padding: 0.5rem 0;
	}

	h2 {
		font-size: 1.1rem;
		margin: 0;
		color: #e0e0e0;
	}

	.artifact-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		cursor: pointer;
		background: #16213e;
	}

	.artifact-item:hover {
		border-color: #4fc3f7;
		background: rgba(79, 195, 247, 0.05);
	}

	.artifact-name {
		color: #4fc3f7;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.artifact-type {
		color: #8899aa;
		font-size: 0.8rem;
	}

	.artifact-badge {
		color: #81c784;
		font-size: 0.75rem;
		background: #1e2d4a;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}

	.artifact-detail-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}

	.artifact-detail-header button {
		background: #1e3a5f;
		color: #4fc3f7;
		border: 1px solid #4fc3f7;
		border-radius: 4px;
		padding: 0.25rem 0.6rem;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.back-btn {
		background: #1e2d4a !important;
		border-color: #556677 !important;
		color: #8899aa !important;
	}

	.compare-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.8rem;
		color: #8899aa;
	}

	.compare-controls select {
		background: #0d1117;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		color: #e0e0e0;
		padding: 0.2rem 0.4rem;
		font-size: 0.8rem;
	}

	.filter-bar {
		margin-bottom: 0.75rem;
	}

	.filter-bar input {
		width: 100%;
		padding: 0.4rem 0.6rem;
		background: #0d1117;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		color: #e0e0e0;
		font-size: 0.85rem;
	}

	.table-label {
		display: block;
		font-size: 0.8rem;
		color: #81c784;
		margin-bottom: 0.4rem;
	}

	.table-content {
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 0.75rem;
	}

	.compare-view {
		display: flex;
		gap: 1rem;
	}

	.compare-view.vertical {
		flex-direction: column;
	}

	.compare-panel {
		flex: 1;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 0.75rem;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}

	th {
		background: #0d1117;
		color: #a0b0c0;
		padding: 0.5rem 0.75rem;
		text-align: left;
		border-bottom: 2px solid #1e2d4a;
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
	}

	td {
		padding: 0.4rem 0.75rem;
		border-bottom: 1px solid #1e2d4a;
		color: #c9d1d9;
	}

	.pagination {
		display: flex;
		justify-content: flex-end;
		padding-top: 0.5rem;
	}

	.pagination button {
		background: #1e2d4a;
		color: #8899aa;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		padding: 0.2rem 0.6rem;
		font-size: 0.75rem;
		cursor: pointer;
	}
</style>
