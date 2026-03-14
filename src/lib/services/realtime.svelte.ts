import {
	ref,
	onValue,
	push,
	set,
	update,
	remove,
	get,
	serverTimestamp,
	increment,
	type DatabaseReference,
	type DataSnapshot
} from 'firebase/database';
import { firebaseService } from '../firebase.js';

function getDb() {
	const db = firebaseService.getDatabaseInstance();
	if (!db) throw new Error('Realtime Database is not initialized.');
	return db;
}

/**
 * Reactive Firebase Realtime Database node subscription.
 *
 * Subscribes to a database path and exposes reactive state via Svelte 5 runes.
 * Supports read and write operations on the same reference.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitNode } from 'svelte-firekit';
 *   const chat = firekitNode<ChatMessage>('chats/room1');
 * </script>
 * {#if chat.loading}Loading…{/if}
 * {#if chat.data}{chat.data.text}{/if}
 * ```
 */
export class FirekitNode<T = unknown> {
	// ── Reactive state ────────────────────────────────────────────────────────

	private _data = $state<T | null>(null);
	private _loading = $state(true);
	private _error = $state<Error | null>(null);

	// ── Internal ──────────────────────────────────────────────────────────────

	private _ref: DatabaseReference | null = null;
	private _unsubscribe: (() => void) | null = null;
	private _path: string;

	constructor(path: string, startWith?: T) {
		this._path = path;
		if (startWith !== undefined) this._data = startWith;
		this._init();
	}

	// ── Public getters ────────────────────────────────────────────────────────

	get data(): T | null { return this._data; }
	get loading(): boolean { return this._loading; }
	get error(): Error | null { return this._error; }
	get path(): string { return this._path; }

	get ref(): DatabaseReference {
		if (!this._ref) throw new Error('Database reference is not available.');
		return this._ref;
	}

	// ── Initialization ────────────────────────────────────────────────────────

	private _init(): void {
		if (typeof window === 'undefined') {
			this._loading = false;
			return;
		}

		try {
			const db = getDb();
			this._ref = ref(db, this._path);

			this._unsubscribe = onValue(
				this._ref,
				(snap: DataSnapshot) => {
					this._data = snap.val() as T | null;
					this._error = null;
					this._loading = false;
				},
				(err) => {
					this._error = err;
					this._loading = false;
				}
			);
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			this._loading = false;
		}
	}

	// ── Write operations ──────────────────────────────────────────────────────

	/** Pushes a new child node (list append). Returns the new key, or null on failure. */
	async push(data: T): Promise<string | null> {
		if (!this._ref) return null;
		const newRef = push(this._ref);
		await set(newRef, data);
		return newRef.key;
	}

	/** Overwrites the node with new data. */
	async set(data: T): Promise<void> {
		if (!this._ref) return;
		await set(this._ref, data);
	}

	/** Merges partial data into the node (shallow merge). */
	async update(data: Partial<T>): Promise<void> {
		if (!this._ref) return;
		await update(this._ref, data as Record<string, unknown>);
	}

	/** Deletes the node. */
	async remove(): Promise<void> {
		if (!this._ref) return;
		await remove(this._ref);
	}

	/** One-time fetch of current data (no subscription). */
	async fetchOnce(): Promise<T | null> {
		if (!this._ref) return null;
		const snap = await get(this._ref);
		return snap.val() as T | null;
	}

	/** Stops the real-time listener. */
	dispose(): void {
		this._unsubscribe?.();
		this._unsubscribe = null;
	}
}

/**
 * Reactive RTDB list — subscribes to a node and exposes its children as
 * a typed array with each item's key injected as `id`.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitNodeList } from 'svelte-firekit';
 *   const messages = firekitNodeList<Message>('rooms/123/messages');
 * </script>
 * {#each messages.list as msg}
 *   <p>{msg.id}: {msg.text}</p>
 * {/each}
 * ```
 */
export class FirekitNodeList<T = unknown> extends FirekitNode<Record<string, T>> {
	readonly list = $derived(
		this.data
			? Object.entries(this.data).map(([key, value]) => ({
					id: key,
					...(value as object)
				})) as Array<T & { id: string }>
			: ([] as Array<T & { id: string }>)
	);
}

// ── Field value helpers ───────────────────────────────────────────────────────

/** RTDB server timestamp sentinel. */
export const rtdbServerTimestamp = serverTimestamp;

/** RTDB increment sentinel. */
export const rtdbIncrement = increment;

// ── Factory functions ─────────────────────────────────────────────────────────

/**
 * Creates a reactive RTDB node subscription.
 */
export function firekitNode<T = unknown>(path: string, startWith?: T): FirekitNode<T> {
	return new FirekitNode<T>(path, startWith);
}

/**
 * Creates a reactive RTDB node subscription that exposes children as an array.
 */
export function firekitNodeList<T = unknown>(
	path: string,
	startWith?: T[]
): FirekitNodeList<T> {
	let startRecord: Record<string, T> | undefined;
	if (startWith) {
		startRecord = Object.fromEntries(startWith.map((item, i) => [`__init_${i}`, item]));
	}
	return new FirekitNodeList<T>(path, startRecord);
}
