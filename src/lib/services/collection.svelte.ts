/**
 * @fileoverview FirekitCollection - Optimized collection management for Svelte applications
 * @module FirekitCollection
 * @version 1.0.0
 */

import {
	collection,
	collectionGroup,
	query,
	onSnapshot,
	getDocs,
	where,
	orderBy,
	limit,
	startAt,
	startAfter,
	endAt,
	endBefore,
	type Query,
	type CollectionReference,
	type DocumentData,
	type QueryConstraint,
	type QuerySnapshot,
	type DocumentSnapshot,
	type Unsubscribe
} from 'firebase/firestore';
import { firebaseService } from '../firebase.js';
import { browser } from '$app/environment';
import {
	type CollectionState,
	type CollectionOptions,
	type DocumentChange,
	type CollectionMetadata,
	type CollectionStats,
	type CollectionQueryResult,
	type QueryBuilder,
	type FirestoreOperator,
	type PaginationConfig,
	CollectionErrorCode,
	CollectionError
} from '../types/collection.js';

/**
 * Query builder implementation for type-safe query construction
 */
class FirekitQueryBuilder<T> implements QueryBuilder<T> {
	private constraints: QueryConstraint[] = [];

	where(field: string, operator: FirestoreOperator, value: any): QueryBuilder<T> {
		this.constraints.push(where(field, operator, value));
		return this;
	}

	orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryBuilder<T> {
		this.constraints.push(orderBy(field, direction));
		return this;
	}

	limit(count: number): QueryBuilder<T> {
		this.constraints.push(limit(count));
		return this;
	}

	startAt(...values: any[]): QueryBuilder<T> {
		this.constraints.push(startAt(...values));
		return this;
	}

	startAfter(...values: any[]): QueryBuilder<T> {
		this.constraints.push(startAfter(...values));
		return this;
	}

	endAt(...values: any[]): QueryBuilder<T> {
		this.constraints.push(endAt(...values));
		return this;
	}

	endBefore(...values: any[]): QueryBuilder<T> {
		this.constraints.push(endBefore(...values));
		return this;
	}

	build(): QueryConstraint[] {
		return [...this.constraints];
	}
}

/**
 * Comprehensive Firestore collection management with real-time updates and advanced features.
 * Uses Svelte 5 runes for optimal reactivity and performance.
 *
 * @class FirekitCollection
 * @template T Document data type
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 *   active: boolean;
 * }
 *
 * // Simple collection subscription
 * const users = firekitCollection<User>('users');
 *
 * // With query constraints
 * const activeUsers = firekitCollection<User>('users',
 *   where('active', '==', true),
 *   orderBy('name'),
 *   limit(10)
 * );
 *
 * // With advanced options
 * const paginatedUsers = firekitCollection<User>('users', {
 *   pagination: { enabled: true, pageSize: 20 },
 *   cache: { enabled: true, ttl: 300000 },
 *   transform: (doc) => ({ ...doc, displayName: doc.name.toUpperCase() })
 * });
 *
 * // Access reactive state
 * $: if (users.loading) {
 *   console.log('Loading...');
 * } else if (users.error) {
 *   console.error('Error:', users.error);
 * } else {
 *   console.log('Users:', users.data);
 * }
 * ```
 */
class FirekitCollection<T extends DocumentData = DocumentData> {
	// Reactive state using Svelte 5 runes
	private _data = $state<T[]>([]);
	private _loading = $state(true);
	private _initialized = $state(false);
	private _error = $state<CollectionError | null>(null);
	private _lastUpdated = $state<Date | null>(null);

	// Internal state
	private collectionRef: CollectionReference<T> | null = null;
	protected queryRef: Query<T> | null = null;
	private unsubscribe: Unsubscribe | null = null;
	protected options: CollectionOptions;
	private stats: CollectionStats = this.initializeStats();
	private cache: Map<string, { data: T[]; timestamp: Date }> = new Map();
	private collectionPath: string;

	/**
	 * Creates a collection subscription
	 *
	 * @param path Collection path
	 * @param constraintsOrOptions Query constraints or collection options
	 * @param additionalConstraints Additional constraints if options were provided
	 */
	constructor(
		path: string,
		constraintsOrOptions?: QueryConstraint[] | CollectionOptions,
		...additionalConstraints: QueryConstraint[]
	) {
		this.collectionPath = path;

		// Parse constructor arguments
		if (Array.isArray(constraintsOrOptions)) {
			// Old style: path, ...constraints
			this.options = {};
			this.initializeCollection([...constraintsOrOptions, ...additionalConstraints]);
		} else {
			// New style: path, options, ...constraints
			this.options = constraintsOrOptions || {};
			// Only use additionalConstraints since options object doesn't contain constraints
			this.initializeCollection(additionalConstraints);
		}
	}

	/**
	 * Initialize statistics object
	 */
	private initializeStats(): CollectionStats {
		return {
			totalDocuments: 0,
			readCount: 0,
			writeCount: 0,
			cacheHitRate: 0,
			averageQueryTime: 0,
			lastActivity: new Date(),
			memoryUsage: 0
		};
	}

	/**
	 * Initialize collection subscription
	 */
	private async initializeCollection(constraints: QueryConstraint[]): Promise<void> {
		if (!browser) return;

		try {
			const firestore = firebaseService.getDbInstance();
			if (!firestore) {
				throw new CollectionError(
					CollectionErrorCode.COLLECTION_UNAVAILABLE,
					'Firestore instance not available',
					this.collectionPath
				);
			}

			// Check cache first
			const cacheKey = this.getCacheKey(constraints);
			if (this.options.cache?.enabled && this.isCacheValid(cacheKey)) {
				const cached = this.cache.get(cacheKey)!;
				this._data = cached.data;
				this._loading = false;
				this._initialized = true;
				this._lastUpdated = cached.timestamp;

				this.stats.cacheHitRate = (this.stats.cacheHitRate + 1) / 2;
			}

			// Create collection reference
			this.collectionRef = collection(firestore, this.collectionPath) as CollectionReference<T>;

			// Create query with constraints
			this.queryRef =
				constraints.length > 0 ? query(this.collectionRef, ...constraints) : this.collectionRef;

			// Set up real-time listener or one-time fetch
			if (this.options.realtime !== false) {
				this.setupRealtimeListener();
			} else {
				await this.fetchOnce();
			}
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Set up real-time document listener
	 */
	protected setupRealtimeListener(): void {
		if (!this.queryRef) return;

		const options = {
			includeMetadataChanges: this.options.includeMetadata || false
		};

		this.unsubscribe = onSnapshot(
			this.queryRef,
			options,
			(snapshot: QuerySnapshot<T>) => {
				this.processSnapshot(snapshot);
			},
			(error) => {
				this.handleError(error);
			}
		);
	}

	/**
	 * Fetch collection data once (no real-time updates)
	 */
	protected async fetchOnce(): Promise<void> {
		if (!this.queryRef) return;

		try {
			this._loading = true;

			const startTime = Date.now();
			const snapshot = await getDocs(this.queryRef);
			const queryTime = Date.now() - startTime;

			this.stats.averageQueryTime = (this.stats.averageQueryTime + queryTime) / 2;
			this.processSnapshot(snapshot);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Process query snapshot and update state
	 */
	private processSnapshot(snapshot: QuerySnapshot<T>): void {
		try {
			const startTime = Date.now();

			// Extract documents with ID
			let documents = snapshot.docs.map((doc: DocumentSnapshot<T>) => {
				const data = doc.data();
				return { id: doc.id, ...data } as unknown as T;
			});

			// Apply transform function if provided
			if (this.options.transform) {
				documents = documents.map(this.options.transform);
			}

			// Apply filter function if provided
			if (this.options.filter) {
				documents = documents.filter(this.options.filter);
			}

			// Apply sort function if provided
			if (this.options.sort) {
				documents = documents.sort(this.options.sort);
			}

			// Track document changes for events
			const changes: DocumentChange<T>[] = this.calculateChanges(this._data, documents);

			// Update reactive state
			this._data = documents;
			this._loading = false;
			this._initialized = true;
			this._error = null;
			this._lastUpdated = new Date();

			// Update statistics
			this.stats.totalDocuments = documents.length;
			this.stats.readCount++;
			this.stats.lastActivity = new Date();
			this.stats.memoryUsage = this.calculateMemoryUsage(documents);

			// Update cache if enabled
			if (this.options.cache?.enabled) {
				const cacheKey = this.getCacheKey([]);
				this.cache.set(cacheKey, {
					data: documents,
					timestamp: new Date()
				});
				this.cleanupCache();
			}
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Calculate changes between old and new document arrays
	 */
	private calculateChanges(oldDocs: T[], newDocs: T[]): DocumentChange<T>[] {
		const changes: DocumentChange<T>[] = [];
		const oldMap = new Map(oldDocs.map((doc, index) => [(doc as any).id, { doc, index }]));
		const newMap = new Map(newDocs.map((doc, index) => [(doc as any).id, { doc, index }]));

		// Find added and modified documents
		newDocs.forEach((newDoc, newIndex) => {
			const id = (newDoc as any).id;
			const oldEntry = oldMap.get(id);

			if (!oldEntry) {
				// Document was added
				changes.push({
					type: 'added',
					doc: newDoc,
					oldIndex: -1,
					newIndex,
					timestamp: new Date()
				});
			} else if (JSON.stringify(oldEntry.doc) !== JSON.stringify(newDoc)) {
				// Document was modified
				changes.push({
					type: 'modified',
					doc: newDoc,
					oldIndex: oldEntry.index,
					newIndex,
					timestamp: new Date()
				});
			}
		});

		// Find removed documents
		oldDocs.forEach((oldDoc, oldIndex) => {
			const id = (oldDoc as any).id;
			if (!newMap.has(id)) {
				changes.push({
					type: 'removed',
					doc: oldDoc,
					oldIndex,
					newIndex: -1,
					timestamp: new Date()
				});
			}
		});

		return changes;
	}

	/**
	 * Handle and process errors
	 */
	protected handleError(error: any): void {
		let collectionError: CollectionError;

		if (error instanceof CollectionError) {
			collectionError = error;
		} else {
			// Map Firestore errors to CollectionError
			const code = this.mapFirestoreErrorCode(error.code);
			collectionError = new CollectionError(
				code,
				error.message || 'An unknown error occurred',
				this.collectionPath,
				[],
				error
			);
		}

		this._error = collectionError;
		this._loading = false;

		console.error('FirekitCollection error:', collectionError);
	}

	/**
	 * Map Firestore error codes to CollectionErrorCode
	 */
	private mapFirestoreErrorCode(firestoreCode: string): CollectionErrorCode {
		switch (firestoreCode) {
			case 'permission-denied':
				return CollectionErrorCode.PERMISSION_DENIED;
			case 'not-found':
				return CollectionErrorCode.NOT_FOUND;
			case 'unavailable':
				return CollectionErrorCode.UNAVAILABLE;
			case 'deadline-exceeded':
				return CollectionErrorCode.DEADLINE_EXCEEDED;
			case 'unauthenticated':
				return CollectionErrorCode.UNAUTHENTICATED;
			case 'resource-exhausted':
				return CollectionErrorCode.RESOURCE_EXHAUSTED;
			case 'failed-precondition':
				return CollectionErrorCode.FAILED_PRECONDITION;
			case 'aborted':
				return CollectionErrorCode.ABORTED;
			case 'out-of-range':
				return CollectionErrorCode.OUT_OF_RANGE;
			case 'unimplemented':
				return CollectionErrorCode.UNIMPLEMENTED;
			case 'internal':
				return CollectionErrorCode.INTERNAL_ERROR;
			case 'data-loss':
				return CollectionErrorCode.DATA_LOSS;
			case 'cancelled':
				return CollectionErrorCode.CANCELLED;
			default:
				return CollectionErrorCode.UNKNOWN;
		}
	}

	/**
	 * Generate cache key for query
	 */
	private getCacheKey(constraints: QueryConstraint[]): string {
		if (this.options.cache?.customKey) {
			return this.options.cache.customKey(this.collectionPath, constraints);
		}

		// More reliable constraint serialization
		const constraintString = constraints
			.map((c) => {
				try {
					return JSON.stringify(c);
				} catch {
					return c.toString();
				}
			})
			.join('|');
		return `${this.collectionPath}:${constraintString}`;
	}

	/**
	 * Check if cache entry is still valid
	 */
	private isCacheValid(cacheKey: string): boolean {
		const cached = this.cache.get(cacheKey);
		if (!cached) return false;

		const ttl = this.options.cache?.ttl || 300000; // 5 minutes default
		return Date.now() - cached.timestamp.getTime() < ttl;
	}

	/**
	 * Clean up expired cache entries
	 */
	private cleanupCache(): void {
		const maxSize = this.options.cache?.maxSize || 100;
		const ttl = this.options.cache?.ttl || 300000;
		const now = Date.now();

		// Remove expired entries
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp.getTime() > ttl) {
				this.cache.delete(key);
			}
		}

		// Remove oldest entries if cache is too large
		if (this.cache.size > maxSize) {
			const entries = Array.from(this.cache.entries()).sort(
				(a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime()
			);

			const toRemove = entries.slice(0, this.cache.size - maxSize);
			toRemove.forEach(([key]) => this.cache.delete(key));
		}
	}

	/**
	 * Calculate memory usage of documents
	 */
	private calculateMemoryUsage(documents: T[]): number {
		try {
			return JSON.stringify(documents).length * 2; // Rough estimate
		} catch {
			return 0;
		}
	}

	// ========================================
	// REACTIVE GETTERS (Public API)
	// ========================================

	/**
	 * Get current collection data
	 */
	get data(): T[] {
		return this._data;
	}

	/**
	 * Get loading state
	 */
	get loading(): boolean {
		return this._loading;
	}

	/**
	 * Get initialization state
	 */
	get initialized(): boolean {
		return this._initialized;
	}

	/**
	 * Get error state
	 */
	get error(): CollectionError | null {
		return this._error;
	}

	/**
	 * Check if collection is empty
	 */
	get empty(): boolean {
		return this._data.length === 0;
	}

	/**
	 * Get number of documents
	 */
	get size(): number {
		return this._data.length;
	}

	/**
	 * Get last update timestamp
	 */
	get lastUpdated(): Date | null {
		return this._lastUpdated;
	}

	/**
	 * Get collection reference
	 */
	get ref(): CollectionReference<T> {
		if (!this.collectionRef) {
			throw new CollectionError(
				CollectionErrorCode.REFERENCE_UNAVAILABLE,
				'Collection reference not available',
				this.collectionPath
			);
		}
		return this.collectionRef;
	}

	/**
	 * Get query reference
	 */
	get queryReference(): Query<T> {
		if (!this.queryRef) {
			throw new CollectionError(
				CollectionErrorCode.REFERENCE_UNAVAILABLE,
				'Query reference not available',
				this.collectionPath
			);
		}
		return this.queryRef;
	}

	/**
	 * Get collection path
	 */
	get path(): string {
		return this.collectionPath;
	}

	/**
	 * Get collection state summary
	 */
	get state(): CollectionState<T> {
		return {
			data: this._data,
			loading: this._loading,
			initialized: this._initialized,
			error: this._error,
			empty: this.empty,
			size: this.size,
			lastUpdated: this._lastUpdated
		};
	}

	// ========================================
	// PUBLIC METHODS
	// ========================================

	/**
	 * Manually refresh collection data
	 */
	async refresh(): Promise<void> {
		if (!this.queryRef) {
			throw new CollectionError(
				CollectionErrorCode.REFERENCE_UNAVAILABLE,
				'Cannot refresh: query reference not available',
				this.collectionPath
			);
		}

		try {
			this._loading = true;
			const snapshot = await getDocs(this.queryRef);
			this.processSnapshot(snapshot);
		} catch (error) {
			this.handleError(error);
			throw error;
		}
	}

	/**
	 * Get fresh data from server (bypassing cache)
	 */
	async getFromServer(): Promise<T[]> {
		if (!this.queryRef) {
			throw new CollectionError(
				CollectionErrorCode.REFERENCE_UNAVAILABLE,
				'Cannot fetch: query reference not available',
				this.collectionPath
			);
		}

		try {
			const snapshot = await getDocs(this.queryRef);
			return snapshot.docs.map((doc) => {
				const data = doc.data();
				return { id: doc.id, ...data } as unknown as T;
			});
		} catch (error) {
			this.handleError(error);
			throw error;
		}
	}

	/**
	 * Add query constraints to existing query
	 */
	addConstraints(...constraints: QueryConstraint[]): FirekitCollection<T> {
		if (!this.collectionRef) {
			throw new CollectionError(
				CollectionErrorCode.REFERENCE_UNAVAILABLE,
				'Cannot add constraints: collection reference not available',
				this.collectionPath
			);
		}

		const newQuery = query(this.queryRef || this.collectionRef, ...constraints);
		const newCollection = new FirekitCollection<T>(this.collectionPath, this.options);
		newCollection.queryRef = newQuery;
		newCollection.initializeCollection([]);
		return newCollection;
	}

	/**
	 * Create a new query builder for this collection
	 */
	createQuery(): QueryBuilder<T> {
		return new FirekitQueryBuilder<T>();
	}

	/**
	 * Apply new query constraints
	 */
	withQuery(builder: QueryBuilder<T>): FirekitCollection<T> {
		return this.addConstraints(...builder.build());
	}

	/**
	 * Filter documents by predicate
	 */
	filter(predicate: (doc: T) => boolean): T[] {
		return this._data.filter(predicate);
	}

	/**
	 * Find first document matching predicate
	 */
	find(predicate: (doc: T) => boolean): T | undefined {
		return this._data.find(predicate);
	}

	/**
	 * Find document by ID
	 */
	findById(id: string): T | undefined {
		return this._data.find((doc) => (doc as any).id === id);
	}

	/**
	 * Sort documents by field or custom function
	 */
	sort(compareFn: (a: T, b: T) => number): T[] {
		return [...this._data].sort(compareFn);
	}

	/**
	 * Get paginated subset of documents
	 */
	paginate(page: number, pageSize: number): T[] {
		const startIndex = (page - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		return this._data.slice(startIndex, endIndex);
	}

	/**
	 * Group documents by field value
	 */
	groupBy<K extends keyof T>(field: K): Map<T[K], T[]> {
		const groups = new Map<T[K], T[]>();

		this._data.forEach((doc) => {
			const key = doc[field];
			if (!groups.has(key)) {
				groups.set(key, []);
			}
			groups.get(key)!.push(doc);
		});

		return groups;
	}

	/**
	 * Get unique values for a field
	 */
	unique<K extends keyof T>(field: K): T[K][] {
		const values = this._data.map((doc) => doc[field]);
		return Array.from(new Set(values));
	}

	/**
	 * Count documents matching predicate
	 */
	count(predicate?: (doc: T) => boolean): number {
		return predicate ? this._data.filter(predicate).length : this._data.length;
	}

	/**
	 * Check if any document matches predicate
	 */
	some(predicate: (doc: T) => boolean): boolean {
		return this._data.some(predicate);
	}

	/**
	 * Check if all documents match predicate
	 */
	every(predicate: (doc: T) => boolean): boolean {
		return this._data.every(predicate);
	}

	/**
	 * Switch between realtime and one-time fetch modes
	 */
	setRealtimeMode(realtime: boolean): void {
		if (this.options.realtime === realtime) return;

		this.options.realtime = realtime;

		// Clean up existing listener
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}

		// Set up new mode
		if (realtime) {
			this.setupRealtimeListener();
		}
	}

	/**
	 * Clear cache for this collection
	 */
	clearCache(): void {
		const cacheKey = this.getCacheKey([]);
		this.cache.delete(cacheKey);
	}

	/**
	 * Get collection statistics
	 */
	getStats(): CollectionStats {
		return { ...this.stats };
	}

	/**
	 * Reset statistics
	 */
	resetStats(): void {
		this.stats = this.initializeStats();
	}

	/**
	 * Wait for collection to initialize
	 */
	async waitForInitialization(): Promise<T[]> {
		return new Promise((resolve) => {
			if (this._initialized) {
				resolve(this._data);
				return;
			}

			// Poll for initialization since we removed events
			const checkInterval = setInterval(() => {
				if (this._initialized) {
					clearInterval(checkInterval);
					resolve(this._data);
				}
			}, 100);

			// Timeout after 10 seconds
			setTimeout(() => {
				clearInterval(checkInterval);
				resolve(this._data);
			}, 10000);
		});
	}

	// ========================================
	// CLEANUP
	// ========================================

	/**
	 * Dispose of all resources and cleanup
	 */
	dispose(): void {
		// Unsubscribe from real-time updates
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}

		// Clear cache
		this.cache.clear();

		// Reset state
		this._data = [];
		this._loading = false;
		this._initialized = false;
		this._error = null;
		this._lastUpdated = null;
	}
}

/**
 * Collection Group implementation for querying across multiple collections
 */
class FirekitCollectionGroup<T extends DocumentData = DocumentData> extends FirekitCollection<T> {
	constructor(
		collectionId: string,
		constraintsOrOptions?: QueryConstraint[] | CollectionOptions,
		...additionalConstraints: QueryConstraint[]
	) {
		// Initialize with empty options to avoid parent constructor issues
		super(`__collection_group__${collectionId}`, {});

		// Parse constructor arguments properly
		if (Array.isArray(constraintsOrOptions)) {
			this.options = {};
			this.initializeCollectionGroup(collectionId, [
				...constraintsOrOptions,
				...additionalConstraints
			]);
		} else {
			this.options = constraintsOrOptions || {};
			this.initializeCollectionGroup(collectionId, additionalConstraints);
		}
	}

	/**
	 * Initialize collection group subscription
	 */
	private async initializeCollectionGroup(
		collectionId: string,
		constraints: QueryConstraint[]
	): Promise<void> {
		if (!browser) return;

		try {
			const firestore = firebaseService.getDbInstance();
			if (!firestore) {
				throw new CollectionError(
					CollectionErrorCode.COLLECTION_UNAVAILABLE,
					'Firestore instance not available',
					collectionId
				);
			}

			// Create collection group reference
			const groupRef = collectionGroup(firestore, collectionId);

			// Create query with constraints
			this.queryRef =
				constraints.length > 0
					? query(groupRef as Query<T>, ...constraints)
					: (groupRef as Query<T>);

			// Set up real-time listener or one-time fetch
			if (this.options.realtime !== false) {
				this.setupRealtimeListener();
			} else {
				await this.fetchOnce();
			}
		} catch (error) {
			this.handleError(error);
		}
	}
}

// ========================================
// FACTORY FUNCTIONS
// ========================================

/**
 * Creates a reactive collection subscription
 */
export function firekitCollection<T extends DocumentData = DocumentData>(
	path: string,
	constraintsOrOptions?: QueryConstraint[] | CollectionOptions,
	...additionalConstraints: QueryConstraint[]
): FirekitCollection<T>;

export function firekitCollection<T extends DocumentData = DocumentData>(
	path: string,
	options: CollectionOptions,
	...constraints: QueryConstraint[]
): FirekitCollection<T>;

export function firekitCollection<T extends DocumentData = DocumentData>(
	path: string,
	constraintsOrOptions?: QueryConstraint[] | CollectionOptions,
	...additionalConstraints: QueryConstraint[]
): FirekitCollection<T> {
	if (Array.isArray(constraintsOrOptions)) {
		return new FirekitCollection(path, [...constraintsOrOptions, ...additionalConstraints]);
	} else {
		return new FirekitCollection(path, constraintsOrOptions, ...additionalConstraints);
	}
}

/**
 * Creates a one-time collection fetch (no real-time updates)
 */
export function firekitCollectionOnce<T extends DocumentData = DocumentData>(
	path: string,
	...constraints: QueryConstraint[]
): FirekitCollection<T> {
	return new FirekitCollection(path, { realtime: false }, ...constraints);
}

/**
 * Creates a collection group subscription
 */
export function firekitCollectionGroup<T extends DocumentData = DocumentData>(
	collectionId: string,
	constraintsOrOptions?: QueryConstraint[] | CollectionOptions,
	...additionalConstraints: QueryConstraint[]
): FirekitCollectionGroup<T>;

export function firekitCollectionGroup<T extends DocumentData = DocumentData>(
	collectionId: string,
	options: CollectionOptions,
	...constraints: QueryConstraint[]
): FirekitCollectionGroup<T>;

export function firekitCollectionGroup<T extends DocumentData = DocumentData>(
	collectionId: string,
	constraintsOrOptions?: QueryConstraint[] | CollectionOptions,
	...additionalConstraints: QueryConstraint[]
): FirekitCollectionGroup<T> {
	if (Array.isArray(constraintsOrOptions)) {
		return new FirekitCollectionGroup(collectionId, [
			...constraintsOrOptions,
			...additionalConstraints
		]);
	} else {
		return new FirekitCollectionGroup(collectionId, constraintsOrOptions, ...additionalConstraints);
	}
}
