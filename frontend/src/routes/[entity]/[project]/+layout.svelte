<script lang="ts">
	import { page } from '$app/state';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import ProjectNav from '$lib/components/ProjectNav.svelte';

	let { children } = $props();

	const entity = $derived(page.params.entity);
	const project = $derived(page.params.project);

	// Don't show project nav on run detail pages
	const isRunDetail = $derived(page.url.pathname.includes('/runs/'));

	const crumbs = $derived(
		isRunDetail
			? [
					{ label: entity, href: `/${entity}/projects` },
					{ label: project, href: `/${entity}/${project}/workspace` },
					{ label: page.params.runId ?? 'run', href: page.url.pathname }
				]
			: [
					{ label: entity, href: `/${entity}/projects` },
					{ label: project, href: `/${entity}/${project}/workspace` }
				]
	);
</script>

<Breadcrumb {crumbs} />
{#if !isRunDetail}
	<ProjectNav {entity} {project} />
{/if}
{@render children()}
