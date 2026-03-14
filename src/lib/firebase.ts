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
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import { getFirekitConfig, isFirekitConfigured } from './config.js';
import {
	FirebaseServiceStatus,
	FirebaseServiceError,
	type FirebaseServiceInstance
} from './types/firebase.js';
import type { AppCheck } from 'firebase/app-check';
import type { RemoteConfig } from 'firebase/remote-config';

/**
 * Singleton service that manages all Firebase service instances.
 * Services are initialized lazily — they spin up only when first accessed.
 *
 * Core services (Firestore, Auth, Functions, RTDB, Storage) are always available.
 * Browser-only services (Analytics, Performance, Messaging) check the environment.
 * Security services (AppCheck, RemoteConfig) are initialized by their dedicated service files.
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
	appCheck: AppCheck | null = null;
	remoteConfig: RemoteConfig | null = null;
	performance: FirebaseServiceInstance['performance'] = null;
	messaging: FirebaseServiceInstance['messaging'] = null;
	status: FirebaseServiceStatus = FirebaseServiceStatus.UNINITIALIZED;
	initializationError: Error | null = null;
	readonly isBrowser = typeof window !== 'undefined';

	private constructor() {}

	static getInstance(): FirebaseService {
		if (!FirebaseService.instance) {
			FirebaseService.instance = new FirebaseService();
		}
		return FirebaseService.instance;
	}

	getStatus(): FirebaseServiceStatus {
		return this.status;
	}

	getInitializationError(): Error | null {
		return this.initializationError;
	}

	getFirebaseApp(): FirebaseServiceInstance['firebaseApp'] {
		if (this.status === FirebaseServiceStatus.ERROR) {
			throw new FirebaseServiceError('Firebase service is in error state', 'app');
		}

		if (this.firebaseApp) return this.firebaseApp;

		// Config not set yet — retryable, do not mark as ERROR
		if (!isFirekitConfigured()) {
			throw new FirebaseServiceError(
				'Firekit is not configured. Call initFirekit(config) before using any Firekit services.',
				'app'
			);
		}

		try {
			this.status = FirebaseServiceStatus.INITIALIZING;
			const existingApps = getApps();
			this.firebaseApp = existingApps.length
				? existingApps[0]
				: initializeApp(getFirekitConfig());

			this.initializeFirestoreInstance();
			this.status = FirebaseServiceStatus.INITIALIZED;
			return this.firebaseApp;
		} catch (error) {
			this.status = FirebaseServiceStatus.ERROR;
			this.initializationError = error instanceof Error ? error : new Error(String(error));
			throw new FirebaseServiceError('Failed to initialize Firebase app', 'app');
		}
	}

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
			}
		} catch (error) {
			throw new FirebaseServiceError('Failed to initialize Firestore', 'firestore');
		}
	}

	getDbInstance(): FirebaseServiceInstance['db'] {
		if (!this.db) {
			this.getFirebaseApp();
			if (!this.db) {
				throw new FirebaseServiceError(
					this.isBrowser
						? 'Firestore instance not available'
						: 'Firestore is not available in server environment',
					'firestore'
				);
			}
		}
		return this.db;
	}

	getAuthInstance(): FirebaseServiceInstance['auth'] {
		try {
			if (!this.auth) {
				this.auth = getAuth(this.getFirebaseApp()!);
			}
			return this.auth;
		} catch {
			throw new FirebaseServiceError('Failed to initialize Auth', 'auth');
		}
	}

	getFunctionsInstance(): FirebaseServiceInstance['functions'] {
		try {
			if (!this.functions) {
				this.functions = getFunctions(this.getFirebaseApp()!);
			}
			return this.functions;
		} catch {
			throw new FirebaseServiceError('Failed to initialize Functions', 'functions');
		}
	}

	getDatabaseInstance(): FirebaseServiceInstance['database'] {
		try {
			if (!this.database) {
				this.database = getDatabase(this.getFirebaseApp()!);
			}
			return this.database;
		} catch {
			throw new FirebaseServiceError('Failed to initialize Realtime Database', 'database');
		}
	}

	getStorageInstance(): FirebaseServiceInstance['storage'] {
		try {
			if (!this.storage) {
				this.storage = getStorage(this.getFirebaseApp()!);
			}
			return this.storage;
		} catch {
			throw new FirebaseServiceError('Failed to initialize Storage', 'storage');
		}
	}

	/**
	 * Gets the Analytics instance. Returns null if analytics is not supported
	 * (e.g. no measurementId in config, ad-blockers, SSR).
	 */
	async getAnalyticsInstance(): Promise<FirebaseServiceInstance['analytics']> {
		if (!this.isBrowser) return null;

		try {
			if (!this.analytics && (await isAnalyticsSupported())) {
				this.analytics = getAnalytics(this.getFirebaseApp()!);
			}
			return this.analytics;
		} catch {
			return null;
		}
	}

	/**
	 * Gets the Performance Monitoring instance. Browser-only.
	 */
	getPerformanceInstance(): FirebaseServiceInstance['performance'] {
		if (!this.isBrowser) return null;

		try {
			if (!this.performance) {
				this.performance = getPerformance(this.getFirebaseApp()!);
			}
			return this.performance;
		} catch {
			throw new FirebaseServiceError('Failed to initialize Performance Monitoring', 'performance');
		}
	}

	/**
	 * Gets the Cloud Messaging instance. Returns null if not supported
	 * (requires HTTPS, service workers, and browser support).
	 */
	async getMessagingInstance(): Promise<FirebaseServiceInstance['messaging']> {
		if (!this.isBrowser) return null;

		try {
			if (!this.messaging && (await isMessagingSupported())) {
				this.messaging = getMessaging(this.getFirebaseApp()!);
			}
			return this.messaging;
		} catch {
			return null;
		}
	}

	/**
	 * Resets all service instances. Primarily useful for testing.
	 */
	async reset(): Promise<void> {
		this.firebaseApp = null;
		this.db = null;
		this.auth = null;
		this.functions = null;
		this.database = null;
		this.storage = null;
		this.analytics = null;
		this.appCheck = null;
		this.remoteConfig = null;
		this.performance = null;
		this.messaging = null;
		this.status = FirebaseServiceStatus.UNINITIALIZED;
		this.initializationError = null;
	}
}

/**
 * The global Firebase service singleton.
 * Access Firebase service instances through this object.
 *
 * @example
 * import { firebaseService } from 'svelte-firekit';
 * const db = firebaseService.getDbInstance();
 * const auth = firebaseService.getAuthInstance();
 */
export const firebaseService = FirebaseService.getInstance();
