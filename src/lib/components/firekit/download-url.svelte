<script lang="ts">
	import { ref, type StorageReference } from 'firebase/storage';
	import { firebaseService } from '$lib/firebase.js';
	import { firekitDownloadUrl } from '$lib/services/storage.svelte.js';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	/**
	 * Props for DownloadURL component
	 */
	let {
		ref: path,
		children,
		loading
	}: {
		/**
		 * Storage reference path string (e.g. 'images/pic.png')
		 */
		ref: string;
		/**
		 * Content to render when URL is loaded
		 */
		children: Snippet<[string, StorageReference, any]>;
		/**
		 * Content to render while loading
		 */
		loading?: Snippet<[]>;
	} = $props();

	// Get Storage instance and create references
	let storage: any = $state(null);
	let storageRef: StorageReference | null = $state(null);
	let downloadUrlService: ReturnType<typeof firekitDownloadUrl> | null = $state(null);

	// Track URL state
	let urlState = $state({
		loading: true,
		url: null as string | null,
		error: null as Error | null
	});

	// Subscribe to URL changes
	$effect(() => {
		if (!browser) {
			urlState = {
				loading: false,
				url: null,
				error: new Error('Storage not available in SSR')
			};
			return;
		}

		// Initialize storage and service
		storage = firebaseService.getStorageInstance();
		if (!storage) {
			urlState = {
				loading: false,
				url: null,
				error: new Error('Storage instance not available')
			};
			return;
		}

		// Create storage reference
		storageRef = ref(storage, path);

		// Create download URL service
		downloadUrlService = firekitDownloadUrl(path);

		// The service state is reactive, so we can directly access it
		// The effect will re-run when the service state changes
		urlState = {
			loading: downloadUrlService.loading,
			url: downloadUrlService.url,
			error: downloadUrlService.error
		};
	});
</script>

{#if !browser}
	<div>Storage not available in SSR</div>
{:else if urlState.loading}
	{#if loading}
		{@render loading()}
	{:else}
		<div>Loading...</div>
	{/if}
{:else if urlState.error}
	<div class="error">Error: {urlState.error.message}</div>
{:else if urlState.url}
	{@render children(urlState.url, storageRef!, storage)}
{/if}
