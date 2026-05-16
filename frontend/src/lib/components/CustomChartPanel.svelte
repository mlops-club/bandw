<script lang="ts">
	import LineChart from './LineChart.svelte';
	import ScatterChart from './ScatterChart.svelte';
	import BarChart from './BarChart.svelte';
	import HistogramChart from './HistogramChart.svelte';
	import { getColor } from '$lib/utils/colors';

	type ChartDef = {
		title: string;
		type: string;
		xKey?: string;
		yKey?: string;
		labelKey?: string;
		valueKey?: string;
		data?: Record<string, unknown>[];
	};

	type HistoryRow = Record<string, number>;

	let { chart, sampledRows = [], index = 0 }: { chart: ChartDef; sampledRows?: HistoryRow[]; index?: number } = $props();

	let editing = $state(false);
	let queryText = $state('');
	let chartType = $state('');
	let xField = $state('');
	let yField = $state('');
	let showChartTypeOptions = $state(false);
	let showXOptions = $state(false);
	let showYOptions = $state(false);

	// Available fields from sampled data
	const availableFields = $derived(() => {
		if (sampledRows.length > 0) {
			return Object.keys(sampledRows[0]).filter((k) => !k.startsWith('_'));
		}
		if (chart.data && chart.data.length > 0) {
			return Object.keys(chart.data[0]);
		}
		return [];
	});

	function openEdit() {
		editing = true;
		chartType = chart.type;
		xField = chart.xKey || chart.labelKey || '';
		yField = chart.yKey || chart.valueKey || '';
		queryText = `query { runSets { summaryTable(tableKey: "${chart.title}") } }`;
	}

	// Build line/scatter series from sampled history
	const lineSeries = $derived.by(() => {
		const xKey = chart.xKey || '_step';
		const yKey = chart.yKey || '';
		if (!yKey) return [];
		const rows = sampledRows.length > 0 ? sampledRows : [];
		return [
			{
				label: chart.title,
				color: getColor(index),
				data: rows
					.filter((r) => r[xKey] != null && r[yKey] != null)
					.map((r) => ({ x: Number(r[xKey]), y: Number(r[yKey]) }))
			}
		];
	});
</script>

<div class="custom-chart-panel">
	{#if !editing}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="chart-clickable" onclick={() => {}}>
			{#if chart.type === 'bar' && chart.data}
				<BarChart title={chart.title} data={chart.data} labelKey={chart.labelKey || 'label'} valueKey={chart.valueKey || 'value'} />
			{:else if chart.type === 'histogram' && chart.data}
				<HistogramChart title={chart.title} data={chart.data} valueKey={chart.valueKey || 'value'} />
			{:else if chart.type === 'scatter'}
				<ScatterChart title={chart.title} series={lineSeries} />
			{:else}
				<LineChart title={chart.title} series={lineSeries} />
			{/if}
		</div>
		<div class="panel-actions">
			<button class="edit-btn" onclick={openEdit}>Edit</button>
		</div>
	{:else}
		<div class="edit-interface">
			<h3 class="chart-title">{chart.title}</h3>
			<div class="edit-section">
				<div class="custom-combobox" role="combobox" aria-label="chart type" aria-expanded={showChartTypeOptions}>
					<button class="combobox-trigger" onclick={() => showChartTypeOptions = !showChartTypeOptions}>{chartType || 'Select type...'}</button>
					{#if showChartTypeOptions}
						<div class="combobox-listbox" role="listbox">
							{#each ['line', 'scatter', 'bar', 'histogram'] as t}
								<button role="option" aria-selected={chartType === t} onclick={() => { chartType = t; showChartTypeOptions = false; }}>{t}</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
			<div class="edit-section">
				<textarea id="query-editor" bind:value={queryText} aria-label="query" rows="4"></textarea>
			</div>
			<div class="edit-section field-mapping">
				<div class="custom-combobox" role="combobox" aria-label="x axis" aria-expanded={showXOptions}>
					<button class="combobox-trigger" onclick={() => showXOptions = !showXOptions}>{xField || 'Select X...'}</button>
					{#if showXOptions}
						<div class="combobox-listbox" role="listbox">
							{#each availableFields() as f}
								<button role="option" aria-selected={xField === f} onclick={() => { xField = f; showXOptions = false; }}>{f}</button>
							{/each}
						</div>
					{/if}
				</div>
				<div class="custom-combobox" role="combobox" aria-label="y metric" aria-expanded={showYOptions}>
					<button class="combobox-trigger" onclick={() => showYOptions = !showYOptions}>{yField || 'Select Y...'}</button>
					{#if showYOptions}
						<div class="combobox-listbox" role="listbox">
							{#each availableFields() as f}
								<button role="option" aria-selected={yField === f} onclick={() => { yField = f; showYOptions = false; }}>{f}</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
			<div class="edit-actions">
				<button onclick={() => (editing = false)}>Close</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.custom-chart-panel {
		position: relative;
	}
	.custom-combobox { position: relative; }
	.combobox-trigger { width: 100%; text-align: left; padding: 0.4rem; background: #0d1117; border: 1px solid #1e2d4a; border-radius: 4px; color: #e0e0e0; cursor: pointer; font-size: 0.8rem; }
	.combobox-listbox { position: absolute; top: 100%; left: 0; right: 0; background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; z-index: 10; max-height: 200px; overflow-y: auto; }
	.combobox-listbox button { display: block; width: 100%; text-align: left; padding: 0.35rem 0.5rem; background: none; border: none; color: #e0e0e0; cursor: pointer; font-size: 0.8rem; }
	.combobox-listbox button:hover { background: rgba(79,195,247,0.1); }
	.combobox-listbox button[aria-selected="true"] { color: #4fc3f7; background: rgba(79,195,247,0.05); }

	.chart-clickable {
		cursor: pointer;
	}

	.panel-actions {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
	}

	.edit-btn {
		background: #1e3a5f;
		color: #4fc3f7;
		border: 1px solid #4fc3f7;
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.edit-interface {
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 1rem;
	}

	.chart-title {
		font-size: 0.85rem;
		color: #a0b0c0;
		margin: 0 0 0.75rem;
		font-weight: 600;
	}

	.edit-section {
		margin-bottom: 0.75rem;
	}

	.edit-section label {
		display: block;
		font-size: 0.75rem;
		color: #8899aa;
		margin-bottom: 0.25rem;
	}

	.edit-section select,
	.edit-section textarea {
		width: 100%;
		background: #0d1117;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		color: #e0e0e0;
		padding: 0.4rem;
		font-size: 0.8rem;
		font-family: inherit;
	}

	.edit-section textarea {
		font-family: 'SF Mono', 'Fira Code', monospace;
		resize: vertical;
	}

	.field-mapping {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.4rem;
		align-items: center;
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.edit-actions button {
		background: #1e3a5f;
		color: #e0e0e0;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		padding: 0.3rem 0.75rem;
		font-size: 0.8rem;
		cursor: pointer;
	}
</style>
