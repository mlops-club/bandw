<script lang="ts">
	import { setContextClient } from '@urql/svelte';
	import { client } from '$lib/graphql/client';

	setContextClient(client);

	let { children } = $props();
</script>

<svelte:head>
	<title>bandw</title>
</svelte:head>

<div class="app">
	<header>
		<nav>
			<a href="/admin/projects" class="logo">bandw</a>
		</nav>
	</header>
	<main>
		{@render children()}
	</main>
</div>

<style>
	:global(:root) {
		--bg-body: #1a1a2e;
		--bg-primary: #16213e;
		--bg-secondary: #1e2d4a;
		--bg-input: #0d1117;
		--bg-accent: #1e3a5f;
		--text-primary: #e0e0e0;
		--text-secondary: #8899aa;
		--text-dim: #556677;
		--text-key: #a0b0c0;
		--accent: #4fc3f7;
		--accent-hover: #81d4fa;
		--success: #81c784;
		--warning: #ffb74d;
		--error: #ff6b6b;
		--border: #1e2d4a;
		--border-focus: #0f3460;
	}

	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: var(--bg-body);
		color: var(--text-primary);
	}

	:global(a) {
		color: #64b5f6;
		text-decoration: none;
	}

	:global(a:hover) {
		text-decoration: underline;
	}

	.app {
		min-height: 100vh;
	}

	header {
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border-focus);
		padding: 0 1.5rem;
	}

	nav {
		display: flex;
		align-items: center;
		height: 48px;
		max-width: 1400px;
		margin: 0 auto;
	}

	.logo {
		font-size: 1.2rem;
		font-weight: 700;
		color: #ffd700;
		letter-spacing: 1px;
	}

	.logo:hover {
		text-decoration: none;
	}

	main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1.5rem;
	}
</style>
