<script lang="ts">
	import type { Snippet } from 'svelte';
	import { firekitNetwork } from '../services/network.svelte.js';

	/**
	 * Renders snippets based on network/sync status.
	 *
	 * @example
	 * ```svelte
	 * <NetworkStatus>
	 *   {#snippet online()}<span class="dot green" />{/snippet}
	 *   {#snippet offline()}<span class="dot red">Offline</span>{/snippet}
	 *   {#snippet pending()}<span>Saving...</span>{/snippet}
	 * </NetworkStatus>
	 * ```
	 */
	let {
		online: onlineSnippet,
		offline: offlineSnippet,
		pending: pendingSnippet
	}: {
		/** Rendered when online and all writes are synced. */
		online?: Snippet;
		/** Rendered when the browser is offline. */
		offline?: Snippet;
		/** Rendered when there are pending Firestore writes. */
		pending?: Snippet;
	} = $props();
</script>

{#if !firekitNetwork.online && offlineSnippet}
	{@render offlineSnippet()}
{:else if firekitNetwork.hasPendingWrites && pendingSnippet}
	{@render pendingSnippet()}
{:else if firekitNetwork.online && onlineSnippet}
	{@render onlineSnippet()}
{/if}
