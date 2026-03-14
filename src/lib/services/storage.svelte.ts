import {
	ref,
	getDownloadURL,
	listAll,
	uploadBytesResumable,
	deleteObject,
	getMetadata,
	updateMetadata,
	type StorageReference,
	type ListResult,
	type UploadTask,
	type UploadTaskSnapshot,
	type FullMetadata,
	type UploadMetadata,
	type SettableMetadata
} from 'firebase/storage';
import { firebaseService } from '../firebase.js';

function getStorage() {
	const storage = firebaseService.getStorageInstance();
	if (!storage) throw new Error('Firebase Storage is not initialized.');
	return storage;
}

// ── Download URL ──────────────────────────────────────────────────────────────

/**
 * Fetches and exposes a Firebase Storage download URL reactively.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitDownloadUrl } from 'svelte-firekit';
 *   const img = firekitDownloadUrl('images/avatar.jpg');
 * </script>
 * {#if img.url}<img src={img.url} alt="avatar" />{/if}
 * ```
 */
export class FirekitDownloadUrl {
	private _url = $state<string | null>(null);
	private _loading = $state(true);
	private _error = $state<Error | null>(null);
	private _storageRef: StorageReference | null = null;
	private _path: string;

	constructor(path: string) {
		this._path = path;
		this._init();
	}

	get url(): string | null { return this._url; }
	get loading(): boolean { return this._loading; }
	get error(): Error | null { return this._error; }

	private async _init(): Promise<void> {
		if (typeof window === 'undefined') {
			this._loading = false;
			return;
		}
		try {
			const storage = getStorage();
			this._storageRef = ref(storage, this._path);
			this._url = await getDownloadURL(this._storageRef);
			this._error = null;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
		} finally {
			this._loading = false;
		}
	}

	/** Re-fetches the download URL (useful after replacing a file). */
	async refresh(): Promise<void> {
		if (!this._storageRef) return;
		this._loading = true;
		this._error = null;
		try {
			this._url = await getDownloadURL(this._storageRef);
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
		} finally {
			this._loading = false;
		}
	}
}

// ── Storage list ──────────────────────────────────────────────────────────────

/**
 * Lists files and sub-folders at a Storage path reactively.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitStorageList } from 'svelte-firekit';
 *   const dir = firekitStorageList('uploads/2024');
 * </script>
 * {#each dir.items as item}<p>{item.name}</p>{/each}
 * ```
 */
export class FirekitStorageList {
	private _items = $state<StorageReference[]>([]);
	private _prefixes = $state<StorageReference[]>([]);
	private _loading = $state(true);
	private _error = $state<Error | null>(null);
	private _storageRef: StorageReference | null = null;
	private _path: string;

	constructor(path: string) {
		this._path = path;
		this._init();
	}

	get items(): StorageReference[] { return this._items; }
	get prefixes(): StorageReference[] { return this._prefixes; }
	get loading(): boolean { return this._loading; }
	get error(): Error | null { return this._error; }

	private async _init(): Promise<void> {
		if (typeof window === 'undefined') {
			this._loading = false;
			return;
		}
		try {
			const storage = getStorage();
			this._storageRef = ref(storage, this._path);
			const result: ListResult = await listAll(this._storageRef);
			this._items = result.items;
			this._prefixes = result.prefixes;
			this._error = null;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
		} finally {
			this._loading = false;
		}
	}

	/** Re-lists the directory (useful after uploads/deletes). */
	async refresh(): Promise<void> {
		if (!this._storageRef) return;
		this._loading = true;
		this._error = null;
		try {
			const result: ListResult = await listAll(this._storageRef);
			this._items = result.items;
			this._prefixes = result.prefixes;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
		} finally {
			this._loading = false;
		}
	}
}

// ── Upload task ───────────────────────────────────────────────────────────────

export type UploadState = 'idle' | 'running' | 'paused' | 'success' | 'canceled' | 'error';

/**
 * Manages a resumable Firebase Storage upload with reactive progress.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitUploadTask } from 'svelte-firekit';
 *   let file: File;
 *   $: task = file ? firekitUploadTask('uploads/' + file.name, file) : null;
 * </script>
 * {#if task}
 *   <progress value={task.progress} max={100} />
 *   {#if task.downloadURL}<img src={task.downloadURL} />{/if}
 * {/if}
 * ```
 */
export class FirekitUploadTask {
	private _progress = $state(0);
	private _downloadURL = $state<string | null>(null);
	private _error = $state<Error | null>(null);
	private _state = $state<UploadState>('idle');
	private _bytesTransferred = $state(0);
	private _totalBytes = $state(0);
	private _snapshot = $state<UploadTaskSnapshot | null>(null);

	readonly completed = $derived(this._state === 'success');
	readonly canceled = $derived(this._state === 'canceled');
	readonly failed = $derived(this._state === 'error');
	readonly active = $derived(this._state === 'running' || this._state === 'paused');

	private _task: UploadTask | null = null;
	private _storageRef: StorageReference | null = null;

	constructor(path: string, file: Blob | Uint8Array | ArrayBuffer, metadata?: UploadMetadata) {
		this._init(path, file, metadata);
	}

	get progress(): number { return this._progress; }
	get downloadURL(): string | null { return this._downloadURL; }
	get error(): Error | null { return this._error; }
	get state(): UploadState { return this._state; }
	get bytesTransferred(): number { return this._bytesTransferred; }
	get totalBytes(): number { return this._totalBytes; }
	get snapshot(): UploadTaskSnapshot | null { return this._snapshot; }

	private _init(path: string, file: Blob | Uint8Array | ArrayBuffer, metadata?: UploadMetadata): void {
		if (typeof window === 'undefined') return;

		try {
			const storage = getStorage();
			this._storageRef = ref(storage, path);
			this._task = uploadBytesResumable(this._storageRef, file, metadata);
			this._state = 'running';

			this._task.on(
				'state_changed',
				(snap: UploadTaskSnapshot) => {
					this._snapshot = snap;
					this._bytesTransferred = snap.bytesTransferred;
					this._totalBytes = snap.totalBytes;
					this._progress = snap.totalBytes > 0
						? (snap.bytesTransferred / snap.totalBytes) * 100
						: 0;
					this._state = snap.state as UploadState;
				},
				(err) => {
					this._error = err;
					this._state = 'error';
				},
				async () => {
					if (this._storageRef) {
						this._downloadURL = await getDownloadURL(this._storageRef);
					}
					this._state = 'success';
					this._progress = 100;
				}
			);
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			this._state = 'error';
		}
	}

	/** Pauses the upload. */
	pause(): void { this._task?.pause(); }

	/** Resumes a paused upload. */
	resume(): void { this._task?.resume(); }

	/** Cancels the upload. */
	cancel(): void { this._task?.cancel(); }
}

// ── One-shot helpers ──────────────────────────────────────────────────────────

/**
 * Deletes a file from Firebase Storage.
 */
export async function deleteFile(path: string): Promise<void> {
	const storage = getStorage();
	await deleteObject(ref(storage, path));
}

/**
 * Fetches metadata for a file in Firebase Storage.
 */
export async function getFileMetadata(path: string): Promise<FullMetadata> {
	const storage = getStorage();
	return getMetadata(ref(storage, path));
}

/**
 * Updates metadata for a file in Firebase Storage.
 * Only fields provided in `metadata` are changed; omitted fields are left as-is.
 *
 * @example
 * ```ts
 * await updateFileMetadata('images/avatar.jpg', {
 *   contentType: 'image/webp',
 *   customMetadata: { uploadedBy: 'uid123' }
 * });
 * ```
 */
export async function updateFileMetadata(
	path: string,
	metadata: SettableMetadata
): Promise<FullMetadata> {
	const storage = getStorage();
	return updateMetadata(ref(storage, path), metadata);
}

export type { SettableMetadata };

// ── Factory functions ─────────────────────────────────────────────────────────

/** Creates a reactive download URL fetcher. */
export function firekitDownloadUrl(path: string): FirekitDownloadUrl {
	return new FirekitDownloadUrl(path);
}

/** Creates a reactive Storage directory listing. */
export function firekitStorageList(path: string): FirekitStorageList {
	return new FirekitStorageList(path);
}

/** Creates a reactive resumable upload task. */
export function firekitUploadTask(
	path: string,
	file: Blob | Uint8Array | ArrayBuffer,
	metadata?: UploadMetadata
): FirekitUploadTask {
	return new FirekitUploadTask(path, file, metadata);
}
