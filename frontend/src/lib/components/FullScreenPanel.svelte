<script lang="ts">
	import LineChart from './LineChart.svelte';

	type Series = {
		label: string;
		data: { x: number; y: number }[];
		color: string;
	};

	type RunInfo = {
		name: string;
		displayName?: string;
	};

	let {
		panel,
		series,
		runs,
		onClose
	}: {
		panel: string;
		series: Series[];
		runs: RunInfo[];
		onClose: () => void;
	} = $props();
</script>

<div class="fullscreen-overlay" onclick={onClose} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}>
	<div class="fullscreen-content" onclick={(e) => e.stopPropagation()}>
		<div class="fullscreen-header">
			<h2>{panel}</h2>
			<div class="fullscreen-nav">
				<button aria-label="Back to workspace" onclick={onClose}>← Back</button>
				<button aria-label="Previous panel" onclick={() => {}}>← Prev</button>
				<button aria-label="Next panel" onclick={() => {}}>Next →</button>
				<button onclick={onClose}>✕ Close</button>
			</div>
		</div>
		<div class="fullscreen-chart">
			<LineChart title={panel} {series} />
		</div>
		<aside class="fullscreen-sidebar" role="complementary">
			<h3>Runs</h3>
			{#each runs as run}
				<div class="fullscreen-run">{run.displayName || run.name}</div>
			{/each}
		</aside>
	</div>
</div>

<style>
	.fullscreen-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 200; display: flex; align-items: center; justify-content: center; }
	.fullscreen-content { width: 95vw; height: 90vh; background: #1a1a2e; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
	.fullscreen-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #1e2d4a; }
	.fullscreen-header h2 { font-size: 1.1rem; margin: 0; }
	.fullscreen-nav { display: flex; gap: 0.5rem; }
	.fullscreen-nav button { padding: 0.4rem 0.8rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; color: #e0e0e0; cursor: pointer; font-size: 0.85rem; }
	.fullscreen-nav button:hover { background: #1e2d4a; }
	.fullscreen-chart { flex: 1; padding: 1.5rem; overflow: auto; }
	.fullscreen-sidebar { width: 250px; border-left: 1px solid #1e2d4a; padding: 1rem; overflow-y: auto; }
	.fullscreen-sidebar h3 { font-size: 0.85rem; color: #8899aa; margin: 0 0 0.5rem; }
	.fullscreen-run { padding: 0.3rem 0.5rem; font-size: 0.85rem; color: #e0e0e0; border-radius: 3px; }
	.fullscreen-run:hover { background: rgba(79,195,247,0.05); }
</style>
