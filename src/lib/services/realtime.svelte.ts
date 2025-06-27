/**
 * @fileoverview FirekitRealtimeDB - Optimized Realtime Database management for Svelte applications
 * @module FirekitRealtimeDB
 * @version 1.0.0
 */

import {
	ref,
	onValue,
	push,
	set,
	update,
	remove,
	type DatabaseReference,
	type DataSnapshot
} from 'firebase/database';
import { firebaseService } from '../firebase.js';
import { browser } from '$app/environment';

/**
 * Manages real-time Firebase Realtime Database subscriptions with reactive state
 * @class
 * @template T Data type
 *
 * @example
 * ```typescript
 * interface ChatMessage {
 *   text: string;
 *   userId: string;
 *   timestamp: number;
 * }
 *
 * // Create regular reference
 * const chatRef = firekitRealtimeDB<ChatMessage>('chats/123');
 *
 * // Create list reference
 * const messagesList = firekitRealtimeList<ChatMessage>('messages');
 * ```
 */
class FirekitRealtimeDB<T> {
	/** Current data */
	private _data = $state<T | null>(null);
	/** Loading state */
	private _loading = $state(true);
	/** Error state */
	private _error = $state<Error | null>(null);
	/** Database reference */
	private dbRef: DatabaseReference | null = null;
	/** Subscription cleanup function */
	private unsubscribe: (() => void) | null = null;

	/**
	 * Creates a Realtime Database subscription
	 * @param {string} path Database path
	 * @param {T} [startWith] Initial data before fetch completes
	 */
	constructor(path: string, startWith?: T) {
		this._data = startWith ?? null;

		if (browser) {
			this.initializeRealtimeDB(path);
		}
	}

	/**
	 * Initializes database subscription
	 * @private
	 * @param {string} path Database path
	 */
	private initializeRealtimeDB(path: string) {
		try {
			const database = firebaseService.getDatabaseInstance();
			if (!database) {
				throw new Error('Database instance not available');
			}

			this.dbRef = ref(database, path);

			this.unsubscribe = onValue(
				this.dbRef,
				(snapshot: DataSnapshot) => {
					this._data = snapshot.val();
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
	 * Pushes new data to list
	 * @param {T} data Data to push
	 * @returns {Promise<string | null>} New item key or null if failed
	 *
	 * @example
	 * ```typescript
	 * const key = await chatRef.push({
	 *   text: 'Hello',
	 *   userId: '123',
	 *   timestamp: Date.now()
	 * });
	 * ```
	 */
	async push(data: T): Promise<string | null> {
		if (!this.dbRef) return null;
		const newRef = push(this.dbRef);
		await set(newRef, data);
		return newRef.key;
	}

	/**
	 * Sets data at reference
	 * @param {T} data Data to set
	 *
	 * @example
	 * ```typescript
	 * await chatRef.set({
	 *   text: 'Updated message',
	 *   userId: '123',
	 *   timestamp: Date.now()
	 * });
	 * ```
	 */
	async set(data: T): Promise<void> {
		if (!this.dbRef) return;
		await set(this.dbRef, data);
	}

	/**
	 * Updates data at reference
	 * @param {Partial<T>} data Data to update
	 *
	 * @example
	 * ```typescript
	 * await chatRef.update({
	 *   text: 'Edited message'
	 * });
	 * ```
	 */
	async update(data: Partial<T>): Promise<void> {
		if (!this.dbRef) return;
		await update(this.dbRef, data);
	}

	/**
	 * Removes data at reference
	 *
	 * @example
	 * ```typescript
	 * await chatRef.remove();
	 * ```
	 */
	async remove(): Promise<void> {
		if (!this.dbRef) return;
		await remove(this.dbRef);
	}

	/** Gets current data */
	get data(): T | null {
		return this._data;
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
	 * Gets database reference
	 * @throws {Error} If reference is not available
	 */
	get ref(): DatabaseReference {
		if (!this.dbRef) {
			throw new Error('Database reference is not available');
		}
		return this.dbRef;
	}

	/** Cleanup subscription */
	dispose(): void {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
	}
}

/**
 * Creates a reactive Realtime Database reference
 * @template T Data type
 * @param {string} path Database path
 * @param {T} [startWith] Initial data
 * @returns {FirekitRealtimeDB<T>} Database subscription instance
 *
 * @example
 * ```typescript
 * const chatRef = firekitRealtimeDB<ChatMessage>('chats/123');
 * ```
 */
export function firekitRealtimeDB<T>(path: string, startWith?: T): FirekitRealtimeDB<T> {
	return new FirekitRealtimeDB<T>(path, startWith);
}

/**
 * Creates a reactive Realtime Database list reference
 * Automatically converts data to array format with IDs
 *
 * @template T List item type
 * @param {string} path Database path
 * @param {T[]} [startWith=[]] Initial array data
 * @returns {FirekitRealtimeDB} Database subscription instance with array support
 *
 * @example
 * ```typescript
 * const messagesList = firekitRealtimeList<ChatMessage>('messages');
 * console.log(messagesList.list); // Array of messages with IDs
 * ```
 */
export function firekitRealtimeList<T>(
	path: string,
	startWith: T[] = []
): FirekitRealtimeDB<Record<string, T>> & { list: Array<T & { id: string }> } {
	const startWithRecord = startWith.reduce(
		(acc, item, index) => {
			acc[`key${index}`] = item;
			return acc;
		},
		{} as Record<string, T>
	);

	return new (class extends FirekitRealtimeDB<Record<string, T>> {
		private _list = $derived(
			this.data
				? Object.entries(this.data).map(([key, value]) => ({
						id: key,
						...value
					}))
				: []
		);

		get list() {
			return this._list;
		}
	})(path, startWithRecord);
}
