import type { FirebaseOptions } from 'firebase/app';
import { isValidFirebaseConfig } from './types/firebase.js';

let _config: FirebaseOptions | null = null;

/**
 * Initialize Firekit with your Firebase project configuration.
 * Must be called once before using any Firekit services.
 *
 * Works in any Svelte 5 project — no SvelteKit dependency required.
 *
 * @example
 * // Plain Svelte 5
 * import { initFirekit } from 'svelte-firekit';
 * initFirekit({ apiKey: '...', authDomain: '...', projectId: '...', ... });
 *
 * @example
 * // SvelteKit — call in +layout.ts or a dedicated firebase.ts module
 * import { initFirekit } from 'svelte-firekit';
 * import { PUBLIC_FIREBASE_API_KEY, PUBLIC_FIREBASE_PROJECT_ID } from '$env/static/public';
 *
 * initFirekit({
 *   apiKey: PUBLIC_FIREBASE_API_KEY,
 *   authDomain: `${PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
 *   projectId: PUBLIC_FIREBASE_PROJECT_ID,
 *   storageBucket: `${PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
 *   messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
 *   appId: PUBLIC_FIREBASE_APP_ID,
 *   measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID, // optional, needed only for Analytics
 * });
 */
export function initFirekit(config: FirebaseOptions): void {
	if (!isValidFirebaseConfig(config)) {
		throw new Error(
			'Invalid Firebase configuration. Required: apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId.'
		);
	}
	_config = config;
}

/**
 * Returns the stored Firebase config. Throws if initFirekit() has not been called.
 * @internal Used by FirebaseService — consumers should use initFirekit() instead.
 */
export function getFirekitConfig(): FirebaseOptions {
	if (!_config) {
		throw new Error(
			'Firekit is not configured. Call initFirekit(config) before using any Firekit services.'
		);
	}
	return _config;
}

/** Returns true if initFirekit() has been called. */
export function isFirekitConfigured(): boolean {
	return _config !== null;
}
