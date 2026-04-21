<script lang="ts">
	import { page } from '$app/state';
	import { queryStore, getContextClient, gql } from '@urql/svelte';

	const client = getContextClient();
	const entity = $derived(page.params.entity ?? '');
	const project = $derived(page.params.project ?? '');

	// Query artifact types for this project
	const ARTIFACT_TYPES_QUERY = gql`
		query ArtifactTypes($projectName: String!, $entityName: String!) {
			project(name: $projectName, entityName: $entityName) {
				artifactTypes(first: 50) {
					edges {
						node {
							id
							name
							artifactCollections(first: 50) {
								edges {
									node {
										id
										name
										artifacts(first: 20) {
											edges {
												node {
													id
													versionIndex
													state
													createdAt
													metadata
												}
											}
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

	const typesResult = $derived(
		queryStore({
			client,
			query: ARTIFACT_TYPES_QUERY,
			variables: { projectName: project, entityName: entity }
		})
	);

	const artifactTypes = $derived(
		$typesResult.data?.project?.artifactTypes?.edges?.map((e: any) => e.node) ?? []
	);

	let selectedType = $state('');
	let selectedCollection = $state('');
	let selectedArtifact: any = $state(null);
	let activeTab = $state('files');
</script>

<h1>Artifacts</h1>

<div class="artifacts-layout">
	<aside class="artifact-sidebar">
		<h2>Artifact Types</h2>
		{#each artifactTypes as artType}
			<div class="tree-item" role="treeitem" aria-label={artType.name}>
				<button class="tree-btn" class:active={selectedType === artType.name} onclick={() => { selectedType = artType.name; selectedCollection = ''; selectedArtifact = null; }}>
					{artType.name}
				</button>
				{#if selectedType === artType.name}
					<div class="tree-children">
						{#each artType.artifactCollections?.edges?.map((e: any) => e.node) ?? [] as coll}
							<button class="tree-child" role="link" aria-label={coll.name} onclick={() => { selectedCollection = coll.name; selectedArtifact = coll; }}>
								{coll.name}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</aside>

	<main class="artifact-content">
		{#if selectedArtifact}
			<h2>{selectedArtifact.name}</h2>
			<p class="artifact-type">Type: {selectedType}</p>

			<nav class="artifact-tabs">
				<button role="link" aria-label="Files" class:active={activeTab === 'files'} onclick={() => activeTab = 'files'}>Files</button>
				<button role="link" aria-label="Metadata" class:active={activeTab === 'metadata'} onclick={() => activeTab = 'metadata'}>Metadata</button>
				<button role="link" aria-label="Usage" class:active={activeTab === 'usage'} onclick={() => activeTab = 'usage'}>Usage</button>
				<button role="link" aria-label="Versions" class:active={activeTab === 'versions'} onclick={() => activeTab = 'versions'}>Versions</button>
				<button role="link" aria-label="Lineage" class:active={activeTab === 'lineage'} onclick={() => activeTab = 'lineage'}>Lineage</button>
			</nav>

			<div class="tab-content">
				{#if activeTab === 'files'}
					<div class="files-list">
						<p>Files in {selectedArtifact.name}</p>
						{#each selectedArtifact.artifacts?.edges?.map((e: any) => e.node) ?? [] as version}
							<div class="file-entry">
								<span>v{version.versionIndex}</span>
								<span>{version.state}</span>
								<button class="download-btn">Download</button>
							</div>
						{/each}
					</div>
				{:else if activeTab === 'metadata'}
					<div class="metadata-view">
						{#each selectedArtifact.artifacts?.edges?.map((e: any) => e.node) ?? [] as version}
							{#if version.metadata}
								{@const meta = typeof version.metadata === 'string' ? JSON.parse(version.metadata) : version.metadata}
								{#each Object.entries(meta) as [key, val]}
									<div class="meta-row">
										<span class="meta-key">{key}</span>
										<span class="meta-val">{JSON.stringify(val)}</span>
									</div>
								{/each}
							{/if}
						{/each}
					</div>
				{:else if activeTab === 'usage'}
					<div class="usage-view">
						<h3>Producing runs</h3>
						<p>Runs that created this artifact</p>
						<h3>Consuming runs</h3>
						<p>Runs that used this artifact</p>
					</div>
				{:else if activeTab === 'versions'}
					<div class="versions-list">
						{#each selectedArtifact.artifacts?.edges?.map((e: any) => e.node) ?? [] as version}
							<div class="version-row">
								<span>v{version.versionIndex}</span>
								<span>{version.state}</span>
								<span>{version.createdAt}</span>
							</div>
						{/each}
					</div>
				{:else if activeTab === 'lineage'}
					<div class="lineage-view">
						<svg width="400" height="200" class="lineage-dag">
							<rect x="10" y="80" width="100" height="40" rx="4" fill="#16213e" stroke="#4fc3f7" />
							<text x="60" y="105" text-anchor="middle" fill="#e0e0e0" font-size="12">Producer</text>
							<rect x="150" y="80" width="100" height="40" rx="4" fill="#16213e" stroke="#81c784" />
							<text x="200" y="105" text-anchor="middle" fill="#e0e0e0" font-size="12">{selectedArtifact.name}</text>
							<rect x="290" y="80" width="100" height="40" rx="4" fill="#16213e" stroke="#4fc3f7" />
							<text x="340" y="105" text-anchor="middle" fill="#e0e0e0" font-size="12">Consumer</text>
							<line x1="110" y1="100" x2="150" y2="100" stroke="#556677" stroke-width="2" />
							<line x1="250" y1="100" x2="290" y2="100" stroke="#556677" stroke-width="2" />
						</svg>
					</div>
				{/if}
			</div>
		{:else if selectedType}
			<h2>{selectedType}</h2>
			<p>Select an artifact collection from the sidebar.</p>
		{:else}
			<p class="empty-state">Select an artifact type from the sidebar to browse artifacts.</p>
		{/if}
	</main>
</div>

<style>
	h1 { font-size: 1.5rem; margin-bottom: 1rem; }
	.artifacts-layout { display: flex; gap: 1rem; }
	.artifact-sidebar { width: 250px; flex-shrink: 0; background: #16213e; border: 1px solid #1e2d4a; border-radius: 6px; padding: 0.75rem; }
	.artifact-sidebar h2 { font-size: 0.85rem; color: #8899aa; text-transform: uppercase; margin: 0 0 0.5rem; }
	.tree-item { margin-bottom: 0.25rem; }
	.tree-btn { display: block; width: 100%; text-align: left; padding: 0.4rem 0.6rem; background: none; border: none; color: #8899aa; cursor: pointer; border-radius: 3px; font-size: 0.85rem; }
	.tree-btn:hover, .tree-btn.active { color: #4fc3f7; background: rgba(79,195,247,0.05); }
	.tree-children { padding-left: 1rem; }
	.tree-child { display: block; padding: 0.3rem 0.5rem; color: #8899aa; text-decoration: none; font-size: 0.8rem; border-radius: 3px; cursor: pointer; }
	.tree-child:hover { color: #e0e0e0; background: rgba(255,255,255,0.03); }
	.artifact-content { flex: 1; }
	.artifact-content h2 { font-size: 1.2rem; margin: 0 0 0.25rem; }
	.artifact-type { color: #8899aa; font-size: 0.85rem; margin-bottom: 1rem; }
	.artifact-tabs { display: flex; gap: 0; border-bottom: 2px solid #1e2d4a; margin-bottom: 1rem; }
	.artifact-tabs a { color: #8899aa; padding: 0.5rem 1rem; text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 0.85rem; }
	.artifact-tabs a.active { color: #4fc3f7; border-bottom-color: #4fc3f7; }
	.files-list, .versions-list, .metadata-view, .usage-view { padding: 0.5rem 0; }
	.file-entry, .version-row { display: flex; gap: 1rem; padding: 0.4rem 0; color: #e0e0e0; font-size: 0.85rem; border-bottom: 1px solid #1e2d4a; }
	.meta-row { display: flex; gap: 1rem; padding: 0.3rem 0; }
	.meta-key { color: #4fc3f7; font-size: 0.85rem; font-weight: 500; }
	.meta-val { color: #e0e0e0; font-size: 0.85rem; }
	.download-btn { padding: 0.2rem 0.5rem; background: #16213e; border: 1px solid #1e2d4a; border-radius: 3px; color: #8899aa; cursor: pointer; font-size: 0.75rem; }
	.empty-state { color: #556677; padding: 2rem; text-align: center; }
	.lineage-dag { display: block; margin: 1rem auto; }
</style>
