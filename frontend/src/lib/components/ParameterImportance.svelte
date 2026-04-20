<script lang="ts">
	let {
		runs,
	}: {
		runs: any[];
	} = $props();

	// Derive config keys from runs
	const configKeys = $derived.by(() => {
		const keys = new Set<string>();
		for (const run of runs) {
			const config = parseConfig(run.config);
			for (const k of Object.keys(config)) keys.add(k);
		}
		return Array.from(keys);
	});

	// Derive metric keys from runs summary
	const metricKeys = $derived.by(() => {
		const keys = new Set<string>();
		for (const run of runs) {
			const summary = parseSummary(run.summaryMetrics);
			for (const k of Object.keys(summary)) {
				if (!k.startsWith('_')) keys.add(k);
			}
		}
		return Array.from(keys);
	});

	let selectedMetric = $state('');
	let enabledParams: Record<string, boolean> = $state({});
	let initialized = $state(false);

	$effect(() => {
		if (!initialized && configKeys.length > 0 && metricKeys.length > 0) {
			selectedMetric = metricKeys[0];
			const init: Record<string, boolean> = {};
			for (const k of configKeys) init[k] = true;
			enabledParams = init;
			initialized = true;
		}
	});

	function parseConfig(raw: string | null): Record<string, unknown> {
		if (!raw) return {};
		try {
			const parsed = JSON.parse(raw);
			const out: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(parsed)) {
				if (k.startsWith('_')) continue;
				out[k] = typeof v === 'object' && v !== null && 'value' in (v as Record<string, unknown>) ? (v as Record<string, unknown>).value : v;
			}
			return out;
		} catch { return {}; }
	}

	function parseSummary(raw: string | null): Record<string, unknown> {
		if (!raw) return {};
		try { return JSON.parse(raw); } catch { return {}; }
	}

	// Compute Pearson correlation between a config param and the selected metric
	function computeCorrelation(paramKey: string): number {
		const pairs: { x: number; y: number }[] = [];
		for (const run of runs) {
			const config = parseConfig(run.config);
			const summary = parseSummary(run.summaryMetrics);
			const x = Number(config[paramKey]);
			const y = Number(summary[selectedMetric]);
			if (!isNaN(x) && !isNaN(y)) pairs.push({ x, y });
		}
		if (pairs.length < 2) return 0;
		const n = pairs.length;
		const sumX = pairs.reduce((a, p) => a + p.x, 0);
		const sumY = pairs.reduce((a, p) => a + p.y, 0);
		const sumXY = pairs.reduce((a, p) => a + p.x * p.y, 0);
		const sumX2 = pairs.reduce((a, p) => a + p.x * p.x, 0);
		const sumY2 = pairs.reduce((a, p) => a + p.y * p.y, 0);
		const num = n * sumXY - sumX * sumY;
		const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
		return den === 0 ? 0 : num / den;
	}

	const correlations = $derived.by(() => {
		return configKeys
			.filter(k => enabledParams[k])
			.map(k => ({ param: k, correlation: computeCorrelation(k) }))
			.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
	});

	const maxAbs = $derived(Math.max(0.01, ...correlations.map(c => Math.abs(c.correlation))));
</script>

<div class="param-importance-panel">
	<h3>Parameter Importance</h3>
	<p class="panel-desc">How hyperparameters affect metrics</p>

	<div class="metric-selector">
		<label aria-label="metric">
			Output metric
		</label>
		<div class="metric-options" role="listbox" aria-label="metric">
			{#each metricKeys as m}
				<button role="option" aria-selected={selectedMetric === m} class:selected={selectedMetric === m} onclick={() => selectedMetric = m}>{m}</button>
			{/each}
		</div>
	</div>

	<div class="importance-table">
		{#each configKeys as key}
			{@const corr = correlations.find(c => c.param === key)}
			<div class="table-row">
				<label class="param-toggle"><input type="checkbox" bind:checked={enabledParams[key]} /> {key}</label>
				{#if corr}
					<span class="importance-bar">
						<svg width="120" height="16">
							<rect
								x={corr.correlation >= 0 ? 60 : 60 - Math.abs(corr.correlation) / maxAbs * 58}
								y="2"
								width={Math.abs(corr.correlation) / maxAbs * 58}
								height="12"
								fill={corr.correlation >= 0 ? '#4fc3f7' : '#e57373'}
								rx="2"
							/>
						</svg>
					</span>
					<span class="correlation-value">{corr.correlation.toFixed(3)}</span>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.param-importance-panel {
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 1rem;
	}
	h3 { font-size: 1rem; color: #e0e0e0; margin: 0 0 0.75rem; }
	h4 { font-size: 0.85rem; color: #8899aa; margin: 0.75rem 0 0.3rem; }
	.metric-selector { margin-bottom: 0.75rem; }
	.metric-selector label { color: #8899aa; font-size: 0.85rem; }
	.metric-options { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.3rem; }
	.metric-options button { padding: 0.25rem 0.6rem; background: #0d1117; border: 1px solid #1e2d4a; color: #8899aa; border-radius: 3px; cursor: pointer; font-size: 0.8rem; }
	.metric-options button.selected { color: #4fc3f7; border-color: #4fc3f7; background: rgba(79,195,247,0.1); }
	.importance-table { margin-bottom: 0.5rem; }
	.table-header { display: grid; grid-template-columns: 1fr 130px 80px; gap: 0.5rem; padding: 0.3rem 0; color: #8899aa; font-size: 0.75rem; border-bottom: 1px solid #1e2d4a; }
	.table-row { display: grid; grid-template-columns: 1fr 130px 80px; gap: 0.5rem; padding: 0.3rem 0; align-items: center; }
	.param-name { color: #e0e0e0; font-size: 0.85rem; }
	.correlation-value { color: #8899aa; font-size: 0.8rem; font-family: monospace; }
	.param-toggles label { display: block; color: #8899aa; font-size: 0.85rem; margin: 0.2rem 0; }
	.param-toggles input { margin-right: 0.3rem; }
</style>
