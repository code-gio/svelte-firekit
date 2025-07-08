<script lang="ts">
	import { ref, type DatabaseReference, type Database } from 'firebase/database';
	import { firebaseService } from '$lib/firebase.js';
	import { firekitRealtimeList } from '$lib/services/realtime.svelte.js';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	/**
	 * Props for NodeList component
	 */
	let {
		path,
		startWith,
		children,
		loading,
		queryConstraints
	}: {
		/**
		 * Database reference path string (e.g. 'users')
		 */
		path: string;
		/**
		 * Initial value to use before list is fetched
		 */
		startWith?: any[];
		/**
		 * Content to render when list is loaded
		 */
		children: Snippet<[any[], DatabaseReference, Database]>;
		/**
		 * Content to render while loading
		 */
		loading?: Snippet<[]>;
		/**
		 * Query constraints for the list
		 */
		queryConstraints?: any[];
	} = $props();

	// Get Database instance and create references
	let database: Database | null = $state(null);
	let listRef: DatabaseReference | null = $state(null);
	let listService: ReturnType<typeof firekitRealtimeList> | null = $state(null);

	// Track list state
	let listState = $state({
		loading: true,
		data: startWith ?? [],
		error: null as Error | null
	});

	// Subscribe to list changes
	$effect(() => {
		if (!browser) {
			listState = {
				loading: false,
				data: startWith ?? [],
				error: new Error('Realtime Database not available in SSR')
			};
			return;
		}

		// Initialize database and service
		database = firebaseService.getDatabaseInstance();
		if (!database) {
			listState = {
				loading: false,
				data: [],
				error: new Error('Realtime Database instance not available')
			};
			return;
		}

		// Create database reference
		listRef = ref(database, path);

		// Create list service
		listService = firekitRealtimeList(path, startWith);

		// The service state is reactive, so we can directly access it
		// The effect will re-run when the service state changes
		listState = {
			loading: listService.loading,
			data: listService.list, // Use the processed list with IDs
			error: listService.error
		};
	});
</script>

{#if !browser}
	{@render children(startWith ?? [], null as any, null as any)}
{:else if listState.loading}
	{#if loading}
		{@render loading()}
	{:else}
		<div>Loading...</div>
	{/if}
{:else if listState.error}
	<div class="error">Error: {listState.error.message}</div>
{:else}
	{@render children(listState.data, listRef!, database!)}
{/if}
