import type { FirebaseOptions } from 'firebase/app';
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_MEASUREMENT_ID
} from '$env/static/public';
import { type FirebaseEnvVars, isValidFirebaseConfig } from './types/firebase.js';
/**
 * @module FirebaseConfig
 */

/**
 * Singleton class that manages Firebase configuration.
 * Implements the Singleton pattern to ensure only one Firebase config instance exists.
 *
 * @example
 * // Get Firebase configuration
 * const config = FirebaseConfig.getInstance().getConfig();
 *
 * // Initialize Firebase app
 * const app = initializeApp(config);
 *
 * @throws {Error} If any required Firebase configuration variables are missing or invalid
 */
class FirebaseConfig {
	private static instance: FirebaseConfig;
	private readonly config: FirebaseOptions;

	/**
	 * Private constructor to prevent direct instantiation.
	 * Validates all required environment variables are present and creates config.
	 *
	 * @private
	 * @throws {Error} If any required Firebase configuration variables are missing or invalid
	 */
	private constructor() {
		const config = this.getFirebaseConfig();
		if (!isValidFirebaseConfig(config)) {
			throw new Error('Invalid Firebase configuration. Please check your environment variables.');
		}

		this.config = config;
	}

	/**
	 * Gets the Firebase configuration from environment variables.
	 *
	 * @private
	 * @returns {Partial<FirebaseEnvVars>} The Firebase configuration
	 */
	private getFirebaseConfig(): Partial<FirebaseEnvVars> {
		return {
			apiKey: PUBLIC_FIREBASE_API_KEY,
			authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
			projectId: PUBLIC_FIREBASE_PROJECT_ID,
			storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
			messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
			appId: PUBLIC_FIREBASE_APP_ID,
			measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID
		};
	}

	/**
	 * Gets the singleton instance of FirebaseConfig.
	 * Creates a new instance if one doesn't exist.
	 *
	 * @returns {FirebaseConfig} The singleton FirebaseConfig instance
	 * @throws {Error} If any required Firebase configuration variables are missing or invalid
	 */
	static getInstance(): FirebaseConfig {
		if (!FirebaseConfig.instance) {
			FirebaseConfig.instance = new FirebaseConfig();
		}
		return FirebaseConfig.instance;
	}

	/**
	 * Gets the Firebase configuration options.
	 *
	 * @returns {FirebaseOptions} The Firebase configuration options
	 */
	getConfig(): FirebaseOptions {
		return this.config;
	}
}

/**
 * Pre-initialized Firebase configuration instance.
 * Use this to get Firebase configuration options directly.
 *
 * @example
 * import { firebaseConfig } from './firebase-config';
 * import { initializeApp } from 'firebase/app';
 *
 * const app = initializeApp(firebaseConfig);
 */
export const firebaseConfig = FirebaseConfig.getInstance().getConfig();
