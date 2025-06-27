<script lang="ts">
	import { firekitCollection } from '../services/collection.svelte.js';
	import { firebaseService } from '../firebase.js';
	import { collection } from 'firebase/firestore';
	import { browser } from '$app/environment';
	import type {
		CollectionReference,
		Query,
		DocumentData,
		Firestore,
		QueryConstraint
	} from 'firebase/firestore';
	import type { Snippet } from 'svelte';

	/**
	 * Props for Collection component
	 */
	let {
		ref,
		startWith,
		children,
		loading,
		queryConstraints = []
	}: {
		/**
		 * Firestore collection reference, query reference, or path string
		 */
		ref: CollectionReference | Query | string;
		/**
		 * Initial value to use before collection is fetched
		 */
		startWith?: DocumentData[];
		/**
		 * Content to render when collection is loaded
		 */
		children: Snippet<[DocumentData[], CollectionReference | Query, Firestore, number]>;
		/**
		 * Content to render while loading
		 */
		loading?: Snippet<[]>;
		/**
		 * Optional query constraints to apply to the collection
		 */
		queryConstraints?: QueryConstraint[];
	} = $props();

	// Get Firestore instance only in browser environment
	let firestore: Firestore | null = $state(null);
	let collectionRef: CollectionReference | Query | null = $state(null);
	let collectionService: ReturnType<typeof firekitCollection> | null = $state(null);

	// Track collection state
	let collectionState = $state({
		loading: true,
		data: startWith ?? ([] as DocumentData[]),
		error: null as Error | null,
		count: startWith?.length ?? 0
	});

	// Initialize Firestore and collection service
	$effect(() => {
		if (!browser) {
			collectionState = {
				loading: false,
				data: startWith ?? [],
				error: null,
				count: startWith?.length ?? 0
			};
			return;
		}

		// Initialize Firestore
		firestore = firebaseService.getDbInstance();
		if (!firestore) {
			collectionState = {
				loading: false,
				data: [],
				error: new Error('Firestore instance not available'),
				count: 0
			};
			return;
		}

		// Create collection reference if path string is provided
		collectionRef =
			typeof ref === 'string' ? collection(firestore, ref) : (ref as CollectionReference | Query);

		// Create collection service
		const path = typeof ref === 'string' ? ref : (ref as CollectionReference).path;
		collectionService = firekitCollection(path, queryConstraints);

		// Set up event listener for real-time updates
		const unsubscribe = collectionService.addEventListener((event) => {
			if (event.type === 'data_changed') {
				collectionState = {
					loading: false,
					data: event.data || [],
					error: null,
					count: event.data?.length || 0
				};
			} else if (event.type === 'error') {
				collectionState = {
					loading: false,
					data: [],
					error: event.error || null,
					count: 0
				};
			} else if (event.type === 'loading_started') {
				collectionState = {
					...collectionState,
					loading: true
				};
			} else if (event.type === 'loading_finished') {
				collectionState = {
					...collectionState,
					loading: false
				};
			}
		});

		// Set initial state from service
		collectionState = {
			loading: collectionService.loading,
			data: collectionService.data,
			error: collectionService.error,
			count: collectionService.size
		};

		return () => {
			unsubscribe();
			collectionService?.dispose();
		};
	});
</script>

{#if !browser}
	{@render children(startWith ?? [], null as any, null as any, startWith?.length ?? 0)}
{:else if collectionState.loading}
	{#if loading}
		{@render loading()}
	{:else}
		<div>Loading...</div>
	{/if}
{:else if collectionState.error}
	<div class="error">Error: {collectionState.error.message}</div>
{:else}
	{@render children(collectionState.data, collectionRef!, firestore!, collectionState.count)}
{/if}
