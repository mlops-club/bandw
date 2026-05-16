<script lang="ts">
	let { message = 'Loading...' }: { message?: string } = $props();
</script>

<div class="spinner-container">
	<div class="spinner"></div>
	<p class="spinner-text">{message}</p>
</div>

<style>
	.spinner-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 0.75rem;
	}

	.spinner {
		width: 28px;
		height: 28px;
		border: 3px solid var(--border, #1e2d4a);
		border-top-color: var(--accent, #4fc3f7);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.spinner-text {
		color: var(--text-secondary, #8899aa);
		font-size: 0.85rem;
		margin: 0;
	}
</style>
