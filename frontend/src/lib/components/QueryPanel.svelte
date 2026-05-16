<script lang="ts">
	import WandbTable from './WandbTable.svelte';

	type RunData = {
		name: string;
		displayName?: string;
		config: string | null;
		summaryMetrics: string | null;
	};

	let { runs = [] }: { runs: RunData[] } = $props();

	let expression = $state('');
	let showConfig = $state(false);

	// Parse expression like runs.summary["key"] or runs.config["key"]
	function evaluateExpression(expr: string): { columns: string[]; data: unknown[][] } | null {
		const summaryMatch = expr.match(/^runs\.summary\["(.+?)"\]$/);
		const configMatch = expr.match(/^runs\.config\["(.+?)"\]$/);

		if (summaryMatch) {
			const key = summaryMatch[1];
			return extractFromRuns(key, 'summary');
		}
		if (configMatch) {
			const key = configMatch[1];
			return extractFromRuns(key, 'config');
		}
		return null;
	}

	function extractFromRuns(key: string, source: 'summary' | 'config'): { columns: string[]; data: unknown[][] } {
		const rows: unknown[][] = [];
		const allColumns = new Set<string>();

		for (const run of runs) {
			let parsed: Record<string, unknown> = {};
			try {
				if (source === 'summary') {
					parsed = JSON.parse(run.summaryMetrics || '{}');
				} else {
					const raw = JSON.parse(run.config || '{}');
					// Check for _bandw_tables which stores table data
					const bandwTables = raw['_bandw_tables'];
					if (bandwTables) {
						const tableVal = typeof bandwTables === 'object' && 'value' in bandwTables ? bandwTables.value : bandwTables;
						if (tableVal && tableVal[key]) {
							const table = tableVal[key];
							return { columns: table.columns || [], data: table.data || [] };
						}
					}
					for (const [k, v] of Object.entries(raw)) {
						parsed[k] = typeof v === 'object' && v !== null && 'value' in (v as Record<string, unknown>)
							? (v as Record<string, unknown>).value
							: v;
					}
				}
			} catch { /* skip */ }

			const val = parsed[key];
			if (val !== undefined) {
				if (typeof val === 'object' && val !== null && 'columns' in (val as Record<string, unknown>)) {
					const tableVal = val as { columns: string[]; data: unknown[][] };
					return { columns: tableVal.columns, data: tableVal.data };
				}
				allColumns.add('run');
				allColumns.add(key);
				rows.push([run.displayName || run.name, val]);
			}
		}

		if (rows.length > 0) {
			return { columns: Array.from(allColumns), data: rows };
		}
		return { columns: ['run', key], data: [] };
	}

	const result = $derived(expression ? evaluateExpression(expression) : null);
</script>

<div class="query-panel">
	<div class="query-header">
		<h3>Query Panel</h3>
		<button class="config-toggle" aria-label="Panel settings" onclick={() => showConfig = !showConfig}>
			{showConfig ? 'Hide config' : 'Settings'}
		</button>
	</div>

	<div class="expression-editor">
		<label for="query-expression" class="sr-only">Query</label>
		<input
			id="query-expression"
			type="text"
			role="textbox"
			aria-label="expression"
			placeholder='runs.summary["key"] or runs.config["key"]'
			bind:value={expression}
		/>
	</div>

	{#if showConfig}
		<div class="config-drawer" role="complementary">
			<h4>Configuration</h4>
			<label>
				<span>Expression type</span>
				<select>
					<option>Summary</option>
					<option>Config</option>
					<option>Artifact</option>
				</select>
			</label>
		</div>
	{/if}

	{#if result && result.columns.length > 0}
		<div class="query-result">
			<WandbTable
				title="Query Result"
				columns={result.columns}
				data={result.data}
			/>
		</div>
	{:else if expression}
		<p class="no-result">No data found for expression: {expression}</p>
	{/if}
</div>

<style>
	.query-panel {
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.query-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.query-header h3 {
		font-size: 0.95rem;
		color: #e0e0e0;
		margin: 0;
	}

	.config-toggle {
		background: #1e3a5f;
		color: #4fc3f7;
		border: 1px solid #4fc3f7;
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.expression-editor {
		margin-bottom: 0.75rem;
	}

	.expression-editor label.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	.expression-editor input {
		width: 100%;
		padding: 0.5rem;
		background: #0d1117;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		color: #e0e0e0;
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 0.85rem;
	}

	.config-drawer {
		background: #0d1117;
		border: 1px solid #1e2d4a;
		border-radius: 4px;
		padding: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.config-drawer h4 {
		font-size: 0.85rem;
		color: #8899aa;
		margin: 0 0 0.5rem;
	}

	.config-drawer label {
		display: block;
		font-size: 0.8rem;
		color: #8899aa;
	}

	.config-drawer select {
		margin-top: 0.25rem;
		padding: 0.3rem;
		background: #16213e;
		border: 1px solid #1e2d4a;
		color: #e0e0e0;
		border-radius: 3px;
	}

	.no-result {
		color: #556677;
		font-size: 0.85rem;
		text-align: center;
		padding: 1rem;
	}
</style>
