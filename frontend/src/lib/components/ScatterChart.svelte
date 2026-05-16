<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, ScatterController, PointElement, LinearScale, Title, Tooltip } from 'chart.js';

	Chart.register(ScatterController, PointElement, LinearScale, Title, Tooltip);

	type Series = {
		label: string;
		data: { x: number; y: number }[];
		color: string;
	};

	let { title, series }: { title: string; series: Series[] } = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function buildChart() {
		if (chart) chart.destroy();
		if (!canvas || series.length === 0) return;

		const datasets = series.map((s) => ({
			label: s.label,
			data: s.data.map((d) => ({ x: d.x, y: d.y })),
			backgroundColor: s.color,
			borderColor: s.color,
			pointRadius: 3,
			pointHoverRadius: 5,
			showLine: false
		}));

		chart = new Chart(canvas, {
			type: 'scatter',
			data: { datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				plugins: {
					title: { display: false },
					tooltip: { mode: 'nearest', intersect: true }
				},
				scales: {
					x: {
						type: 'linear',
						ticks: { color: '#667788' },
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
		void series;
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
