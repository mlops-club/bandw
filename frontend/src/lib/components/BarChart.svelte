<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip } from 'chart.js';

	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip);

	type BarData = Record<string, unknown>;

	let { title, data, labelKey, valueKey }: { title: string; data: BarData[]; labelKey: string; valueKey: string } = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function buildChart() {
		if (chart) chart.destroy();
		if (!canvas || data.length === 0) return;

		const labels = data.map((d) => String(d[labelKey] ?? ''));
		const values = data.map((d) => Number(d[valueKey] ?? 0));

		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: title,
						data: values,
						backgroundColor: [
							'rgba(79, 195, 247, 0.7)',
							'rgba(129, 212, 250, 0.7)',
							'rgba(3, 169, 244, 0.7)',
							'rgba(2, 136, 209, 0.7)',
							'rgba(1, 87, 155, 0.7)',
						],
						borderColor: 'rgba(79, 195, 247, 1)',
						borderWidth: 1
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
	<!-- Render label text for accessibility / test assertions -->
	<div class="bar-labels">
		{#each data as d}
			<span class="bar-label">{d[labelKey]}</span>
		{/each}
	</div>
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

	.bar-labels {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		font-size: 0.7rem;
		color: #8899aa;
		margin-bottom: 0.25rem;
	}

	.bar-label {
		padding: 0 0.25rem;
	}
</style>
