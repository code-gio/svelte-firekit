<script lang="ts" generics="T extends Record<string, unknown> = Record<string, unknown>">
	import type { Snippet } from 'svelte';
	import { FirekitDoc } from '../services/document.svelte.js';

	/**
	 * Renders a Firestore document reactively.
	 *
	 * Provides three snippet slots: `data` (document exists), `loading`, and `error`.
	 *
	 * @example
	 * ```svelte
	 * <Doc path="users/uid123" let:data={user}>
	 *   {#snippet data(user)}
	 *     <p>{user.name}</p>
	 *   {/snippet}
	 *   {#snippet loading()}
	 *     <p>Loading…</p>
	 *   {/snippet}
	 * </Doc>
	 * ```
	 */
	let {
		path,
		realtime = true,
		data: dataSnippet,
		loading: loadingSnippet,
		error: errorSnippet
	}: {
		/** Firestore document path (e.g. "users/uid123"). */
		path: string;
		/** Subscribe to real-time updates. Default: true */
		realtime?: boolean;
		/** Rendered when the document exists and is loaded. */
		data?: Snippet<[T]>;
		/** Rendered while loading. */
		loading?: Snippet;
		/** Rendered when an error occurs. */
		error?: Snippet<[import('../types/document.js').DocumentError]>;
	} = $props();

	const doc = new FirekitDoc<T>(path, { realtime });
</script>

{#if doc.loading}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{/if}
{:else if doc.error}
	{#if errorSnippet}
		{@render errorSnippet(doc.error)}
	{/if}
{:else if doc.exists && doc.data}
	{#if dataSnippet}
		{@render dataSnippet(doc.data)}
	{/if}
{/if}
