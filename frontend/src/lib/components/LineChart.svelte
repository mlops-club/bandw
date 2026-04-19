<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, LineController, LineElement, PointElement, LinearScale, Title, Tooltip, Filler, CategoryScale } from 'chart.js';

	Chart.register(LineController, LineElement, PointElement, LinearScale, Title, Tooltip, Filler, CategoryScale);

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

		// Deep-clone data to avoid Chart.js mutating Svelte 5 reactive proxies
		const datasets = series.map((s) => ({
			label: s.label,
			data: s.data.map((d) => ({ x: d.x, y: d.y })),
			borderColor: s.color,
			backgroundColor: 'transparent',
			borderWidth: 1.5,
			pointRadius: 0,
			tension: 0.1
		}));

		chart = new Chart(canvas, {
			type: 'line',
			data: { datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				plugins: {
					title: {
						display: true,
						text: title,
						color: '#a0b0c0',
						font: { size: 13 }
					},
					tooltip: {
						mode: 'index',
						intersect: false
					}
				},
				scales: {
					x: {
						type: 'linear',
						title: { display: true, text: 'Step', color: '#667788' },
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
		// Re-render when series changes
		void series;
		void title;
		if (canvas) buildChart();
	});

	onDestroy(() => {
		if (chart) chart.destroy();
	});
</script>

<div class="chart-container">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.chart-container {
		position: relative;
		height: 250px;
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 0.75rem;
	}
</style>
