<script lang="ts">
	import { firekitDoc } from '../services/document.svelte.js';
	import { firebaseService } from '../firebase.js';
	import { doc } from 'firebase/firestore';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import type { DocumentReference, DocumentData, Firestore } from 'firebase/firestore';
	import type { Snippet } from 'svelte';
	import type { DocumentOptions } from '../types/document.js';

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
	let firestore: Firestore | null = $state(null);
	let docRef: DocumentReference | null = $state(null);
	let documentService: any = $state(null);

	// Reactive document state
	let componentState = $state({
		loading: true,
		data: null as DocumentData | null,
		error: null as Error | null,
		exists: false
	});

	// Initialize in browser environment
	$effect(() => {
		if (!browser) return;

		firestore = firebaseService.getDbInstance();
		if (!firestore) {
			throw new Error('Firestore instance not available');
		}

		// Create document reference if path string is provided
		docRef = typeof ref === 'string' ? doc(firestore, ref) : ref;

		// Create document service
		documentService = firekitDoc(docRef.path, startWith ?? undefined, options);
	});

	// Subscribe to document changes only if in browser and document service exists
	$effect(() => {
		if (!browser || !documentService) {
			componentState = {
				loading: false,
				data: startWith ?? null,
				error: null,
				exists: !!startWith
			};
			return;
		}

		// Update component state based on document service state
		componentState = {
			loading: documentService.loading,
			data: documentService.data,
			error: documentService.error,
			exists: documentService.exists
		};
	});

	// Cleanup on component destruction
	onDestroy(() => {
		if (documentService) {
			documentService.dispose();
		}
	});
</script>

{#if !browser}
	{@render children(startWith ?? null, null as any, null as any)}
{:else if componentState.loading}
	{#if loading}
		{@render loading()}
	{:else}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
				<p class="mt-2 text-gray-600">Loading document...</p>
			</div>
		</div>
	{/if}
{:else if componentState.error}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-center">
			<div class="text-red-500 text-lg font-semibold mb-2">Error Loading Document</div>
			<p class="text-gray-600 mb-4">{componentState.error.message}</p>
			{#if documentService?.canRefresh}
				<button
					class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					onclick={() => documentService?.refresh()}
				>
					Retry
				</button>
			{/if}
		</div>
	</div>
{:else}
	{@render children(componentState.data ?? null, docRef!, firestore!)}
{/if}
