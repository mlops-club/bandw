<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const entity = $derived(page.params.entity);
	const project = $derived(page.params.project);

	$effect(() => {
		goto(`/${entity}/${project}/overview`, { replaceState: true });
	});
</script>

<p>Redirecting to workspace...</p>
