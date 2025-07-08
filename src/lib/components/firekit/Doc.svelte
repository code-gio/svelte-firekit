<script lang="ts">
	import { firekitDoc } from '$lib/services/document.svelte.js';
	import { firebaseService } from '$lib/firebase.js';
	import { doc } from 'firebase/firestore';
	import { browser } from '$app/environment';
	import type { DocumentReference, DocumentData, Firestore } from 'firebase/firestore';
	import type { Snippet } from 'svelte';
	import type { DocumentOptions } from '$lib/types/document.js';

	/**
	 * Props for Doc component
	 */
	let {
		ref,
		startWith,
		children,
		loading,
		options = {}
	}: {
		/**
		 * Firestore document reference or path string
		 */
		ref: DocumentReference | string;
		/**
		 * Initial value to use before document is fetched
		 */
		startWith?: DocumentData | null;
		/**
		 * Content to render when document is loaded
		 */
		children: Snippet<[DocumentData | null, DocumentReference, Firestore]>;
		/**
		 * Content to render while loading
		 */
		loading?: Snippet<[]>;
		/**
		 * Document options for configuration
		 */
		options?: DocumentOptions;
	} = $props();

	// Get Firestore instance only in browser environment
	let firestore = $derived(browser ? firebaseService.getDbInstance() : null);

	// Create document reference if path string is provided
	let docRef = $derived(
		firestore && typeof ref === 'string' ? doc(firestore, ref) : (ref as DocumentReference)
	);

	// Create document service with derived path
	let documentPath = $derived(typeof ref === 'string' ? ref : (ref as DocumentReference).path);
	let documentService = $state<ReturnType<typeof firekitDoc> | null>(null);

	// Track document state using derived computations
	let documentState = $derived({
		loading: !browser
			? false
			: !firestore
				? false
				: !documentService
					? true
					: documentService.loading,
		data: !browser
			? (startWith ?? null)
			: !firestore
				? null
				: !documentService
					? (startWith ?? null)
					: documentService.data,
		error: !browser
			? null
			: !firestore
				? new Error('Firestore instance not available')
				: !documentService
					? null
					: documentService.error,
		canRefresh: !browser
			? false
			: !firestore
				? false
				: !documentService
					? false
					: documentService.canRefresh
	});

	// Set up document service and event listener
	$effect(() => {
		if (!browser || !documentPath) {
			documentService = null;
			return;
		}

		// Create new service when path or options change
		const newService = firekitDoc(documentPath, startWith ?? undefined, options);
		documentService = newService;

		return () => {
			newService?.dispose();
		};
	});
</script>

{#if !browser}
	{@render children(startWith ?? null, null as any, null as any)}
{:else if !firestore}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div class="mb-2 text-lg font-semibold text-red-500">Firestore Not Available</div>
			<p class="text-gray-600">Firestore instance is not available.</p>
		</div>
	</div>
{:else if documentState.loading}
	{#if loading}
		{@render loading()}
	{:else}
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center">
				<div class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
				<p class="mt-2 text-gray-600">Loading document...</p>
			</div>
		</div>
	{/if}
{:else if documentState.error}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div class="mb-2 text-lg font-semibold text-red-500">Error Loading Document</div>
			<p class="mb-4 text-gray-600">{documentState.error.message}</p>
			{#if documentState.canRefresh}
				<button
					class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					onclick={() => documentService?.refresh()}
				>
					Retry
				</button>
			{/if}
		</div>
	</div>
{:else}
	{@render children(documentState.data, docRef!, firestore!)}
{/if}
