import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { Functions } from 'firebase/functions';
import type { Database } from 'firebase/database';
import type { FirebaseStorage } from 'firebase/storage';
import type { Analytics } from 'firebase/analytics';
import type { AppCheck } from 'firebase/app-check';
import type { RemoteConfig } from 'firebase/remote-config';
import type { FirebasePerformance } from 'firebase/performance';
import type { Messaging } from 'firebase/messaging';

export type FirebaseEnvVars = FirebaseOptions;

/**
 * Type guard — requires the six fields that are always mandatory.
 * measurementId is Analytics-only and intentionally omitted.
 */
export function isValidFirebaseConfig(config: Partial<FirebaseEnvVars>): config is FirebaseEnvVars {
	return (
		typeof config.apiKey === 'string' &&
		typeof config.authDomain === 'string' &&
		typeof config.projectId === 'string' &&
		typeof config.storageBucket === 'string' &&
		typeof config.messagingSenderId === 'string' &&
		typeof config.appId === 'string'
	);
}

export enum FirebaseServiceStatus {
	UNINITIALIZED = 'UNINITIALIZED',
	INITIALIZING = 'INITIALIZING',
	INITIALIZED = 'INITIALIZED',
	ERROR = 'ERROR'
}

export class FirebaseServiceError extends Error {
	constructor(
		message: string,
		public readonly service: string
	) {
		super(message);
		this.name = 'FirebaseServiceError';
	}
}

export interface FirebaseServiceInstance {
	firebaseApp: FirebaseApp | null;
	db: Firestore | null;
	auth: Auth | null;
	functions: Functions | null;
	database: Database | null;
	storage: FirebaseStorage | null;
	analytics: Analytics | null;
	appCheck: AppCheck | null;
	remoteConfig: RemoteConfig | null;
	performance: FirebasePerformance | null;
	messaging: Messaging | null;
	status: FirebaseServiceStatus;
	initializationError: Error | null;
	isBrowser: boolean;
}
