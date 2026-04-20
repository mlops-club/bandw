<script lang="ts">
	import { page } from '$app/state';
	const project = $derived(page.params.project);
</script>

<h1>Artifacts</h1>
<p>Browse artifacts for {project}.</p>
