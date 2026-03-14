import {
	loadBundle,
	namedQuery,
	type Query,
	type DocumentData
} from 'firebase/firestore';
import { firebaseService } from '../firebase.js';

function getDb() {
	const db = firebaseService.getDbInstance();
	if (!db) throw new Error('Firestore is not initialized.');
	return db;
}

/**
 * Loads a Firestore bundle into the local cache.
 *
 * Bundles are pre-packaged snapshots of query results generated server-side,
 * which lets you serve initial data from CDN/cache instead of hitting Firestore.
 *
 * After loading, use `getNamedQuery()` to retrieve a cached query and pass it
 * to `FirekitCollection` or `getDocs`.
 *
 * @param data  The bundle data — a `ReadableStream<Uint8Array>`, `ArrayBuffer`, or `string`.
 * @returns     Total number of documents loaded from the bundle.
 *
 * @example
 * ```ts
 * import { loadFirestoreBundle, getNamedQuery } from 'svelte-firekit';
 * import { getDocs } from 'firebase/firestore';
 *
 * const res = await fetch('/bundles/featured-posts.bundle');
 * await loadFirestoreBundle(res.body!);
 *
 * const q = await getNamedQuery('featured-posts');
 * if (q) {
 *   const snap = await getDocs(q);
 * }
 * ```
 */
export async function loadFirestoreBundle(
	data: ReadableStream<Uint8Array> | ArrayBuffer | string
): Promise<number> {
	const db = getDb();
	const result = await loadBundle(db, data);
	return result.totalDocuments;
}

/**
 * Retrieves a named query that was loaded via `loadFirestoreBundle()`.
 *
 * Returns `null` if the named query has not been loaded yet.
 *
 * @example
 * ```ts
 * const query = await getNamedQuery<Post>('featured-posts');
 * if (query) {
 *   const snap = await getDocs(query);
 * }
 * ```
 */
export async function getNamedQuery<T = DocumentData>(
	queryName: string
): Promise<Query<T> | null> {
	const db = getDb();
	const result = await namedQuery(db, queryName);
	return result as Query<T> | null;
}
