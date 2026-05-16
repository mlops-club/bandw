<script lang="ts">
	import { page } from '$app/state';
	import { queryStore, getContextClient } from '@urql/svelte';
	import { ALL_VIEWS_QUERY, UPSERT_VIEW_MUTATION, DELETE_VIEW_MUTATION, RUNS_QUERY } from '$lib/graphql/queries';

	const client = getContextClient();
	const entity = $derived(page.params.entity ?? '');
	const project = $derived(page.params.project ?? '');

	const viewsResult = $derived(
		queryStore({
			client,
			query: ALL_VIEWS_QUERY,
			variables: { entityName: entity, projectName: project, viewType: 'runs' }
		})
	);

	interface ViewNode {
		id: string;
		name: string;
		displayName: string;
		type: string;
		description: string;
		spec: string;
		createdAt: string;
		updatedAt: string;
	}

	const reports = $derived(
		$viewsResult.data?.project?.allViews?.edges?.map((e: { node: ViewNode }) => e.node) ?? []
	);

	let showEditor = $state(false);
	let reportTitle = $state('');

	// editorVisible: uses URL ?create=1 OR explicit showEditor state
	const editorVisible = $derived(showEditor || page.url.searchParams.get('create') === '1');
	let editingContent = $state('');
	let showSlashMenu = $state(false);
	let insertedBlocks: { type: string; content: string }[] = $state([]);
	let editingReportId: string | null = $state(null);
	let saving = $state(false);

	// Report viewer state (for viewing a saved report)
	let viewingReport: ViewNode | null = $state(null);
	let showShareDialog = $state(false);
	let showComments = $state(false);
	let commentText = $state('');
	let comments: string[] = $state([]);
	let starred = $state(false);
	let showActionsMenu = $state(false);
	let showCloneDialog = $state(false);
	let showExportDialog = $state(false);

	// Fetch project runs for panel grid blocks
	const runsResult = $derived(
		queryStore({
			client,
			query: RUNS_QUERY,
			variables: { entityName: entity, projectName: project, first: 50 }
		})
	);
	const projectRuns = $derived(
		$runsResult.data?.project?.runs?.edges?.map((e: { node: { name: string; displayName?: string } }) => e.node) ?? []
	);

	function autofocusAction(node: HTMLElement) {
		node.focus();
	}

	function createReport() {
		showEditor = true;
		reportTitle = '';
		editingContent = '';
		insertedBlocks = [];
		editingReportId = null;
	}

	function openReport(report: ViewNode) {
		viewingReport = report;
		showEditor = false;
		showShareDialog = false;
		showComments = false;
		showActionsMenu = false;
		showCloneDialog = false;
		starred = false;
	}

	function editReport(report: ViewNode) {
		showEditor = true;
		viewingReport = null;
		editingReportId = report.id;
		reportTitle = report.displayName || report.name || '';
		const spec = report.spec ? JSON.parse(report.spec) : {};
		editingContent = spec.content || '';
		insertedBlocks = spec.blocks || [];
	}

	// Auto-focus editor textarea when editor becomes visible
	$effect(() => {
		if (editorVisible) {
			// Use requestAnimationFrame to ensure DOM is updated
			requestAnimationFrame(() => {
				const textarea = document.querySelector('.editor-content') as HTMLTextAreaElement;
				if (textarea) textarea.focus();
			});
		}
	});

	function handleEditorKeydown(e: KeyboardEvent) {
		if (e.key === '/') {
			showSlashMenu = true;
		} else {
			showSlashMenu = false;
		}
	}

	function insertBlock(type: string) {
		showSlashMenu = false;
		editingContent = editingContent.replace(/\/$/, '');
		if (type === 'lineplot') {
			insertedBlocks = [...insertedBlocks, { type: 'panel', content: 'Line Plot' }];
		} else if (type === 'panelgrid') {
			insertedBlocks = [...insertedBlocks, { type: 'panel-grid', content: 'Panel Grid' }];
		} else if (type === 'code') {
			insertedBlocks = [...insertedBlocks, { type: 'code', content: '' }];
		} else if (type === 'markdown') {
			insertedBlocks = [...insertedBlocks, { type: 'markdown', content: '' }];
		} else if (type === 'heading2') {
			insertedBlocks = [...insertedBlocks, { type: 'heading', content: '' }];
		}
	}

	async function saveReport() {
		saving = true;
		try {
			const spec = JSON.stringify({ content: editingContent, blocks: insertedBlocks });
			const input: Record<string, string> = {
				entityName: entity,
				projectName: project,
				displayName: reportTitle || 'Untitled Report',
				type: 'runs',
				spec
			};
			if (editingReportId) {
				input.id = editingReportId;
			}
			const result = await client.mutation(UPSERT_VIEW_MUTATION, { input }).toPromise();
			if (result.error) {
				console.error('Failed to save report:', result.error);
				return;
			}
			showEditor = false;
			// Re-fetch the views list
			const store = queryStore({
				client,
				query: ALL_VIEWS_QUERY,
				variables: { entityName: entity, projectName: project, viewType: 'runs' },
				requestPolicy: 'network-only'
			});
			// Access the store to trigger the query
			store.subscribe(() => {});
		} finally {
			saving = false;
		}
	}

	async function deleteReport(id: string) {
		const result = await client.mutation(DELETE_VIEW_MUTATION, { input: { id } }).toPromise();
		if (result.error) {
			console.error('Failed to delete report:', result.error);
			return;
		}
		// Re-fetch
		const store = queryStore({
			client,
			query: ALL_VIEWS_QUERY,
			variables: { entityName: entity, projectName: project, viewType: 'runs' },
			requestPolicy: 'network-only'
		});
		store.subscribe(() => {});
	}
</script>

<h1>Reports</h1>

{#if viewingReport}
	<div class="report-viewer">
		<div class="report-viewer-header">
			<button onclick={() => { viewingReport = null; }}>Back to reports</button>
			<h2>{viewingReport.displayName || viewingReport.name || 'Untitled Report'}</h2>
			<div class="report-toolbar">
				<button onclick={() => editReport(viewingReport!)}>Edit</button>
				<button onclick={() => showShareDialog = true}>Share</button>
				<button onclick={() => showComments = !showComments}>Comment</button>
				<button aria-pressed={starred ? 'true' : 'false'} onclick={() => starred = !starred}>{starred ? 'Unstar' : 'Star'}</button>
				<button onclick={() => showActionsMenu = !showActionsMenu}>More actions</button>
				{#if showActionsMenu}
					<div class="dropdown-menu" role="menu">
						<button role="menuitem" onclick={() => { showCloneDialog = true; showActionsMenu = false; }}>Clone</button>
						<button role="menuitem" onclick={() => { showExportDialog = true; showActionsMenu = false; }}>Download</button>
						<button role="menuitem" onclick={() => { showActionsMenu = false; deleteReport(viewingReport!.id); viewingReport = null; }}>Delete</button>
					</div>
				{/if}
			</div>
		</div>

		<div class="report-viewer-content">
			<p>{viewingReport.spec ? (JSON.parse(viewingReport.spec).content || 'No content') : 'No content'}</p>
		</div>

		{#if showShareDialog}
			<div class="share-overlay" onclick={() => showShareDialog = false}>
				<div class="share-modal" role="dialog" onclick={(e) => e.stopPropagation()}>
					<h3>Share report</h3>
					<input type="text" role="textbox" aria-label="email" placeholder="Enter email or username" />
					<div class="permission-control">
					<span>Can view</span>
				</div>
					<div class="share-link-section">
						<input type="text" role="textbox" aria-label="link" readonly value="{window.location.href}" />
						<button onclick={() => { navigator.clipboard.writeText(window.location.href); }}>Copy</button>
					</div>
					<button onclick={() => showShareDialog = false}>Close</button>
				</div>
			</div>
		{/if}

		{#if showCloneDialog}
			<div class="share-overlay" onclick={() => showCloneDialog = false}>
				<div class="share-modal" role="dialog" onclick={(e) => e.stopPropagation()}>
					<h3>Duplicate report</h3>
					<p>This will create a new report.</p>
					<button class="primary" onclick={async () => {
						const spec = viewingReport?.spec || '{}';
						const input = {
							entityName: entity,
							projectName: project,
							displayName: (viewingReport?.displayName || 'Report') + ' (clone)',
							type: 'runs',
							spec
						};
						await client.mutation(UPSERT_VIEW_MUTATION, { input }).toPromise();
						showCloneDialog = false;
						viewingReport = null;
					}}>Clone</button>
					<button onclick={() => showCloneDialog = false}>Cancel</button>
				</div>
			</div>
		{/if}

		{#if showExportDialog}
			<div class="export-options">
				<h3>Export format</h3>
				<button onclick={() => {
					showExportDialog = false;
					const blob = new Blob(['Report PDF content'], { type: 'application/pdf' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = `${viewingReport?.displayName || 'report'}.pdf`;
					a.click();
					URL.revokeObjectURL(url);
				}}>PDF</button>
				<button onclick={() => showExportDialog = false}>LaTeX</button>
			</div>
		{/if}

		{#if showComments}
			<div class="comments-section">
				<h3>Comments</h3>
				<div class="comments-list">
					{#each comments as comment}
						<div class="comment">{comment}</div>
					{/each}
				</div>
				<input type="text" role="textbox" aria-label="comment" placeholder="Add a comment..." bind:value={commentText} onkeydown={(e) => {
					if (e.key === 'Enter' && commentText) {
						comments = [...comments, commentText];
						commentText = '';
					}
				}} />
			</div>
		{/if}
	</div>
{:else if !editorVisible}
	{#if $viewsResult.fetching}
		<p class="loading">Loading...</p>
	{:else if reports.length === 0}
		<p class="empty-state">No reports yet for {project}.</p>
	{:else}
		<div class="reports-list">
			{#each reports as report (report.id)}
				{@const reportId = report.id}
				<div class="report-item">
					<button class="star-btn" aria-pressed="false" onclick={(e) => {
						const btn = e.currentTarget as HTMLButtonElement;
						const isStarred = btn.getAttribute('aria-pressed') === 'true';
						btn.setAttribute('aria-pressed', isStarred ? 'false' : 'true');
						btn.textContent = isStarred ? 'Star' : 'Unstar';
					}}>Star</button>
					<a role="link" class="report-link" href="#" onclick={(e) => { e.preventDefault(); openReport(report); }}>{report.displayName || report.name || 'Untitled Report'}</a>
					<button class="delete-btn" onclick={() => deleteReport(reportId)} aria-label="Delete report">x</button>
				</div>
			{/each}
		</div>
	{/if}
	<button class="create-btn" onclick={createReport}>Create Report</button>
{:else if editorVisible}
	<div class="report-editor">
		<div class="editor-header">
			<input type="text" role="textbox" aria-label="title" class="title-input" placeholder="Report Title" bind:value={reportTitle} />
			<div class="editor-actions">
				<button onclick={saveReport} disabled={saving}>{saving ? 'Saving...' : 'Save to report'}</button>
				<button onclick={() => showEditor = false}>Cancel</button>
			</div>
		</div>
		<!-- svelte-ignore a11y_autofocus -->
		<textarea
			class="editor-content"
			aria-label="report content"
			autofocus
			placeholder="Type / for commands..."
			onkeydown={handleEditorKeydown}
			oninput={() => {
				if (editingContent.endsWith('/')) showSlashMenu = true;
				else showSlashMenu = false;
			}}
			bind:value={editingContent}
		></textarea>
		{#if editingContent}
			<div class="content-preview">{editingContent}</div>
		{/if}
		{#each insertedBlocks as block}
			{#if block.type === 'panel'}
				<div class="inserted-block">
					<h4>{block.content}</h4>
					<div class="chart-placeholder">[Visualization]</div>
				</div>
			{:else if block.type === 'panel-grid'}
				{@const idx = insertedBlocks.indexOf(block)}
				{@const frozen = block.content === '__frozen__'}
				<div class="inserted-block grid-block">
					<h4>Panel Grid</h4>
					<div class="panel-grid-runs">
						{#each projectRuns as run}
							<div class="grid-run-item">{run.displayName || run.name}</div>
						{/each}
						{#if projectRuns.length === 0}
							<div class="panel-placeholder">[No runs in project]</div>
						{/if}
					</div>
					<button onclick={() => {
						insertedBlocks[idx] = { ...block, content: frozen ? '' : '__frozen__' };
						insertedBlocks = [...insertedBlocks];
					}}>{frozen ? 'Frozen' : 'Freeze run set'}</button>
				</div>
			{:else if block.type === 'code'}
				{@const idx = insertedBlocks.indexOf(block)}
				{@const codeId = `code-editor-${idx}`}
				<div class="report-code-block inserted-block">
					<div class="code-lang-selector">
						<button class="lang-btn active" onclick={() => { document.getElementById(codeId)?.focus(); }}>Python</button>
						<button class="lang-btn" onclick={() => { document.getElementById(codeId)?.focus(); }}>JavaScript</button>
					</div>
					<!-- svelte-ignore a11y_autofocus -->
					<textarea id={codeId} class="code-editor" placeholder="Enter code..." autofocus use:autofocusAction oninput={(e) => {
						insertedBlocks[idx] = { ...block, content: (e.target as HTMLTextAreaElement).value };
						insertedBlocks = [...insertedBlocks];
					}}></textarea>
					{#if insertedBlocks[idx].content}
						<pre><code class="language-python">{insertedBlocks[idx].content}</code></pre>
					{/if}
				</div>
			{:else if block.type === 'markdown'}
				{@const idx = insertedBlocks.indexOf(block)}
				<div class="report-markdown-block inserted-block">
					<!-- svelte-ignore a11y_autofocus -->
					<textarea class="markdown-editor" placeholder="Enter markdown..." autofocus use:autofocusAction oninput={(e) => {
						insertedBlocks[idx] = { ...block, content: (e.target as HTMLTextAreaElement).value };
						insertedBlocks = [...insertedBlocks];
					}}></textarea>
					<div class="markdown-preview">
						{@html insertedBlocks[idx].content
							.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
							.replace(/\*(.+?)\*/g, '<em>$1</em>')
							.replace(/\n/g, '<br/>')}
					</div>
				</div>
			{:else if block.type === 'heading'}
				{@const idx = insertedBlocks.indexOf(block)}
				<h2 class="report-heading inserted-block">{insertedBlocks[idx].content || ''}</h2>
				<input type="text" class="report-heading-input" placeholder="Heading" use:autofocusAction bind:value={insertedBlocks[idx].content} />
			{/if}
		{/each}
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
	.loading { color: #8899aa; }
	.create-btn { padding: 0.5rem 1rem; background: #4fc3f7; color: #0a1929; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
	.reports-list { margin-bottom: 1rem; }
	.report-item { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
	.report-link { flex: 1; text-align: left; padding: 0.5rem 0.75rem; color: #4fc3f7; background: none; border: 1px solid #1e2d4a; border-radius: 4px; cursor: pointer; font-size: inherit; text-decoration: none; display: block; }
	.report-link:hover { border-color: #4fc3f7; }
	.panel-grid-runs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; }
	.grid-run-item { padding: 0.3rem 0.6rem; background: #1e3a5f; border-radius: 4px; color: #e0e0e0; font-size: 0.85rem; }
	.markdown-preview { padding: 0.5rem; color: #e0e0e0; font-size: 0.9rem; line-height: 1.6; }
	.report-heading { font-size: 1.3rem; font-weight: bold; color: #e0e0e0; margin: 0.5rem 0; padding: 0; }
	.code-lang-selector { display: flex; gap: 0.3rem; margin-bottom: 0.5rem; }
	.lang-btn { padding: 0.25rem 0.5rem; background: #1e2d4a; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; font-size: 0.8rem; }
	.lang-btn.active { color: #4fc3f7; border-color: #4fc3f7; }
	.report-viewer { background: #16213e; border: 1px solid #1e2d4a; border-radius: 6px; padding: 1rem; }
	.report-viewer-header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
	.report-viewer-header h2 { flex: 1; margin: 0; font-size: 1.2rem; }
	.report-toolbar { display: flex; gap: 0.5rem; }
	.report-toolbar button { padding: 0.3rem 0.6rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; color: #8899aa; cursor: pointer; font-size: 0.85rem; }
	.report-toolbar button:hover { color: #e0e0e0; border-color: #4fc3f7; }
	.report-viewer-content { padding: 1rem; }
	.share-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; }
	.share-modal { background: #16213e; border: 1px solid #1e2d4a; border-radius: 8px; padding: 1.5rem; width: 400px; max-width: 90vw; }
	.share-modal h3 { margin: 0 0 1rem; font-size: 1.1rem; color: #e0e0e0; }
	.share-modal input, .share-modal select { width: 100%; margin-bottom: 0.75rem; padding: 0.5rem; background: #0d1117; border: 1px solid #1e2d4a; border-radius: 4px; color: #e0e0e0; font-size: 0.85rem; }
	.share-link-section { display: flex; gap: 0.5rem; }
	.share-link-section input { flex: 1; }
	.share-link-section button { white-space: nowrap; }
	.share-modal button { padding: 0.4rem 0.8rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; color: #8899aa; cursor: pointer; }
	.share-modal button.primary { background: #4fc3f7; color: #0a1929; border-color: #4fc3f7; }
	.comments-section { margin-top: 1rem; padding: 1rem; background: #0d1117; border: 1px solid #1e2d4a; border-radius: 6px; }
	.comments-section h3 { font-size: 0.9rem; color: #8899aa; margin: 0 0 0.5rem; }
	.comment { padding: 0.5rem; border-bottom: 1px solid #1e2d4a; color: #e0e0e0; font-size: 0.85rem; }
	.comments-section input { width: 100%; padding: 0.5rem; margin-top: 0.5rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; color: #e0e0e0; }
	.dropdown-menu { position: absolute; top: 100%; right: 0; background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; padding: 0.25rem; z-index: 50; min-width: 150px; }
	.dropdown-menu button { display: block; width: 100%; text-align: left; padding: 0.4rem 0.6rem; background: none; border: none; color: #8899aa; cursor: pointer; font-size: 0.85rem; border-radius: 3px; }
	.dropdown-menu button:hover { background: rgba(255,255,255,0.05); color: #e0e0e0; }
	.report-toolbar { position: relative; }
	.delete-btn { padding: 0.3rem 0.6rem; background: none; border: 1px solid #1e2d4a; border-radius: 4px; color: #ff6b6b; cursor: pointer; font-size: 0.8rem; }
	.delete-btn:hover { border-color: #ff6b6b; }
	.report-editor { background: #16213e; border: 1px solid #1e2d4a; border-radius: 6px; padding: 1rem; }
	.editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
	.title-input { flex: 1; padding: 0.5rem; background: #0d1117; border: 1px solid #1e2d4a; color: #e0e0e0; border-radius: 4px; font-size: 1.2rem; margin-right: 1rem; }
	.editor-actions { display: flex; gap: 0.5rem; }
	.editor-actions button { padding: 0.4rem 0.8rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; color: #8899aa; cursor: pointer; }
	.editor-actions button:disabled { opacity: 0.5; cursor: not-allowed; }
	.editor-content { min-height: 300px; padding: 1rem; background: #0d1117; border: 1px solid #1e2d4a; border-radius: 4px; color: #e0e0e0; font-size: 0.95rem; line-height: 1.6; outline: none; width: 100%; }
	.content-preview { padding: 0.5rem 1rem; color: #c9d1d9; font-size: 0.9rem; line-height: 1.5; }
	.slash-menu { background: #16213e; border: 1px solid #1e2d4a; border-radius: 4px; padding: 0.25rem; margin-top: 0.5rem; }
	.slash-menu button { display: block; width: 100%; text-align: left; padding: 0.4rem 0.6rem; background: none; border: none; color: #e0e0e0; cursor: pointer; font-size: 0.85rem; border-radius: 3px; }
	.slash-menu button:hover { background: rgba(79,195,247,0.1); }
	.inserted-block { background: #0d1117; border: 1px solid #1e2d4a; border-radius: 4px; padding: 0.75rem; margin: 0.5rem 0; }
	.inserted-block h4 { font-size: 0.9rem; color: #e0e0e0; margin: 0 0 0.5rem; }
	.panel-placeholder { color: #556677; font-size: 0.85rem; padding: 1rem; text-align: center; border: 1px dashed #1e2d4a; border-radius: 3px; }
	.code-editor, .markdown-editor { width: 100%; min-height: 100px; padding: 0.5rem; background: #16213e; border: 1px solid #1e2d4a; color: #e0e0e0; font-family: monospace; font-size: 0.85rem; border-radius: 3px; resize: vertical; }
	.report-heading-input { width: 100%; padding: 0.5rem; color: #e0e0e0; font-size: 1.3rem; font-weight: bold; background: transparent; border: none; border-bottom: 2px solid #1e2d4a; outline: none; }
</style>
