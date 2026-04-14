<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();

	const entity = $derived(page.params.entity ?? 'admin');
	const project = $derived(page.params.project ?? 'uncategorized');

	const navItems = $derived([
		{ label: 'Project', href: `/${entity}/${project}/overview`, icon: 'i' },
		{ label: 'Workspace', href: `/${entity}/${project}/workspace`, icon: '⊞' },
		{ label: 'Runs', href: `/${entity}/${project}/table`, icon: '☰' },
	]);
</script>

<div class="app">
	<header class="topnav">
		<a class="logo" href="/">bandw</a>
		<span class="breadcrumb">{entity} / {project}</span>
	</header>
	<div class="body">
		<nav class="sidebar">
			{#each navItems as item}
				<a
					href={item.href}
					class="nav-item"
					class:active={page.url.pathname === item.href}
				>
					<span class="icon">{item.icon}</span>
					<span class="label">{item.label}</span>
				</a>
			{/each}
		</nav>
		<main class="content">
			{@render children()}
		</main>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #1a1a2e;
		color: #e0e0e0;
	}
	:global(a) {
		color: #7eb8da;
		text-decoration: none;
	}
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}
	.topnav {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1rem;
		height: 48px;
		background: #16213e;
		border-bottom: 1px solid #2a2a4a;
	}
	.logo {
		font-weight: 700;
		font-size: 1.1rem;
		color: #f5c542;
	}
	.breadcrumb {
		font-size: 0.85rem;
		color: #888;
	}
	.body {
		display: flex;
		flex: 1;
		overflow: hidden;
	}
	.sidebar {
		width: 56px;
		background: #16213e;
		border-right: 1px solid #2a2a4a;
		display: flex;
		flex-direction: column;
		padding-top: 0.5rem;
	}
	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.6rem 0;
		font-size: 0.65rem;
		color: #888;
		transition: color 0.15s;
	}
	.nav-item:hover, .nav-item.active {
		color: #f5c542;
	}
	.icon {
		font-size: 1.2rem;
		margin-bottom: 2px;
	}
	.content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
	}
</style>
