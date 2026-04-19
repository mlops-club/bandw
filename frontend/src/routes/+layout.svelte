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
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #1a1a2e;
		color: #e0e0e0;
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
		background: #16213e;
		border-bottom: 1px solid #0f3460;
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
