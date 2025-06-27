/**
 * @fileoverview FirekitStorage - Optimized Firebase Storage management for Svelte applications
 * @module FirekitStorage
 * @version 1.0.0
 */

import {
	ref,
	getDownloadURL,
	listAll,
	uploadBytesResumable,
	type StorageReference,
	type ListResult,
	type UploadTask,
	type UploadTaskSnapshot
} from 'firebase/storage';
import { browser } from '$app/environment';
import { firebaseService } from '../firebase.js';

/**
 * Manages Firebase Storage download URL fetching with reactive state
 * @class
 *
 * @example
 * ```typescript
 * // Get download URL for image
 * const imageUrl = firekitDownloadUrl('images/photo.jpg');
 *
 * // Access reactive state
 * if (imageUrl.loading) {
 *   console.log('Loading URL...');
 * } else if (imageUrl.url) {
 *   console.log('Download URL:', imageUrl.url);
 * }
 * ```
 */
class FirekitDownloadUrl {
	/** Current download URL */
	private _url = $state<string | null>(null);
	/** Loading state */
	private _loading = $state(true);
	/** Error state */
	private _error = $state<Error | null>(null);
	/** Storage reference */
	private storageRef: StorageReference | null = null;

	/**
	 * Creates a download URL fetcher
	 * @param {string} path Storage path to file
	 *
	 * @example
	 * ```typescript
	 * const url = new FirekitDownloadUrl('documents/file.pdf');
	 * ```
	 */
	constructor(path: string) {
		if (browser) {
			this.initializeDownload(path);
		}
	}

	/**
	 * Initializes download URL fetching
	 * @private
	 * @param {string} path Storage path
	 */
	private async initializeDownload(path: string) {
		try {
			const storage = firebaseService.getStorageInstance();
			if (!storage) {
				throw new Error('Storage instance not available');
			}

			this.storageRef = ref(storage, path);
			this._url = await getDownloadURL(this.storageRef);
			this._loading = false;
		} catch (error) {
			this._error = error as Error;
			this._loading = false;
		}
	}

	/** Gets current download URL */
	get url(): string | null {
		return this._url;
	}

	/** Gets loading state */
	get loading(): boolean {
		return this._loading;
	}

	/** Gets error state */
	get error(): Error | null {
		return this._error;
	}

	/**
	 * Refreshes download URL
	 * Useful when file content has changed
	 *
	 * @example
	 * ```typescript
	 * // Refresh URL after file update
	 * await uploadNewVersion();
	 * imageUrl.refresh();
	 * ```
	 */
	refresh(): void {
		if (this.storageRef) {
			this._loading = true;
			this._error = null;
			this.initializeDownload(this.storageRef.fullPath);
		}
	}
}

/**
 * Manages Firebase Storage directory listing with reactive state
 * @class
 *
 * @example
 * ```typescript
 * // List contents of images directory
 * const imagesList = firekitStorageList('images');
 *
 * // Access items and folders
 * console.log('Files:', imagesList.items);
 * console.log('Folders:', imagesList.prefixes);
 * ```
 */
class FirekitStorageList {
	/** List of files in directory */
	private _items = $state<StorageReference[]>([]);
	/** List of subdirectories */
	private _prefixes = $state<StorageReference[]>([]);
	/** Loading state */
	private _loading = $state(true);
	/** Error state */
	private _error = $state<Error | null>(null);
	/** Storage reference */
	private storageRef: StorageReference | null = null;

	/**
	 * Creates a storage directory lister
	 * @param {string} path Storage directory path
	 *
	 * @example
	 * ```typescript
	 * const list = new FirekitStorageList('uploads/2024');
	 * ```
	 */
	constructor(path: string) {
		if (browser) {
			this.initializeList(path);
		}
	}

	/**
	 * Initializes directory listing
	 * @private
	 * @param {string} path Storage directory path
	 */
	private async initializeList(path: string) {
		try {
			const storage = firebaseService.getStorageInstance();
			if (!storage) {
				throw new Error('Storage instance not available');
			}

			this.storageRef = ref(storage, path);
			const result: ListResult = await listAll(this.storageRef);

			this._items = result.items;
			this._prefixes = result.prefixes;
			this._loading = false;
		} catch (error) {
			this._error = error as Error;
			this._loading = false;
		}
	}

	/** Gets list of files */
	get items(): StorageReference[] {
		return this._items;
	}

	/** Gets list of subdirectories */
	get prefixes(): StorageReference[] {
		return this._prefixes;
	}

	/** Gets loading state */
	get loading(): boolean {
		return this._loading;
	}

	/** Gets error state */
	get error(): Error | null {
		return this._error;
	}

	/**
	 * Refreshes directory listing
	 * Useful when directory contents have changed
	 *
	 * @example
	 * ```typescript
	 * // Refresh after upload
	 * await uploadFile('images/new.jpg');
	 * imagesList.refresh();
	 * ```
	 */
	refresh(): void {
		if (this.storageRef) {
			this._loading = true;
			this._error = null;
			this.initializeList(this.storageRef.fullPath);
		}
	}
}

/**
 * Manages Firebase Storage upload operations with reactive state and progress tracking
 * @class
 *
 * @example
 * ```typescript
 * // Create upload task
 * const upload = firekitUploadTask('images/photo.jpg', file);
 *
 * // Monitor progress
 * console.log(`Upload progress: ${upload.progress}%`);
 *
 * // Control upload
 * upload.pause();
 * upload.resume();
 * upload.cancel();
 * ```
 */
class FirekitUploadTask {
	/** Upload progress percentage */
	private _progress = $state(0);
	/** Error state */
	private _error = $state<Error | null>(null);
	/** Current upload snapshot */
	private _snapshot = $state<UploadTaskSnapshot | null>(null);
	/** Download URL of uploaded file */
	private _downloadURL = $state<string | null>(null);
	/** Upload completion state */
	private _completed = $state(false);
	/** Upload task reference */
	private uploadTask: UploadTask | null = null;
	/** Storage reference */
	private storageRef: StorageReference | null = null;

	/**
	 * Creates an upload task
	 * @param {string} path Storage path for upload
	 * @param {File} file File to upload
	 *
	 * @example
	 * ```typescript
	 * const task = new FirekitUploadTask('documents/report.pdf', file);
	 * ```
	 */
	constructor(path: string, file: File) {
		if (browser) {
			this.initializeUpload(path, file);
		}
	}

	/**
	 * Initializes file upload
	 * @private
	 * @param {string} path Storage path
	 * @param {File} file File to upload
	 */
	private initializeUpload(path: string, file: File) {
		try {
			const storage = firebaseService.getStorageInstance();
			if (!storage) {
				throw new Error('Storage instance not available');
			}

			this.storageRef = ref(storage, path);
			this.uploadTask = uploadBytesResumable(this.storageRef, file);

			this.uploadTask.on(
				'state_changed',
				(snapshot) => {
					this._snapshot = snapshot;
					this._progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				},
				(error) => {
					this._error = error;
				},
				async () => {
					if (this.storageRef) {
						this._downloadURL = await getDownloadURL(this.storageRef);
						this._completed = true;
					}
				}
			);
		} catch (error) {
			this._error = error as Error;
		}
	}

	/** Pauses upload */
	pause(): void {
		this.uploadTask?.pause();
	}

	/** Resumes upload */
	resume(): void {
		this.uploadTask?.resume();
	}

	/** Cancels upload */
	cancel(): void {
		this.uploadTask?.cancel();
	}

	/** Gets upload progress percentage */
	get progress(): number {
		return this._progress;
	}

	/** Gets error state */
	get error(): Error | null {
		return this._error;
	}

	/** Gets current upload snapshot */
	get snapshot(): UploadTaskSnapshot | null {
		return this._snapshot;
	}

	/** Gets download URL */
	get downloadURL(): string | null {
		return this._downloadURL;
	}

	/** Gets completion state */
	get completed(): boolean {
		return this._completed;
	}
}

// ========================================
// FACTORY FUNCTIONS
// ========================================

/**
 * Creates a download URL fetcher
 * @param {string} path Storage path to file
 * @returns {FirekitDownloadUrl} Download URL fetcher instance
 *
 * @example
 * ```typescript
 * const imageUrl = firekitDownloadUrl('images/profile.jpg');
 *
 * // Use in template
 * {#if imageUrl.loading}
 *   <p>Loading...</p>
 * {:else if imageUrl.url}
 *   <img src={imageUrl.url} alt="Profile" />
 * {/if}
 * ```
 */
export function firekitDownloadUrl(path: string): FirekitDownloadUrl {
	return new FirekitDownloadUrl(path);
}

/**
 * Creates a storage directory lister
 * @param {string} path Storage directory path
 * @returns {FirekitStorageList} Storage list instance
 *
 * @example
 * ```typescript
 * const documents = firekitStorageList('documents');
 *
 * // Use in template
 * {#if documents.loading}
 *   <p>Loading...</p>
 * {:else}
 *   <ul>
 *     {#each documents.items as item}
 *       <li>{item.name}</li>
 *     {/each}
 *   </ul>
 * {/if}
 * ```
 */
export function firekitStorageList(path: string): FirekitStorageList {
	return new FirekitStorageList(path);
}

/**
 * Creates an upload task
 * @param {string} path Storage path for upload
 * @param {File} file File to upload
 * @returns {FirekitUploadTask} Upload task instance
 *
 * @example
 * ```typescript
 * const uploadTask = firekitUploadTask('images/profile.jpg', imageFile);
 *
 * // Template usage
 * {#if !uploadTask.completed}
 *   <progress value={uploadTask.progress} max="100" />
 * {:else}
 *   <img src={uploadTask.downloadURL} alt="Uploaded file" />
 * {/if}
 * ```
 */
export function firekitUploadTask(path: string, file: File): FirekitUploadTask {
	return new FirekitUploadTask(path, file);
}
