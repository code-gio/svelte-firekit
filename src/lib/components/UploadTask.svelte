<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { UploadMetadata } from 'firebase/storage';
	import { FirekitUploadTask, type UploadState } from '../services/storage.svelte.js';

	/**
	 * Manages a Firebase Storage upload with reactive progress.
	 *
	 * Exposes upload controls (pause, resume, cancel) and progress state
	 * to the `uploading` snippet.
	 *
	 * @example
	 * ```svelte
	 * <UploadTask path="uploads/{file.name}" {file}>
	 *   {#snippet uploading(task)}
	 *     <progress value={task.progress} max={100} />
	 *     <button onclick={task.pause}>Pause</button>
	 *   {/snippet}
	 *   {#snippet complete(url)}
	 *     <img src={url} alt="uploaded" />
	 *   {/snippet}
	 * </UploadTask>
	 * ```
	 */
	let {
		path,
		file,
		metadata,
		uploading: uploadingSnippet,
		complete: completeSnippet,
		error: errorSnippet
	}: {
		/** Storage destination path. */
		path: string;
		/** File or raw bytes to upload. */
		file: Blob | Uint8Array | ArrayBuffer;
		/** Optional upload metadata (content type, custom metadata, etc.). */
		metadata?: UploadMetadata;
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
		/** Rendered on error. */
		error?: Snippet<[Error]>;
	} = $props();

	const task = new FirekitUploadTask(path, file, metadata);
</script>

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
		pause: () => task.pause(),
		resume: () => task.resume(),
		cancel: () => task.cancel()
	})}
{/if}
