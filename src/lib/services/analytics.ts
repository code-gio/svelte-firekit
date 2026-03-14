import {
	getAnalytics,
	logEvent,
	setUserId,
	setUserProperties,
	setDefaultEventParameters,
	setAnalyticsCollectionEnabled,
	setConsent,
	isSupported,
	type Analytics,
	type ConsentSettings
} from 'firebase/analytics';
import { firebaseService } from '../firebase.js';

function getApp() {
	const app = firebaseService.getFirebaseApp();
	if (!app) throw new Error('Firebase app is not initialized.');
	return app;
}

/**
 * Firebase Analytics wrapper.
 *
 * Lazily initializes Analytics (checks `isSupported()` first) and
 * provides a clean, typed API for event logging and user properties.
 *
 * @example
 * ```ts
 * import { firekitAnalytics } from 'svelte-firekit';
 *
 * firekitAnalytics.logEvent('purchase', { value: 9.99, currency: 'USD' });
 * firekitAnalytics.setUserId(user.uid);
 * ```
 */
class FirekitAnalytics {
	private static instance: FirekitAnalytics;
	private _analytics: Analytics | null = null;
	private _initPromise: Promise<void> | null = null;

	private constructor() {}

	static getInstance(): FirekitAnalytics {
		if (!FirekitAnalytics.instance) {
			FirekitAnalytics.instance = new FirekitAnalytics();
		}
		return FirekitAnalytics.instance;
	}

	private _init(): Promise<void> {
		if (this._initPromise) return this._initPromise;
		this._initPromise = (async () => {
			if (typeof window === 'undefined') return;
			const supported = await isSupported();
			if (!supported) return;
			this._analytics = getAnalytics(getApp());
		})();
		return this._initPromise;
	}

	private async _get(): Promise<Analytics | null> {
		await this._init();
		return this._analytics;
	}

	// ── Event logging ─────────────────────────────────────────────────────────

	/**
	 * Logs a custom or standard analytics event.
	 *
	 * @example
	 * ```ts
	 * firekitAnalytics.logEvent('sign_up', { method: 'google' });
	 * firekitAnalytics.logEvent('page_view', { page_title: 'Home' });
	 * ```
	 */
	async logEvent(
		eventName: string,
		eventParams?: Record<string, unknown>
	): Promise<void> {
		const a = await this._get();
		if (!a) return;
		logEvent(a, eventName, eventParams);
	}

	// ── User identity ─────────────────────────────────────────────────────────

	/**
	 * Sets the Analytics user ID.
	 * Pass `null` to clear the user ID (e.g. on sign-out).
	 */
	async setUserId(id: string | null): Promise<void> {
		const a = await this._get();
		if (!a) return;
		setUserId(a, id);
	}

	/**
	 * Sets Analytics user properties.
	 *
	 * @example
	 * ```ts
	 * firekitAnalytics.setUserProperties({ plan: 'pro', locale: 'en-US' });
	 * ```
	 */
	async setUserProperties(properties: Record<string, string | null>): Promise<void> {
		const a = await this._get();
		if (!a) return;
		setUserProperties(a, properties);
	}

	// ── Screen / page tracking ────────────────────────────────────────────────

	/**
	 * Logs a screen_view event.
	 *
	 * @example
	 * ```ts
	 * firekitAnalytics.setCurrentScreen('ProductDetail');
	 * ```
	 */
	async setCurrentScreen(screenName: string): Promise<void> {
		const a = await this._get();
		if (!a) return;
		logEvent(a, 'screen_view' as string, { screen_name: screenName });
	}

	// ── Defaults & consent ────────────────────────────────────────────────────

	/**
	 * Sets default parameters that will be included with every logged event.
	 */
	async setDefaultEventParameters(params: Record<string, unknown> | null): Promise<void> {
		await this._get();
		if (params) setDefaultEventParameters(params);
	}

	/**
	 * Enables or disables Analytics data collection.
	 * Useful for respecting user consent.
	 */
	async setCollectionEnabled(enabled: boolean): Promise<void> {
		const a = await this._get();
		if (!a) return;
		setAnalyticsCollectionEnabled(a, enabled);
	}

	/**
	 * Updates consent settings (GDPR, CCPA, etc.).
	 *
	 * @example
	 * ```ts
	 * firekitAnalytics.setConsent({
	 *   analytics_storage: 'granted',
	 *   ad_storage: 'denied'
	 * });
	 * ```
	 */
	async setConsent(settings: ConsentSettings): Promise<void> {
		const a = await this._get();
		if (!a) return;
		setConsent(settings);
	}
}

export const firekitAnalytics = FirekitAnalytics.getInstance();
