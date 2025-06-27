/**
 * @fileoverview FirekitDoc - Optimized Firestore document management for Svelte
 * @module FirekitDoc
 * @version 1.0.0
 */

import {
	doc,
	getDoc,
	onSnapshot,
	type DocumentReference,
	type DocumentData,
	type DocumentSnapshot,
	type Unsubscribe
} from 'firebase/firestore';
import { firebaseService } from '../firebase.js';
import { browser } from '$app/environment';
import {
	type DocumentState,
	type DocumentOptions,
	DocumentErrorCode,
	DocumentError
} from '../types/document.js';

/**
 * Manages real-time Firestore document subscriptions with reactive state.
 * Uses Svelte 5 runes for optimal reactivity and performance.
 *
 * @class FirekitDoc
 * @template T Document data type
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * // Create document subscription
 * const userDoc = firekitDoc<User>('users/123', {
 *   id: '123',
 *   name: 'Loading...',
 *   email: ''
 * });
 *
 * // Access reactive state in Svelte component
 * $: if (userDoc.loading) {
 *   console.log('Loading user...');
 * } else if (userDoc.error) {
 *   console.error('Error:', userDoc.error);
 * } else if (userDoc.exists) {
 *   console.log('User data:', userDoc.data);
 * }
 * ```
 */
class FirekitDoc<T extends DocumentData = DocumentData> {
	/** Document reference */
	private docRef: DocumentReference<T> | null = null;

	/** Unsubscribe function for real-time listener */
	private unsubscribe: Unsubscribe | null = null;

	/** Configuration options */
	private options: DocumentOptions;

	// ========================================
	// REACTIVE STATE (Svelte 5 Runes)
	// ========================================

	/** Current document data - reactive */
	private _data = $state<T | null>(null);

	/** Loading state - reactive */
	private _loading = $state(true);

	/** Error state - reactive */
	private _error = $state<DocumentError | null>(null);

	/** Document exists state - reactive */
	private _exists = $state(false);

	// ========================================
	// ENHANCED DERIVED STATE
	// ========================================

	/** Computed document state with all reactive properties */
	private _computedState = $derived({
		data: this._data,
		loading: this._loading,
		error: this._error,
		exists: this._exists,
		id: this.docRef?.id ?? '',
		isEmpty: !this._data && !this._loading && !this._error,
		isReady: !this._loading && !this._error,
		hasData: !!this._data,
		canRetry: this._error?.isRetryable() ?? false,
		isStale: this._data && this.isStale(300000), // 5 minutes default
		status: this.getStatus()
	});

	/** Derived: Whether document is in a valid state for operations */
	private _isValid = $derived(this.docRef !== null && !this._loading && !this._error);

	/** Derived: Whether document can be refreshed */
	private _canRefresh = $derived(this.docRef !== null && !this._loading);

	/** Derived: Whether document has pending operations */
	private _hasPendingOperations = $derived<boolean>(
		this._loading || (this._error ? this._error.isRetryable() : false)
	);

	/**
	 * Creates a document subscription with real-time updates
	 *
	 * @param ref Document path or DocumentReference
	 * @param startWith Initial data to show while loading
	 * @param options Configuration options
	 */
	constructor(ref: string | DocumentReference<T>, startWith?: T, options: DocumentOptions = {}) {
		this.options = {
			realtime: true,
			includeMetadata: false,
			source: 'default',
			...options
		};

		// Set initial data if provided
		if (startWith) {
			this.updateState({
				data: startWith,
				exists: true,
				loading: false,
				error: null
			});
		}

		// Only initialize in browser environment
		if (browser) {
			this.initializeDocument(ref);
		}
	}

	/**
	 * Initialize document reference and subscription
	 */
	private async initializeDocument(ref: string | DocumentReference<T>): Promise<void> {
		try {
			const firestore = firebaseService.getDbInstance();
			if (!firestore) {
				throw new DocumentError(
					DocumentErrorCode.FIRESTORE_UNAVAILABLE,
					'Firestore instance not available'
				);
			}

			// Create document reference
			this.docRef = typeof ref === 'string' ? (doc(firestore, ref) as DocumentReference<T>) : ref;

			// Set up real-time listener or one-time fetch
			if (this.options.realtime) {
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
	private setupRealtimeListener(): void {
		if (!this.docRef) return;

		const options = {
			includeMetadataChanges: this.options.includeMetadata
		};

		this.unsubscribe = onSnapshot(
			this.docRef,
			options,
			(snapshot: DocumentSnapshot<T>) => {
				this.processSnapshot(snapshot);
			},
			(error) => {
				this.handleError(error);
			}
		);
	}

	/**
	 * Fetch document data once (no real-time updates)
	 */
	private async fetchOnce(): Promise<void> {
		if (!this.docRef) return;

		try {
			this.updateState({ loading: true });
			const snapshot = await getDoc(this.docRef);
			this.processSnapshot(snapshot);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Process document snapshot and update state
	 */
	private processSnapshot(snapshot: DocumentSnapshot<T>): void {
		try {
			const exists = snapshot.exists();
			const data = exists ? snapshot.data() : null;

			// Add document ID to data if it exists
			const processedData = data
				? ({
						...data,
						id: snapshot.id
					} as T)
				: null;

			// Update reactive state atomically
			this.updateState({
				data: processedData,
				exists,
				loading: false,
				error: null
			});
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Handle and process errors
	 */
	private handleError(error: any): void {
		let documentError: DocumentError;

		if (error instanceof DocumentError) {
			documentError = error;
		} else {
			// Map Firestore errors to DocumentError
			const code = this.mapFirestoreErrorCode(error.code);
			documentError = new DocumentError(code, error.message, error);
		}

		this.updateState({
			error: documentError,
			loading: false
		});

		console.error('FirekitDoc error:', documentError);
	}

	/**
	 * Map Firestore error codes to DocumentErrorCode
	 */
	private mapFirestoreErrorCode(firestoreCode: string): DocumentErrorCode {
		switch (firestoreCode) {
			case 'permission-denied':
				return DocumentErrorCode.PERMISSION_DENIED;
			case 'not-found':
				return DocumentErrorCode.NOT_FOUND;
			case 'unavailable':
				return DocumentErrorCode.UNAVAILABLE;
			case 'deadline-exceeded':
				return DocumentErrorCode.TIMEOUT;
			case 'cancelled':
				return DocumentErrorCode.CANCELLED;
			default:
				return DocumentErrorCode.UNKNOWN;
		}
	}

	// ========================================
	// REACTIVE METHODS
	// ========================================

	/**
	 * Reactive method: Automatically retry if error is retryable
	 * @returns Promise that resolves when retry is complete
	 */
	async retryIfNeeded(): Promise<void> {
		if (this._computedState.canRetry) {
			await this.refresh();
		}
	}

	/**
	 * Reactive method: Refresh if data is stale
	 * @param maxAge Maximum age in milliseconds
	 * @returns Promise that resolves when refresh is complete
	 */
	async refreshIfStale(maxAge: number = 300000): Promise<void> {
		if (this._computedState.isStale) {
			await this.refresh();
		}
	}

	/**
	 * Reactive method: Get fresh data if not ready
	 * @returns Promise resolving to document data
	 */
	async ensureReady(): Promise<T | null> {
		if (!this._computedState.isReady) {
			await this.refresh();
		}
		return this._data;
	}

	// ========================================
	// STATE MANAGEMENT
	// ========================================

	/**
	 * Update state atomically with partial updates
	 * @param updates Partial state updates
	 */
	private updateState(
		updates: Partial<{
			data: T | null;
			loading: boolean;
			error: DocumentError | null;
			exists: boolean;
		}>
	): void {
		if (updates.data !== undefined) this._data = updates.data;
		if (updates.loading !== undefined) this._loading = updates.loading;
		if (updates.error !== undefined) this._error = updates.error;
		if (updates.exists !== undefined) this._exists = updates.exists;
	}

	/**
	 * Get human-readable status string
	 * @returns Status description
	 */
	private getStatus(): string {
		if (this._loading) return 'loading';
		if (this._error) return 'error';
		if (this._exists) return 'exists';
		return 'not-found';
	}

	// ========================================
	// PUBLIC GETTERS (Reactive State)
	// ========================================

	/**
	 * Get current document data
	 * @returns Current document data or null
	 */
	get data(): T | null {
		return this._data;
	}

	/**
	 * Get document ID
	 * @returns Document ID or empty string if not available
	 */
	get id(): string {
		return this.docRef?.id ?? '';
	}

	/**
	 * Get loading state
	 * @returns True if document is currently loading
	 */
	get loading(): boolean {
		return this._loading;
	}

	/**
	 * Get error state
	 * @returns Current error or null if no error
	 */
	get error(): DocumentError | null {
		return this._error;
	}

	/**
	 * Check if document exists
	 * @returns True if document exists in Firestore
	 */
	get exists(): boolean {
		return this._exists;
	}

	/**
	 * Get document reference
	 * @returns Firestore DocumentReference
	 * @throws DocumentError if reference is not available
	 */
	get ref(): DocumentReference<T> {
		if (!this.docRef) {
			throw new DocumentError(
				DocumentErrorCode.REFERENCE_UNAVAILABLE,
				'Document reference is not available'
			);
		}
		return this.docRef;
	}

	/**
	 * Get current document state summary
	 * @returns Complete document state object
	 */
	get state(): DocumentState<T> {
		return {
			data: this._data,
			exists: this._exists,
			loading: this._loading,
			error: this._error,
			id: this.id
		};
	}

	/**
	 * Get enhanced computed state
	 * @returns Computed state with additional reactive properties
	 */
	get computedState() {
		return this._computedState;
	}

	/**
	 * Check if document is in valid state for operations
	 * @returns True if document can be operated on
	 */
	get isValid(): boolean {
		return this._isValid;
	}

	/**
	 * Check if document can be refreshed
	 * @returns True if refresh operation is available
	 */
	get canRefresh(): boolean {
		return this._canRefresh;
	}

	/**
	 * Check if document has pending operations
	 * @returns True if there are ongoing operations
	 */
	get hasPendingOperations(): boolean {
		return this._hasPendingOperations;
	}

	// ========================================
	// PUBLIC METHODS
	// ========================================

	/**
	 * Manually refresh document data
	 * @returns Promise that resolves when refresh is complete
	 */
	async refresh(): Promise<void> {
		if (!this.docRef) {
			throw new DocumentError(
				DocumentErrorCode.REFERENCE_UNAVAILABLE,
				'Cannot refresh: document reference not available'
			);
		}

		try {
			this.updateState({ loading: true });
			const snapshot = await getDoc(this.docRef);
			this.processSnapshot(snapshot);
		} catch (error) {
			this.handleError(error);
			throw error;
		}
	}

	/**
	 * Get fresh data from server (bypassing cache)
	 * @returns Promise resolving to fresh document data
	 */
	async getFromServer(): Promise<T | null> {
		if (!this.docRef) {
			throw new DocumentError(
				DocumentErrorCode.REFERENCE_UNAVAILABLE,
				'Cannot fetch: document reference not available'
			);
		}

		try {
			const snapshot = await getDoc(this.docRef);
			const data = snapshot.exists() ? snapshot.data() : null;
			return data ? ({ ...data, id: snapshot.id } as T) : null;
		} catch (error) {
			this.handleError(error);
			throw error;
		}
	}

	/**
	 * Switch between realtime and one-time fetch modes
	 * @param realtime Whether to enable real-time updates
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
	 * Check if document data is stale (for cache management)
	 * @param maxAge Maximum age in milliseconds
	 * @returns True if data is considered stale
	 */
	isStale(maxAge: number = 300000): boolean {
		// 5 minutes default
		if (!this._data || !('updatedAt' in this._data)) return false;

		const updatedAt = (this._data as any).updatedAt;
		if (!updatedAt?.toDate) return false;

		const now = new Date().getTime();
		const dataTime = updatedAt.toDate().getTime();
		return now - dataTime > maxAge;
	}

	/**
	 * Clean up resources and unsubscribe from listeners
	 */
	dispose(): void {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}

		// Reset state
		this.updateState({
			data: null,
			loading: false,
			error: null,
			exists: false
		});
		this.docRef = null;
	}
}

// ========================================
// FACTORY FUNCTIONS
// ========================================

/**
 * Creates a reactive document subscription with real-time updates
 *
 * @template T Document data type
 * @param ref Document path or DocumentReference
 * @param startWith Initial data to show while loading
 * @param options Configuration options
 * @returns FirekitDoc instance with reactive state
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * // Real-time document subscription
 * const userDoc = firekitDoc<User>('users/123', {
 *   id: '123',
 *   name: 'Loading...',
 *   email: ''
 * });
 *
 * // One-time fetch
 * const userDoc = firekitDoc<User>('users/123', undefined, {
 *   realtime: false
 * });
 *
 * // In Svelte component
 * $: if (userDoc.loading) {
 *   // Show loading state
 * } else if (userDoc.error) {
 *   // Handle error
 * } else if (userDoc.exists) {
 *   // Use userDoc.data
 * }
 *
 * // Use reactive methods
 * $: if (userDoc.computedState.canRetry) {
 *   userDoc.retryIfNeeded();
 * }
 * ```
 */
export function firekitDoc<T extends DocumentData = DocumentData>(
	ref: string | DocumentReference<T>,
	startWith?: T,
	options?: DocumentOptions
): FirekitDoc<T> {
	return new FirekitDoc(ref, startWith, options);
}

/**
 * Creates a one-time document fetch (no real-time updates)
 *
 * @template T Document data type
 * @param ref Document path or DocumentReference
 * @param startWith Initial data to show while loading
 * @returns FirekitDoc instance configured for one-time fetch
 *
 * @example
 * ```typescript
 * const userDoc = firekitDocOnce<User>('users/123');
 * ```
 */
export function firekitDocOnce<T extends DocumentData = DocumentData>(
	ref: string | DocumentReference<T>,
	startWith?: T
): FirekitDoc<T> {
	return new FirekitDoc(ref, startWith, { realtime: false });
}

/**
 * Creates a document subscription with metadata changes included
 *
 * @template T Document data type
 * @param ref Document path or DocumentReference
 * @param startWith Initial data to show while loading
 * @returns FirekitDoc instance with metadata tracking
 *
 * @example
 * ```typescript
 * const userDoc = firekitDocWithMetadata<User>('users/123');
 * ```
 */
export function firekitDocWithMetadata<T extends DocumentData = DocumentData>(
	ref: string | DocumentReference<T>,
	startWith?: T
): FirekitDoc<T> {
	return new FirekitDoc(ref, startWith, {
		realtime: true,
		includeMetadata: true
	});
}
