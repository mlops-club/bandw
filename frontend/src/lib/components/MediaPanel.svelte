<script lang="ts">
	type MediaConfig = {
		images?: { items?: { caption: string; step: number }[] };
		images_with_masks?: { classes?: string[] };
		images_with_boxes?: { label?: string };
		overlay_table?: { label?: string };
		histogram?: { steps?: number };
		audio?: { items?: { caption: string; step: number }[] };
		video?: { steps?: number };
		point_cloud?: { steps?: number };
		html_content?: { steps?: number };
	};

	let { media, runNames = [] }: { media: MediaConfig; runNames?: string[] } = $props();

	let currentStep = $state(0);
	const maxStep = $derived(
		media.images?.items?.length ? media.images.items.length - 1 : 4
	);
</script>

<div class="media-panel">
	{#if media.images}
		<div class="media-section">
			<img alt="images" src="" width="64" height="64" style="background: #1e2d4a; display: block;" />
			<input type="range" role="slider" aria-label="Step" min="0" max={maxStep} bind:value={currentStep} />
			<div class="captions">
				{#each media.images.items ?? [] as item}
					{#if item.step === currentStep}
						<span class="caption">{item.caption}</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	{#if media.images_with_masks}
		<div class="media-section">
			<h3>masks</h3>
			<div class="class-labels">
				<span class="class-label">{(media.images_with_masks.classes ?? []).join(', ')}</span>
			</div>
		</div>
	{/if}

	{#if media.images_with_boxes}
		<div class="media-section">
			<h3>boxes</h3>
			<span>overlay annotations</span>
		</div>
	{/if}

	{#if media.overlay_table}
		<div class="media-section">
			<h3>overlay_table</h3>
			<span>Table with image overlays</span>
		</div>
	{/if}

	{#if media.histogram}
		<div class="media-section">
			<h3>histogram</h3>
			<span>Histogram data ({media.histogram.steps} steps)</span>
		</div>
	{/if}

	{#if media.audio}
		<div class="media-section">
			<h3>audio</h3>
			<div class="audio-captions">
				{#each media.audio.items ?? [] as item}
					<span class="audio-caption">{item.caption}</span>
				{/each}
			</div>
		</div>
	{/if}

	{#if media.video}
		<div class="media-section">
			<h3>video</h3>
			<span>Video ({media.video.steps} steps)</span>
		</div>
	{/if}

	{#if media.point_cloud}
		<div class="media-section">
			<h3>point_cloud</h3>
			<span>3D point cloud</span>
		</div>
	{/if}

	{#if media.html_content}
		<div class="media-section">
			<h3>html_content</h3>
			<span>HTML content</span>
		</div>
	{/if}

	{#if runNames.length > 1}
		<div class="compare-section">
			<h3>Compare</h3>
			{#each runNames as name}
				<span class="run-name">{name}</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.media-panel {
		background: #16213e;
		border: 1px solid #1e2d4a;
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.media-section {
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #1e2d4a;
	}

	.media-section:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}

	h3 {
		font-size: 0.9rem;
		color: #e0e0e0;
		margin: 0 0 0.5rem;
	}

	.class-labels, .audio-captions, .captions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.class-label, .audio-caption, .caption {
		padding: 0.2rem 0.5rem;
		background: #1e2d4a;
		border-radius: 3px;
		font-size: 0.8rem;
		color: #8899aa;
	}

	.run-name {
		display: inline-block;
		padding: 0.2rem 0.5rem;
		background: #1e3a5f;
		border-radius: 3px;
		font-size: 0.85rem;
		color: #4fc3f7;
		margin-right: 0.5rem;
	}

	.compare-section {
		margin-top: 1rem;
	}

	input[type="range"] {
		width: 100%;
		margin: 0.5rem 0;
	}

	span {
		color: #8899aa;
		font-size: 0.85rem;
	}
</style>
