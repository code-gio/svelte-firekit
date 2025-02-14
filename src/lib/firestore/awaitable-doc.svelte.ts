/**
 * @module FirekitAwaitableDoc
 */

import { doc, getDoc, onSnapshot, type DocumentReference, type DocumentData } from "firebase/firestore";
import { firebaseService } from "../firebase.js";
import { browser } from "$app/environment";

/**
 * Provides real-time document subscription with state management.
 * Automatically handles document data updates, loading states, and error handling.
 * 
 * @class
 * @template T Type of document data
 * @example
 * ```typescript
 * interface UserProfile {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 * 
 * // Create document subscription
 * const userDoc = firekitAwaitableDoc<UserProfile>(
 *   'users/123',
 *   { id: '123', name: 'Loading...', email: '' }
 * );
 * 
 * // Access reactive state
 * if (userDoc.loading) {
 *   console.log('Loading user data...');
 * } else if (userDoc.error) {
 *   console.error('Error:', userDoc.error);
 * } else {
 *   console.log('User data:', userDoc.data);
 * }
 * 
 * // Get fresh data
 * const freshData = await userDoc.getData();
 * ```
 */
class FirekitAwaitableDoc<T> {
    /**
     * Current document data.
     * Uses SvelteKit's $state for reactivity.
     * @private
     */
    private _data = $state<T | null>(null);

    /**
     * Loading state indicator.
     * Uses SvelteKit's $state for reactivity.
     * @private
     */
    private _loading = $state(true);

    /**
     * Error state container.
     * Uses SvelteKit's $state for reactivity.
     * @private
     */
    private _error = $state<Error | null>(null);

    /**
     * Firestore document reference.
     * @private
     */
    private docRef: DocumentReference<T> | null = null;

    /**
     * Creates a document subscription.
     * Initializes document subscription if in browser environment.
     * 
     * @param {string | DocumentReference<T>} ref - Document path or reference
     * @param {T} [startWith] - Initial data before fetch completes
     * 
     * @example
     * ```typescript
     * const doc = new FirekitAwaitableDoc('users/123', defaultUser);
     * ```
     */
    constructor(ref: string | DocumentReference<T>, startWith?: T) {
        this._data = startWith ?? null;

        if (browser) {
            this.initializeDoc(ref);
        }
    }

    /**
     * Initializes document subscription.
     * Sets up real-time updates and handles initial data fetch.
     * 
     * @private
     * @param {string | DocumentReference<T>} ref - Document path or reference
     * @returns {Promise<void>}
     * 
     * @throws {Error} If document initialization fails
     */
    private async initializeDoc(ref: string | DocumentReference<T>): Promise<void> {
        try {
            const firestore = firebaseService.getDbInstance();
            this.docRef = typeof ref === "string"
                ? (doc(firestore, ref) as DocumentReference<T>)
                : ref;

            // Initial fetch
            const snapshot = await getDoc(this.docRef);
            this._data = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as T : null;

            // Setup real-time updates
            onSnapshot(
                this.docRef,
                (snapshot) => {
                    this._data = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as T : null;
                    this._loading = false;
                    this._error = null;
                },
                (error) => {
                    this._error = error;
                    this._loading = false;
                }
            );
        } catch (error) {
            this._error = error as Error;
            this._loading = false;
        }
    }

    /**
     * Fetches fresh document data.
     * Makes a new request to Firestore instead of using cached data.
     * 
     * @returns {Promise<T | null>} Document data or null if not found
     * 
     * @example
     * ```typescript
     * const freshData = await doc.getData();
     * if (freshData) {
     *   console.log('Fresh data:', freshData);
     * }
     * ```
     */
    async getData(): Promise<T | null> {
        if (!this.docRef) return null;
        const snapshot = await getDoc(this.docRef);
        return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as T : null;
    }

    /**
     * Gets current document data.
     * @returns {T | null} Current document data or null if not loaded
     */
    get data(): T | null {
        return this._data;
    }

    /**
     * Gets current loading state.
     * @returns {boolean} True if document is loading
     */
    get loading(): boolean {
        return this._loading;
    }

    /**
     * Gets current error state.
     * @returns {Error | null} Error object if an error occurred, null otherwise
     */
    get error(): Error | null {
        return this._error;
    }
}

/**
 * Creates a document subscription.
 * Factory function for creating FirekitAwaitableDoc instances.
 * 
 * @template T Document data type
 * @param {string} path Document path
 * @param {T} [startWith] Initial data before fetch completes
 * @returns {FirekitAwaitableDoc<T>} Document subscription instance
 * 
 * @example
 * ```typescript
 * interface UserProfile {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 * 
 * const userDoc = firekitAwaitableDoc<UserProfile>(
 *   'users/123',
 *   { id: '123', name: 'Loading...', email: '' }
 * );
 * ```
 */
export function firekitAwaitableDoc<T extends DocumentData>(
    path: string,
    startWith?: T
): FirekitAwaitableDoc<T> {
    return new FirekitAwaitableDoc<T>(path, startWith);
}