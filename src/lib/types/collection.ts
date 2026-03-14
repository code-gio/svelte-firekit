import type { QueryConstraint } from 'firebase/firestore';

export interface CollectionState<T> {
	data: T[];
	loading: boolean;
	initialized: boolean;
	error: CollectionError | null;
	empty: boolean;
	size: number;
	lastUpdated: Date | null;
}

export interface CollectionOptions {
	realtime?: boolean;
	includeMetadata?: boolean;
	source?: 'default' | 'server' | 'cache';
	transform?: (doc: unknown) => unknown;
	filter?: (doc: unknown) => boolean;
	sort?: (a: unknown, b: unknown) => number;
	pagination?: PaginationConfig;
	cache?: CacheConfig;
	errorHandling?: ErrorHandlingConfig;
}

export interface PaginationConfig {
	enabled: boolean;
	pageSize: number;
	currentPage: number;
	autoLoad?: boolean;
	cursor?: unknown;
}

export interface CacheConfig {
	enabled: boolean;
	ttl: number;
	maxSize?: number;
	keyStrategy?: 'path' | 'query' | 'custom';
	customKey?: (path: string, constraints: QueryConstraint[]) => string;
}

export interface ErrorHandlingConfig {
	autoRetry?: boolean;
	maxRetries?: number;
	retryDelay?: number;
	onError?: (error: CollectionError) => void;
}

export interface QueryBuilder<T> {
	where(field: string, operator: FirestoreOperator, value: unknown): QueryBuilder<T>;
	orderBy(field: string, direction?: 'asc' | 'desc'): QueryBuilder<T>;
	limit(count: number): QueryBuilder<T>;
	startAt(...values: unknown[]): QueryBuilder<T>;
	startAfter(...values: unknown[]): QueryBuilder<T>;
	endAt(...values: unknown[]): QueryBuilder<T>;
	endBefore(...values: unknown[]): QueryBuilder<T>;
	build(): QueryConstraint[];
}

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

export type CollectionChangeType = 'added' | 'modified' | 'removed';

export interface DocumentChange<T> {
	type: CollectionChangeType;
	doc: T;
	oldIndex: number;
	newIndex: number;
	timestamp: Date;
}

export interface CollectionMetadata {
	fromCache: boolean;
	hasPendingWrites: boolean;
	syncState: 'synced' | 'local' | 'unknown';
	lastSyncTime?: Date;
}

export interface CollectionAggregation {
	count?: number;
	sum?: number;
	average?: number;
}

export interface CollectionListenerConfig {
	includeMetadata?: boolean;
	onError?: (error: CollectionError) => void;
	onData?: (data: unknown[]) => void;
	onChange?: (changes: DocumentChange<unknown>[]) => void;
	autoRetry?: boolean;
	retryConfig?: {
		maxAttempts: number;
		baseDelay: number;
		maxDelay: number;
	};
}

export enum CollectionErrorCode {
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
	NETWORK_ERROR = 'collection/network-error',
	OFFLINE = 'collection/offline',
	INVALID_QUERY = 'collection/invalid-query',
	QUERY_TOO_COMPLEX = 'collection/query-too-complex',
	MISSING_INDEX = 'collection/missing-index',
	INVALID_ARGUMENT = 'collection/invalid-argument',
	COLLECTION_UNAVAILABLE = 'collection/collection-unavailable',
	REFERENCE_UNAVAILABLE = 'collection/reference-unavailable',
	LISTENER_ERROR = 'collection/listener-error',
	CACHE_ERROR = 'collection/cache-error',
	CACHE_FULL = 'collection/cache-full',
	PAGINATION_ERROR = 'collection/pagination-error',
	INVALID_CURSOR = 'collection/invalid-cursor',
	TRANSFORM_ERROR = 'collection/transform-error',
	FILTER_ERROR = 'collection/filter-error',
	UNKNOWN = 'collection/unknown'
}

// Note: CollectionError intentionally has extra `path` and `query` params
// compared to DocumentError, since collection errors are always tied to a
// specific path and may be caused by invalid query constraints.
export class CollectionError extends Error {
	constructor(
		public code: CollectionErrorCode,
		message: string,
		public path?: string,
		public query?: QueryConstraint[],
		public originalError?: unknown,
		public context?: Record<string, unknown>
	) {
		super(message);
		this.name = 'CollectionError';
	}

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

	requiresAuth(): boolean {
		return (
			this.code === CollectionErrorCode.UNAUTHENTICATED ||
			this.code === CollectionErrorCode.PERMISSION_DENIED
		);
	}

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

	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			friendlyMessage: this.getFriendlyMessage(),
			path: this.path,
			isRetryable: this.isRetryable(),
			requiresAuth: this.requiresAuth(),
			isQueryError: this.isQueryError(),
			context: this.context,
			timestamp: new Date().toISOString()
		};
	}
}

export interface CollectionSubscription {
	unsubscribe: () => void;
	active: boolean;
	config: CollectionOptions;
}

export interface CollectionQueryResult<T> {
	docs: T[];
	metadata: CollectionMetadata;
	totalCount?: number;
	hasMore?: boolean;
	nextCursor?: unknown;
	prevCursor?: unknown;
}
