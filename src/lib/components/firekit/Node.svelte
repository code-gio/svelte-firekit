<script lang="ts">
	import { ref, type DatabaseReference, type Database } from 'firebase/database';
	import { firebaseService } from '$lib/firebase.js';
	import { firekitRealtimeDB } from '$lib/services/realtime.svelte.js';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	/**
	 * Props for Node component
	 */
	let {
		path,
		startWith,
		children,
		loading
	}: {
		/**
		 * Database reference path string (e.g. 'users/123')
		 */
		path: string;
		/**
		 * Initial value to use before node is fetched
		 */
		startWith?: any;
		/**
		 * Content to render when node is loaded
		 */
		children: Snippet<[any, DatabaseReference, Database]>;
		/**
		 * Content to render while loading
		 */
		loading?: Snippet<[]>;
	} = $props();

	// Get Database instance and create references
	let database: Database | null = $state(null);
	let nodeRef: DatabaseReference | null = $state(null);
	let nodeService: ReturnType<typeof firekitRealtimeDB> | null = $state(null);

	// Track node state
	let nodeState = $state({
		loading: true,
		data: startWith ?? null,
		error: null as Error | null
	});

	// Subscribe to node changes
	$effect(() => {
		if (!browser) {
			nodeState = {
				loading: false,
				data: startWith ?? null,
				error: new Error('Realtime Database not available in SSR')
			};
			return;
		}

		// Initialize database and service
		database = firebaseService.getDatabaseInstance();
		if (!database) {
			nodeState = {
				loading: false,
				data: null,
				error: new Error('Realtime Database instance not available')
			};
			return;
		}

		// Create database reference
		nodeRef = ref(database, path);

		// Create node service
		nodeService = firekitRealtimeDB(path, startWith);

		// The service state is reactive, so we can directly access it
		// The effect will re-run when the service state changes
		nodeState = {
			loading: nodeService.loading,
			data: nodeService.data,
			error: nodeService.error
		};
	});
</script>

{#if !browser}
	{@render children(startWith ?? null, null as any, null as any)}
{:else if nodeState.loading}
	{#if loading}
		{@render loading()}
	{:else}
		<div>Loading...</div>
	{/if}
{:else if nodeState.error}
	<div class="error">Error: {nodeState.error.message}</div>
{:else}
	{@render children(nodeState.data, nodeRef!, database!)}
{/if}
