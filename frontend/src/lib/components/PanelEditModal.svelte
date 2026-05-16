<script lang="ts">
	let {
		show = false,
		onClose,
		onDeletePanel
	}: {
		show: boolean;
		onClose: () => void;
		onDeletePanel: () => void;
	} = $props();

	let panelEditTab: 'data' | 'grouping' | 'chart' | 'legend' | 'expressions' = $state('data');
</script>

{#if show}
	<div class="panel-edit-overlay" onclick={onClose}>
		<div class="panel-edit-modal" role="dialog" aria-label="Edit panel" onclick={(e) => e.stopPropagation()}>
			<div class="panel-edit-header">
				<h3>Edit panel</h3>
				<button onclick={onClose}>×</button>
			</div>
			<div class="panel-edit-tabs" role="tablist">
				<button role="tab" aria-selected={panelEditTab === 'data'} onclick={() => panelEditTab = 'data'}>Data</button>
				<button role="tab" aria-selected={panelEditTab === 'grouping'} onclick={() => panelEditTab = 'grouping'}>Grouping</button>
				<button role="tab" aria-selected={panelEditTab === 'chart'} onclick={() => panelEditTab = 'chart'}>Chart</button>
				<button role="tab" aria-selected={panelEditTab === 'legend'} onclick={() => panelEditTab = 'legend'}>Legend</button>
				<button role="tab" aria-selected={panelEditTab === 'expressions'} onclick={() => panelEditTab = 'expressions'}>Expressions</button>
			</div>
			<div class="panel-edit-content" role="tabpanel">
				{#if panelEditTab === 'data' || true}
					<label>
						Y axis range
						<input type="text" placeholder="Auto" aria-label="Y axis range" />
					</label>
					<label>
						Smoothing
						<input type="range" min="0" max="1" step="0.01" value="0" role="slider" aria-label="smoothing" />
					</label>
					<label>
						X axis
						<select><option>Step</option><option>Relative Time</option><option>Wall Time</option></select>
					</label>
					<button class="reset-btn" onclick={() => {}}>Reset to section defaults</button>
				{/if}
				{#if panelEditTab === 'grouping' || true}
					<label>Group by <select><option>None</option><option>Run</option></select></label>
					<label>Aggregation <select><option>Mean</option><option>Median</option><option>Min</option><option>Max</option></select></label>
				{/if}
				{#if panelEditTab === 'chart' || true}
					<label>Title <input type="text" placeholder="Panel title" /></label>
					<fieldset aria-label="Chart type">
						<legend>Chart type</legend>
						<div class="chart-type-options" role="listbox" aria-label="chart type">
							<button role="option" aria-selected={true}>Line</button>
							<button role="option">Bar chart</button>
							<button role="option">Area</button>
							<button role="option">Scatter</button>
						</div>
					</fieldset>
				{/if}
				{#if panelEditTab === 'legend' || true}
					<label>Legend template <input type="text" placeholder="{'$'}{'{run:displayName}'}" /></label>
				{/if}
				{#if panelEditTab === 'expressions' || true}
					<label>Y-axis expression <input type="text" placeholder="e.g., loss * 100" /></label>
				{/if}
			</div>
			<div class="panel-edit-footer">
				<div class="panel-edit-actions">
					<button role="menuitem" onclick={() => { onDeletePanel(); onClose(); }}>Delete panel</button>
				</div>
				<div class="panel-edit-buttons">
					<button onclick={onClose}>Cancel</button>
					<button class="primary" onclick={onClose}>Apply</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.panel-edit-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; }
	.panel-edit-modal { background: #16213e; border: 1px solid #1e2d4a; border-radius: 8px; width: 500px; max-height: 80vh; overflow-y: auto; }
	.panel-edit-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #1e2d4a; }
	.panel-edit-header h3 { margin: 0; font-size: 1rem; color: #e0e0e0; }
	.panel-edit-header button { background: none; border: none; color: #8899aa; font-size: 1.2rem; cursor: pointer; }
	.panel-edit-tabs { display: flex; border-bottom: 1px solid #1e2d4a; padding: 0 1rem; }
	.panel-edit-tabs button { padding: 0.5rem 0.75rem; background: none; border: none; border-bottom: 2px solid transparent; color: #8899aa; cursor: pointer; font-size: 0.85rem; }
	.panel-edit-tabs button[aria-selected="true"] { color: #4fc3f7; border-bottom-color: #4fc3f7; }
	.panel-edit-content { padding: 1rem; }
	.panel-edit-content label { display: block; margin: 0.5rem 0; color: #8899aa; font-size: 0.85rem; }
	.panel-edit-content input, .panel-edit-content select { display: block; width: 100%; margin-top: 0.25rem; padding: 0.4rem; background: #0d1117; border: 1px solid #1e2d4a; color: #e0e0e0; border-radius: 3px; }
	.panel-edit-content input[type="range"] { width: 100%; }
	.panel-edit-footer { display: flex; justify-content: space-between; gap: 0.5rem; padding: 1rem; border-top: 1px solid #1e2d4a; }
	.panel-edit-footer button { padding: 0.4rem 0.8rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; color: #8899aa; cursor: pointer; }
	.panel-edit-footer button.primary { background: #4fc3f7; color: #0a1929; border-color: #4fc3f7; }
	.panel-edit-actions { display: flex; }
	.panel-edit-buttons { display: flex; gap: 0.5rem; }
	.reset-btn { margin-top: 0.5rem; padding: 0.3rem 0.6rem; background: transparent; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; font-size: 0.8rem; }
</style>
