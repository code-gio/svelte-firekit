/**
 * @fileoverview Document mutation types and interfaces for FirekitDocumentMutations
 * @module MutationTypes
 * @version 1.0.0
 */

import type { FieldValue, Timestamp } from 'firebase/firestore';
import { CacheSource } from './document.js';

/**
 * Response structure for document mutations
 */
export interface MutationResponse<T = any> {
	/** Operation success status */
	success: boolean;
	/** Document data */
	data?: T;
	/** Document ID */
	id?: string;
	/** Error details if operation failed */
	error?: MutationError;
	/** Operation metadata */
	metadata?: MutationMetadata;
}

/**
 * Metadata for mutation operations
 */
export interface MutationMetadata {
	/** Operation timestamp */
	timestamp: Date;
	/** Operation type */
	operation: MutationOperationType;
	/** Data source */
	source: CacheSource;
	/** User who performed the operation */
	performedBy?: string;
	/** Duration of operation in milliseconds */
	duration?: number;
	/** Whether operation was cached */
	fromCache?: boolean;
}

/**
 * Options for document mutations
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
	validator?: (data: any) => ValidationResult;
	/** Retry configuration */
	retry?: RetryConfig;
	/** Whether to perform optimistic updates */
	optimistic?: boolean;
	/** Custom metadata to include */
	customMetadata?: Record<string, any>;
	/** Transaction options */
	transaction?: TransactionOptions;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
	/** Whether validation passed */
	valid: boolean;
	/** Validation error message if failed */
	message?: string;
	/** Field-specific errors */
	fieldErrors?: Record<string, string>;
}

/**
 * Retry configuration for failed operations
 */
export interface RetryConfig {
	/** Whether retry is enabled */
	enabled: boolean;
	/** Maximum number of retry attempts */
	maxAttempts: number;
	/** Base delay between retries in milliseconds */
	baseDelay: number;
	/** Backoff strategy */
	strategy: 'linear' | 'exponential';
	/** Maximum delay between retries */
	maxDelay?: number;
	/** Custom retry condition function */
	shouldRetry?: (error: MutationError, attempt: number) => boolean;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
	/** Maximum number of transaction attempts */
	maxAttempts?: number;
	/** Whether to use batch writes instead of transactions */
	useBatch?: boolean;
	/** Custom transaction timeout */
	timeout?: number;
}

/**
 * Batch operation interface
 */
export interface BatchOperation<T = any> {
	/** Operation type */
	type: MutationOperationType;
	/** Document path */
	path: string;
	/** Data for create/update operations */
	data?: T;
	/** Options specific to this operation */
	options?: MutationOptions;
	/** Custom ID for operation tracking */
	operationId?: string;
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
	results: BatchOperationResult[];
	/** Batch execution metadata */
	metadata: BatchMetadata;
}

/**
 * Individual batch operation result
 */
export interface BatchOperationResult {
	/** The original operation */
	operation: BatchOperation;
	/** Operation success status */
	success: boolean;
	/** Result data if successful */
	data?: any;
	/** Document ID if applicable */
	id?: string;
	/** Error if failed */
	error?: MutationError;
	/** Operation execution time */
	duration?: number;
}

/**
 * Batch operation metadata
 */
export interface BatchMetadata {
	/** Batch execution start time */
	startTime: Date;
	/** Batch execution end time */
	endTime: Date;
	/** Total execution duration */
	duration: number;
	/** Batch size */
	operationCount: number;
	/** User who executed the batch */
	executedBy?: string;
	/** Batch execution strategy */
	strategy: 'parallel' | 'sequential';
}

/**
 * Mutation operation types
 */
export enum MutationOperationType {
	CREATE = 'create',
	SET = 'set',
	UPDATE = 'update',
	DELETE = 'delete',
	INCREMENT = 'increment',
	ARRAY_UNION = 'arrayUnion',
	ARRAY_REMOVE = 'arrayRemove',
	TRANSACTION = 'transaction',
	READ = 'read'
}

/**
 * Document timestamp fields
 */
export interface TimestampFields {
	/** Document creation timestamp */
	createdAt?: Timestamp | FieldValue;
	/** Document last update timestamp */
	updatedAt?: Timestamp | FieldValue;
	/** User who created the document */
	createdBy?: string;
	/** User who last updated the document */
	updatedBy?: string;
}

/**
 * Field value operations for special Firestore operations
 */
export interface FieldValueOperations {
	/** Server timestamp */
	serverTimestamp(): FieldValue;
	/** Increment numeric value */
	increment(value: number): FieldValue;
	/** Add elements to array */
	arrayUnion(...elements: any[]): FieldValue;
	/** Remove elements from array */
	arrayRemove(...elements: any[]): FieldValue;
	/** Delete field */
	deleteField(): FieldValue;
}

/**
 * Document existence check result
 */
export interface ExistenceCheckResult {
	/** Whether document exists */
	exists: boolean;
	/** Document ID if exists */
	id?: string;
	/** Last modified timestamp */
	lastModified?: Date;
	/** Document metadata */
	metadata?: {
		size: number;
		updateTime: Date;
		createTime: Date;
	};
}

/**
 * Bulk mutation configuration
 */
export interface BulkMutationConfig {
	/** Batch size for bulk operations */
	batchSize?: number;
	/** Whether to run operations in parallel */
	parallel?: boolean;
	/** Maximum concurrency for parallel operations */
	maxConcurrency?: number;
	/** Whether to stop on first error */
	failFast?: boolean;
	/** Progress callback */
	onProgress?: (completed: number, total: number) => void;
	/** Error callback */
	onError?: (error: MutationError, operation: BatchOperation) => void;
}

/**
 * Optimistic update configuration
 */
export interface OptimisticUpdateConfig {
	/** Whether optimistic updates are enabled */
	enabled: boolean;
	/** Rollback strategy on failure */
	rollbackStrategy: 'automatic' | 'manual';
	/** Timeout for confirming optimistic update */
	confirmationTimeout?: number;
	/** Custom rollback function */
	rollbackFn?: (originalData: any) => void;
}

/**
 * Mutation error codes enum
 */
export enum MutationErrorCode {
	// Firebase errors
	PERMISSION_DENIED = 'mutations/permission-denied',
	NOT_FOUND = 'mutations/not-found',
	ALREADY_EXISTS = 'mutations/already-exists',
	FAILED_PRECONDITION = 'mutations/failed-precondition',
	ABORTED = 'mutations/aborted',
	OUT_OF_RANGE = 'mutations/out-of-range',
	UNIMPLEMENTED = 'mutations/unimplemented',
	INTERNAL_ERROR = 'mutations/internal',
	UNAVAILABLE = 'mutations/unavailable',
	DEADLINE_EXCEEDED = 'mutations/deadline-exceeded',
	UNAUTHENTICATED = 'mutations/unauthenticated',
	RESOURCE_EXHAUSTED = 'mutations/resource-exhausted',
	CANCELLED = 'mutations/cancelled',

	// Validation errors
	VALIDATION_FAILED = 'mutations/validation-failed',
	REQUIRED_FIELD_MISSING = 'mutations/required-field-missing',
	INVALID_FIELD_TYPE = 'mutations/invalid-field-type',
	INVALID_FIELD_VALUE = 'mutations/invalid-field-value',
	FIELD_TOO_LARGE = 'mutations/field-too-large',
	DOCUMENT_TOO_LARGE = 'mutations/document-too-large',

	// Operation errors
	INVALID_PATH = 'mutations/invalid-path',
	INVALID_DOCUMENT_ID = 'mutations/invalid-document-id',
	BATCH_TOO_LARGE = 'mutations/batch-too-large',
	TRANSACTION_FAILED = 'mutations/transaction-failed',
	RETRY_EXHAUSTED = 'mutations/retry-exhausted',
	OPTIMISTIC_LOCK_FAILED = 'mutations/optimistic-lock-failed',

	// Network errors
	NETWORK_ERROR = 'mutations/network-error',
	TIMEOUT = 'mutations/timeout',
	OFFLINE = 'mutations/offline',

	// Service errors
	SERVICE_UNAVAILABLE = 'mutations/service-unavailable',
	QUOTA_EXCEEDED = 'mutations/quota-exceeded',

	// Unknown
	UNKNOWN = 'mutations/unknown'
}

/**
 * Custom mutation error class
 */
export class MutationError extends Error {
	constructor(
		public code: MutationErrorCode,
		message: string,
		public operation?: MutationOperationType,
		public path?: string,
		public originalError?: any,
		public context?: Record<string, any>
	) {
		super(message);
		this.name = 'MutationError';
	}

	/**
	 * Get user-friendly error message
	 */
	getFriendlyMessage(): string {
		switch (this.code) {
			case MutationErrorCode.PERMISSION_DENIED:
				return 'You do not have permission to perform this operation.';
			case MutationErrorCode.NOT_FOUND:
				return 'The document you are trying to update was not found.';
			case MutationErrorCode.ALREADY_EXISTS:
				return 'A document with this ID already exists.';
			case MutationErrorCode.VALIDATION_FAILED:
				return 'The provided data is invalid.';
			case MutationErrorCode.REQUIRED_FIELD_MISSING:
				return 'Required fields are missing.';
			case MutationErrorCode.INVALID_FIELD_TYPE:
				return 'One or more fields have incorrect data types.';
			case MutationErrorCode.DOCUMENT_TOO_LARGE:
				return 'The document is too large to save.';
			case MutationErrorCode.NETWORK_ERROR:
				return 'Network connection error. Please try again.';
			case MutationErrorCode.TIMEOUT:
				return 'Operation timed out. Please try again.';
			case MutationErrorCode.UNAVAILABLE:
				return 'Service is temporarily unavailable. Please try again later.';
			case MutationErrorCode.QUOTA_EXCEEDED:
				return 'Usage quota exceeded. Please try again later.';
			case MutationErrorCode.UNAUTHENTICATED:
				return 'Please sign in to perform this operation.';
			case MutationErrorCode.OFFLINE:
				return 'You are offline. Changes will be saved when connection is restored.';
			default:
				return this.message || 'An unexpected error occurred.';
		}
	}

	/**
	 * Check if error is retryable
	 */
	isRetryable(): boolean {
		const retryableCodes = [
			MutationErrorCode.NETWORK_ERROR,
			MutationErrorCode.TIMEOUT,
			MutationErrorCode.UNAVAILABLE,
			MutationErrorCode.INTERNAL_ERROR,
			MutationErrorCode.ABORTED,
			MutationErrorCode.DEADLINE_EXCEEDED,
			MutationErrorCode.CANCELLED
		];
		return retryableCodes.includes(this.code);
	}

	/**
	 * Check if error requires user authentication
	 */
	requiresAuth(): boolean {
		const authCodes = [MutationErrorCode.UNAUTHENTICATED, MutationErrorCode.PERMISSION_DENIED];
		return authCodes.includes(this.code);
	}

	/**
	 * Check if error is a validation error
	 */
	isValidationError(): boolean {
		const validationCodes = [
			MutationErrorCode.VALIDATION_FAILED,
			MutationErrorCode.REQUIRED_FIELD_MISSING,
			MutationErrorCode.INVALID_FIELD_TYPE,
			MutationErrorCode.INVALID_FIELD_VALUE,
			MutationErrorCode.FIELD_TOO_LARGE,
			MutationErrorCode.DOCUMENT_TOO_LARGE
		];
		return validationCodes.includes(this.code);
	}

	/**
	 * Check if error is permanent (not retryable)
	 */
	isPermanent(): boolean {
		const permanentCodes = [
			MutationErrorCode.PERMISSION_DENIED,
			MutationErrorCode.INVALID_PATH,
			MutationErrorCode.INVALID_DOCUMENT_ID,
			MutationErrorCode.UNIMPLEMENTED,
			MutationErrorCode.OUT_OF_RANGE
		];
		return permanentCodes.includes(this.code);
	}

	/**
	 * Get suggested action for the error
	 */
	getSuggestedAction(): string {
		if (this.requiresAuth()) {
			return 'Please sign in and try again.';
		}
		if (this.isValidationError()) {
			return 'Please check your data and try again.';
		}
		if (this.isRetryable()) {
			return 'This appears to be a temporary issue. Please try again.';
		}
		if (this.isPermanent()) {
			return 'Please check your request and contact support if the issue persists.';
		}
		return 'Please try again or contact support if the issue persists.';
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
			suggestedAction: this.getSuggestedAction(),
			operation: this.operation,
			path: this.path,
			isRetryable: this.isRetryable(),
			requiresAuth: this.requiresAuth(),
			isValidationError: this.isValidationError(),
			isPermanent: this.isPermanent(),
			context: this.context,
			timestamp: new Date().toISOString()
		};
	}
}

/**
 * Mutation event types for tracking operations
 */

/**
 * Mutation analytics data
 */
export interface MutationAnalytics {
	/** Total number of mutations */
	totalMutations: number;
	/** Number of successful mutations */
	successfulMutations: number;
	/** Number of failed mutations */
	failedMutations: number;
	/** Success rate percentage */
	successRate: number;
	/** Average mutation duration */
	averageDuration: number;
	/** Most common error codes */
	commonErrors: Array<{
		code: MutationErrorCode;
		count: number;
		percentage: number;
	}>;
	/** Performance metrics by operation type */
	performanceByOperation: Record<
		MutationOperationType,
		{
			count: number;
			averageDuration: number;
			successRate: number;
		}
	>;
	/** Retry statistics */
	retryStats: {
		totalRetries: number;
		retriesPerMutation: number;
		retrySuccessRate: number;
	};
}
