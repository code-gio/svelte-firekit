<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { UploadMetadata } from 'firebase/storage';
	import { FirekitUploadTask, type UploadState } from '../services/storage.svelte.js';
	import { validateFile } from '../utils/validation.js';
	import type { FileValidationOptions, FileValidationResult } from '../types/storage.js';

	/**
	 * Manages a Firebase Storage upload with reactive progress.
	 * Optionally validates the file before uploading.
	 *
	 * @example
	 * ```svelte
	 * <UploadTask
	 *   path="uploads/{file.name}"
	 *   {file}
	 *   validate={{ maxSize: 5 * 1024 * 1024, accept: ['image/*'] }}
	 * >
	 *   {#snippet uploading(task)}
	 *     <progress value={task.progress} max={100} />
	 *     <button onclick={task.pause}>Pause</button>
	 *   {/snippet}
	 *   {#snippet complete(url)}
	 *     <img src={url} alt="uploaded" />
	 *   {/snippet}
	 *   {#snippet invalid(result)}
	 *     {#each result.errors as err}
	 *       <p class="error">{err.message}</p>
	 *     {/each}
	 *   {/snippet}
	 * </UploadTask>
	 * ```
	 */
	let {
		path,
		file,
		metadata,
		validate,
		uploading: uploadingSnippet,
		complete: completeSnippet,
		error: errorSnippet,
		invalid: invalidSnippet
	}: {
		/** Storage destination path. */
		path: string;
		/** File or raw bytes to upload. */
		file: Blob | Uint8Array | ArrayBuffer;
		/** Optional upload metadata (content type, custom metadata, etc.). */
		metadata?: UploadMetadata;
		/** Optional validation rules. Only applied when `file` is a File instance. */
		validate?: FileValidationOptions;
		/**
		 * Rendered while the upload is active.
		 * Receives an object with `{ progress, state, bytesTransferred, totalBytes, pause, resume, cancel }`.
		 */
		uploading?: Snippet<[{
			progress: number;
			state: UploadState;
			bytesTransferred: number;
			totalBytes: number;
			pause: () => void;
			resume: () => void;
			cancel: () => void;
		}]>;
		/** Rendered after a successful upload. Receives the download URL. */
		complete?: Snippet<[string]>;
		/** Rendered on upload error. */
		error?: Snippet<[Error]>;
		/** Rendered when validation fails. Receives the validation result with errors. */
		invalid?: Snippet<[FileValidationResult]>;
	} = $props();

	let validationResult = $state<FileValidationResult | null>(null);
	let task = $state<FirekitUploadTask | null>(null);
	let started = false;

	// Run validation (if configured) then start upload.
	// Uses $effect so Svelte properly tracks the prop references.
	$effect(() => {
		if (started) return;
		started = true;

		if (validate && file instanceof File) {
			validateFile(file, validate).then((result) => {
				validationResult = result;
				if (result.valid) {
					task = new FirekitUploadTask(path, file as Blob, metadata);
				}
			});
		} else {
			task = new FirekitUploadTask(path, file, metadata);
		}
	});
</script>

{#if validationResult && !validationResult.valid}
	{#if invalidSnippet}
		{@render invalidSnippet(validationResult)}
	{:else if errorSnippet}
		{@render errorSnippet(new Error(validationResult.errors.map((e) => e.message).join('; ')))}
	{/if}
{:else if task}
	{#if task.error && errorSnippet}
		{@render errorSnippet(task.error)}
	{:else if task.completed && completeSnippet && task.downloadURL}
		{@render completeSnippet(task.downloadURL)}
	{:else if task.active && uploadingSnippet}
		{@render uploadingSnippet({
			progress: task.progress,
			state: task.state,
			bytesTransferred: task.bytesTransferred,
			totalBytes: task.totalBytes,
			pause: () => task!.pause(),
			resume: () => task!.resume(),
			cancel: () => task!.cancel()
		})}
	{/if}
{/if}
