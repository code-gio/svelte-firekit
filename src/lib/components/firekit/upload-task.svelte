<script lang="ts">
	import { type UploadTaskSnapshot } from 'firebase/storage';
	import { firebaseService } from '$lib/firebase.js';
	import { firekitUploadTask } from '$lib/services/storage.svelte.js';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';
	import type { UploadMetadata } from 'firebase/storage';

	/**
	 * Props for UploadTask component
	 */
	let {
		ref: path,
		data,
		metadata,
		children
	}: {
		/**
		 * Storage reference path string (e.g. 'myFile.txt')
		 */
		ref: string;
		/**
		 * File data to upload (Blob, Uint8Array, or ArrayBuffer)
		 */
		data: Blob | Uint8Array | ArrayBuffer;
		/**
		 * Optional file metadata
		 */
		metadata?: UploadMetadata;
		/**
		 * Content to render during upload
		 */
		children: Snippet<[UploadTaskSnapshot | null, any, number, any]>;
	} = $props();

	// Get Storage instance and create references
	let storage: any = $state(null);
	let uploadTaskService: ReturnType<typeof firekitUploadTask> | null = $state(null);

	// Track upload state
	let uploadState = $state({
		loading: true,
		snapshot: null as UploadTaskSnapshot | null,
		progress: 0,
		error: null as Error | null,
		task: null as any
	});

	// Subscribe to upload changes
	$effect(() => {
		if (!browser) {
			uploadState = {
				loading: false,
				snapshot: null,
				progress: 0,
				error: new Error('Storage not available in SSR'),
				task: null
			};
			return;
		}

		// Initialize storage and service
		storage = firebaseService.getStorageInstance();
		if (!storage) {
			uploadState = {
				loading: false,
				snapshot: null,
				progress: 0,
				error: new Error('Storage instance not available'),
				task: null
			};
			return;
		}

		// Convert data to File if it's not already a File
		let file: File;
		if (data instanceof File) {
			file = data;
		} else if (data instanceof Blob) {
			file = new File([data], path.split('/').pop() || 'file', { type: metadata?.contentType });
		} else {
			// For Uint8Array or ArrayBuffer, create a Blob first
			const blob = new Blob([data], { type: metadata?.contentType });
			file = new File([blob], path.split('/').pop() || 'file');
		}

		// Create upload task service
		uploadTaskService = firekitUploadTask(path, file);

		// The service state is reactive, so we can directly access it
		// The effect will re-run when the service state changes
		uploadState = {
			loading: !uploadTaskService.completed,
			snapshot: uploadTaskService.snapshot,
			progress: uploadTaskService.progress,
			error: uploadTaskService.error,
			task: uploadTaskService
		};
	});
</script>

{#if !browser}
	<div>Storage not available in SSR</div>
{:else if uploadState.error}
	<div class="error">Error: {uploadState.error.message}</div>
{:else}
	{@render children(uploadState.snapshot, uploadState.task, uploadState.progress, storage)}
{/if}
