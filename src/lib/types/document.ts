export interface DocumentState<T> {
	data: T | null;
	exists: boolean;
	loading: boolean;
	error: DocumentError | null;
	id: string;
}

export interface DocumentOptions {
	realtime?: boolean;
	includeMetadata?: boolean;
	source?: 'default' | 'server' | 'cache';
	retry?: {
		enabled: boolean;
		maxAttempts: number;
		backoffMs: number;
	};
	cache?: {
		enabled: boolean;
		maxAge: number;
	};
}

export interface DocumentListenerConfig {
	includeMetadata?: boolean;
	onError?: (error: DocumentError) => void;
	onData?: (data: unknown) => void;
	autoRetry?: boolean;
}

export interface CacheEntry<T> {
	data: T;
	timestamp: Date;
	source: CacheSource;
	expiresAt: Date;
	metadata?: {
		lastModified: Date;
		etag?: string;
	};
}

export enum CacheSource {
	SERVER = 'server',
	CACHE = 'cache',
	CLIENT = 'client'
}

export enum DocumentErrorCode {
	FIRESTORE_UNAVAILABLE = 'firestore/unavailable',
	NETWORK_ERROR = 'firestore/network-error',
	TIMEOUT = 'firestore/timeout',
	CANCELLED = 'firestore/cancelled',
	PERMISSION_DENIED = 'firestore/permission-denied',
	UNAUTHENTICATED = 'firestore/unauthenticated',
	NOT_FOUND = 'firestore/not-found',
	ALREADY_EXISTS = 'firestore/already-exists',
	REFERENCE_UNAVAILABLE = 'firestore/reference-unavailable',
	INVALID_PATH = 'firestore/invalid-path',
	INVALID_DATA = 'firestore/invalid-data',
	DATA_LOSS = 'firestore/data-loss',
	FAILED_PRECONDITION = 'firestore/failed-precondition',
	ABORTED = 'firestore/aborted',
	OUT_OF_RANGE = 'firestore/out-of-range',
	UNIMPLEMENTED = 'firestore/unimplemented',
	INTERNAL_ERROR = 'firestore/internal',
	UNAVAILABLE = 'firestore/unavailable',
	VALIDATION_FAILED = 'document/validation-failed',
	REQUIRED_FIELD_MISSING = 'document/required-field-missing',
	INVALID_FIELD_TYPE = 'document/invalid-field-type',
	CACHE_MISS = 'document/cache-miss',
	CACHE_EXPIRED = 'document/cache-expired',
	UNKNOWN = 'document/unknown'
}

export class DocumentError extends Error {
	constructor(
		public code: DocumentErrorCode,
		message: string,
		public originalError?: unknown,
		public context?: Record<string, unknown>
	) {
		super(message);
		this.name = 'DocumentError';
	}

	getFriendlyMessage(): string {
		switch (this.code) {
			case DocumentErrorCode.PERMISSION_DENIED:
				return 'You do not have permission to access this document.';
			case DocumentErrorCode.NOT_FOUND:
				return 'The requested document was not found.';
			case DocumentErrorCode.NETWORK_ERROR:
				return 'Network connection error. Please check your internet connection.';
			case DocumentErrorCode.TIMEOUT:
				return 'Request timed out. Please try again.';
			case DocumentErrorCode.UNAUTHENTICATED:
				return 'Please sign in to access this document.';
			case DocumentErrorCode.UNAVAILABLE:
				return 'Service is temporarily unavailable. Please try again later.';
			case DocumentErrorCode.VALIDATION_FAILED:
				return 'The provided data is invalid.';
			case DocumentErrorCode.ALREADY_EXISTS:
				return 'A document with this ID already exists.';
			case DocumentErrorCode.CACHE_EXPIRED:
				return 'Cached data has expired. Refreshing...';
			default:
				return this.message || 'An unexpected error occurred.';
		}
	}

	isRetryable(): boolean {
		const retryableCodes = [
			DocumentErrorCode.NETWORK_ERROR,
			DocumentErrorCode.TIMEOUT,
			DocumentErrorCode.UNAVAILABLE,
			DocumentErrorCode.CANCELLED,
			DocumentErrorCode.INTERNAL_ERROR
		];
		return retryableCodes.includes(this.code);
	}

	isPermissionError(): boolean {
		return (
			this.code === DocumentErrorCode.PERMISSION_DENIED ||
			this.code === DocumentErrorCode.UNAUTHENTICATED
		);
	}

	isValidationError(): boolean {
		const validationCodes = [
			DocumentErrorCode.VALIDATION_FAILED,
			DocumentErrorCode.REQUIRED_FIELD_MISSING,
			DocumentErrorCode.INVALID_FIELD_TYPE,
			DocumentErrorCode.INVALID_DATA
		];
		return validationCodes.includes(this.code);
	}

	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			friendlyMessage: this.getFriendlyMessage(),
			isRetryable: this.isRetryable(),
			context: this.context,
			timestamp: new Date().toISOString()
		};
	}
}

export type DocumentFieldValue =
	| { type: 'serverTimestamp' }
	| { type: 'increment'; value: number }
	| { type: 'arrayUnion'; values: unknown[] }
	| { type: 'arrayRemove'; values: unknown[] }
	| { type: 'delete' };

export type DocumentUpdateData<T> = {
	[K in keyof T]?: T[K] | DocumentFieldValue;
} & {
	[key: string]: unknown | DocumentFieldValue;
};

export interface DocumentMetadata {
	hasPendingWrites: boolean;
	fromCache: boolean;
	lastUpdateTime?: Date;
	createTime?: Date;
	updateTime?: Date;
}

export interface DocumentSnapshot<T> {
	id: string;
	data: T | null;
	exists: boolean;
	metadata: DocumentMetadata;
	ref: unknown;
}

export interface DocumentSubscription {
	unsubscribe: () => void;
	active: boolean;
	config: DocumentListenerConfig;
}
