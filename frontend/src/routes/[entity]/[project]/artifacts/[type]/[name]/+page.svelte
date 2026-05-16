<script lang="ts">
	import { page } from '$app/state';
	import { queryStore, getContextClient, gql } from '@urql/svelte';
	import { DELETE_ARTIFACT_MUTATION } from '$lib/graphql/queries';

	const client = getContextClient();
	const entity = $derived(page.params.entity ?? '');
	const project = $derived(page.params.project ?? '');
	const artifactType = $derived(page.params.type ?? '');
	const artifactName = $derived(page.params.name ?? '');

	const ARTIFACT_DETAIL_QUERY = gql`
		query ArtifactDetail($projectName: String!, $entityName: String!, $collectionName: String!) {
			project(name: $projectName, entityName: $entityName) {
				artifactCollection(name: $collectionName) {
					id
					name
					description
					defaultArtifactType { id name }
					artifacts(first: 50) {
						edges {
							node {
								id
								versionIndex
								state
								description
								metadata
								createdAt
								size
								fileCount
								aliases { alias }
								createdBy { ... on Run { name displayName inputArtifacts(first: 20) { edges { node { id versionIndex artifactSequence { name } } } } } }
								usedBy { edges { node { name displayName } } }
								files(first: 100) {
									edges {
										node {
											id
											name
											sizeBytes
											directUrl
											url
										}
									}
								}
							}
						}
					}
				}
			}
		}
	`;

	const result = $derived(
		queryStore({
			client,
			query: ARTIFACT_DETAIL_QUERY,
			variables: { projectName: project, entityName: entity, collectionName: artifactName }
		})
	);

	const collection = $derived($result.data?.project?.artifactCollection);
	const versions = $derived(
		collection?.artifacts?.edges?.map((e: any) => e.node) ?? []
	);
	const latestVersion = $derived(versions[versions.length - 1]);

	let activeTab = $state('overview');
	let selectedVersion = $state<any>(null);
	const displayVersion = $derived(selectedVersion ?? latestVersion);

	let showDeleteDialog = $state(false);
	let expandedDirs = $state<Set<string>>(new Set());

	function parseMetadata(raw: string | null): Record<string, unknown> {
		if (!raw) return {};
		try { return JSON.parse(raw); } catch { return {}; }
	}

	// Group files into directory structure
	function groupFiles(files: { name: string; sizeBytes?: number; directUrl?: string; url?: string }[]) {
		const dirs: Record<string, typeof files> = {};
		const rootFiles: typeof files = [];
		for (const f of files) {
			const slashIdx = f.name.indexOf('/');
			if (slashIdx > 0) {
				const dir = f.name.substring(0, slashIdx);
				const childName = f.name.substring(slashIdx + 1);
				if (!dirs[dir]) dirs[dir] = [];
				dirs[dir].push({ ...f, name: childName });
			} else {
				rootFiles.push(f);
			}
		}
		return { dirs, rootFiles };
	}

	async function deleteVersion(artifactId: string) {
		const result = await client.mutation(DELETE_ARTIFACT_MUTATION, {
			input: { artifactID: artifactId }
		}).toPromise();
		if (!result.error) {
			showDeleteDialog = false;
			// Refetch by forcing a new query
			selectedVersion = null;
		}
	}
</script>

<nav class="breadcrumb">
	<a href="/{entity}">{entity}</a> /
	<a href="/{entity}/{project}">{project}</a> /
	<a href="/{entity}/{project}/artifacts">Artifacts</a> /
	<span>{artifactType}</span> /
	<span>{artifactName}</span>
</nav>

{#if $result.fetching}
	<p>Loading artifact...</p>
{:else if !collection}
	<p>Artifact not found.</p>
{:else}
	<h1>{collection.name}</h1>
	<p class="subtitle">Type: {artifactType} &middot; {versions.length} version{versions.length !== 1 ? 's' : ''}</p>

	<nav class="artifact-tabs" role="tablist">
		<a href="#overview" role="link" aria-label="Overview" class:active={activeTab === 'overview'} onclick={(e) => { e.preventDefault(); activeTab = 'overview'; }}>Overview</a>
		<a href="#metadata" role="link" aria-label="Metadata" class:active={activeTab === 'metadata'} onclick={(e) => { e.preventDefault(); activeTab = 'metadata'; }}>Metadata</a>
		<a href="#usage" role="link" aria-label="Usage" class:active={activeTab === 'usage'} onclick={(e) => { e.preventDefault(); activeTab = 'usage'; }}>Usage</a>
		<a href="#files" role="link" aria-label="Files" class:active={activeTab === 'files'} onclick={(e) => { e.preventDefault(); activeTab = 'files'; }}>Files</a>
		<a href="#versions" role="link" aria-label="Version" class:active={activeTab === 'versions'} onclick={(e) => { e.preventDefault(); activeTab = 'versions'; }}>Versions</a>
		<a href="#lineage" role="link" aria-label="Lineage" class:active={activeTab === 'lineage'} onclick={(e) => { e.preventDefault(); activeTab = 'lineage'; }}>Lineage</a>
	</nav>

	<div class="tab-content">
		{#if activeTab === 'overview'}
			<div class="overview">
				{#if displayVersion}
					<div class="version-header">
						<div class="version-badge">v{displayVersion.versionIndex} &middot; {displayVersion.state}</div>
						<button class="delete-version-btn" onclick={() => showDeleteDialog = true}>Delete</button>
					</div>
					{#if displayVersion.description}
						<p>{displayVersion.description}</p>
					{/if}
					{#if displayVersion.aliases?.length}
						<div class="aliases">
							{#each displayVersion.aliases as alias}
								<span class="alias-badge">{alias.alias}</span>
							{/each}
						</div>
					{/if}
					<div class="stats">
						<span>Files: {displayVersion.fileCount ?? 0}</span>
						<span>Size: {displayVersion.size ?? 0} bytes</span>
						<span>Created: {displayVersion.createdAt}</span>
					</div>
				{/if}
			</div>

		{:else if activeTab === 'metadata'}
			<div class="metadata-view">
				{#if displayVersion?.metadata}
					{@const meta = parseMetadata(displayVersion.metadata)}
					{#each Object.entries(meta) as [key, val]}
						<div class="meta-row">
							<span class="meta-key">{key}</span>
							<span class="meta-val">{JSON.stringify(val)}</span>
						</div>
					{/each}
				{:else}
					<p class="empty">No metadata.</p>
				{/if}
			</div>

		{:else if activeTab === 'usage'}
			<div class="usage-view">
				<h3>Created by</h3>
				{#if displayVersion?.createdBy}
					<p>{displayVersion.createdBy.displayName || displayVersion.createdBy.name}</p>
				{:else}
					<p class="empty">Unknown</p>
				{/if}
				<h3>Used by</h3>
				{#if displayVersion?.usedBy?.edges?.length}
					{#each displayVersion.usedBy.edges as edge}
						<p>{edge.node.displayName || edge.node.name}</p>
					{/each}
				{:else}
					<p class="empty">No consuming runs.</p>
				{/if}
			</div>

		{:else if activeTab === 'files'}
			<div class="files-list">
				{#if displayVersion?.files?.edges?.length}
					{@const allFiles = displayVersion.files.edges.map((e: any) => e.node)}
					{@const grouped = groupFiles(allFiles)}
					{#each Object.entries(grouped.dirs) as [dirName, dirFiles]}
						<div class="dir-entry">
							<button class="dir-toggle" onclick={() => {
								const next = new Set(expandedDirs);
								if (next.has(dirName)) next.delete(dirName); else next.add(dirName);
								expandedDirs = next;
							}}>
								{expandedDirs.has(dirName) ? '▼' : '▶'} {dirName}
							</button>
							{#if expandedDirs.has(dirName)}
								<div class="dir-children">
									{#each dirFiles as file}
										<div class="file-entry">
											<a href={file.directUrl || file.url || '#'} role="link" aria-label={file.name} class="file-name" download={file.name}>{file.name}</a>
											{#if file.sizeBytes}
												<span class="file-size">{file.sizeBytes} bytes</span>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
					{#each grouped.rootFiles as file}
						<div class="file-entry">
							<a href={file.directUrl || file.url || '#'} role="link" aria-label={file.name} class="file-name" download={file.name}>{file.name}</a>
							{#if file.sizeBytes}
								<span class="file-size">{file.sizeBytes} bytes</span>
							{/if}
						</div>
					{/each}
				{:else}
					<p class="empty">No files in this version.</p>
				{/if}
			</div>

		{:else if activeTab === 'versions'}
			<div class="versions-list">
				{#each versions as version}
					<a href="#v{version.versionIndex}" role="link" aria-label="v{version.versionIndex}" class="version-row" class:active={displayVersion?.id === version.id} onclick={(e) => { e.preventDefault(); selectedVersion = version; }}>
						<span class="version-label">v{version.versionIndex}</span>
						<span class="version-state">{version.state}</span>
						<span class="version-date">{version.createdAt}</span>
						{#if (version.aliases || []).some((a: any) => a.alias !== `v${version.versionIndex}` && a.alias !== 'latest')}
							<span class="version-aliases">{(version.aliases || []).filter((a: any) => a.alias !== `v${version.versionIndex}` && a.alias !== 'latest').map((a: any) => a.alias).join(', ')}</span>
						{/if}
					</a>
				{/each}
			</div>

		{:else if activeTab === 'lineage'}
			{@const inputArtifacts = displayVersion?.createdBy?.inputArtifacts?.edges?.map((e: any) => e.node) ?? []}
			{@const consumers = displayVersion?.usedBy?.edges?.map((e: any) => e.node) ?? []}
			{@const createdByName = displayVersion?.createdBy?.displayName || displayVersion?.createdBy?.name}
			<div class="lineage-view" data-testid="lineage-graph">
				<svg width="800" height="200" class="dag-svg" role="img" aria-label="artifact graph">
					<!-- Input artifacts -->
					{#each inputArtifacts as inputArt, i}
						{@const yPos = 60 + i * 50}
						<rect x="10" y={yPos} width="130" height="36" rx="4" fill="#16213e" stroke="#81c784" />
						<text x="75" y={yPos + 22} text-anchor="middle" fill="#e0e0e0" font-size="12">{inputArt.artifactSequence?.name ?? `input-${i}`}</text>
						<line x1="140" y1={yPos + 18} x2="260" y2="100" stroke="#556677" stroke-width="2" marker-end="url(#arrow)" />
					{/each}
					<!-- Producer run -->
					{#if createdByName}
						<rect x="260" y="80" width="130" height="40" rx="4" fill="#16213e" stroke="#4fc3f7" />
						<text x="325" y="105" text-anchor="middle" fill="#e0e0e0" font-size="12">{createdByName}</text>
						<line x1="390" y1="100" x2="430" y2="100" stroke="#556677" stroke-width="2" marker-end="url(#arrow)" />
					{/if}
					<!-- This artifact -->
					<rect x="430" y="80" width="140" height="40" rx="4" fill="#16213e" stroke="#81c784" />
					<text x="500" y="105" text-anchor="middle" fill="#e0e0e0" font-size="12">{collection.name}</text>
					<!-- Consumer runs -->
					{#each consumers as consumer, i}
						{@const yPos = 60 + i * 50}
						<line x1="570" y1="100" x2="610" y2={yPos + 18} stroke="#556677" stroke-width="2" marker-end="url(#arrow)" />
						<rect x="610" y={yPos} width="130" height="36" rx="4" fill="#16213e" stroke="#4fc3f7" />
						<text x="675" y={yPos + 22} text-anchor="middle" fill="#e0e0e0" font-size="12">{consumer.displayName || consumer.name}</text>
					{/each}
					<defs>
						<marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
							<path d="M 0 0 L 10 5 L 0 10 z" fill="#556677" />
						</marker>
					</defs>
				</svg>
			</div>
		{/if}
	</div>

	{#if showDeleteDialog}
		<div class="delete-overlay" onclick={() => showDeleteDialog = false}>
			<div class="delete-dialog" role="dialog" onclick={(e) => e.stopPropagation()}>
				<h3>Delete version</h3>
				<p>This will permanently delete v{displayVersion?.versionIndex}. This action cannot be undone.</p>
				<div class="dialog-actions">
					<button onclick={() => showDeleteDialog = false}>Cancel</button>
					<button class="confirm-delete" onclick={() => displayVersion && deleteVersion(displayVersion.id)}>Delete</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.breadcrumb { font-size: 0.85rem; color: #8899aa; margin-bottom: 1rem; }
	.breadcrumb a { color: #4fc3f7; text-decoration: none; }
	h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
	.subtitle { color: #8899aa; font-size: 0.85rem; margin-bottom: 1rem; }
	.artifact-tabs { display: flex; gap: 0; border-bottom: 2px solid #1e2d4a; margin-bottom: 1rem; }
	.artifact-tabs a { color: #8899aa; padding: 0.5rem 1rem; text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 0.85rem; cursor: pointer; }
	.artifact-tabs a.active { color: #4fc3f7; border-bottom-color: #4fc3f7; }
	.tab-content { padding: 0.5rem 0; }
	.version-badge { display: inline-block; padding: 0.25rem 0.75rem; background: #1e2d4a; border-radius: 4px; font-size: 0.85rem; color: #81c784; margin-bottom: 0.5rem; }
	.stats { display: flex; gap: 1.5rem; color: #8899aa; font-size: 0.85rem; margin: 0.5rem 0; }
	.aliases { color: #8899aa; font-size: 0.85rem; margin-top: 0.5rem; }
	.meta-row { display: flex; gap: 1rem; padding: 0.3rem 0; border-bottom: 1px solid #1e2d4a; }
	.meta-key { color: #4fc3f7; font-size: 0.85rem; font-weight: 500; min-width: 150px; }
	.meta-val { color: #e0e0e0; font-size: 0.85rem; }
	.usage-view h3 { font-size: 0.95rem; margin: 0.75rem 0 0.25rem; }
	.versions-list { display: flex; flex-direction: column; gap: 0.25rem; }
	.version-row { display: flex; gap: 1rem; padding: 0.5rem; color: #e0e0e0; font-size: 0.85rem; border: 1px solid #1e2d4a; border-radius: 4px; text-decoration: none; cursor: pointer; }
	.version-row:hover, .version-row.active { background: rgba(79,195,247,0.05); border-color: #4fc3f7; }
	.version-label { color: #4fc3f7; font-weight: 500; }
	.version-state { color: #81c784; }
	.version-date { color: #8899aa; }
	.version-aliases { color: #ffb74d; }
	.lineage-view { padding: 1rem 0; }
	.lineage-dag { display: block; margin: 0 auto; }
	.lineage-node-label { display: inline-block; margin: 0.25rem 0.5rem; font-size: 0.8rem; color: #e0e0e0; }
	.files-list { padding: 0.5rem 0; }
	.file-entry { display: flex; gap: 1rem; padding: 0.4rem 0; border-bottom: 1px solid #1e2d4a; align-items: center; }
	.file-name { color: #4fc3f7; text-decoration: none; font-size: 0.85rem; }
	.file-name:hover { text-decoration: underline; }
	.file-size { color: #8899aa; font-size: 0.8rem; }
	.empty { color: #556677; }
	.version-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
	.delete-version-btn { padding: 0.25rem 0.6rem; background: #1e2d4a; border: 1px solid #ff6b6b; border-radius: 4px; color: #ff6b6b; cursor: pointer; font-size: 0.8rem; }
	.delete-version-btn:hover { background: rgba(255,107,107,0.1); }
	.aliases { display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 0.5rem 0; }
	.alias-badge { padding: 0.15rem 0.5rem; background: #1e3a5f; border-radius: 12px; font-size: 0.8rem; color: #ffb74d; }
	.dir-entry { margin-bottom: 0.25rem; }
	.dir-toggle { background: none; border: none; color: #4fc3f7; cursor: pointer; font-size: 0.85rem; padding: 0.3rem 0; }
	.dir-children { padding-left: 1.5rem; }
	.delete-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; }
	.delete-dialog { background: #16213e; border: 1px solid #1e2d4a; border-radius: 8px; padding: 1.5rem; width: 400px; max-width: 90vw; }
	.delete-dialog h3 { margin: 0 0 0.75rem; color: #e0e0e0; }
	.delete-dialog p { color: #8899aa; font-size: 0.9rem; margin-bottom: 1rem; }
	.dialog-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
	.dialog-actions button { padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; border: 1px solid #1e2d4a; background: #16213e; color: #8899aa; }
	.confirm-delete { background: #ff6b6b !important; color: white !important; border-color: #ff6b6b !important; }
</style>
