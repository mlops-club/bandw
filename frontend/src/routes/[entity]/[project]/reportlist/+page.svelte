<script lang="ts">
	import { page } from '$app/state';
	const project = $derived(page.params.project);
</script>

<h1>Reports</h1>
<p>No reports yet for {project}.</p>
<button>Create Report</button>
