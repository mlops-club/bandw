<script lang="ts">
	import { page } from '$app/state';
	import ProjectNav from '$lib/components/ProjectNav.svelte';
	const entity = $derived(page.params.entity ?? '');
	const project = $derived(page.params.project ?? '');

	let showEditor = $state(false);
	let reportTitle = $state('');
	let reports: { title: string; content: string }[] = $state([]);
	let editingContent = $state('');
	let showSlashMenu = $state(false);

	function createReport() {
		showEditor = true;
		reportTitle = '';
		editingContent = '';
	}

	function handleEditorKeydown(e: KeyboardEvent) {
		if (e.key === '/') {
			showSlashMenu = true;
		} else {
			showSlashMenu = false;
		}
	}

	function insertBlock(type: string) {
		showSlashMenu = false;
		if (type === 'heading2') {
			// Will be handled by the contenteditable
		}
	}
</script>

<ProjectNav {entity} {project} />

<h1>Reports</h1>

{#if !showEditor}
	{#if reports.length === 0}
		<p class="empty-state">No reports yet for {project}.</p>
	{:else}
		<div class="reports-list">
			{#each reports as report}
				<a href="/{entity}/{project}/reportlist" class="report-link" role="link">{report.title || 'Untitled Report'}</a>
			{/each}
		</div>
	{/if}
	<button class="create-btn" onclick={createReport}>Create Report</button>
{:else}
	<div class="report-editor">
		<div class="editor-header">
			<input type="text" role="textbox" aria-label="title" class="title-input" placeholder="Report Title" bind:value={reportTitle} />
			<div class="editor-actions">
				<button onclick={() => {
					reports = [...reports, { title: reportTitle || 'Untitled Report', content: editingContent }];
					showEditor = false;
				}}>Save</button>
				<button onclick={() => showEditor = false}>Cancel</button>
			</div>
		</div>
		<textarea
			class="editor-content"
			aria-label="report content"
			placeholder="Type / for commands..."
			onkeydown={handleEditorKeydown}
			bind:value={editingContent}
		></textarea>
		{#if showSlashMenu}
			<div class="slash-menu" role="listbox">
				<button role="option" onclick={() => insertBlock('lineplot')}>Line Plot</button>
				<button role="option" onclick={() => insertBlock('panelgrid')}>Panel Grid</button>
				<button role="option" onclick={() => insertBlock('code')}>Code</button>
				<button role="option" onclick={() => insertBlock('markdown')}>Markdown</button>
				<button role="option" onclick={() => insertBlock('heading2')}>Heading 2</button>
				<button role="option" onclick={() => insertBlock('paragraph')}>Paragraph</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	h1 { font-size: 1.5rem; margin-bottom: 1rem; }
	.empty-state { color: #8899aa; margin-bottom: 1rem; }
	.create-btn { padding: 0.5rem 1rem; background: #4fc3f7; color: #0a1929; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
	.reports-list { margin-bottom: 1rem; }
	.report-link { display: block; padding: 0.5rem 0.75rem; color: #4fc3f7; text-decoration: none; border: 1px solid #1e2d4a; border-radius: 4px; margin-bottom: 0.5rem; }
	.report-link:hover { border-color: #4fc3f7; }
	.report-editor { background: #16213e; border: 1px solid #1e2d4a; border-radius: 6px; padding: 1rem; }
	.editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
	.title-input { flex: 1; padding: 0.5rem; background: #0d1117; border: 1px solid #1e2d4a; color: #e0e0e0; border-radius: 4px; font-size: 1.2rem; margin-right: 1rem; }
	.editor-actions { display: flex; gap: 0.5rem; }
	.editor-actions button { padding: 0.4rem 0.8rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; color: #8899aa; cursor: pointer; }
	.editor-content { min-height: 300px; padding: 1rem; background: #0d1117; border: 1px solid #1e2d4a; border-radius: 4px; color: #e0e0e0; font-size: 0.95rem; line-height: 1.6; outline: none; }
	.slash-menu { background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; padding: 0.25rem; margin-top: 0.5rem; }
	.slash-menu button { display: block; width: 100%; text-align: left; padding: 0.4rem 0.6rem; background: none; border: none; color: #e0e0e0; cursor: pointer; font-size: 0.85rem; border-radius: 3px; }
	.slash-menu button:hover { background: rgba(79,195,247,0.1); }
</style>
