import { initializeApp, getApps } from 'firebase/app';
import {
	initializeFirestore,
	CACHE_SIZE_UNLIMITED,
	persistentLocalCache,
	persistentMultipleTabManager,
	enablePersistentCacheIndexAutoCreation,
	getPersistentCacheIndexManager
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { firebaseConfig } from './config.js';
import {
	FirebaseServiceStatus,
	FirebaseServiceError,
	type FirebaseServiceInstance
} from './types/firebase.js';

/**
 * Singleton service class that manages Firebase service instances.
 * Handles initialization and access to Firebase app and its various services.
 *
 * @example
 * // Get Firestore instance
 * const db = firebaseService.getDbInstance();
 *
 * // Get Auth instance
 * const auth = firebaseService.getAuthInstance();
 */
class FirebaseService implements FirebaseServiceInstance {
	private static instance: FirebaseService;
	firebaseApp: FirebaseServiceInstance['firebaseApp'] = null;
	db: FirebaseServiceInstance['db'] = null;
	auth: FirebaseServiceInstance['auth'] = null;
	functions: FirebaseServiceInstance['functions'] = null;
	database: FirebaseServiceInstance['database'] = null;
	storage: FirebaseServiceInstance['storage'] = null;
	analytics: FirebaseServiceInstance['analytics'] = null;
	status: FirebaseServiceStatus = FirebaseServiceStatus.UNINITIALIZED;
	initializationError: Error | null = null;
	readonly isBrowser = typeof window !== 'undefined';

	/** @private */
	private constructor() {}

	/**
	 * Gets the singleton instance of FirebaseService.
	 * Creates a new instance if one doesn't exist.
	 *
	 * @returns {FirebaseService} The singleton FirebaseService instance
	 */
	static getInstance(): FirebaseService {
		if (!FirebaseService.instance) {
			FirebaseService.instance = new FirebaseService();
		}
		return FirebaseService.instance;
	}

	/**
	 * Gets the current status of the Firebase service
	 *
	 * @returns {FirebaseServiceStatus} The current service status
	 */
	getStatus(): FirebaseServiceStatus {
		return this.status;
	}

	/**
	 * Gets the initialization error if any occurred
	 *
	 * @returns {Error | null} The initialization error or null if none occurred
	 */
	getInitializationError(): Error | null {
		return this.initializationError;
	}

	/**
	 * Initializes or retrieves the Firebase app instance.
	 * Also initializes Firestore if running in browser environment.
	 *
	 * @returns {FirebaseApp} The Firebase app instance
	 * @throws {FirebaseServiceError} If initialization fails
	 */
	getFirebaseApp(): FirebaseServiceInstance['firebaseApp'] {
		if (this.status === FirebaseServiceStatus.ERROR) {
			throw new FirebaseServiceError('Firebase service is in error state', 'app');
		}

		if (this.firebaseApp) return this.firebaseApp;

		try {
			this.status = FirebaseServiceStatus.INITIALIZING;
			const existingApps = getApps();
			if (existingApps.length) {
				this.firebaseApp = existingApps[0];
			} else {
				this.firebaseApp = initializeApp(firebaseConfig);
				console.log(
					`${firebaseConfig.projectId} initialized on ${this.isBrowser ? 'client' : 'server'}`
				);
			}

			this.initializeFirestoreInstance();
			this.status = FirebaseServiceStatus.INITIALIZED;
			return this.firebaseApp;
		} catch (error) {
			this.status = FirebaseServiceStatus.ERROR;
			this.initializationError = error instanceof Error ? error : new Error(String(error));
			throw new FirebaseServiceError('Failed to initialize Firebase app', 'app');
		}
	}

	/**
	 * Initializes Firestore with persistent cache and multi-tab support.
	 * Only runs in browser environment.
	 *
	 * @private
	 * @throws {FirebaseServiceError} If Firestore initialization fails
	 */
	private initializeFirestoreInstance(): void {
		if (this.db || !this.isBrowser) return;

		try {
			this.db = initializeFirestore(this.firebaseApp!, {
				localCache: persistentLocalCache({
					cacheSizeBytes: CACHE_SIZE_UNLIMITED,
					tabManager: persistentMultipleTabManager()
				})
			});

			const indexManager = getPersistentCacheIndexManager(this.db);
			if (indexManager) {
				enablePersistentCacheIndexAutoCreation(indexManager);
				console.log('Firestore persistent cache indexing is enabled');
			} else {
				console.warn('Failed to initialize the Firestore cache index manager');
			}
		} catch (error) {
			throw new FirebaseServiceError('Failed to initialize Firestore', 'firestore');
		}
	}

	/**
	 * Gets the Firestore instance, initializing it if necessary.
	 *
	 * @returns {Firestore} The Firestore instance
	 * @throws {FirebaseServiceError} If Firestore is not available
	 */
	getDbInstance(): FirebaseServiceInstance['db'] {
		if (!this.db) {
			try {
				this.getFirebaseApp();
				if (!this.db) {
					// If we're not in a browser environment, Firestore won't be available
					if (!this.isBrowser) {
						throw new FirebaseServiceError(
							'Firestore is not available in server environment',
							'firestore'
						);
					}
					throw new FirebaseServiceError('Firestore instance not available', 'firestore');
				}
			} catch (error) {
				if (error instanceof FirebaseServiceError) {
					throw error;
				}
				throw new FirebaseServiceError('Failed to initialize Firestore', 'firestore');
			}
		}
		return this.db;
	}

	/**
	 * Gets the Authentication instance, initializing it if necessary.
	 *
	 * @returns {Auth} The Authentication instance
	 * @throws {FirebaseServiceError} If Auth initialization fails
	 */
	getAuthInstance(): FirebaseServiceInstance['auth'] {
		try {
			if (!this.auth) {
				this.auth = getAuth(this.getFirebaseApp()!);
			}
			return this.auth;
		} catch (error) {
			throw new FirebaseServiceError('Failed to initialize Auth', 'auth');
		}
	}

	/**
	 * Gets the Cloud Functions instance, initializing it if necessary.
	 *
	 * @returns {Functions} The Cloud Functions instance
	 * @throws {FirebaseServiceError} If Functions initialization fails
	 */
	getFunctionsInstance(): FirebaseServiceInstance['functions'] {
		try {
			if (!this.functions) {
				this.functions = getFunctions(this.getFirebaseApp()!);
			}
			return this.functions;
		} catch (error) {
			throw new FirebaseServiceError('Failed to initialize Functions', 'functions');
		}
	}

	/**
	 * Gets the Realtime Database instance, initializing it if necessary.
	 *
	 * @returns {Database} The Realtime Database instance
	 * @throws {FirebaseServiceError} If Database initialization fails
	 */
	getDatabaseInstance(): FirebaseServiceInstance['database'] {
		try {
			if (!this.database) {
				this.database = getDatabase(this.getFirebaseApp()!);
			}
			return this.database;
		} catch (error) {
			throw new FirebaseServiceError('Failed to initialize Database', 'database');
		}
	}

	/**
	 * Gets the Storage instance, initializing it if necessary.
	 *
	 * @returns {FirebaseStorage} The Storage instance
	 * @throws {FirebaseServiceError} If Storage initialization fails
	 */
	getStorageInstance(): FirebaseServiceInstance['storage'] {
		try {
			if (!this.storage) {
				this.storage = getStorage(this.getFirebaseApp()!);
			}
			return this.storage;
		} catch (error) {
			throw new FirebaseServiceError('Failed to initialize Storage', 'storage');
		}
	}

	/**
	 * Gets the Analytics instance, initializing it if necessary.
	 * Only available in browser environment.
	 *
	 * @returns {Analytics} The Analytics instance
	 * @throws {FirebaseServiceError} If Analytics initialization fails
	 */
	getAnalyticsInstance(): FirebaseServiceInstance['analytics'] {
		if (!this.isBrowser) {
			throw new FirebaseServiceError(
				'Analytics is not available in server environment',
				'analytics'
			);
		}

		try {
			if (!this.analytics) {
				this.analytics = getAnalytics(this.getFirebaseApp()!);
			}
			return this.analytics;
		} catch (error) {
			throw new FirebaseServiceError('Failed to initialize Analytics', 'analytics');
		}
	}

	/**
	 * Resets the Firebase service to its initial state.
	 * Useful for testing or when you need to reinitialize the services.
	 *
	 * @returns {Promise<void>}
	 */
	async reset(): Promise<void> {
		this.firebaseApp = null;
		this.db = null;
		this.auth = null;
		this.functions = null;
		this.database = null;
		this.storage = null;
		this.analytics = null;
		this.status = FirebaseServiceStatus.UNINITIALIZED;
		this.initializationError = null;
	}
}

/**
 * Pre-initialized Firebase service instance.
 * Use this to access Firebase services directly.
 *
 * @example
 * import { firebaseService } from './firebase-service';
 *
 * // Get Firestore
 * const db = firebaseService.getDbInstance();
 *
 * // Get Auth
 * const auth = firebaseService.getAuthInstance();
 */
export const firebaseService = FirebaseService.getInstance();
