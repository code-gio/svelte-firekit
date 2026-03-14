import {
	doc,
	getDoc,
	getDocFromServer,
	onSnapshot,
	type DocumentReference,
	type DocumentSnapshot,
	type Unsubscribe,
	type FirestoreError,
	type SnapshotListenOptions
} from 'firebase/firestore';
import { firebaseService } from '../firebase.js';
import { DocumentError, DocumentErrorCode } from '../types/document.js';

function getDb() {
	const db = firebaseService.getDbInstance();
	if (!db) throw new Error('Firestore is not initialized.');
	return db;
}

function mapFirestoreError(err: FirestoreError, path: string): DocumentError {
	const codeMap: Partial<Record<string, DocumentErrorCode>> = {
		'permission-denied': DocumentErrorCode.PERMISSION_DENIED,
		'unauthenticated': DocumentErrorCode.UNAUTHENTICATED,
		'not-found': DocumentErrorCode.NOT_FOUND,
		'already-exists': DocumentErrorCode.ALREADY_EXISTS,
		'unavailable': DocumentErrorCode.UNAVAILABLE,
		'deadline-exceeded': DocumentErrorCode.TIMEOUT,
		'cancelled': DocumentErrorCode.CANCELLED,
		'internal': DocumentErrorCode.INTERNAL_ERROR,
		'data-loss': DocumentErrorCode.DATA_LOSS,
		'failed-precondition': DocumentErrorCode.FAILED_PRECONDITION,
		'aborted': DocumentErrorCode.ABORTED,
		'out-of-range': DocumentErrorCode.OUT_OF_RANGE,
		'unimplemented': DocumentErrorCode.UNIMPLEMENTED,
		'resource-exhausted': DocumentErrorCode.UNAVAILABLE
	};
	const code = codeMap[err.code] ?? DocumentErrorCode.UNKNOWN;
	return new DocumentError(code, err.message, err, { path });
}

/**
 * Options for FirekitDoc.
 */
export interface FirekitDocOptions {
	/** Subscribe to real-time updates. Default: true */
	realtime?: boolean;
	/** Include metadata-only changes in real-time updates. Default: false */
	includeMetadata?: boolean;
}

/**
 * Reactive Firestore document subscription.
 *
 * Manages a single Firestore document with reactive state via Svelte 5 runes.
 * Automatically subscribes to real-time updates (or fetches once) when constructed.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitDoc } from 'svelte-firekit';
 *   const user = firekitDoc<User>('users/uid123');
 * </script>
 * {#if user.loading}Loading...{/if}
 * {#if user.data}{user.data.name}{/if}
 * ```
 */
export class FirekitDoc<T = Record<string, unknown>> {
	// ── Reactive state ────────────────────────────────────────────────────────

	private _data = $state<T | null>(null);
	private _loading = $state(true);
	private _error = $state<DocumentError | null>(null);
	private _exists = $state(false);
	private _id = $state('');
	private _fromCache = $state(false);
	private _hasPendingWrites = $state(false);

	// ── Derived ───────────────────────────────────────────────────────────────

	readonly hasData = $derived(this._data !== null && this._exists);
	readonly isReady = $derived(!this._loading && this._exists && this._data !== null);
	readonly isEmpty = $derived(!this._loading && !this._exists);
	readonly canRetry = $derived(this._error !== null && (this._error.isRetryable?.() ?? false));

	// ── Internal ──────────────────────────────────────────────────────────────

	private _ref: DocumentReference | null = null;
	private _unsubscribe: Unsubscribe | null = null;
	private _path: string;
	private _options: Required<FirekitDocOptions>;

	constructor(path: string, options: FirekitDocOptions = {}) {
		this._path = path;
		this._options = { realtime: true, includeMetadata: false, ...options };
		this._init();
	}

	// ── Public getters ────────────────────────────────────────────────────────

	get data(): T | null { return this._data; }
	get loading(): boolean { return this._loading; }
	get error(): DocumentError | null { return this._error; }
	get exists(): boolean { return this._exists; }
	get id(): string { return this._id; }
	get path(): string { return this._path; }
	get fromCache(): boolean { return this._fromCache; }
	get hasPendingWrites(): boolean { return this._hasPendingWrites; }
	get ref(): DocumentReference | null { return this._ref; }

	// ── Initialization ────────────────────────────────────────────────────────

	private _init(): void {
		if (typeof window === 'undefined') {
			this._loading = false;
			return;
		}

		try {
			const db = getDb();
			this._ref = doc(db, this._path);
			this._id = this._ref.id;

			if (this._options.realtime) {
				this._subscribe();
			} else {
				this._fetchOnce();
			}
		} catch (err) {
			this._error = new DocumentError(
				DocumentErrorCode.REFERENCE_UNAVAILABLE,
				err instanceof Error ? err.message : String(err),
				err
			);
			this._loading = false;
		}
	}

	private _subscribe(): void {
		if (!this._ref) return;

		const listenOptions: SnapshotListenOptions = {
			includeMetadataChanges: this._options.includeMetadata
		};

		this._unsubscribe = onSnapshot(
			this._ref,
			listenOptions,
			(snap: DocumentSnapshot) => this._handleSnapshot(snap),
			(err: FirestoreError) => {
				this._error = mapFirestoreError(err, this._path);
				this._loading = false;
			}
		);
	}

	private async _fetchOnce(): Promise<void> {
		if (!this._ref) return;
		try {
			const snap = await getDoc(this._ref);
			this._handleSnapshot(snap);
		} catch (err) {
			const fsErr = err as FirestoreError;
			this._error = mapFirestoreError(fsErr, this._path);
			this._loading = false;
		}
	}

	private _handleSnapshot(snap: DocumentSnapshot): void {
		this._exists = snap.exists();
		this._data = snap.exists() ? (snap.data() as T) : null;
		this._id = snap.id;
		this._fromCache = snap.metadata.fromCache;
		this._hasPendingWrites = snap.metadata.hasPendingWrites;
		this._error = null;
		this._loading = false;
	}

	// ── Public methods ────────────────────────────────────────────────────────

	/** Re-fetches the document from the local cache / server. */
	async refresh(): Promise<void> {
		if (!this._ref) return;
		this._loading = true;
		try {
			const snap = await getDoc(this._ref);
			this._handleSnapshot(snap);
		} catch (err) {
			this._error = mapFirestoreError(err as FirestoreError, this._path);
			this._loading = false;
		}
	}

	/** Forces a fetch directly from the Firestore server (bypasses cache). */
	async getFromServer(): Promise<void> {
		if (!this._ref) return;
		this._loading = true;
		try {
			const snap = await getDocFromServer(this._ref);
			this._handleSnapshot(snap);
		} catch (err) {
			this._error = mapFirestoreError(err as FirestoreError, this._path);
			this._loading = false;
		}
	}

	/**
	 * Switches between real-time and one-time fetch mode.
	 * Unsubscribes existing listener if disabling real-time.
	 */
	setRealtimeMode(enabled: boolean): void {
		if (enabled === this._options.realtime) return;
		this._options.realtime = enabled;
		if (!enabled) {
			this._unsubscribe?.();
			this._unsubscribe = null;
		} else {
			this._subscribe();
		}
	}

	/**
	 * Changes the document path and re-subscribes (or re-fetches).
	 * Tears down any existing real-time listener before switching.
	 *
	 * @example
	 * ```ts
	 * const userDoc = firekitDoc<User>('users/alice');
	 * // User switches account:
	 * userDoc.setPath('users/bob');
	 * ```
	 */
	setPath(newPath: string): void {
		this._unsubscribe?.();
		this._unsubscribe = null;
		this._path = newPath;
		this._loading = true;
		this._data = null;
		this._exists = false;
		this._error = null;
		this._init();
	}

	/**
	 * Resolves when the document has finished its initial load.
	 * Useful for SSR / data-loading patterns.
	 */
	waitForReady(): Promise<T | null> {
		if (!this._loading) return Promise.resolve(this._data);
		// $effect.root creates a reactive scope outside of component initialization,
		// so this works safely whether called inside or outside a Svelte component.
		return new Promise<T | null>((resolve) => {
			const stop = $effect.root(() => {
				$effect(() => {
					if (!this._loading) {
						stop();
						resolve(this._data);
					}
				});
			});
		});
	}

	/** Stops the real-time listener and frees resources. */
	dispose(): void {
		this._unsubscribe?.();
		this._unsubscribe = null;
	}
}

// ── Factory functions ─────────────────────────────────────────────────────────

/**
 * Creates a reactive Firestore document with real-time updates.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitDoc } from 'svelte-firekit';
 *   const post = firekitDoc<Post>('posts/abc123');
 * </script>
 * ```
 */
export function firekitDoc<T = Record<string, unknown>>(
	path: string,
	options?: Omit<FirekitDocOptions, 'realtime'>
): FirekitDoc<T> {
	return new FirekitDoc<T>(path, { ...options, realtime: true });
}

/**
 * Creates a one-time Firestore document fetch (no real-time listener).
 */
export function firekitDocOnce<T = Record<string, unknown>>(
	path: string,
	options?: Omit<FirekitDocOptions, 'realtime'>
): FirekitDoc<T> {
	return new FirekitDoc<T>(path, { ...options, realtime: false });
}

/**
 * Creates a reactive Firestore document that also exposes metadata
 * (fromCache, hasPendingWrites).
 */
export function firekitDocWithMetadata<T = Record<string, unknown>>(
	path: string
): FirekitDoc<T> {
	return new FirekitDoc<T>(path, { realtime: true, includeMetadata: true });
}
