import {
	collection,
	collectionGroup,
	query,
	getDocs,
	getDocsFromServer,
	onSnapshot,
	orderBy,
	limit,
	limitToLast,
	where,
	startAt,
	startAfter,
	endAt,
	endBefore,
	getCountFromServer,
	type CollectionReference,
	type Query,
	type QueryConstraint,
	type QuerySnapshot,
	type QueryDocumentSnapshot,
	type DocumentData,
	type Unsubscribe,
	type FirestoreError
} from 'firebase/firestore';
import { firebaseService } from '../firebase.js';
import {
	CollectionError,
	CollectionErrorCode,
	type FirestoreOperator
} from '../types/collection.js';

function getDb() {
	const db = firebaseService.getDbInstance();
	if (!db) throw new Error('Firestore is not initialized.');
	return db;
}

function mapFirestoreError(err: FirestoreError, path: string): CollectionError {
	const codeMap: Partial<Record<string, CollectionErrorCode>> = {
		'permission-denied': CollectionErrorCode.PERMISSION_DENIED,
		'unauthenticated': CollectionErrorCode.UNAUTHENTICATED,
		'not-found': CollectionErrorCode.NOT_FOUND,
		'already-exists': CollectionErrorCode.ALREADY_EXISTS,
		'unavailable': CollectionErrorCode.UNAVAILABLE,
		'deadline-exceeded': CollectionErrorCode.DEADLINE_EXCEEDED,
		'cancelled': CollectionErrorCode.CANCELLED,
		'internal': CollectionErrorCode.INTERNAL_ERROR,
		'data-loss': CollectionErrorCode.DATA_LOSS,
		'failed-precondition': CollectionErrorCode.FAILED_PRECONDITION,
		'aborted': CollectionErrorCode.ABORTED,
		'out-of-range': CollectionErrorCode.OUT_OF_RANGE,
		'unimplemented': CollectionErrorCode.UNIMPLEMENTED,
		'resource-exhausted': CollectionErrorCode.RESOURCE_EXHAUSTED
	};
	const code = codeMap[err.code] ?? CollectionErrorCode.UNKNOWN;
	return new CollectionError(code, err.message, path, undefined, err);
}

// ── Query builder ─────────────────────────────────────────────────────────────

/**
 * Fluent query builder — wraps Firestore QueryConstraints.
 *
 * @example
 * ```ts
 * const constraints = new FirekitQueryBuilder<Post>()
 *   .where('published', '==', true)
 *   .orderBy('createdAt', 'desc')
 *   .limit(20)
 *   .build();
 * ```
 */
export class FirekitQueryBuilder<T = DocumentData> {
	private constraints: QueryConstraint[] = [];

	where(field: string, operator: FirestoreOperator, value: unknown): this {
		this.constraints.push(where(field, operator, value));
		return this;
	}

	orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
		this.constraints.push(orderBy(field, direction));
		return this;
	}

	limit(count: number): this {
		this.constraints.push(limit(count));
		return this;
	}

	limitToLast(count: number): this {
		this.constraints.push(limitToLast(count));
		return this;
	}

	startAt(...values: unknown[]): this {
		this.constraints.push(startAt(...values));
		return this;
	}

	startAfter(...values: unknown[]): this {
		this.constraints.push(startAfter(...values));
		return this;
	}

	endAt(...values: unknown[]): this {
		this.constraints.push(endAt(...values));
		return this;
	}

	endBefore(...values: unknown[]): this {
		this.constraints.push(endBefore(...values));
		return this;
	}

	build(): QueryConstraint[] {
		return [...this.constraints];
	}

	/** Convenience — returns the constructed Firestore Query for a given collection ref. */
	buildQuery(ref: CollectionReference<T> | Query<T>): Query<T> {
		return query(ref, ...this.constraints) as Query<T>;
	}
}

// ── Options ───────────────────────────────────────────────────────────────────

export interface FirekitCollectionOptions<T = DocumentData> {
	/** Subscribe to real-time updates. Default: true */
	realtime?: boolean;
	/** Include metadata-only changes in real-time updates. Default: false */
	includeMetadata?: boolean;
	/** Optional client-side transform applied to each document. */
	transform?: (doc: DocumentData & { id: string }) => T;
	/** Optional client-side filter applied after fetching. */
	filter?: (doc: T) => boolean;
}

// ── Main class ────────────────────────────────────────────────────────────────

/**
 * Reactive Firestore collection subscription.
 *
 * Manages a Firestore collection query with reactive state via Svelte 5 runes.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitCollection } from 'svelte-firekit';
 *   const posts = firekitCollection<Post>('posts', [where('published', '==', true)]);
 * </script>
 * {#each posts.data as post}...{/each}
 * ```
 */
export class FirekitCollection<T = DocumentData> {
	// ── Reactive state ────────────────────────────────────────────────────────

	private _data = $state<T[]>([]);
	private _loading = $state(true);
	private _error = $state<CollectionError | null>(null);
	private _size = $state(0);
	private _fromCache = $state(false);
	private _hasPendingWrites = $state(false);

	// ── Derived ───────────────────────────────────────────────────────────────

	readonly isEmpty = $derived(!this._loading && this._size === 0);
	readonly hasData = $derived(this._size > 0);
	readonly isReady = $derived(!this._loading && this._error === null);

	// ── Pagination state ──────────────────────────────────────────────────────

	private _pageSize = $state(0);       // 0 = pagination disabled
	private _currentPage = $state(1);
	private _hasMore = $state(false);
	// Cursors are not reactive — they are internal implementation detail
	private _lastVisible: QueryDocumentSnapshot | null = null;
	private _cursorStack: QueryDocumentSnapshot[] = [];

	// ── Internal ──────────────────────────────────────────────────────────────

	private _unsubscribe: Unsubscribe | null = null;
	private _path: string;
	protected _constraints: QueryConstraint[];
	private _options: Required<FirekitCollectionOptions<T>>;
	private _isGroup: boolean;

	constructor(
		path: string,
		constraints: QueryConstraint[] = [],
		options: FirekitCollectionOptions<T> = {},
		isGroup = false
	) {
		this._path = path;
		this._constraints = constraints;
		this._isGroup = isGroup;
		this._options = {
			realtime: true,
			includeMetadata: false,
			transform: (doc) => doc as unknown as T,
			filter: () => true,
			...options
		};
		this._init();
	}

	// ── Public getters ────────────────────────────────────────────────────────

	get data(): T[] { return this._data; }
	get loading(): boolean { return this._loading; }
	get error(): CollectionError | null { return this._error; }
	get size(): number { return this._size; }
	get path(): string { return this._path; }
	get fromCache(): boolean { return this._fromCache; }
	get hasPendingWrites(): boolean { return this._hasPendingWrites; }
	get pageSize(): number { return this._pageSize; }
	get currentPage(): number { return this._currentPage; }
	get hasMore(): boolean { return this._hasMore; }

	// ── Initialization ────────────────────────────────────────────────────────

	protected _buildQuery(): Query<DocumentData> {
		const db = getDb();
		const ref = this._isGroup
			? collectionGroup(db, this._path)
			: collection(db, this._path);
		return query(ref, ...this._constraints);
	}

	private _init(): void {
		if (typeof window === 'undefined') {
			this._loading = false;
			return;
		}

		try {
			if (this._options.realtime) {
				this._subscribe();
			} else {
				this._fetchOnce();
			}
		} catch (err) {
			this._error = new CollectionError(
				CollectionErrorCode.REFERENCE_UNAVAILABLE,
				err instanceof Error ? err.message : String(err),
				this._path
			);
			this._loading = false;
		}
	}

	private _subscribe(): void {
		const q = this._buildQuery();

		this._unsubscribe = onSnapshot(
			q,
			{ includeMetadataChanges: this._options.includeMetadata },
			(snap: QuerySnapshot) => this._handleSnapshot(snap),
			(err: FirestoreError) => {
				this._error = mapFirestoreError(err, this._path);
				this._loading = false;
			}
		);
	}

	private async _fetchOnce(): Promise<void> {
		try {
			const snap = await getDocs(this._buildQuery());
			this._handleSnapshot(snap);
		} catch (err) {
			this._error = mapFirestoreError(err as FirestoreError, this._path);
			this._loading = false;
		}
	}

	private _handleSnapshot(snap: QuerySnapshot): void {
		const docs = snap.docs.map((d) => {
			const raw = { id: d.id, ...d.data() };
			return this._options.transform(raw);
		});

		this._data = this._options.filter ? docs.filter(this._options.filter) : docs;
		this._size = this._data.length;
		this._fromCache = snap.metadata.fromCache;
		this._hasPendingWrites = snap.metadata.hasPendingWrites;
		this._error = null;
		this._loading = false;

		// Track cursors for pagination
		if (snap.docs.length > 0) {
			this._lastVisible = snap.docs[snap.docs.length - 1];
		}
	}

	// ── Paginated fetch ───────────────────────────────────────────────────────

	/**
	 * Fetches a single page. Fetches `pageSize + 1` docs to detect `hasMore`,
	 * then trims the result to `pageSize` for display.
	 * @param cursor  Start after this document. Pass null for the first page.
	 * @param append  If true, appends to existing data instead of replacing it (for loadMore).
	 */
	private async _fetchPage(
		cursor: QueryDocumentSnapshot | null,
		append = false
	): Promise<void> {
		this._loading = true;
		try {
			const base = this._buildQuery();
			const paginatedQuery = cursor
				? query(base, startAfter(cursor), limit(this._pageSize + 1))
				: query(base, limit(this._pageSize + 1));

			const snap = await getDocs(paginatedQuery);
			const allDocs = snap.docs;

			this._hasMore = allDocs.length > this._pageSize;
			const pageDocs = allDocs.slice(0, this._pageSize);

			if (pageDocs.length > 0) {
				this._lastVisible = pageDocs[pageDocs.length - 1];
			}

			const mapped = pageDocs.map((d) => {
				const raw = { id: d.id, ...d.data() };
				return this._options.transform(raw);
			});
			const filtered = this._options.filter ? mapped.filter(this._options.filter) : mapped;

			this._data = append ? [...this._data, ...filtered] : filtered;
			this._size = this._data.length;
			this._fromCache = snap.metadata.fromCache;
			this._hasPendingWrites = snap.metadata.hasPendingWrites;
			this._error = null;
		} catch (err) {
			this._error = mapFirestoreError(err as FirestoreError, this._path);
		} finally {
			this._loading = false;
		}
	}

	// ── Public methods ────────────────────────────────────────────────────────

	/** Re-fetches from cache or server. */
	async refresh(): Promise<void> {
		this._loading = true;
		try {
			const snap = await getDocs(this._buildQuery());
			this._handleSnapshot(snap);
		} catch (err) {
			this._error = mapFirestoreError(err as FirestoreError, this._path);
			this._loading = false;
		}
	}

	/** Forces a fetch directly from the Firestore server (bypasses cache). */
	async getFromServer(): Promise<void> {
		this._loading = true;
		try {
			const snap = await getDocsFromServer(this._buildQuery());
			this._handleSnapshot(snap);
		} catch (err) {
			this._error = mapFirestoreError(err as FirestoreError, this._path);
			this._loading = false;
		}
	}

	/**
	 * Returns the server-side document count (uses Firestore aggregation query).
	 * Does not download the documents.
	 */
	async countFromServer(): Promise<number> {
		const snap = await getCountFromServer(this._buildQuery());
		return snap.data().count;
	}

	/**
	 * Replaces the current query constraints and re-fetches.
	 */
	async setConstraints(constraints: QueryConstraint[]): Promise<void> {
		this._unsubscribe?.();
		this._unsubscribe = null;
		this._constraints = constraints;
		this._loading = true;
		if (this._options.realtime) {
			this._subscribe();
		} else {
			await this._fetchOnce();
		}
	}

	/**
	 * Appends additional constraints (e.g. pagination cursor) and re-fetches.
	 */
	async addConstraints(constraints: QueryConstraint[]): Promise<void> {
		return this.setConstraints([...this._constraints, ...constraints]);
	}

	/** Switches between real-time and one-time mode. */
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

	// ── Client-side convenience ───────────────────────────────────────────────

	/** Client-side filter (does NOT modify the Firestore query). */
	filter(predicate: (doc: T) => boolean): T[] {
		return this._data.filter(predicate);
	}

	/** Finds the first document matching a predicate. */
	find(predicate: (doc: T) => boolean): T | undefined {
		return this._data.find(predicate);
	}

	/** Finds a document by its Firestore document ID. */
	findById(id: string): T | undefined {
		return this._data.find((d) => (d as { id?: string }).id === id);
	}

	/** Client-side sort (returns a new array, does NOT modify stored data). */
	sort(compareFn: (a: T, b: T) => number): T[] {
		return [...this._data].sort(compareFn);
	}

	// ── Pagination ────────────────────────────────────────────────────────────

	/**
	 * Enables cursor-based pagination and loads the first page.
	 *
	 * Disables the real-time listener — paginated queries use one-time fetches.
	 *
	 * @example
	 * ```ts
	 * const posts = firekitCollection<Post>('posts', [orderBy('createdAt', 'desc')]);
	 * await posts.setPagination(10); // 10 per page
	 * ```
	 */
	async setPagination(pageSize: number): Promise<void> {
		this._unsubscribe?.();
		this._unsubscribe = null;
		this._options.realtime = false;
		this._pageSize = pageSize;
		this._currentPage = 1;
		this._lastVisible = null;
		this._cursorStack = [];
		await this._fetchPage(null);
	}

	/**
	 * Loads the next page, replacing the current data.
	 * Call `setPagination()` first.
	 */
	async nextPage(): Promise<void> {
		if (this._pageSize === 0 || !this._hasMore || !this._lastVisible) return;
		this._cursorStack.push(this._lastVisible);
		await this._fetchPage(this._lastVisible);
		this._currentPage++;
	}

	/**
	 * Loads the previous page, replacing the current data.
	 */
	async prevPage(): Promise<void> {
		if (this._pageSize === 0 || this._currentPage <= 1) return;
		this._cursorStack.pop(); // remove current-page cursor
		const prevCursor = this._cursorStack[this._cursorStack.length - 1] ?? null;
		await this._fetchPage(prevCursor);
		this._currentPage--;
		// Always has more going backwards (we came from a later page)
		this._hasMore = true;
	}

	/**
	 * Appends the next page to existing data (infinite scroll).
	 * Call `setPagination()` first.
	 */
	async loadMore(): Promise<void> {
		if (this._pageSize === 0 || !this._hasMore || !this._lastVisible) return;
		this._cursorStack.push(this._lastVisible);
		await this._fetchPage(this._lastVisible, true);
		this._currentPage++;
	}

	/**
	 * Resets pagination back to the first page.
	 */
	async resetPagination(): Promise<void> {
		if (this._pageSize === 0) return;
		this._currentPage = 1;
		this._lastVisible = null;
		this._cursorStack = [];
		await this._fetchPage(null);
	}

	// ── Reactive path ─────────────────────────────────────────────────────────

	/**
	 * Changes the collection path and re-fetches.
	 * Tears down any existing real-time listener before switching.
	 *
	 * @example
	 * ```ts
	 * const messages = firekitCollection<Message>('rooms/general/messages');
	 * // User switches room:
	 * messages.setPath('rooms/random/messages');
	 * ```
	 */
	setPath(newPath: string): void {
		this._unsubscribe?.();
		this._unsubscribe = null;
		this._path = newPath;
		this._loading = true;
		this._data = [];
		this._error = null;
		this._lastVisible = null;
		this._cursorStack = [];
		this._currentPage = 1;
		this._init();
	}

	/**
	 * Resolves when the collection has finished its initial load.
	 */
	waitForReady(): Promise<T[]> {
		if (!this._loading) return Promise.resolve(this._data);
		// $effect.root creates a reactive scope outside of component initialization,
		// so this works safely whether called inside or outside a Svelte component.
		return new Promise<T[]>((resolve) => {
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

// ── Collection group ──────────────────────────────────────────────────────────

/**
 * Reactive Firestore collection group query.
 * Queries across all collections sharing the same name (collectionGroup).
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitCollectionGroup } from 'svelte-firekit';
 *   // Query 'comments' across all parent documents
 *   const allComments = firekitCollectionGroup<Comment>('comments');
 * </script>
 * ```
 */
export class FirekitCollectionGroup<T = DocumentData> extends FirekitCollection<T> {
	constructor(
		collectionId: string,
		constraints: QueryConstraint[] = [],
		options: FirekitCollectionOptions<T> = {}
	) {
		super(collectionId, constraints, options, true);
	}
}

// ── Factory functions ─────────────────────────────────────────────────────────

/**
 * Creates a reactive Firestore collection with real-time updates.
 *
 * @example
 * ```ts
 * const posts = firekitCollection<Post>('posts', [where('published', '==', true)]);
 * ```
 */
export function firekitCollection<T = DocumentData>(
	path: string,
	constraints: QueryConstraint[] = [],
	options?: Omit<FirekitCollectionOptions<T>, 'realtime'>
): FirekitCollection<T> {
	return new FirekitCollection<T>(path, constraints, { ...options, realtime: true });
}

/**
 * Creates a one-time Firestore collection fetch (no real-time listener).
 */
export function firekitCollectionOnce<T = DocumentData>(
	path: string,
	constraints: QueryConstraint[] = [],
	options?: Omit<FirekitCollectionOptions<T>, 'realtime'>
): FirekitCollection<T> {
	return new FirekitCollection<T>(path, constraints, { ...options, realtime: false });
}

/**
 * Creates a reactive Firestore collection group query with real-time updates.
 */
export function firekitCollectionGroup<T = DocumentData>(
	collectionId: string,
	constraints: QueryConstraint[] = [],
	options?: Omit<FirekitCollectionOptions<T>, 'realtime'>
): FirekitCollectionGroup<T> {
	return new FirekitCollectionGroup<T>(collectionId, constraints, { ...options, realtime: true });
}
