import {
	getRemoteConfig,
	fetchAndActivate,
	fetchConfig,
	activate,
	getValue,
	getString,
	getBoolean,
	getNumber,
	getAll,
	onConfigUpdate,
	isSupported,
	setLogLevel,
	type RemoteConfig,
	type Value
} from 'firebase/remote-config';
import { firebaseService } from '../firebase.js';

function getApp() {
	const app = firebaseService.getFirebaseApp();
	if (!app) throw new Error('Firebase app is not initialized.');
	return app;
}

/**
 * Reactive Firebase Remote Config service.
 *
 * Fetches and activates remote configuration values, exposes them reactively,
 * and optionally subscribes to real-time config updates.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitRemoteConfig } from 'svelte-firekit';
 *
 *   const rc = firekitRemoteConfig({
 *     defaults: { welcomeMessage: 'Hello!', featureEnabled: false },
 *     minimumFetchIntervalMs: 3600_000
 *   });
 *   await rc.fetchAndActivate();
 * </script>
 * <p>{rc.getString('welcomeMessage')}</p>
 * ```
 */
export class FirekitRemoteConfig {
	private _loading = $state(false);
	private _error = $state<Error | null>(null);
	private _lastFetchTime = $state<Date | null>(null);
	private _activated = $state(false);
	/** Bumped whenever config is activated, so derived reads stay reactive. */
	private _version = $state(0);

	private _rc: RemoteConfig | null = null;
	private _unsubscribe: (() => void) | null = null;
	private _options: FirekitRemoteConfigOptions;

	constructor(options: FirekitRemoteConfigOptions = {}) {
		this._options = options;
		this._init();
	}

	get loading(): boolean { return this._loading; }
	get error(): Error | null { return this._error; }
	get activated(): boolean { return this._activated; }
	get lastFetchTime(): Date | null { return this._lastFetchTime; }

	private async _init(): Promise<void> {
		if (typeof window === 'undefined') return;

		try {
			const supported = await isSupported();
			if (!supported) return;

			const app = getApp();
			this._rc = getRemoteConfig(app);

			if (this._options.minimumFetchIntervalMs !== undefined) {
				this._rc.settings.minimumFetchIntervalMillis = this._options.minimumFetchIntervalMs;
			}
			if (this._options.fetchTimeoutMs !== undefined) {
				this._rc.settings.fetchTimeoutMillis = this._options.fetchTimeoutMs;
			}
			if (this._options.defaults) {
				this._rc.defaultConfig = this._options.defaults as Record<string, string | number | boolean>;
			}
			if (this._options.logLevel) {
				setLogLevel(this._rc, this._options.logLevel);
			}

			if (this._options.autoFetch !== false) {
				await this.fetchAndActivate();
			}

			if (this._options.realtime) {
				this._subscribeToUpdates();
			}
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
		}
	}

	private _subscribeToUpdates(): void {
		if (!this._rc) return;
		this._unsubscribe = onConfigUpdate(this._rc, {
			next: async () => {
				try {
					await activate(this._rc!);
					this._version++;
					this._activated = true;
				} catch (err) {
					this._error = err instanceof Error ? err : new Error(String(err));
				}
			},
			error: (err) => {
				this._error = err instanceof Error ? err : new Error(String(err));
				// Clean up the broken subscription so it doesn't keep firing errors
				this._unsubscribe?.();
				this._unsubscribe = null;
			},
			complete: () => {}
		});
	}

	// ── Fetch / activate ──────────────────────────────────────────────────────

	/** Fetches fresh config from the server and activates it. */
	async fetchAndActivate(): Promise<boolean> {
		if (!this._rc) return false;
		this._loading = true;
		this._error = null;
		try {
			const changed = await fetchAndActivate(this._rc);
			this._activated = true;
			this._lastFetchTime = new Date();
			this._version++;
			return changed;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			return false;
		} finally {
			this._loading = false;
		}
	}

	/** Fetches config without activating. */
	async fetch(): Promise<void> {
		if (!this._rc) return;
		this._loading = true;
		this._error = null;
		try {
			await fetchConfig(this._rc);
			this._lastFetchTime = new Date();
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
		} finally {
			this._loading = false;
		}
	}

	/** Activates the last fetched config. */
	async activate(): Promise<boolean> {
		if (!this._rc) return false;
		const changed = await activate(this._rc);
		if (changed) {
			this._activated = true;
			this._version++;
		}
		return changed;
	}

	// ── Value accessors ───────────────────────────────────────────────────────

	/** Returns a string config value. Uses default if not set. */
	getString(key: string, defaultValue = ''): string {
		void this._version; // reactive dependency — ensures re-evaluation when config is activated // reactive dependency
		if (!this._rc) return defaultValue;
		return getString(this._rc, key) || defaultValue;
	}

	/** Returns a boolean config value. */
	getBoolean(key: string, defaultValue = false): boolean {
		void this._version; // reactive dependency — ensures re-evaluation when config is activated
		if (!this._rc) return defaultValue;
		try { return getBoolean(this._rc, key); } catch { return defaultValue; }
	}

	/** Returns a number config value. */
	getNumber(key: string, defaultValue = 0): number {
		void this._version; // reactive dependency — ensures re-evaluation when config is activated
		if (!this._rc) return defaultValue;
		try { return getNumber(this._rc, key); } catch { return defaultValue; }
	}

	/** Returns the raw Value object for a key. */
	getValue(key: string): Value | null {
		void this._version; // reactive dependency — ensures re-evaluation when config is activated
		if (!this._rc) return null;
		return getValue(this._rc, key);
	}

	/** Returns all config key-value pairs as a plain object. */
	getAll(): Record<string, Value> {
		void this._version; // reactive dependency — ensures re-evaluation when config is activated
		if (!this._rc) return {};
		return getAll(this._rc);
	}

	/** Stops the real-time config update listener. */
	dispose(): void {
		this._unsubscribe?.();
		this._unsubscribe = null;
	}
}

export interface FirekitRemoteConfigOptions {
	/** Default values applied before remote values are fetched. */
	defaults?: Record<string, string | number | boolean>;
	/** Minimum interval between fetches in ms. Default: 43200000 (12h). */
	minimumFetchIntervalMs?: number;
	/** Fetch timeout in ms. Default: 60000 (60s). */
	fetchTimeoutMs?: number;
	/** Automatically fetch + activate on init. Default: true. */
	autoFetch?: boolean;
	/** Subscribe to real-time config updates. Default: false. */
	realtime?: boolean;
	/** SDK log level. */
	logLevel?: 'debug' | 'error' | 'silent';
}

/** Creates a reactive Remote Config instance. */
export function firekitRemoteConfig(options?: FirekitRemoteConfigOptions): FirekitRemoteConfig {
	return new FirekitRemoteConfig(options);
}
