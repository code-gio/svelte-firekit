<script lang="ts">
	import { firekitCollection } from '$lib/services/collection.svelte.js';
	import { firebaseService } from '$lib/firebase.js';
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
	let firestore = $derived(browser ? firebaseService.getDbInstance() : null);

	// Create collection reference if path string is provided
	let collectionRef = $derived(
		firestore && typeof ref === 'string'
			? collection(firestore, ref)
			: (ref as CollectionReference | Query)
	);

	// Create collection service with derived path
	let collectionPath = $derived(typeof ref === 'string' ? ref : (ref as CollectionReference).path);
	let collectionService = $state<ReturnType<typeof firekitCollection> | null>(null);

	// Track collection state using derived computations
	let collectionState = $derived({
		loading: !browser
			? false
			: !firestore
				? false
				: !collectionService
					? true
					: collectionService.loading,
		data: !browser
			? (startWith ?? [])
			: !firestore
				? []
				: !collectionService
					? (startWith ?? [])
					: collectionService.data,
		error: !browser
			? null
			: !firestore
				? new Error('Firestore instance not available')
				: !collectionService
					? null
					: collectionService.error,
		count: !browser
			? (startWith?.length ?? 0)
			: !firestore
				? 0
				: !collectionService
					? (startWith?.length ?? 0)
					: collectionService.size
	});

	// Set up collection service
	$effect(() => {
		if (!browser || !collectionPath) {
			collectionService = null;
			return;
		}

		// Create new service when path or constraints change
		const newService = firekitCollection(collectionPath, queryConstraints);
		collectionService = newService;

		return () => {
			newService?.dispose();
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
