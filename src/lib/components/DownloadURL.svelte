<script lang="ts">
	import type { Snippet } from 'svelte';
	import { FirekitDownloadUrl } from '../services/storage.svelte.js';

	/**
	 * Fetches and renders a Firebase Storage download URL.
	 *
	 * @example
	 * ```svelte
	 * <DownloadURL path="images/avatar.jpg">
	 *   {#snippet data(url)}
	 *     <img src={url} alt="avatar" />
	 *   {/snippet}
	 * </DownloadURL>
	 * ```
	 */
	let {
		path,
		data: dataSnippet,
		loading: loadingSnippet,
		error: errorSnippet
	}: {
		/** Firebase Storage path (e.g. "images/avatar.jpg"). */
		path: string;
		/** Rendered with the resolved download URL. */
		data?: Snippet<[string]>;
		/** Rendered while fetching. */
		loading?: Snippet;
		/** Rendered on error. */
		error?: Snippet<[Error]>;
	} = $props();

	const dl = new FirekitDownloadUrl(path);
</script>

{#if dl.loading}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{/if}
{:else if dl.error}
	{#if errorSnippet}
		{@render errorSnippet(dl.error)}
	{/if}
{:else if dl.url}
	{#if dataSnippet}
		{@render dataSnippet(dl.url)}
	{/if}
{/if}
