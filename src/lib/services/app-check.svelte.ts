import {
	initializeAppCheck,
	getToken,
	getLimitedUseToken,
	onTokenChanged,
	setTokenAutoRefreshEnabled,
	type AppCheckOptions,
	type AppCheckTokenResult,
	type AppCheck
} from 'firebase/app-check';
import { firebaseService } from '../firebase.js';

export type { AppCheckOptions, AppCheckTokenResult };
export {
	ReCaptchaV3Provider,
	ReCaptchaEnterpriseProvider,
	CustomProvider
} from 'firebase/app-check';

/**
 * App Check service — secures all Firebase service calls with attestation tokens.
 *
 * **Must be initialized before any other Firebase service makes a network call.**
 * Use the `appCheckOptions` prop on `<FirebaseApp>`, or call `firekitAppCheck.initialize()`
 * manually as early as possible in your app lifecycle.
 *
 * Supports reCAPTCHA Enterprise, reCAPTCHA v3, and custom providers.
 *
 * @example Via FirebaseApp component
 * ```svelte
 * <FirebaseApp
 *   {config}
 *   appCheckOptions={{ provider: new ReCaptchaEnterpriseProvider('SITE_KEY'), isTokenAutoRefreshEnabled: true }}
 * >
 * ```
 *
 * @example Programmatic initialization
 * ```ts
 * import { firekitAppCheck, ReCaptchaEnterpriseProvider } from 'svelte-firekit';
 * firekitAppCheck.initialize({
 *   provider: new ReCaptchaEnterpriseProvider('SITE_KEY'),
 *   isTokenAutoRefreshEnabled: true
 * });
 * ```
 *
 * @example Debug mode in development
 * ```ts
 * // Set this BEFORE calling initialize() — Firebase SDK picks it up automatically
 * if (import.meta.env.DEV) {
 *   (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
 * }
 * firekitAppCheck.initialize({ provider: new ReCaptchaEnterpriseProvider('SITE_KEY') });
 * ```
 */
class FirekitAppCheck {
	private static instance: FirekitAppCheck;
	private appCheck: AppCheck | null = null;
	private unsubscribeToken: (() => void) | null = null;

	// ── Reactive state ───────────────────────────────────────────────────────────

	private _initialized = $state(false);
	private _loading = $state(false);
	private _error = $state<Error | null>(null);
	private _token = $state<string | null>(null);
	private _tokenExpireTime = $state<number | null>(null);

	// ── Derived ──────────────────────────────────────────────────────────────────

	private _isTokenValid = $derived(
		this._token !== null &&
			this._tokenExpireTime !== null &&
			this._tokenExpireTime > Date.now()
	);

	private constructor() {}

	static getInstance(): FirekitAppCheck {
		if (!FirekitAppCheck.instance) {
			FirekitAppCheck.instance = new FirekitAppCheck();
		}
		return FirekitAppCheck.instance;
	}

	// ── Public getters ───────────────────────────────────────────────────────────

	/** Whether App Check has been initialized. */
	get initialized(): boolean { return this._initialized; }

	/** True while a token request is in flight. */
	get loading(): boolean { return this._loading; }

	/** Last error from initialization or token fetch. */
	get error(): Error | null { return this._error; }

	/** The current App Check token string, or null if not yet acquired. */
	get token(): string | null { return this._token; }

	/** Whether the current token is present and has not expired locally. */
	get isTokenValid(): boolean { return this._isTokenValid; }

	// ── Initialization ───────────────────────────────────────────────────────────

	/**
	 * Initializes App Check. Must be called before any other Firebase network call.
	 * Idempotent — subsequent calls are no-ops.
	 */
	initialize(options: AppCheckOptions): void {
		if (this._initialized || typeof window === 'undefined') return;

		try {
			const app = firebaseService.getFirebaseApp();
			if (!app) throw new Error('Firebase app not initialized.');

			this.appCheck = initializeAppCheck(app, options);

			// Store the instance on firebaseService for other services to reference
			firebaseService.appCheck = this.appCheck;

			// Subscribe to token changes for reactive updates
			this.unsubscribeToken = onTokenChanged(
				this.appCheck,
				(tokenResult) => {
					this._token = tokenResult.token;
					this._error = null;
				},
				(err) => {
					this._error = err;
				}
			);

			this._initialized = true;
			this._error = null;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			throw this._error;
		}
	}

	// ── Token methods ────────────────────────────────────────────────────────────

	/**
	 * Returns the current App Check token, fetching a fresh one if needed.
	 * @param forceRefresh - Force a new token even if the current one is valid.
	 */
	async getToken(forceRefresh = false): Promise<AppCheckTokenResult | null> {
		if (!this.appCheck) return null;

		try {
			this._loading = true;
			const result = await getToken(this.appCheck, forceRefresh);
			this._token = result.token;
			this._error = null;
			return result;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			return null;
		} finally {
			this._loading = false;
		}
	}

	/**
	 * Returns a limited-use token (one-time use, not cached).
	 * Use this for sensitive operations like account deletion or payment flows.
	 */
	async getLimitedUseToken(): Promise<AppCheckTokenResult | null> {
		if (!this.appCheck) return null;

		try {
			this._loading = true;
			const result = await getLimitedUseToken(this.appCheck);
			this._error = null;
			return result;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			return null;
		} finally {
			this._loading = false;
		}
	}

	/**
	 * Enables or disables automatic background token refresh.
	 */
	setAutoRefresh(enabled: boolean): void {
		if (!this.appCheck) return;
		setTokenAutoRefreshEnabled(this.appCheck, enabled);
	}

	// ── Cleanup ──────────────────────────────────────────────────────────────────

	dispose(): void {
		this.unsubscribeToken?.();
		this.unsubscribeToken = null;
	}
}

export const firekitAppCheck = FirekitAppCheck.getInstance();
