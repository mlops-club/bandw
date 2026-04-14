<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/admin/uncategorized/workspace', { replaceState: true });
	});
</script>
