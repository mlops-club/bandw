<script lang="ts">
	let { state }: { state: string | null } = $props();

	const colors: Record<string, string> = {
		running: '#4caf50',
		finished: '#2196f3',
		crashed: '#f44336',
		failed: '#ff9800'
	};

	const color = $derived(colors[state ?? ''] ?? '#9e9e9e');
</script>

<span class="badge" style="--badge-color: {color}">
	{state ?? 'unknown'}
</span>

<style>
	.badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background: color-mix(in srgb, var(--badge-color) 20%, transparent);
		color: var(--badge-color);
		border: 1px solid color-mix(in srgb, var(--badge-color) 40%, transparent);
	}
</style>
