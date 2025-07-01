/**
 * @fileoverview FirekitDocumentMutations - Optimized document mutation service for Svelte
 * @module FirekitDocumentMutations
 * @version 1.0.0
 */

import {
	addDoc,
	setDoc,
	updateDoc,
	deleteDoc,
	doc,
	getDoc,
	collection,
	serverTimestamp,
	increment,
	arrayUnion,
	arrayRemove,
	deleteField,
	writeBatch,
	runTransaction,
	type DocumentData,
	type WithFieldValue,
	type PartialWithFieldValue,
	type DocumentReference,
	type WriteBatch,
	type Transaction
} from 'firebase/firestore';
import { firebaseService } from '../firebase.js';
import { firekitUser } from './user.svelte.js';
import {
	type MutationResponse,
	type MutationOptions,
	type BatchOperation,
	type BatchResult,
	type ExistenceCheckResult,
	type BulkMutationConfig,
	type ValidationResult,
	type MutationAnalytics,
	type TimestampFields,
	MutationOperationType,
	MutationErrorCode,
	MutationError
} from '../types/mutations.js';
import { CacheSource } from '../types/document.js';
/**
 * Comprehensive Firestore document mutation service with advanced features.
 * Handles CRUD operations, batch processing, validation, error handling, and analytics.
 *
 * @class FirekitDocumentMutations
 * @example
 * ```typescript
 * import { firekitDocMutations } from 'svelte-firekit';
 *
 * // Add a new document
 * const result = await firekitDocMutations.add('users', {
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * }, {
 *   timestamps: true,
 *   validate: true
 * });
 *
 * // Batch operations
 * const batchResult = await firekitDocMutations.batch([
 *   { type: 'create', path: 'users', data: userData },
 *   { type: 'update', path: 'profiles/123', data: profileUpdate }
 * ]);
 * ```
 */
class FirekitDocumentMutations {
	private analytics: MutationAnalytics = this.initializeAnalytics();
	private defaultOptions: MutationOptions = {
		timestamps: true,
		merge: false,
		validate: false,
		optimistic: false,
		retry: {
			enabled: true,
			maxAttempts: 3,
			baseDelay: 1000,
			strategy: 'exponential'
		}
	};

	/**
	 * Initialize analytics object
	 */
	private initializeAnalytics(): MutationAnalytics {
		return {
			totalMutations: 0,
			successfulMutations: 0,
			failedMutations: 0,
			successRate: 0,
			averageDuration: 0,
			commonErrors: [],
			performanceByOperation: {} as any,
			retryStats: {
				totalRetries: 0,
				retriesPerMutation: 0,
				retrySuccessRate: 0
			}
		};
	}

	/**
	 * Generate timestamp data for document mutations
	 */
	private getTimestampData(isNew: boolean = true): TimestampFields {
		const timestamps: TimestampFields = {
			updatedAt: serverTimestamp(),
			updatedBy: firekitUser.uid || 'anonymous'
		};

		if (isNew) {
			timestamps.createdAt = serverTimestamp();
			timestamps.createdBy = firekitUser.uid || 'anonymous';
		}

		return timestamps;
	}

	/**
	 * Validate data using custom validator or basic validation
	 */
	private validateData(data: any, validator?: (data: any) => ValidationResult): ValidationResult {
		if (validator) {
			return validator(data);
		}

		// Basic validation
		if (!data || typeof data !== 'object') {
			return {
				valid: false,
				message: 'Data must be a valid object'
			};
		}

		// Check for null/undefined values in top-level fields
		const invalidFields: Record<string, string> = {};
		for (const [key, value] of Object.entries(data)) {
			if (value === null || value === undefined) {
				invalidFields[key] = 'Field cannot be null or undefined';
			}
		}

		if (Object.keys(invalidFields).length > 0) {
			return {
				valid: false,
				message: 'Some fields contain invalid values',
				fieldErrors: invalidFields
			};
		}

		return { valid: true };
	}

	/**
	 * Handle and format mutation errors
	 */
	private handleError(error: any, operation?: string, path?: string): MutationError {
		let mutationError: MutationError;

		if (error instanceof MutationError) {
			mutationError = error;
		} else {
			// Map Firestore errors to MutationError
			const code = this.mapFirestoreErrorCode(error.code);
			mutationError = new MutationError(
				code,
				error.message || 'An unknown error occurred',
				operation as MutationOperationType,
				path,
				error
			);
		}

		// Update analytics
		this.analytics.failedMutations++;
		this.updateErrorAnalytics(mutationError);

		console.error('FirekitDocumentMutations error:', mutationError);
		return mutationError;
	}

	/**
	 * Map Firestore error codes to MutationErrorCode
	 */
	private mapFirestoreErrorCode(firestoreCode: string): MutationErrorCode {
		switch (firestoreCode) {
			case 'permission-denied':
				return MutationErrorCode.PERMISSION_DENIED;
			case 'not-found':
				return MutationErrorCode.NOT_FOUND;
			case 'already-exists':
				return MutationErrorCode.ALREADY_EXISTS;
			case 'failed-precondition':
				return MutationErrorCode.FAILED_PRECONDITION;
			case 'aborted':
				return MutationErrorCode.ABORTED;
			case 'out-of-range':
				return MutationErrorCode.OUT_OF_RANGE;
			case 'unimplemented':
				return MutationErrorCode.UNIMPLEMENTED;
			case 'internal':
				return MutationErrorCode.INTERNAL_ERROR;
			case 'unavailable':
				return MutationErrorCode.UNAVAILABLE;
			case 'deadline-exceeded':
				return MutationErrorCode.DEADLINE_EXCEEDED;
			case 'unauthenticated':
				return MutationErrorCode.UNAUTHENTICATED;
			case 'resource-exhausted':
				return MutationErrorCode.RESOURCE_EXHAUSTED;
			case 'cancelled':
				return MutationErrorCode.CANCELLED;
			default:
				return MutationErrorCode.UNKNOWN;
		}
	}

	/**
	 * Update error analytics
	 */
	private updateErrorAnalytics(error: MutationError): void {
		const existingError = this.analytics.commonErrors.find((e) => e.code === error.code);
		if (existingError) {
			existingError.count++;
		} else {
			this.analytics.commonErrors.push({
				code: error.code,
				count: 1,
				percentage: 0
			});
		}

		// Recalculate percentages
		const totalErrors = this.analytics.commonErrors.reduce((sum, e) => sum + e.count, 0);
		this.analytics.commonErrors.forEach((e) => {
			e.percentage = (e.count / totalErrors) * 100;
		});

		// Sort by count
		this.analytics.commonErrors.sort((a, b) => b.count - a.count);
	}

	/**
	 * Execute operation with retry logic
	 */
	private async executeWithRetry<T>(
		operation: () => Promise<T>,
		options: MutationOptions,
		operationName: string,
		path?: string
	): Promise<T> {
		const retryConfig = { ...this.defaultOptions.retry, ...options.retry };
		let lastError: MutationError;
		let attempt = 0;

		while (attempt < retryConfig.maxAttempts!) {
			try {
				if (attempt > 0) {
					this.analytics.retryStats.totalRetries++;
				}

				const result = await operation();

				if (attempt > 0) {
					// Successful retry
					this.analytics.retryStats.retrySuccessRate =
						(this.analytics.retryStats.retrySuccessRate + 1) / 2;
				}

				return result;
			} catch (error: any) {
				lastError = this.handleError(error, operationName, path);

				if (
					!lastError.isRetryable() ||
					(retryConfig.shouldRetry && !retryConfig.shouldRetry(lastError, attempt))
				) {
					break;
				}

				attempt++;

				if (attempt < retryConfig.maxAttempts!) {
					const delay =
						retryConfig.strategy === 'exponential'
							? Math.min(
									retryConfig.baseDelay! * Math.pow(2, attempt),
									retryConfig.maxDelay || 30000
								)
							: retryConfig.baseDelay!;

					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		throw lastError!;
	}

	// ========================================
	// CRUD OPERATIONS
	// ========================================

	/**
	 * Add a new document to a collection
	 *
	 * @template T Document data type
	 * @param collectionPath Collection path
	 * @param data Document data
	 * @param options Mutation options
	 * @returns Promise resolving to mutation response
	 *
	 * @example
	 * ```typescript
	 * const result = await firekitDocMutations.add('users', {
	 *   name: 'John Doe',
	 *   email: 'john@example.com'
	 * }, {
	 *   timestamps: true,
	 *   customId: 'custom-user-id',
	 *   validate: true
	 * });
	 *
	 * if (result.success) {
	 *   console.log('Created document:', result.id);
	 * }
	 * ```
	 */
	async add<T extends DocumentData>(
		collectionPath: string,
		data: WithFieldValue<T>,
		options: MutationOptions = {}
	): Promise<MutationResponse<T>> {
		const startTime = Date.now();
		const mergedOptions = { ...this.defaultOptions, ...options };

		try {
			// Validate data if requested
			if (mergedOptions.validate) {
				const validation = this.validateData(data, mergedOptions.validator);
				if (!validation.valid) {
					throw new MutationError(
						MutationErrorCode.VALIDATION_FAILED,
						validation.message || 'Validation failed',
						MutationOperationType.CREATE,
						collectionPath,
						null,
						{ fieldErrors: validation.fieldErrors }
					);
				}
			}

			const result = await this.executeWithRetry(
				async () => {
					const firestore = firebaseService.getDbInstance();
					if (!firestore) {
						throw new MutationError(
							MutationErrorCode.SERVICE_UNAVAILABLE,
							'Firestore service not available'
						);
					}

					const colRef = collection(firestore, collectionPath);

					let dataToAdd = {
						...data,
						...(mergedOptions.timestamps && this.getTimestampData())
					};

					let docRef: DocumentReference<T>;

					if (mergedOptions.customId) {
						docRef = doc(colRef, mergedOptions.customId) as DocumentReference<T>;
						dataToAdd = { ...dataToAdd, id: docRef.id };
						await setDoc(docRef, dataToAdd);
					} else {
						docRef = (await addDoc(colRef, dataToAdd)) as DocumentReference<T>;
						dataToAdd = { ...dataToAdd, id: docRef.id };
						await setDoc(docRef, dataToAdd);
					}

					return {
						success: true,
						id: docRef.id,
						data: { ...dataToAdd, id: docRef.id } as T,
						metadata: {
							timestamp: new Date(),
							operation: MutationOperationType.CREATE,
							source: CacheSource.CLIENT,
							performedBy: firekitUser.uid ?? 'anonymous',
							duration: Date.now() - startTime
						}
					};
				},
				mergedOptions,
				MutationOperationType.CREATE,
				collectionPath
			);

			// Update analytics
			this.analytics.totalMutations++;
			this.analytics.successfulMutations++;
			this.updateOperationAnalytics(MutationOperationType.CREATE, Date.now() - startTime, true);

			return result;
		} catch (error: any) {
			this.analytics.totalMutations++;
			const mutationError =
				error instanceof MutationError
					? error
					: this.handleError(error, MutationOperationType.CREATE, collectionPath);
			this.updateOperationAnalytics(MutationOperationType.CREATE, Date.now() - startTime, false);

			return {
				success: false,
				error: mutationError,
				metadata: {
					timestamp: new Date(),
					operation: MutationOperationType.CREATE,
					source: CacheSource.CLIENT,
					performedBy: firekitUser.uid ?? 'anonymous' ?? 'anonymous',
					duration: Date.now() - startTime
				}
			};
		}
	}

	/**
	 * Set document data at specified path
	 *
	 * @template T Document data type
	 * @param path Document path
	 * @param data Document data
	 * @param options Mutation options
	 * @returns Promise resolving to mutation response
	 *
	 * @example
	 * ```typescript
	 * const result = await firekitDocMutations.set('users/123', {
	 *   name: 'John Doe',
	 *   email: 'john@example.com'
	 * }, {
	 *   merge: true,
	 *   timestamps: true
	 * });
	 * ```
	 */
	async set<T extends DocumentData>(
		path: string,
		data: WithFieldValue<T>,
		options: MutationOptions = {}
	): Promise<MutationResponse<T>> {
		const startTime = Date.now();
		const mergedOptions = { ...this.defaultOptions, ...options };

		try {
			if (mergedOptions.validate) {
				const validation = this.validateData(data, mergedOptions.validator);
				if (!validation.valid) {
					throw new MutationError(
						MutationErrorCode.VALIDATION_FAILED,
						validation.message || 'Validation failed',
						MutationOperationType.SET,
						path,
						null,
						{ fieldErrors: validation.fieldErrors }
					);
				}
			}

			const result = await this.executeWithRetry(
				async () => {
					const firestore = firebaseService.getDbInstance();
					if (!firestore) {
						throw new MutationError(
							MutationErrorCode.SERVICE_UNAVAILABLE,
							'Firestore service not available'
						);
					}

					const docRef = doc(firestore, path) as DocumentReference<T>;
					const dataToSet = {
						...data,
						...(mergedOptions.timestamps && this.getTimestampData()),
						id: docRef.id
					} as WithFieldValue<T>;

					await setDoc(docRef, dataToSet, { merge: mergedOptions.merge });

					return {
						success: true,
						id: docRef.id,
						data: dataToSet as T,
						metadata: {
							timestamp: new Date(),
							operation: MutationOperationType.SET,
							source: CacheSource.CLIENT,
							performedBy: firekitUser.uid ?? 'anonymous' ?? 'anonymous',
							duration: Date.now() - startTime
						}
					};
				},
				mergedOptions,
				MutationOperationType.SET,
				path
			);

			this.analytics.totalMutations++;
			this.analytics.successfulMutations++;
			this.updateOperationAnalytics(MutationOperationType.SET, Date.now() - startTime, true);

			return result;
		} catch (error: any) {
			this.analytics.totalMutations++;
			const mutationError =
				error instanceof MutationError
					? error
					: this.handleError(error, MutationOperationType.SET, path);
			this.updateOperationAnalytics(MutationOperationType.SET, Date.now() - startTime, false);

			return {
				success: false,
				error: mutationError,
				metadata: {
					timestamp: new Date(),
					operation: MutationOperationType.SET,
					source: CacheSource.CLIENT,
					performedBy: firekitUser.uid ?? 'anonymous' ?? 'anonymous',
					duration: Date.now() - startTime
				}
			};
		}
	}

	/**
	 * Update a document at specified path
	 *
	 * @template T Document data type
	 * @param path Document path
	 * @param data Update data
	 * @param options Mutation options
	 * @returns Promise resolving to mutation response
	 *
	 * @example
	 * ```typescript
	 * const result = await firekitDocMutations.update('users/123', {
	 *   name: 'Jane Doe',
	 *   lastLogin: serverTimestamp()
	 * });
	 * ```
	 */
	async update<T extends DocumentData>(
		path: string,
		data: PartialWithFieldValue<T>,
		options: MutationOptions = {}
	): Promise<MutationResponse<Partial<T>>> {
		const startTime = Date.now();
		const mergedOptions = { ...this.defaultOptions, ...options };

		try {
			if (mergedOptions.validate) {
				const validation = this.validateData(data, mergedOptions.validator);
				if (!validation.valid) {
					throw new MutationError(
						MutationErrorCode.VALIDATION_FAILED,
						validation.message || 'Validation failed',
						MutationOperationType.UPDATE,
						path,
						null,
						{ fieldErrors: validation.fieldErrors }
					);
				}
			}

			const result = await this.executeWithRetry(
				async () => {
					const firestore = firebaseService.getDbInstance();
					if (!firestore) {
						throw new MutationError(
							MutationErrorCode.SERVICE_UNAVAILABLE,
							'Firestore service not available'
						);
					}

					const docRef = doc(firestore, path) as DocumentReference<T>;
					const dataToUpdate = {
						...data,
						...(mergedOptions.timestamps && this.getTimestampData(false))
					} as PartialWithFieldValue<T>;
					// @ts-ignore
					await updateDoc(docRef, dataToUpdate);

					return {
						success: true,
						id: docRef.id,
						data: dataToUpdate as Partial<T>,
						metadata: {
							timestamp: new Date(),
							operation: MutationOperationType.UPDATE,
							source: CacheSource.CLIENT,
							performedBy: firekitUser.uid ?? 'anonymous' ?? 'anonymous',
							duration: Date.now() - startTime
						}
					};
				},
				mergedOptions,
				MutationOperationType.UPDATE,
				path
			);

			this.analytics.totalMutations++;
			this.analytics.successfulMutations++;
			this.updateOperationAnalytics(MutationOperationType.UPDATE, Date.now() - startTime, true);

			return result;
		} catch (error: any) {
			this.analytics.totalMutations++;
			const mutationError =
				error instanceof MutationError
					? error
					: this.handleError(error, MutationOperationType.UPDATE, path);
			this.updateOperationAnalytics(MutationOperationType.UPDATE, Date.now() - startTime, false);

			return {
				success: false,
				error: mutationError,
				metadata: {
					timestamp: new Date(),
					operation: MutationOperationType.UPDATE,
					source: CacheSource.CLIENT,
					performedBy: firekitUser.uid ?? 'anonymous' ?? 'anonymous',
					duration: Date.now() - startTime
				}
			};
		}
	}

	/**
	 * Delete a document at specified path
	 *
	 * @param path Document path
	 * @param options Mutation options
	 * @returns Promise resolving to mutation response
	 *
	 * @example
	 * ```typescript
	 * const result = await firekitDocMutations.delete('users/123');
	 * if (result.success) {
	 *   console.log('Document deleted');
	 * }
	 * ```
	 */
	async delete(path: string, options: MutationOptions = {}): Promise<MutationResponse<void>> {
		const startTime = Date.now();
		const mergedOptions = { ...this.defaultOptions, ...options };

		try {
			const result = await this.executeWithRetry(
				async () => {
					const firestore = firebaseService.getDbInstance();
					if (!firestore) {
						throw new MutationError(
							MutationErrorCode.SERVICE_UNAVAILABLE,
							'Firestore service not available'
						);
					}

					const docRef = doc(firestore, path);
					await deleteDoc(docRef);

					return {
						success: true,
						id: docRef.id,
						metadata: {
							timestamp: new Date(),
							operation: MutationOperationType.DELETE,
							source: CacheSource.CLIENT,
							performedBy: firekitUser.uid ?? 'anonymous' ?? 'anonymous',
							duration: Date.now() - startTime
						}
					};
				},
				mergedOptions,
				MutationOperationType.DELETE,
				path
			);

			this.analytics.totalMutations++;
			this.analytics.successfulMutations++;
			this.updateOperationAnalytics(MutationOperationType.DELETE, Date.now() - startTime, true);

			return result;
		} catch (error: any) {
			this.analytics.totalMutations++;
			const mutationError =
				error instanceof MutationError
					? error
					: this.handleError(error, MutationOperationType.DELETE, path);
			this.updateOperationAnalytics(MutationOperationType.DELETE, Date.now() - startTime, false);

			return {
				success: false,
				error: mutationError,
				metadata: {
					timestamp: new Date(),
					operation: MutationOperationType.DELETE,
					source: CacheSource.CLIENT,
					performedBy: firekitUser.uid ?? 'anonymous' ?? 'anonymous',
					duration: Date.now() - startTime
				}
			};
		}
	}

	// ========================================
	// FIELD VALUE OPERATIONS
	// ========================================

	/**
	 * Increment a numeric field
	 *
	 * @param path Document path
	 * @param field Field name
	 * @param value Increment value
	 * @param options Mutation options
	 * @returns Promise resolving to mutation response
	 */
	async increment(
		path: string,
		field: string,
		value: number,
		options: MutationOptions = {}
	): Promise<MutationResponse<any>> {
		return this.update(path, { [field]: increment(value) } as any, options);
	}

	/**
	 * Add elements to an array field
	 *
	 * @param path Document path
	 * @param field Field name
	 * @param elements Elements to add
	 * @param options Mutation options
	 * @returns Promise resolving to mutation response
	 */
	async arrayUnion(
		path: string,
		field: string,
		elements: any[],
		options: MutationOptions = {}
	): Promise<MutationResponse<any>> {
		return this.update(path, { [field]: arrayUnion(...elements) } as any, options);
	}

	/**
	 * Remove elements from an array field
	 *
	 * @param path Document path
	 * @param field Field name
	 * @param elements Elements to remove
	 * @param options Mutation options
	 * @returns Promise resolving to mutation response
	 */
	async arrayRemove(
		path: string,
		field: string,
		elements: any[],
		options: MutationOptions = {}
	): Promise<MutationResponse<any>> {
		return this.update(path, { [field]: arrayRemove(...elements) } as any, options);
	}

	/**
	 * Delete a field from document
	 *
	 * @param path Document path
	 * @param field Field name
	 * @param options Mutation options
	 * @returns Promise resolving to mutation response
	 */
	async deleteField(
		path: string,
		field: string,
		options: MutationOptions = {}
	): Promise<MutationResponse<any>> {
		return this.update(path, { [field]: deleteField() } as any, options);
	}

	// ========================================
	// BATCH OPERATIONS
	// ========================================

	/**
	 * Execute multiple operations in a batch
	 *
	 * @param operations Array of batch operations
	 * @param config Bulk mutation configuration
	 * @returns Promise resolving to batch result
	 *
	 * @example
	 * ```typescript
	 * const result = await firekitDocMutations.batch([
	 *   { type: 'create', path: 'users', data: userData },
	 *   { type: 'update', path: 'profiles/123', data: profileUpdate },
	 *   { type: 'delete', path: 'temp/456' }
	 * ], {
	 *   batchSize: 500,
	 *   failFast: false,
	 *   onProgress: (completed, total) => console.log(`${completed}/${total}`)
	 * });
	 * ```
	 */
	async batch(operations: BatchOperation[], config: BulkMutationConfig = {}): Promise<BatchResult> {
		const startTime = Date.now();
		const batchConfig = {
			parallel: false,
			failFast: true,
			...config,
			// Enforce Firestore limit of 500 operations per batch
			batchSize: Math.min(config.batchSize || 500, 500)
		};

		try {
			const firestore = firebaseService.getDbInstance();
			if (!firestore) {
				throw new MutationError(
					MutationErrorCode.SERVICE_UNAVAILABLE,
					'Firestore service not available'
				);
			}

			const results: any[] = [];
			const batches = this.chunkArray(operations, batchConfig.batchSize!);
			let successCount = 0;
			let failureCount = 0;

			for (let i = 0; i < batches.length; i++) {
				const batch = batches[i];
				const batchWriter = writeBatch(firestore);
				const batchResults: any[] = [];

				for (const operation of batch) {
					try {
						await this.addOperationToBatch(batchWriter, operation);
						batchResults.push({
							operation,
							success: true,
							duration: 0 // Will be updated after batch commit
						});
					} catch (error) {
						const mutationError = this.handleError(error, operation.type, operation.path);
						batchResults.push({
							operation,
							success: false,
							error: mutationError,
							duration: 0
						});
						failureCount++;

						if (batchConfig.failFast) {
							throw mutationError;
						}
					}
				}

				// Commit batch
				const batchStartTime = Date.now();
				await batchWriter.commit();
				const batchDuration = Date.now() - batchStartTime;

				// Update durations
				batchResults.forEach((result) => {
					result.duration = batchDuration / batch.length;
					if (result.success) successCount++;
				});

				results.push(...batchResults);

				batchConfig.onProgress?.(
					Math.min((i + 1) * batchConfig.batchSize!, operations.length),
					operations.length
				);
			}

			const batchResult: BatchResult = {
				success: failureCount === 0,
				successCount,
				failureCount,
				results,
				metadata: {
					startTime: new Date(startTime),
					endTime: new Date(),
					duration: Date.now() - startTime,
					operationCount: operations.length,
					executedBy: firekitUser.uid ?? 'anonymous',
					strategy: batchConfig.parallel ? 'parallel' : 'sequential'
				}
			};

			return batchResult;
		} catch (error: any) {
			const mutationError =
				error instanceof MutationError ? error : this.handleError(error, 'batch');
			throw mutationError;
		}
	}

	/**
	 * Add operation to batch writer
	 */
	private async addOperationToBatch(batch: WriteBatch, operation: BatchOperation): Promise<void> {
		const firestore = firebaseService.getDbInstance();
		if (!firestore) throw new Error('Firestore not available');

		const options = { ...this.defaultOptions, ...operation.options };

		switch (operation.type) {
			case 'create': {
				let data = operation.data || {};

				if (options.timestamps) {
					data = { ...data, ...this.getTimestampData() };
				}

				if (options.validate && operation.data) {
					const validation = this.validateData(operation.data, options.validator);
					if (!validation.valid) {
						throw new MutationError(
							MutationErrorCode.VALIDATION_FAILED,
							validation.message || 'Validation failed',
							operation.type,
							operation.path
						);
					}
				}

				// For CREATE operations, use addDoc if no custom ID, otherwise use setDoc
				if (options.customId) {
					// Use setDoc with custom ID
					const docRef = doc(firestore, operation.path, options.customId);
					batch.set(docRef, { ...data, id: options.customId }, { merge: options.merge });
				} else {
					// Use addDoc to let Firestore generate the ID
					// Note: We can't use addDoc in a batch, so we need to generate an ID
					const docId = this.generateDocumentId();
					const docRef = doc(firestore, operation.path, docId);
					batch.set(docRef, { ...data, id: docId }, { merge: options.merge });
				}
				break;
			}

			case 'set': {
				const docRef = doc(firestore, operation.path);
				let data = operation.data || {};

				if (options.timestamps) {
					data = { ...data, ...this.getTimestampData() };
				}

				if (options.validate && operation.data) {
					const validation = this.validateData(operation.data, options.validator);
					if (!validation.valid) {
						throw new MutationError(
							MutationErrorCode.VALIDATION_FAILED,
							validation.message || 'Validation failed',
							operation.type,
							operation.path
						);
					}
				}

				batch.set(docRef, { ...data, id: docRef.id }, { merge: options.merge });
				break;
			}

			case 'update': {
				const docRef = doc(firestore, operation.path);
				let data = operation.data || {};

				if (options.timestamps) {
					data = { ...data, ...this.getTimestampData(false) };
				}

				if (options.validate && operation.data) {
					const validation = this.validateData(operation.data, options.validator);
					if (!validation.valid) {
						throw new MutationError(
							MutationErrorCode.VALIDATION_FAILED,
							validation.message || 'Validation failed',
							operation.type,
							operation.path
						);
					}
				}

				batch.update(docRef, data);
				break;
			}

			case 'delete': {
				const docRef = doc(firestore, operation.path);
				batch.delete(docRef);
				break;
			}

			default:
				throw new MutationError(
					MutationErrorCode.UNIMPLEMENTED,
					`Operation type ${operation.type} not supported in batch`
				);
		}
	}

	/**
	 * Generate a unique document ID (Firestore-style)
	 */
	private generateDocumentId(): string {
		// Generate a Firestore-style document ID (20 characters, alphanumeric)
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		for (let i = 0; i < 20; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	/**
	 * Chunk array into smaller arrays
	 */
	private chunkArray<T>(array: T[], chunkSize: number): T[][] {
		const chunks: T[][] = [];
		for (let i = 0; i < array.length; i += chunkSize) {
			chunks.push(array.slice(i, i + chunkSize));
		}
		return chunks;
	}

	// ========================================
	// UTILITY METHODS
	// ========================================

	/**
	 * Check if a document exists at specified path
	 *
	 * @param path Document path
	 * @returns Promise resolving to existence check result
	 *
	 * @example
	 * ```typescript
	 * const checkResult = await firekitDocMutations.exists('users/123');
	 * if (checkResult.exists) {
	 *   console.log('Document exists');
	 * }
	 * ```
	 */
	async exists(path: string): Promise<ExistenceCheckResult> {
		try {
			const firestore = firebaseService.getDbInstance();
			if (!firestore) {
				throw new MutationError(
					MutationErrorCode.SERVICE_UNAVAILABLE,
					'Firestore service not available'
				);
			}

			const docRef = doc(firestore, path);
			const docSnap = await getDoc(docRef);

			return {
				exists: docSnap.exists(),
				id: docSnap.exists() ? docSnap.id : undefined,
				lastModified: docSnap.exists()
					? docSnap.metadata.fromCache
						? undefined
						: new Date()
					: undefined,
				metadata: docSnap.exists()
					? {
							size: JSON.stringify(docSnap.data()).length,
							updateTime: docSnap.metadata.fromCache ? new Date() : new Date(),
							createTime: docSnap.metadata.fromCache ? new Date() : new Date()
						}
					: undefined
			};
		} catch (error) {
			console.error('Error checking document existence:', error);
			return { exists: false };
		}
	}

	/**
	 * Get a document at specified path
	 *
	 * @template T Document data type
	 * @param path Document path
	 * @returns Promise resolving to mutation response with document data
	 *
	 * @example
	 * ```typescript
	 * const result = await firekitDocMutations.getDoc<UserData>('users/123');
	 * if (result.success && result.data) {
	 *   console.log('User data:', result.data);
	 * }
	 * ```
	 */
	async getDoc<T extends DocumentData>(path: string): Promise<MutationResponse<T>> {
		try {
			const firestore = firebaseService.getDbInstance();
			if (!firestore) {
				throw new MutationError(
					MutationErrorCode.SERVICE_UNAVAILABLE,
					'Firestore service not available'
				);
			}

			const docRef = doc(firestore, path) as DocumentReference<T>;
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists()) {
				return {
					success: false,
					error: new MutationError(
						MutationErrorCode.NOT_FOUND,
						'Document does not exist',
						undefined,
						path
					)
				};
			}

			return {
				success: true,
				id: docSnap.id,
				data: { id: docSnap.id, ...docSnap.data() } as T,
				metadata: {
					timestamp: new Date(),
					operation: MutationOperationType.READ,
					source: docSnap.metadata.fromCache ? CacheSource.CACHE : CacheSource.SERVER,
					performedBy: firekitUser.uid ?? 'anonymous',
					fromCache: docSnap.metadata.fromCache
				}
			};
		} catch (error: any) {
			const mutationError = this.handleError(error, 'read', path);
			return {
				success: false,
				error: mutationError
			};
		}
	}

	/**
	 * Update operation analytics
	 */
	private updateOperationAnalytics(
		operation: MutationOperationType,
		duration: number,
		success: boolean
	): void {
		if (!this.analytics.performanceByOperation[operation]) {
			this.analytics.performanceByOperation[operation] = {
				count: 0,
				averageDuration: 0,
				successRate: 0
			};
		}

		const stats = this.analytics.performanceByOperation[operation];
		stats.count++;
		stats.averageDuration = (stats.averageDuration * (stats.count - 1) + duration) / stats.count;

		if (success) {
			stats.successRate = (stats.successRate * (stats.count - 1) + 100) / stats.count;
		} else {
			stats.successRate = (stats.successRate * (stats.count - 1)) / stats.count;
		}

		// Update overall analytics
		this.analytics.successRate =
			(this.analytics.successfulMutations / this.analytics.totalMutations) * 100;
		this.analytics.averageDuration =
			(this.analytics.averageDuration * (this.analytics.totalMutations - 1) + duration) /
			this.analytics.totalMutations;
	}

	/**
	 * Get current mutation analytics
	 *
	 * @returns Current analytics data
	 */
	getAnalytics(): MutationAnalytics {
		return { ...this.analytics };
	}

	/**
	 * Reset analytics data
	 */
	resetAnalytics(): void {
		this.analytics = this.initializeAnalytics();
	}

	// ========================================
	// STATIC FIELD VALUE HELPERS
	// ========================================

	/**
	 * Create server timestamp field value
	 */
	static serverTimestamp() {
		return serverTimestamp();
	}

	/**
	 * Create increment field value
	 */
	static increment(value: number) {
		return increment(value);
	}

	/**
	 * Create array union field value
	 */
	static arrayUnion(...elements: any[]) {
		return arrayUnion(...elements);
	}

	/**
	 * Create array remove field value
	 */
	static arrayRemove(...elements: any[]) {
		return arrayRemove(...elements);
	}

	/**
	 * Create delete field value
	 */
	static deleteField() {
		return deleteField();
	}
}

/**
 * Pre-initialized singleton instance of FirekitDocumentMutations.
 *
 * @example
 * ```typescript
 * import { firekitDocMutations } from 'svelte-firekit';
 *
 * // Add document
 * const result = await firekitDocMutations.add('users', userData);
 *
 * // Update document
 * await firekitDocMutations.update('users/123', { name: 'New Name' });
 *
 * // Batch operations
 * const batchResult = await firekitDocMutations.batch([
 *   { type: 'create', path: 'users', data: userData },
 *   { type: 'update', path: 'profiles/123', data: updateData }
 * ]);
 * ```
 */
export const firekitDocMutations = new FirekitDocumentMutations();
