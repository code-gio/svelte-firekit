import type { FieldValue, Timestamp } from 'firebase/firestore';
import { CacheSource } from './document.js';

export interface MutationResponse<T = unknown> {
	success: boolean;
	data?: T;
	id?: string;
	error?: MutationError;
	metadata?: MutationMetadata;
}

export interface MutationMetadata {
	timestamp: Date;
	operation: MutationOperationType;
	source: CacheSource;
	performedBy?: string;
	duration?: number;
	fromCache?: boolean;
}

export interface MutationOptions {
	timestamps?: boolean;
	merge?: boolean;
	customId?: string;
	/** User ID stamped on createdBy / updatedBy when timestamps is true. */
	userId?: string;
	validate?: boolean;
	validator?: (data: unknown) => ValidationResult;
	retry?: RetryConfig;
	optimistic?: boolean;
	customMetadata?: Record<string, unknown>;
	transaction?: TransactionOptions;
}

export interface ValidationResult {
	valid: boolean;
	message?: string;
	fieldErrors?: Record<string, string>;
}

export interface RetryConfig {
	enabled: boolean;
	maxAttempts: number;
	baseDelay: number;
	strategy: 'linear' | 'exponential';
	maxDelay?: number;
	shouldRetry?: (error: MutationError, attempt: number) => boolean;
}

export interface TransactionOptions {
	maxAttempts?: number;
	useBatch?: boolean;
	timeout?: number;
}

export interface BatchOperation<T = unknown> {
	type: MutationOperationType;
	path: string;
	data?: T;
	options?: MutationOptions;
	operationId?: string;
}

export interface BatchResult {
	success: boolean;
	successCount: number;
	failureCount: number;
	results: BatchOperationResult[];
	metadata: BatchMetadata;
}

export interface BatchOperationResult {
	operation: BatchOperation;
	success: boolean;
	data?: unknown;
	id?: string;
	error?: MutationError;
	duration?: number;
}

export interface BatchMetadata {
	startTime: Date;
	endTime: Date;
	duration: number;
	operationCount: number;
	executedBy?: string;
	strategy: 'parallel' | 'sequential';
}

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

export interface TimestampFields {
	createdAt?: Timestamp | FieldValue;
	updatedAt?: Timestamp | FieldValue;
	createdBy?: string;
	updatedBy?: string;
}

export interface BulkMutationConfig {
	batchSize?: number;
	parallel?: boolean;
	maxConcurrency?: number;
	failFast?: boolean;
	onProgress?: (completed: number, total: number) => void;
	onError?: (error: MutationError, operation: BatchOperation) => void;
}

export enum MutationErrorCode {
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
	VALIDATION_FAILED = 'mutations/validation-failed',
	REQUIRED_FIELD_MISSING = 'mutations/required-field-missing',
	INVALID_FIELD_TYPE = 'mutations/invalid-field-type',
	INVALID_FIELD_VALUE = 'mutations/invalid-field-value',
	FIELD_TOO_LARGE = 'mutations/field-too-large',
	DOCUMENT_TOO_LARGE = 'mutations/document-too-large',
	INVALID_PATH = 'mutations/invalid-path',
	INVALID_DOCUMENT_ID = 'mutations/invalid-document-id',
	BATCH_TOO_LARGE = 'mutations/batch-too-large',
	TRANSACTION_FAILED = 'mutations/transaction-failed',
	RETRY_EXHAUSTED = 'mutations/retry-exhausted',
	OPTIMISTIC_LOCK_FAILED = 'mutations/optimistic-lock-failed',
	NETWORK_ERROR = 'mutations/network-error',
	TIMEOUT = 'mutations/timeout',
	OFFLINE = 'mutations/offline',
	SERVICE_UNAVAILABLE = 'mutations/service-unavailable',
	QUOTA_EXCEEDED = 'mutations/quota-exceeded',
	UNKNOWN = 'mutations/unknown'
}

export class MutationError extends Error {
	constructor(
		public code: MutationErrorCode,
		message: string,
		public operation?: MutationOperationType,
		public path?: string,
		public originalError?: unknown,
		public context?: Record<string, unknown>
	) {
		super(message);
		this.name = 'MutationError';
	}

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

	requiresAuth(): boolean {
		return (
			this.code === MutationErrorCode.UNAUTHENTICATED ||
			this.code === MutationErrorCode.PERMISSION_DENIED
		);
	}

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

	getSuggestedAction(): string {
		if (this.requiresAuth()) return 'Please sign in and try again.';
		if (this.isValidationError()) return 'Please check your data and try again.';
		if (this.isRetryable()) return 'This appears to be a temporary issue. Please try again.';
		if (this.isPermanent())
			return 'Please check your request and contact support if the issue persists.';
		return 'Please try again or contact support if the issue persists.';
	}

	toJSON(): Record<string, unknown> {
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
