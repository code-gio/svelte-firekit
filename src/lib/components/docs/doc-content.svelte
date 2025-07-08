<script lang="ts">
	import { onMount } from 'svelte';
	import { TableOfContents } from './toc.svelte.js';

	let contentRef: HTMLElement | undefined = $state();
	let { data }: { data: any } = $props();

	let toc = $state(TableOfContents.getInstance());

	onMount(() => {
		if (contentRef) {
			toc.updateContentRef(contentRef);
		}
	});
</script>

<div class="prose prose-slate dark:prose-invert max-w-none" bind:this={contentRef}>
	<data.doc />
</div>
