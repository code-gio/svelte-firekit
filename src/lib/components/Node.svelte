<script lang="ts" generics="T = unknown">
	import type { Snippet } from 'svelte';
	import { FirekitNode } from '../services/realtime.svelte.js';

	/**
	 * Renders a Firebase Realtime Database node reactively.
	 *
	 * @example
	 * ```svelte
	 * <Node path="rooms/123">
	 *   {#snippet data(room)}
	 *     <p>{room.name}</p>
	 *   {/snippet}
	 *   {#snippet loading()}
	 *     <p>Loading…</p>
	 *   {/snippet}
	 * </Node>
	 * ```
	 */
	let {
		path,
		startWith,
		data: dataSnippet,
		loading: loadingSnippet,
		error: errorSnippet
	}: {
		/** RTDB path (e.g. "rooms/123"). */
		path: string;
		/** Optional initial value shown before the subscription fires. */
		startWith?: T;
		/** Rendered once data is available. */
		data?: Snippet<[T]>;
		/** Rendered while loading. */
		loading?: Snippet;
		/** Rendered on error. */
		error?: Snippet<[Error]>;
	} = $props();

	const node = new FirekitNode<T>(path, startWith);
</script>

{#if node.loading}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{/if}
{:else if node.error}
	{#if errorSnippet}
		{@render errorSnippet(node.error)}
	{/if}
{:else if node.data !== null}
	{#if dataSnippet}
		{@render dataSnippet(node.data)}
	{/if}
{/if}
