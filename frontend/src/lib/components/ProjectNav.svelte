<script lang="ts">
	import { page } from '$app/state';

	let { entity, project }: { entity: string; project: string } = $props();

	const tabs = $derived([
		{ label: 'Overview', href: `/${entity}/${project}/overview` },
		{ label: 'Workspace', href: `/${entity}/${project}/workspace` },
		{ label: 'Runs', href: `/${entity}/${project}/table` },
		{ label: 'Reports', href: `/${entity}/${project}/reportlist` },
		{ label: 'Artifacts', href: `/${entity}/${project}/artifacts` }
	]);

	const currentPath = $derived(page.url.pathname);
</script>

<nav class="project-nav" role="tablist">
	{#each tabs as tab}
		{#if currentPath === tab.href}
			<a href={tab.href} role="tab" aria-selected="true" class="active">{tab.label}</a>
		{:else}
			<a href={tab.href} class:active={false}>{tab.label}</a>
		{/if}
	{/each}
</nav>

<style>
	.project-nav {
		display: flex;
		gap: 0;
		border-bottom: 2px solid #0f3460;
		margin-bottom: 1.5rem;
	}

	a {
		color: #8899aa;
		padding: 0.6rem 1.2rem;
		font-size: 0.9rem;
		text-decoration: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
	}

	a.active {
		color: #e0e0e0;
		border-bottom-color: #4fc3f7;
	}

	a:hover {
		color: #c0d0e0;
		text-decoration: none;
	}
</style>
