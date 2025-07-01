import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { Functions } from 'firebase/functions';
import type { Database } from 'firebase/database';
import type { FirebaseStorage } from 'firebase/storage';
import type { Analytics } from 'firebase/analytics';

/**
 * Type definition for required Firebase environment variables
 */
export type FirebaseEnvVars = FirebaseOptions;

/**
 * Type guard to check if an object contains all required Firebase environment variables
 */
export function isValidFirebaseConfig(config: Partial<FirebaseEnvVars>): config is FirebaseEnvVars {
	return (
		typeof config.apiKey === 'string' &&
		typeof config.authDomain === 'string' &&
		typeof config.projectId === 'string' &&
		typeof config.storageBucket === 'string' &&
		typeof config.messagingSenderId === 'string' &&
		typeof config.appId === 'string' &&
		typeof config.measurementId === 'string'
	);
}

/**
 * Enum representing the initialization status of Firebase services
 */
export enum FirebaseServiceStatus {
	UNINITIALIZED = 'UNINITIALIZED',
	INITIALIZING = 'INITIALIZING',
	INITIALIZED = 'INITIALIZED',
	ERROR = 'ERROR'
}

/**
 * Error class for Firebase service initialization failures
 */
export class FirebaseServiceError extends Error {
	constructor(
		message: string,
		public readonly service: string
	) {
		super(message);
		this.name = 'FirebaseServiceError';
	}
}

/**
 * Interface for Firebase service instance
 */
export interface FirebaseServiceInstance {
	firebaseApp: FirebaseApp | null;
	db: Firestore | null;
	auth: Auth | null;
	functions: Functions | null;
	database: Database | null;
	storage: FirebaseStorage | null;
	analytics: Analytics | null;
	status: FirebaseServiceStatus;
	initializationError: Error | null;
	isBrowser: boolean;
}
