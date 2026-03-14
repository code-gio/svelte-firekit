import {
	getPerformance,
	initializePerformance,
	trace,
	type FirebasePerformance,
	type PerformanceTrace
} from 'firebase/performance';
import { firebaseService } from '../firebase.js';

function getApp() {
	const app = firebaseService.getFirebaseApp();
	if (!app) throw new Error('Firebase app is not initialized.');
	return app;
}

/**
 * Firebase Performance Monitoring wrapper.
 *
 * Lazily initializes the Performance SDK and provides helpers for
 * creating and managing custom traces.
 *
 * @example
 * ```ts
 * import { firekitPerformance } from 'svelte-firekit';
 *
 * const perf = firekitPerformance();
 * const t = perf.startTrace('load-user-profile');
 * await loadUserProfile();
 * t.stop();
 * ```
 */
class FirekitPerformance {
	private static instance: FirekitPerformance;
	private _perf: FirebasePerformance | null = null;

	private constructor() {}

	static getInstance(): FirekitPerformance {
		if (!FirekitPerformance.instance) {
			FirekitPerformance.instance = new FirekitPerformance();
		}
		return FirekitPerformance.instance;
	}

	private _getOrInit(): FirebasePerformance | null {
		if (typeof window === 'undefined') return null;
		if (this._perf) return this._perf;
		try {
			const app = getApp();
			this._perf = getPerformance(app);
			return this._perf;
		} catch {
			return null;
		}
	}

	/**
	 * Starts a custom trace and returns it.
	 * Call `.stop()` when the measured operation completes.
	 *
	 * @example
	 * ```ts
	 * const t = firekitPerformance.startTrace('checkout-flow');
	 * t.putAttribute('userId', uid);
	 * await processCheckout();
	 * t.stop();
	 * ```
	 */
	startTrace(name: string): PerformanceTrace & { stop: () => void } {
		const perf = this._getOrInit();
		if (!perf) {
			// Return a no-op trace when Performance is unavailable (e.g. SSR)
			return {
				start: () => {},
				stop: () => {},
				record: () => {},
				putAttribute: () => {},
				getAttribute: () => undefined,
				removeAttribute: () => {},
				getAttributes: () => ({}),
				putMetric: () => {},
				getMetric: () => 0,
				incrementMetric: () => {}
			} as unknown as PerformanceTrace & { stop: () => void };
		}
		const t = trace(perf, name);
		t.start();
		return t as PerformanceTrace & { stop: () => void };
	}

	/**
	 * Measures the duration of an async operation and records it as a trace.
	 *
	 * @example
	 * ```ts
	 * const data = await firekitPerformance.measure('fetch-products', () => fetchProducts());
	 * ```
	 */
	async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
		const t = this.startTrace(name);
		try {
			return await fn();
		} finally {
			t.stop();
		}
	}

	/**
	 * Enables or disables performance data collection.
	 * Useful for respecting user consent preferences.
	 */
	setCollectionEnabled(enabled: boolean): void {
		const perf = this._getOrInit();
		if (perf) perf.dataCollectionEnabled = enabled;
	}

	/**
	 * Enables or disables automatic instrumentation
	 * (page load, network request monitoring).
	 */
	setInstrumentationEnabled(enabled: boolean): void {
		const perf = this._getOrInit();
		if (perf) perf.instrumentationEnabled = enabled;
	}
}

export const firekitPerformance = FirekitPerformance.getInstance();
export type { PerformanceTrace };
