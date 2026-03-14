<script lang="ts" generics="T extends Record<string, unknown> = Record<string, unknown>">
	import type { Snippet } from 'svelte';
	import type { QueryConstraint } from 'firebase/firestore';
	import { FirekitCollection } from '../services/collection.svelte.js';

	/**
	 * Renders a Firestore collection reactively.
	 *
	 * Provides three snippet slots: `data` (array of documents), `loading`, and `error`.
	 *
	 * @example
	 * ```svelte
	 * <Collection path="posts" {constraints}>
	 *   {#snippet data(posts)}
	 *     {#each posts as post}
	 *       <p>{post.title}</p>
	 *     {/each}
	 *   {/snippet}
	 *   {#snippet loading()}
	 *     <p>Loading…</p>
	 *   {/snippet}
	 * </Collection>
	 * ```
	 */
	let {
		path,
		constraints = [],
		realtime = true,
		data: dataSnippet,
		loading: loadingSnippet,
		error: errorSnippet
	}: {
		/** Firestore collection path (e.g. "posts"). */
		path: string;
		/** Optional Firestore query constraints. */
		constraints?: QueryConstraint[];
		/** Subscribe to real-time updates. Default: true */
		realtime?: boolean;
		/** Rendered with the array of documents once loaded. */
		data?: Snippet<[T[]]>;
		/** Rendered while loading. */
		loading?: Snippet;
		/** Rendered when an error occurs. */
		error?: Snippet<[import('../types/collection.js').CollectionError]>;
	} = $props();

	const col = new FirekitCollection<T>(path, constraints, { realtime });
</script>

{#if col.loading}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{/if}
{:else if col.error}
	{#if errorSnippet}
		{@render errorSnippet(col.error)}
	{/if}
{:else}
	{#if dataSnippet}
		{@render dataSnippet(col.data)}
	{/if}
{/if}
