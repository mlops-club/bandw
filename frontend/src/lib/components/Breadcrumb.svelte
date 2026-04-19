<script lang="ts">
	type Crumb = { label: string; href: string };
	let { crumbs }: { crumbs: Crumb[] } = $props();
</script>

<nav class="breadcrumb" aria-label="Breadcrumb">
	{#each crumbs as crumb, i}
		{#if i > 0}<span class="sep">/</span>{/if}
		{#if i === crumbs.length - 1}
			<span class="current">{crumb.label}</span>
		{:else}
			<a href={crumb.href}>{crumb.label}</a>
		{/if}
	{/each}
</nav>

<style>
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		margin-bottom: 1rem;
	}

	.sep {
		color: #556677;
	}

	a {
		color: #64b5f6;
	}

	.current {
		color: #c0d0e0;
	}
</style>
