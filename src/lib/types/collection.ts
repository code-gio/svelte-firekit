/**
 * @fileoverview Collection types and interfaces for FirekitCollection
 * @module CollectionTypes
 * @version 1.0.0
 */

import type { DocumentData, QueryConstraint, CollectionReference, Query } from 'firebase/firestore';

/**
 * Collection state interface containing all reactive properties
 */
export interface CollectionState<T> {
	/** Array of documents in the collection */
	data: T[];
	/** Loading state indicator */
	loading: boolean;
	/** Whether collection has been initialized */
	initialized: boolean;
	/** Current error state */
	error: CollectionError | null;
	/** Whether collection is empty */
	empty: boolean;
	/** Number of documents */
	size: number;
	/** Last update timestamp */
	lastUpdated: Date | null;
}

/**
 * Collection configuration options
 */
export interface CollectionOptions {
	/** Enable real-time updates (default: true) */
	realtime?: boolean;
	/** Include metadata changes in updates (default: false) */
	includeMetadata?: boolean;
	/** Data source preference (default: 'default') */
	source?: 'default' | 'server' | 'cache';
	/** Transform function for documents */
	transform?: (doc: any) => any;
	/** Filter function for documents */
	filter?: (doc: any) => boolean;
	/** Sort function for documents */
	sort?: (a: any, b: any) => number;
	/** Pagination settings */
	pagination?: PaginationConfig;
	/** Cache configuration */
	cache?: CacheConfig;
	/** Error handling configuration */
	errorHandling?: ErrorHandlingConfig;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
	/** Enable pagination */
	enabled: boolean;
	/** Page size */
	pageSize: number;
	/** Current page number */
	currentPage: number;
	/** Auto-load next page when scrolling */
	autoLoad?: boolean;
	/** Cursor for pagination */
	cursor?: any;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
	/** Enable caching */
	enabled: boolean;
	/** Cache duration in milliseconds */
	ttl: number;
	/** Maximum cache size */
	maxSize?: number;
	/** Cache key strategy */
	keyStrategy?: 'path' | 'query' | 'custom';
	/** Custom cache key function */
	customKey?: (path: string, constraints: QueryConstraint[]) => string;
}

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
	/** Enable automatic retry on errors */
	autoRetry?: boolean;
	/** Maximum retry attempts */
	maxRetries?: number;
	/** Retry delay in milliseconds */
	retryDelay?: number;
	/** Custom error handler */
	onError?: (error: CollectionError) => void;
}

/**
 * Query constraint builder interface
 */
export interface QueryBuilder<T> {
	/** Add where constraint */
	where(field: string, operator: FirestoreOperator, value: any): QueryBuilder<T>;
	/** Add orderBy constraint */
	orderBy(field: string, direction?: 'asc' | 'desc'): QueryBuilder<T>;
	/** Add limit constraint */
	limit(count: number): QueryBuilder<T>;
	/** Add startAt constraint */
	startAt(...values: any[]): QueryBuilder<T>;
	/** Add startAfter constraint */
	startAfter(...values: any[]): QueryBuilder<T>;
	/** Add endAt constraint */
	endAt(...values: any[]): QueryBuilder<T>;
	/** Add endBefore constraint */
	endBefore(...values: any[]): QueryBuilder<T>;
	/** Build the query */
	build(): QueryConstraint[];
}

/**
 * Firestore query operators
 */
export type FirestoreOperator =
	| '<'
	| '<='
	| '=='
	| '!='
	| '>='
	| '>'
	| 'array-contains'
	| 'array-contains-any'
	| 'in'
	| 'not-in';

/**
 * Collection change types
 */
export type CollectionChangeType = 'added' | 'modified' | 'removed';

/**
 * Document change information
 */
export interface DocumentChange<T> {
	/** Type of change */
	type: CollectionChangeType;
	/** Document data */
	doc: T;
	/** Old index in collection */
	oldIndex: number;
	/** New index in collection */
	newIndex: number;
	/** Change timestamp */
	timestamp: Date;
}

/**
 * Collection metadata interface
 */
export interface CollectionMetadata {
	/** Whether data is from cache */
	fromCache: boolean;
	/** Whether there are pending writes */
	hasPendingWrites: boolean;
	/** Sync state */
	syncState: 'synced' | 'local' | 'unknown';
	/** Last sync timestamp */
	lastSyncTime?: Date;
}

/**
 * Collection statistics
 */
export interface CollectionStats {
	/** Total number of documents */
	totalDocuments: number;
	/** Number of read operations */
	readCount: number;
	/** Number of write operations */
	writeCount: number;
	/** Cache hit rate */
	cacheHitRate: number;
	/** Average query time */
	averageQueryTime: number;
	/** Last activity timestamp */
	lastActivity: Date;
	/** Memory usage in bytes */
	memoryUsage: number;
}

/**
 * Collection error codes enum
 */
export enum CollectionErrorCode {
	// Firestore errors
	PERMISSION_DENIED = 'collection/permission-denied',
	NOT_FOUND = 'collection/not-found',
	ALREADY_EXISTS = 'collection/already-exists',
	RESOURCE_EXHAUSTED = 'collection/resource-exhausted',
	FAILED_PRECONDITION = 'collection/failed-precondition',
	ABORTED = 'collection/aborted',
	OUT_OF_RANGE = 'collection/out-of-range',
	UNIMPLEMENTED = 'collection/unimplemented',
	INTERNAL_ERROR = 'collection/internal',
	UNAVAILABLE = 'collection/unavailable',
	DATA_LOSS = 'collection/data-loss',
	UNAUTHENTICATED = 'collection/unauthenticated',
	DEADLINE_EXCEEDED = 'collection/deadline-exceeded',
	CANCELLED = 'collection/cancelled',

	// Network errors
	NETWORK_ERROR = 'collection/network-error',
	OFFLINE = 'collection/offline',

	// Query errors
	INVALID_QUERY = 'collection/invalid-query',
	QUERY_TOO_COMPLEX = 'collection/query-too-complex',
	MISSING_INDEX = 'collection/missing-index',
	INVALID_ARGUMENT = 'collection/invalid-argument',

	// Collection errors
	COLLECTION_UNAVAILABLE = 'collection/collection-unavailable',
	REFERENCE_UNAVAILABLE = 'collection/reference-unavailable',
	LISTENER_ERROR = 'collection/listener-error',

	// Cache errors
	CACHE_ERROR = 'collection/cache-error',
	CACHE_FULL = 'collection/cache-full',
	CACHE_CORRUPTED = 'collection/cache-corrupted',

	// Pagination errors
	PAGINATION_ERROR = 'collection/pagination-error',
	INVALID_CURSOR = 'collection/invalid-cursor',

	// Transform/Filter errors
	TRANSFORM_ERROR = 'collection/transform-error',
	FILTER_ERROR = 'collection/filter-error',

	// Unknown
	UNKNOWN = 'collection/unknown'
}

/**
 * Custom collection error class
 */
export class CollectionError extends Error {
	constructor(
		public code: CollectionErrorCode,
		message: string,
		public path?: string,
		public query?: QueryConstraint[],
		public originalError?: any,
		public context?: Record<string, any>
	) {
		super(message);
		this.name = 'CollectionError';
	}

	/**
	 * Get user-friendly error message
	 */
	getFriendlyMessage(): string {
		switch (this.code) {
			case CollectionErrorCode.PERMISSION_DENIED:
				return 'You do not have permission to access this collection.';
			case CollectionErrorCode.NOT_FOUND:
				return 'The requested collection was not found.';
			case CollectionErrorCode.NETWORK_ERROR:
				return 'Network connection error. Please check your internet connection.';
			case CollectionErrorCode.OFFLINE:
				return 'You are currently offline. Data may not be up to date.';
			case CollectionErrorCode.UNAUTHENTICATED:
				return 'Please sign in to access this collection.';
			case CollectionErrorCode.UNAVAILABLE:
				return 'Service is temporarily unavailable. Please try again later.';
			case CollectionErrorCode.MISSING_INDEX:
				return 'Database index is missing. Please contact support.';
			case CollectionErrorCode.QUERY_TOO_COMPLEX:
				return 'Query is too complex. Please simplify your search.';
			case CollectionErrorCode.INVALID_QUERY:
				return 'Invalid query parameters. Please check your search criteria.';
			case CollectionErrorCode.DEADLINE_EXCEEDED:
				return 'Request timed out. Please try again.';
			case CollectionErrorCode.RESOURCE_EXHAUSTED:
				return 'Too many requests. Please wait a moment and try again.';
			case CollectionErrorCode.CACHE_ERROR:
				return 'Cache error occurred. Data will be refreshed.';
			default:
				return this.message || 'An unexpected error occurred.';
		}
	}

	/**
	 * Check if error is retryable
	 */
	isRetryable(): boolean {
		const retryableCodes = [
			CollectionErrorCode.NETWORK_ERROR,
			CollectionErrorCode.UNAVAILABLE,
			CollectionErrorCode.DEADLINE_EXCEEDED,
			CollectionErrorCode.ABORTED,
			CollectionErrorCode.INTERNAL_ERROR,
			CollectionErrorCode.CANCELLED
		];
		return retryableCodes.includes(this.code);
	}

	/**
	 * Check if error requires user authentication
	 */
	requiresAuth(): boolean {
		const authCodes = [CollectionErrorCode.UNAUTHENTICATED, CollectionErrorCode.PERMISSION_DENIED];
		return authCodes.includes(this.code);
	}

	/**
	 * Check if error is related to query issues
	 */
	isQueryError(): boolean {
		const queryCodes = [
			CollectionErrorCode.INVALID_QUERY,
			CollectionErrorCode.QUERY_TOO_COMPLEX,
			CollectionErrorCode.MISSING_INDEX,
			CollectionErrorCode.INVALID_ARGUMENT,
			CollectionErrorCode.OUT_OF_RANGE
		];
		return queryCodes.includes(this.code);
	}

	/**
	 * Check if error is network related
	 */
	isNetworkError(): boolean {
		const networkCodes = [
			CollectionErrorCode.NETWORK_ERROR,
			CollectionErrorCode.OFFLINE,
			CollectionErrorCode.DEADLINE_EXCEEDED,
			CollectionErrorCode.UNAVAILABLE
		];
		return networkCodes.includes(this.code);
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
			path: this.path,
			query: this.query?.map((c) => c.toString()),
			isRetryable: this.isRetryable(),
			requiresAuth: this.requiresAuth(),
			isQueryError: this.isQueryError(),
			isNetworkError: this.isNetworkError(),
			context: this.context,
			timestamp: new Date().toISOString()
		};
	}
}

/**
 * Collection subscription interface
 */
export interface CollectionSubscription {
	/** Unsubscribe from collection changes */
	unsubscribe: () => void;
	/** Whether subscription is active */
	active: boolean;
	/** Subscription configuration */
	config: CollectionOptions;
	/** Subscription statistics */
	stats: CollectionStats;
}

/**
 * Collection query result interface
 */
export interface CollectionQueryResult<T> {
	/** Query result documents */
	docs: T[];
	/** Query metadata */
	metadata: CollectionMetadata;
	/** Total count (if available) */
	totalCount?: number;
	/** Whether there are more documents */
	hasMore?: boolean;
	/** Next page cursor */
	nextCursor?: any;
	/** Previous page cursor */
	prevCursor?: any;
}

/**
 * Collection aggregation result
 */
export interface CollectionAggregation {
	/** Count of documents */
	count?: number;
	/** Sum of numeric field */
	sum?: number;
	/** Average of numeric field */
	average?: number;
	/** Minimum value */
	min?: any;
	/** Maximum value */
	max?: any;
	/** Custom aggregation results */
	custom?: Record<string, any>;
}

/**
 * Real-time collection listener configuration
 */
export interface ListenerConfig {
	/** Include metadata changes */
	includeMetadata?: boolean;
	/** Custom error handler */
	onError?: (error: CollectionError) => void;
	/** Custom data handler */
	onData?: (data: any[]) => void;
	/** Custom change handler */
	onChange?: (changes: DocumentChange<any>[]) => void;
	/** Whether to automatically retry on connection issues */
	autoRetry?: boolean;
	/** Retry configuration */
	retryConfig?: {
		maxAttempts: number;
		baseDelay: number;
		maxDelay: number;
	};
}

/**
 * Collection performance metrics
 */
export interface CollectionPerformanceMetrics {
	/** Query execution time in milliseconds */
	queryTime: number;
	/** Network latency */
	networkLatency: number;
	/** Cache performance */
	cachePerformance: {
		hits: number;
		misses: number;
		hitRate: number;
	};
	/** Memory usage */
	memoryUsage: {
		current: number;
		peak: number;
		average: number;
	};
	/** Document processing time */
	processingTime: number;
	/** Listener performance */
	listenerPerformance: {
		updateFrequency: number;
		averageUpdateTime: number;
		totalUpdates: number;
	};
}
