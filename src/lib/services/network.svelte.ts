import {
	onSnapshotsInSync,
	enableNetwork,
	disableNetwork,
	waitForPendingWrites
} from 'firebase/firestore';
import { firebaseService } from '../firebase.js';
import { NetworkError, NetworkErrorCode } from '../types/network.js';

/**
 * Reactive network/offline status store.
 *
 * Tracks browser connectivity, Firestore sync state, and pending writes.
 * Provides manual control to go offline/online.
 *
 * @example
 * ```svelte
 * <script>
 *   import { firekitNetwork } from 'svelte-firekit';
 * </script>
 *
 * {#if !firekitNetwork.online}
 *   <p>You're offline. Changes will sync when reconnected.</p>
 * {/if}
 *
 * {#if firekitNetwork.hasPendingWrites}
 *   <p>Saving...</p>
 * {:else}
 *   <p>All changes saved</p>
 * {/if}
 * ```
 */
class FirekitNetwork {
	private static instance: FirekitNetwork;

	// ── Reactive state ──────────────────────────────────────────────────────
	private _online = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);
	private _synced = $state(true);
	private _hasPendingWrites = $state(false);
	private _initialized = $state(false);
	private _error = $state<NetworkError | null>(null);
	private _firestoreEnabled = $state(true);

	// ── Internal ────────────────────────────────────────────────────────────
	private _listening = false;
	private _db: ReturnType<typeof firebaseService.getDbInstance> | null = null;
	private _syncUnsub: (() => void) | null = null;
	private _onlineHandler: (() => void) | null = null;
	private _offlineHandler: (() => void) | null = null;

	private constructor() {}

	static getInstance(): FirekitNetwork {
		if (!FirekitNetwork.instance) {
			FirekitNetwork.instance = new FirekitNetwork();
		}
		return FirekitNetwork.instance;
	}

	private ensureListening(): void {
		if (this._listening || typeof window === 'undefined') return;

		try {
			const db = firebaseService.getDbInstance();
			if (!db) return;

			this._listening = true;

			// Browser online/offline events
			this._onlineHandler = () => { this._online = true; };
			this._offlineHandler = () => { this._online = false; };
			window.addEventListener('online', this._onlineHandler);
			window.addEventListener('offline', this._offlineHandler);

			// Firestore sync state — fires when all active listeners are caught up
			this._syncUnsub = onSnapshotsInSync(db, () => {
				this._synced = true;
				this._hasPendingWrites = false;
			});

			this._db = db;
			this._initialized = true;
		} catch {
			// Firestore not configured yet — will retry on next getter access
		}
	}

	/**
	 * Called by FirebaseApp or lazily on first getter access.
	 * Safe to call multiple times.
	 */
	initialize(): void {
		this.ensureListening();
	}

	// ── Public getters (reactive) ───────────────────────────────────────────

	/** Whether the browser has network connectivity. */
	get online(): boolean { this.ensureListening(); return this._online; }

	/** Whether all Firestore snapshots are in sync with the server. */
	get synced(): boolean { this.ensureListening(); return this._synced; }

	/** Whether there are unconfirmed Firestore writes. */
	get hasPendingWrites(): boolean { this.ensureListening(); return this._hasPendingWrites; }

	/** Whether the network store has been initialized. */
	get initialized(): boolean { return this._initialized; }

	/** Last error from network operations. */
	get error(): NetworkError | null { return this._error; }

	/** Whether Firestore network is currently enabled. */
	get firestoreEnabled(): boolean { return this._firestoreEnabled; }

	// ── Methods ─────────────────────────────────────────────────────────────

	/**
	 * Call this when you perform a Firestore write to track pending state.
	 * Uses `waitForPendingWrites` to automatically clear when the write is acknowledged.
	 */
	trackWrite(): void {
		this._hasPendingWrites = true;
		this._synced = false;

		if (this._db) {
			waitForPendingWrites(this._db)
				.then(() => {
					this._hasPendingWrites = false;
					this._synced = true;
				})
				.catch(() => {
					// Firestore may have been disabled
				});
		}
	}

	/** Enables Firestore network access (reconnects to server). */
	async goOnline(): Promise<void> {
		try {
			const db = firebaseService.getDbInstance();
			if (!db) throw new NetworkError(NetworkErrorCode.FIRESTORE_UNAVAILABLE, 'Firestore is not available.');
			await enableNetwork(db);
			this._firestoreEnabled = true;
			this._error = null;
		} catch (err) {
			if (err instanceof NetworkError) throw err;
			const error = new NetworkError(NetworkErrorCode.ENABLE_NETWORK_FAILED, 'Failed to enable network.', err);
			this._error = error;
			throw error;
		}
	}

	/** Disables Firestore network access (forces offline mode). */
	async goOffline(): Promise<void> {
		try {
			const db = firebaseService.getDbInstance();
			if (!db) throw new NetworkError(NetworkErrorCode.FIRESTORE_UNAVAILABLE, 'Firestore is not available.');
			await disableNetwork(db);
			this._firestoreEnabled = false;
			this._error = null;
		} catch (err) {
			if (err instanceof NetworkError) throw err;
			const error = new NetworkError(NetworkErrorCode.DISABLE_NETWORK_FAILED, 'Failed to disable network.', err);
			this._error = error;
			throw error;
		}
	}

	clearError(): void {
		this._error = null;
	}

	dispose(): void {
		this._listening = false;
		this._syncUnsub?.();
		this._syncUnsub = null;
		if (this._onlineHandler) {
			window.removeEventListener('online', this._onlineHandler);
			this._onlineHandler = null;
		}
		if (this._offlineHandler) {
			window.removeEventListener('offline', this._offlineHandler);
			this._offlineHandler = null;
		}
		this._initialized = false;
	}
}

export const firekitNetwork = FirekitNetwork.getInstance();
