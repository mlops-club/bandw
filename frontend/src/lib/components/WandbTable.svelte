<script lang="ts">
	type TableStep = {
		columns: string[];
		data: unknown[][];
		step: number;
	};

	let {
		title,
		columns,
		data,
		steps,
		exposeTableRole = true
	}: {
		title: string;
		columns: string[];
		data: unknown[][];
		steps?: TableStep[];
		exposeTableRole?: boolean;
	} = $props();

	// Sort state
	let sortCol = $state<number | null>(null);
	let sortAsc = $state(true);

	// Filter state
	let filterOpen = $state(false);
	let filterText = $state('');

	// Step slider state
	let currentStep = $state(0);
	const hasSteps = $derived(!!steps && steps.length > 1);
	const maxStep = $derived(hasSteps ? steps!.length - 1 : 0);

	// Active data based on step
	const activeColumns = $derived(
		hasSteps ? steps![currentStep]?.columns ?? columns : columns
	);
	const activeData = $derived(
		hasSteps ? steps![currentStep]?.data ?? data : data
	);

	// Filtered data
	const filteredData = $derived.by(() => {
		let rows = activeData;
		if (filterText) {
			const lower = filterText.toLowerCase();
			rows = rows.filter((row) =>
				row.some((cell) => String(cell).toLowerCase().includes(lower))
			);
		}
		return rows;
	});

	// Sorted data
	const sortedData = $derived.by(() => {
		if (sortCol === null) return filteredData;
		const col = sortCol;
		const asc = sortAsc;
		return [...filteredData].sort((a, b) => {
			const va = a[col];
			const vb = b[col];
			if (typeof va === 'number' && typeof vb === 'number') {
				return asc ? va - vb : vb - va;
			}
			const sa = String(va);
			const sb = String(vb);
			return asc ? sa.localeCompare(sb) : sb.localeCompare(sa);
		});
	});

	function handleSort(colIndex: number) {
		if (sortCol === colIndex) {
			sortAsc = !sortAsc;
		} else {
			sortCol = colIndex;
			sortAsc = true;
		}
	}

	function downloadCsv() {
		const header = activeColumns.join(',');
		const rows = sortedData.map((row) =>
			row.map((cell) => {
				const s = String(cell);
				return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
			}).join(',')
		);
		const csv = [header, ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${title}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="wandb-table-panel" aria-label="{title}" role="region">
	<div class="table-header">
		<h3 class="table-panel-title">{title}</h3>
		<div class="table-actions">
			{#if !filterOpen}
				<button aria-label="Filter" onclick={() => (filterOpen = true)}>Filter</button>
			{:else}
				<button aria-label="Close" onclick={() => (filterOpen = false)}>Close</button>
			{/if}
			<button aria-label="Export" onclick={downloadCsv}>Export</button>
		</div>
	</div>

	{#if filterOpen}
		<div class="filter-bar">
			<input
				type="text"
				role="textbox"
				aria-label="Filter"
				placeholder="Filter rows..."
				bind:value={filterText}
			/>
		</div>
	{/if}

	{#if hasSteps}
		<div class="step-slider">
			<label for="step-slider-{title}">Step: {currentStep}</label>
			<input
				id="step-slider-{title}"
				type="range"
				role="slider"
				aria-label="Step"
				min="0"
				max={maxStep}
				bind:value={currentStep}
			/>
		</div>
	{/if}

	<div class="table-scroll">
		<table role={exposeTableRole ? 'table' : 'presentation'} aria-label={exposeTableRole ? title : undefined}>
			<thead>
				<tr role="row">
					{#each activeColumns as col, i}
						<th
							role="columnheader"
							onclick={() => handleSort(i)}
							class:sorted={sortCol === i}
						>
							{col}
							{#if sortCol === i}
								<span class="sort-indicator">{sortAsc ? '\u25B2' : '\u25BC'}</span>
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each sortedData as row}
					<tr role="row">
						{#each row as cell}
							<td>{cell}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="table-footer">
		<span class="row-count">{sortedData.length} rows</span>
	</div>
</div>

<style>
	.wandb-table-panel {
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.table-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.table-header h3 {
		font-size: 0.95rem;
		color: #e0e0e0;
		margin: 0;
		font-weight: 600;
	}

	.table-actions {
		display: flex;
		gap: 0.5rem;
	}

	.table-actions button {
		background: #1e3a5f;
		color: #4fc3f7;
		border: 1px solid #4fc3f7;
		border-radius: 4px;
		padding: 0.25rem 0.6rem;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.table-actions button:hover {
		background: #2a4a6f;
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

	.filter-bar input::placeholder {
		color: #556677;
	}

	.step-slider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
		font-size: 0.85rem;
		color: #8899aa;
	}

	.step-slider label {
		white-space: nowrap;
		min-width: 60px;
	}

	.step-slider input[type='range'] {
		flex: 1;
		accent-color: #4fc3f7;
	}

	.table-scroll {
		overflow-x: auto;
		max-height: 400px;
		overflow-y: auto;
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
		position: sticky;
		top: 0;
		z-index: 1;
	}

	th:hover {
		color: #e0e0e0;
	}

	th.sorted {
		color: #4fc3f7;
	}

	.sort-indicator {
		margin-left: 0.25rem;
		font-size: 0.7rem;
	}

	td {
		padding: 0.4rem 0.75rem;
		border-bottom: 1px solid #1e2d4a;
		color: #c9d1d9;
	}

	tr:hover td {
		background: rgba(255, 255, 255, 0.03);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	.table-footer {
		display: flex;
		justify-content: flex-end;
		padding-top: 0.5rem;
	}

	.row-count {
		font-size: 0.8rem;
		color: #556677;
	}
</style>
