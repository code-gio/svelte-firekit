import {
	doc,
	collection,
	addDoc,
	setDoc,
	updateDoc,
	deleteDoc,
	getDoc,
	writeBatch,
	runTransaction,
	serverTimestamp as firestoreServerTimestamp,
	increment as firestoreIncrement,
	arrayUnion as firestoreArrayUnion,
	arrayRemove as firestoreArrayRemove,
	deleteField as firestoreDeleteField,
	type DocumentReference,
	type WriteBatch,
	type Transaction,
	type FieldValue,
	type WithFieldValue,
	type UpdateData
} from 'firebase/firestore';
import { firebaseService } from '../firebase.js';
import type { MutationOptions } from '../types/mutations.js';

/**
 * A single mutation operation for use in batchOps().
 * (Named FirekitBatchOp to avoid conflict with the richer BatchOperation type in types/mutations.)
 */
export interface FirekitBatchOp {
	type: 'set' | 'update' | 'delete';
	path: string;
	id?: string;
	data?: Record<string, unknown>;
	merge?: boolean;
}

/**
 * Result of a batchOps() call.
 */
export interface FirekitBatchResult {
	success: boolean;
	count: number;
	error?: Error;
}

const DEFAULT_OPTIONS: MutationOptions = {
	timestamps: true,
	userId: '',
	retry: { enabled: false, maxAttempts: 3, baseDelay: 200, strategy: 'exponential' }
};

function getDb() {
	const db = firebaseService.getDbInstance();
	if (!db) throw new Error('Firestore is not initialized.');
	return db;
}

/** Resolves merged options and runs the validator if enabled. */
async function resolveOpts(options: MutationOptions, data?: unknown): Promise<MutationOptions> {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	if (opts.validate && opts.validator && data !== undefined) {
		const result = opts.validator(data);
		if (!result.valid) {
			throw new Error(result.message ?? 'Validation failed');
		}
	}
	return opts;
}

/** Runs fn, retrying on failure according to retryConfig. */
async function maybeRetry<T>(fn: () => Promise<T>, opts: MutationOptions): Promise<T> {
	const retry = opts.retry;
	if (!retry?.enabled) return fn();
	return withRetry(fn, retry);
}

/** Wait helper for retry backoff. */
function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
	fn: () => Promise<T>,
	retryConfig: Required<MutationOptions>['retry']
): Promise<T> {
	let lastError: unknown;
	for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (err) {
			lastError = err;
			if (attempt < retryConfig.maxAttempts) {
				await wait(retryConfig.baseDelay * 2 ** (attempt - 1));
			}
		}
	}
	throw lastError;
}

/**
 * Firestore document mutations — add, set, update, delete, batch, transaction.
 *
 * @example
 * ```ts
 * import { firekitMutations } from 'svelte-firekit';
 * await firekitMutations.add('users', { name: 'Alice' });
 * await firekitMutations.update('users/uid123', { name: 'Bob' });
 * ```
 */
class FirekitDocumentMutations {
	private static instance: FirekitDocumentMutations;

	private constructor() {}

	static getInstance(): FirekitDocumentMutations {
		if (!FirekitDocumentMutations.instance) {
			FirekitDocumentMutations.instance = new FirekitDocumentMutations();
		}
		return FirekitDocumentMutations.instance;
	}

	// ── Helpers ──────────────────────────────────────────────────────────────────

	private buildTimestamps(isCreate: boolean, userId?: string): Record<string, unknown> {
		const ts: Record<string, unknown> = { updatedAt: firestoreServerTimestamp() };
		if (isCreate) ts.createdAt = firestoreServerTimestamp();
		if (userId) {
			ts.updatedBy = userId;
			if (isCreate) ts.createdBy = userId;
		}
		return ts;
	}

	private resolveRef(pathOrRef: string | DocumentReference): DocumentReference {
		if (typeof pathOrRef !== 'string') return pathOrRef;
		const db = getDb();
		const segments = pathOrRef.split('/').filter(Boolean);
		if (segments.length % 2 !== 0) throw new Error(`Invalid document path: "${pathOrRef}"`);
		return doc(db, pathOrRef);
	}

	/** Generates a new Firestore document ID for a given collection path. */
	generateId(collectionPath: string): string {
		const db = getDb();
		return doc(collection(db, collectionPath)).id;
	}

	// ── CRUD ─────────────────────────────────────────────────────────────────────

	/**
	 * Adds a new document to a collection with an auto-generated ID.
	 * Returns the new document reference.
	 */
	async add<T extends Record<string, unknown>>(
		collectionPath: string,
		data: T,
		options: MutationOptions = {}
	): Promise<DocumentReference> {
		const opts = await resolveOpts(options, data);
		const payload = opts.timestamps
			? { ...data, ...this.buildTimestamps(true, opts.userId) }
			: data;
		const db = getDb();
		const colRef = collection(db, collectionPath);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return maybeRetry(() => addDoc(colRef, payload as any), opts);
	}

	/**
	 * Sets (overwrites or merges) a document at the given path.
	 */
	async set<T extends Record<string, unknown>>(
		pathOrRef: string | DocumentReference,
		data: T,
		options: MutationOptions = {}
	): Promise<void> {
		const opts = await resolveOpts(options, data);
		const payload = opts.timestamps
			? { ...data, ...this.buildTimestamps(true, opts.userId) }
			: data;
		const ref = this.resolveRef(pathOrRef) as unknown as DocumentReference<T>;
		const merge = opts.merge ?? false;
		return maybeRetry(
			() => merge
				? setDoc(ref, payload as WithFieldValue<T>, { merge: true })
				: setDoc(ref, payload as WithFieldValue<T>),
			opts
		);
	}

	/**
	 * Updates specific fields of an existing document.
	 */
	async update<T extends Record<string, unknown>>(
		pathOrRef: string | DocumentReference,
		data: Partial<T> & Record<string, unknown>,
		options: MutationOptions = {}
	): Promise<void> {
		const opts = await resolveOpts(options, data);
		const payload = opts.timestamps
			? { ...data, ...this.buildTimestamps(false, opts.userId) }
			: data;
		const ref = this.resolveRef(pathOrRef) as unknown as DocumentReference<T>;
		return maybeRetry(() => updateDoc(ref, payload as UpdateData<T>), opts);
	}

	/**
	 * Deletes a document.
	 */
	async delete(pathOrRef: string | DocumentReference, options: MutationOptions = {}): Promise<void> {
		const opts = await resolveOpts(options);
		const ref = this.resolveRef(pathOrRef);
		return maybeRetry(() => deleteDoc(ref), opts);
	}

	// ── Existence ────────────────────────────────────────────────────────────────

	/** Returns true if a document exists at the given path. */
	async exists(pathOrRef: string | DocumentReference): Promise<boolean> {
		const ref = this.resolveRef(pathOrRef);
		const snap = await getDoc(ref);
		return snap.exists();
	}

	/** Fetches a document snapshot and returns its data, or null if it doesn't exist. */
	async fetch<T>(pathOrRef: string | DocumentReference): Promise<T | null> {
		const ref = this.resolveRef(pathOrRef);
		const snap = await getDoc(ref);
		return snap.exists() ? (snap.data() as T) : null;
	}

	// ── Batch ────────────────────────────────────────────────────────────────────

	/**
	 * Executes a batch of mutations, automatically chunked into groups of 500.
	 */
	async batchOps(operations: FirekitBatchOp[], options: MutationOptions = {}): Promise<FirekitBatchResult> {
		if (operations.length === 0) return { success: true, count: 0 };

		const opts = await resolveOpts(options);
		const db = getDb();
		const CHUNK = 500;

		try {
			for (let i = 0; i < operations.length; i += CHUNK) {
				const chunk = operations.slice(i, i + CHUNK);
				const batch: WriteBatch = writeBatch(db);

				for (const op of chunk) {
					const ref =
						op.id
							? doc(db, op.path, op.id)
							: doc(db, op.path);

					if (op.type === 'delete') {
						batch.delete(ref);
					} else if (op.type === 'set' && op.data) {
						const payload = opts.timestamps
							? { ...op.data, ...this.buildTimestamps(true, opts.userId) }
							: op.data;
						op.merge ? batch.set(ref, payload, { merge: true }) : batch.set(ref, payload);
					} else if (op.type === 'update' && op.data) {
						const payload = opts.timestamps
							? { ...op.data, ...this.buildTimestamps(false, opts.userId) }
							: op.data;
						batch.update(ref, payload as UpdateData<Record<string, unknown>>);
					}
				}

				await batch.commit();
			}

			return { success: true, count: operations.length };
		} catch (err) {
			return {
				success: false,
				count: 0,
				error: err instanceof Error ? err : new Error(String(err))
			};
		}
	}

	// ── Transaction ──────────────────────────────────────────────────────────────

	/**
	 * Runs a Firestore transaction.
	 */
	async transaction<T>(
		fn: (transaction: Transaction) => Promise<T>
	): Promise<T> {
		const db = getDb();
		return runTransaction(db, fn);
	}

	// ── Field value helpers ──────────────────────────────────────────────────────

	/** Firestore server timestamp sentinel. */
	serverTimestamp(): FieldValue {
		return firestoreServerTimestamp();
	}

	/** Firestore increment sentinel. */
	increment(n: number): FieldValue {
		return firestoreIncrement(n);
	}

	/** Firestore arrayUnion sentinel. */
	arrayUnion(...elements: unknown[]): FieldValue {
		return firestoreArrayUnion(...elements);
	}

	/** Firestore arrayRemove sentinel. */
	arrayRemove(...elements: unknown[]): FieldValue {
		return firestoreArrayRemove(...elements);
	}

	/** Firestore deleteField sentinel. */
	deleteField(): FieldValue {
		return firestoreDeleteField();
	}
}

export const firekitMutations = FirekitDocumentMutations.getInstance();
