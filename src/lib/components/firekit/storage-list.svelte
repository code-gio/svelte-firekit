<script lang="ts">
	import { ref, type StorageReference } from 'firebase/storage';
	import { firebaseService } from '$lib/firebase.js';
	import { firekitStorageList } from '$lib/services/storage.svelte.js';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	/**
	 * Props for StorageList component
	 */
	let {
		ref: path,
		children,
		loading
	}: {
		/**
		 * Storage reference path string (e.g. 'images/uid')
		 */
		ref: string;
		/**
		 * Content to render when list is loaded
		 */
		children: Snippet<
			[{ items: StorageReference[]; prefixes: StorageReference[] }, StorageReference, any]
		>;
		/**
		 * Content to render while loading
		 */
		loading?: Snippet<[]>;
	} = $props();

	// Get Storage instance and create references
	let storage: any = $state(null);
	let storageRef: StorageReference | null = $state(null);
	let storageListService: ReturnType<typeof firekitStorageList> | null = $state(null);

	// Track list state
	let listState = $state({
		loading: true,
		list: null as { items: StorageReference[]; prefixes: StorageReference[] } | null,
		error: null as Error | null
	});

	// Subscribe to list changes
	$effect(() => {
		if (!browser) {
			listState = {
				loading: false,
				list: null,
				error: new Error('Storage not available in SSR')
			};
			return;
		}

		// Initialize storage and service
		storage = firebaseService.getStorageInstance();
		if (!storage) {
			listState = {
				loading: false,
				list: null,
				error: new Error('Storage instance not available')
			};
			return;
		}

		// Create storage reference
		storageRef = ref(storage, path);

		// Create storage list service
		storageListService = firekitStorageList(path);

		// The service state is reactive, so we can directly access it
		// The effect will re-run when the service state changes
		listState = {
			loading: storageListService.loading,
			list: {
				items: storageListService.items,
				prefixes: storageListService.prefixes
			},
			error: storageListService.error
		};
	});
</script>

{#if !browser}
	<div>Storage not available in SSR</div>
{:else if listState.loading}
	{#if loading}
		{@render loading()}
	{:else}
		<div>Loading...</div>
	{/if}
{:else if listState.error}
	<div class="error">Error: {listState.error.message}</div>
{:else if listState.list}
	{@render children(listState.list, storageRef!, storage)}
{/if}
