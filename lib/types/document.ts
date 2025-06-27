/**
 * @fileoverview Document types and interfaces for FirekitDoc
 * @module DocumentTypes
 * @version 1.0.0
 */

/**
 * Document state interface containing all reactive properties
 */
export interface DocumentState<T> {
	/** Current document data */
	data: T | null;
	/** Whether document exists in Firestore */
	exists: boolean;
	/** Loading state indicator */
	loading: boolean;
	/** Current error state */
	error: DocumentError | null;
	/** Document ID */
	id: string;
}

/**
 * Configuration options for document subscriptions
 */
export interface DocumentOptions {
	/** Enable real-time updates (default: true) */
	realtime?: boolean;
	/** Include metadata changes in updates (default: false) */
	includeMetadata?: boolean;
	/** Data source preference (default: 'default') */
	source?: 'default' | 'server' | 'cache';
	/** Retry configuration for failed operations */
	retry?: {
		enabled: boolean;
		maxAttempts: number;
		backoffMs: number;
	};
	/** Cache configuration */
	cache?: {
		enabled: boolean;
		maxAge: number;
	};
}

/**
 * Document mutation options
 */
export interface MutationOptions {
	/** Whether to include automatic timestamps */
	timestamps?: boolean;
	/** Whether to merge data in set operations */
	merge?: boolean;
	/** Custom document ID for add operations */
	customId?: string;
	/** Whether to validate data before mutation */
	validate?: boolean;
	/** Custom validation function */
	validator?: (data: any) => boolean | string;
}

/**
 * Document mutation response
 */
export interface MutationResponse<T> {
	/** Operation success status */
	success: boolean;
	/** Document data */
	data?: T;
	/** Document ID */
	id?: string;
	/** Error details if operation failed */
	error?: {
		code: string;
		message: string;
		details?: any;
	};
	/** Operation metadata */
	metadata?: {
		timestamp: Date;
		source: string;
		operation: string;
	};
}

/**
 * Batch operation interface
 */
export interface BatchOperation {
	/** Operation type */
	type: 'create' | 'update' | 'delete';
	/** Document path */
	path: string;
	/** Data for create/update operations */
	data?: any;
	/** Options specific to this operation */
	options?: MutationOptions;
}

/**
 * Batch operation result
 */
export interface BatchResult {
	/** Overall batch success status */
	success: boolean;
	/** Number of successful operations */
	successCount: number;
	/** Number of failed operations */
	failureCount: number;
	/** Individual operation results */
	results: Array<{
		operation: BatchOperation;
		success: boolean;
		error?: DocumentError;
	}>;
	/** Batch execution metadata */
	metadata: {
		startTime: Date;
		endTime: Date;
		duration: number;
	};
}

/**
 * Document listener configuration
 */
export interface ListenerConfig {
	/** Whether to include metadata changes */
	includeMetadata?: boolean;
	/** Custom error handler */
	onError?: (error: DocumentError) => void;
	/** Custom data handler */
	onData?: (data: any) => void;
	/** Whether to automatically retry on connection issues */
	autoRetry?: boolean;
}

/**
 * Document cache entry
 */
export interface CacheEntry<T> {
	/** Cached data */
	data: T;
	/** Cache timestamp */
	timestamp: Date;
	/** Data source */
	source: CacheSource;
	/** Expiration time */
	expiresAt: Date;
	/** Document metadata */
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

/**
 * Document error codes enum
 */
export enum DocumentErrorCode {
	// Connection errors
	FIRESTORE_UNAVAILABLE = 'firestore/unavailable',
	NETWORK_ERROR = 'firestore/network-error',
	TIMEOUT = 'firestore/timeout',
	CANCELLED = 'firestore/cancelled',

	// Permission errors
	PERMISSION_DENIED = 'firestore/permission-denied',
	UNAUTHENTICATED = 'firestore/unauthenticated',

	// Document errors
	NOT_FOUND = 'firestore/not-found',
	ALREADY_EXISTS = 'firestore/already-exists',

	// Reference errors
	REFERENCE_UNAVAILABLE = 'firestore/reference-unavailable',
	INVALID_PATH = 'firestore/invalid-path',

	// Data errors
	INVALID_DATA = 'firestore/invalid-data',
	DATA_LOSS = 'firestore/data-loss',

	// Operation errors
	FAILED_PRECONDITION = 'firestore/failed-precondition',
	ABORTED = 'firestore/aborted',
	OUT_OF_RANGE = 'firestore/out-of-range',
	UNIMPLEMENTED = 'firestore/unimplemented',
	INTERNAL_ERROR = 'firestore/internal',
	UNAVAILABLE = 'firestore/unavailable',

	// Validation errors
	VALIDATION_FAILED = 'document/validation-failed',
	REQUIRED_FIELD_MISSING = 'document/required-field-missing',
	INVALID_FIELD_TYPE = 'document/invalid-field-type',

	// Cache errors
	CACHE_MISS = 'document/cache-miss',
	CACHE_EXPIRED = 'document/cache-expired',

	// Unknown
	UNKNOWN = 'document/unknown'
}

/**
 * Custom document error class
 */
export class DocumentError extends Error {
	constructor(
		public code: DocumentErrorCode,
		message: string,
		public originalError?: any,
		public context?: Record<string, any>
	) {
		super(message);
		this.name = 'DocumentError';
	}

	/**
	 * Get user-friendly error message
	 */
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

	/**
	 * Check if error is retryable
	 */
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

	/**
	 * Check if error requires user authentication
	 */
	requiresAuth(): boolean {
		return this.code === DocumentErrorCode.UNAUTHENTICATED;
	}

	/**
	 * Check if error is related to permissions
	 */
	isPermissionError(): boolean {
		const permissionCodes = [
			DocumentErrorCode.PERMISSION_DENIED,
			DocumentErrorCode.UNAUTHENTICATED
		];
		return permissionCodes.includes(this.code);
	}

	/**
	 * Check if error is a validation error
	 */
	isValidationError(): boolean {
		const validationCodes = [
			DocumentErrorCode.VALIDATION_FAILED,
			DocumentErrorCode.REQUIRED_FIELD_MISSING,
			DocumentErrorCode.INVALID_FIELD_TYPE,
			DocumentErrorCode.INVALID_DATA
		];
		return validationCodes.includes(this.code);
	}

	/**
	 * Convert to JSON for logging/debugging
	 */
	toJSON(): Record<string, any> {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			friendlyMessage: this.getFriendlyMessage(),
			isRetryable: this.isRetryable(),
			requiresAuth: this.requiresAuth(),
			context: this.context,
			timestamp: new Date().toISOString()
		};
	}
}

/**
 * Document field value types for special operations
 */
export type DocumentFieldValue =
	| { type: 'serverTimestamp' }
	| { type: 'increment'; value: number }
	| { type: 'arrayUnion'; values: any[] }
	| { type: 'arrayRemove'; values: any[] }
	| { type: 'delete' };

/**
 * Document update data with field value support
 */
export type DocumentUpdateData<T> = {
	[K in keyof T]?: T[K] | DocumentFieldValue;
} & {
	[key: string]: any | DocumentFieldValue;
};

/**
 * Document metadata interface
 */
export interface DocumentMetadata {
	/** Whether document has pending writes */
	hasPendingWrites: boolean;
	/** Whether document data is from cache */
	fromCache: boolean;
	/** Last update timestamp */
	lastUpdateTime?: Date;
	/** Document creation timestamp */
	createTime?: Date;
	/** Document update timestamp */
	updateTime?: Date;
}

/**
 * Document snapshot interface
 */
export interface DocumentSnapshot<T> {
	/** Document ID */
	id: string;
	/** Document data */
	data: T | null;
	/** Whether document exists */
	exists: boolean;
	/** Document metadata */
	metadata: DocumentMetadata;
	/** Document reference */
	ref: any; // DocumentReference type would be imported from firebase
}

/**
 * Document query constraints for filtering
 */
export interface DocumentQueryConstraint {
	type: 'where' | 'orderBy' | 'limit' | 'startAt' | 'endAt';
	field?: string;
	operator?:
		| '<'
		| '<='
		| '=='
		| '!='
		| '>='
		| '>'
		| 'array-contains'
		| 'in'
		| 'not-in'
		| 'array-contains-any';
	value?: any;
	direction?: 'asc' | 'desc';
	count?: number;
}

/**
 * Document observer interface for watching changes
 */
export interface DocumentObserver<T> {
	/** Called when document data changes */
	next: (snapshot: DocumentSnapshot<T>) => void;
	/** Called when an error occurs */
	error?: (error: DocumentError) => void;
	/** Called when observation completes */
	complete?: () => void;
}

/**
 * Document subscription interface
 */
export interface DocumentSubscription {
	/** Unsubscribe from document changes */
	unsubscribe: () => void;
	/** Whether subscription is active */
	active: boolean;
	/** Subscription configuration */
	config: ListenerConfig;
}

/**
 * Document analytics data
 */
export interface DocumentAnalytics {
	/** Number of reads */
	readCount: number;
	/** Number of writes */
	writeCount: number;
	/** Number of deletes */
	deleteCount: number;
	/** Cache hit rate */
	cacheHitRate: number;
	/** Average response time */
	averageResponseTime: number;
	/** Error rate */
	errorRate: number;
	/** Last activity timestamp */
	lastActivity: Date;
}

/**
 * Document performance metrics
 */
export interface DocumentPerformanceMetrics {
	/** Time to first byte */
	ttfb: number;
	/** Total load time */
	loadTime: number;
	/** Cache performance */
	cachePerformance: {
		hits: number;
		misses: number;
		hitRate: number;
	};
	/** Network performance */
	networkPerformance: {
		latency: number;
		bandwidth: number;
		connectionType: string;
	};
}
