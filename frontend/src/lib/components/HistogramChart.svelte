<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip } from 'chart.js';

	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip);

	let { title, data, valueKey }: { title: string; data: Record<string, unknown>[]; valueKey: string } = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function buildChart() {
		if (chart) chart.destroy();
		if (!canvas || data.length === 0) return;

		// Bin the data into a histogram
		const values = data.map((d) => Number(d[valueKey] ?? 0));
		const min = Math.min(...values);
		const max = Math.max(...values);
		const binCount = Math.min(20, Math.max(5, Math.ceil(Math.sqrt(values.length))));
		const binWidth = (max - min) / binCount || 1;
		const bins = new Array(binCount).fill(0);
		const binLabels: string[] = [];

		for (let i = 0; i < binCount; i++) {
			const lo = min + i * binWidth;
			const hi = lo + binWidth;
			binLabels.push(`${lo.toFixed(1)}`);
		}

		for (const v of values) {
			let idx = Math.floor((v - min) / binWidth);
			if (idx >= binCount) idx = binCount - 1;
			if (idx < 0) idx = 0;
			bins[idx]++;
		}

		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: binLabels,
				datasets: [
					{
						label: title,
						data: bins,
						backgroundColor: 'rgba(79, 195, 247, 0.7)',
						borderColor: 'rgba(79, 195, 247, 1)',
						borderWidth: 1,
						barPercentage: 1.0,
						categoryPercentage: 1.0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				plugins: {
					title: { display: false },
					tooltip: { mode: 'index', intersect: false }
				},
				scales: {
					x: {
						ticks: { color: '#667788', maxRotation: 45 },
						grid: { color: 'rgba(255,255,255,0.05)' }
					},
					y: {
						ticks: { color: '#667788' },
						grid: { color: 'rgba(255,255,255,0.05)' }
					}
				}
			}
		});
	}

	onMount(() => buildChart());

	$effect(() => {
		void data;
		void title;
		if (canvas) buildChart();
	});

	onDestroy(() => {
		if (chart) chart.destroy();
	});
</script>

<div class="chart-container" aria-label="{title} chart">
	<h3 class="chart-title">{title}</h3>
	<canvas bind:this={canvas} aria-label="{title}"></canvas>
</div>

<style>
	.chart-container {
		position: relative;
		height: 280px;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 0.75rem;
	}

	.chart-title {
		font-size: 0.85rem;
		color: #a0b0c0;
		text-align: center;
		margin: 0 0 0.25rem;
		font-weight: 600;
	}
</style>
