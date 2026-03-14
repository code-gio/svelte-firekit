/**
 * Typed Svelte context getters for Firebase service instances.
 *
 * These must be called during component initialisation (inside `<script>` or a
 * function called synchronously at component init time), after a `<FirebaseApp>`
 * ancestor has set them via `setContext`.
 *
 * For the reactive singleton services (`firekitUser`, `firekitAuth`, etc.) you
 * can also just import them directly — no context needed.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { getFirestoreContext, getAuthContext } from 'svelte-firekit';
 *   const db = getFirestoreContext();   // Firestore instance
 *   const auth = getAuthContext();      // Auth instance
 * </script>
 * ```
 */

import { getContext } from 'svelte';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { Database } from 'firebase/database';
import type { Functions } from 'firebase/functions';
import type { AppCheck } from 'firebase/app-check';
import type { firekitAnalytics } from './services/analytics.js';
import type { firekitMessaging } from './services/messaging.svelte.js';

/** Returns the `FirebaseApp` instance set by `<FirebaseApp>`. */
export function getFirebaseAppContext(): FirebaseApp | undefined {
	return getContext<FirebaseApp>('firebase/app');
}

/** Returns the Firebase `Auth` instance set by `<FirebaseApp>`. */
export function getAuthContext(): Auth | undefined {
	return getContext<Auth>('firebase/auth');
}

/** Returns the `Firestore` instance set by `<FirebaseApp>`. */
export function getFirestoreContext(): Firestore | undefined {
	return getContext<Firestore>('firebase/firestore');
}

/** Returns the `FirebaseStorage` instance set by `<FirebaseApp>`. */
export function getStorageContext(): FirebaseStorage | undefined {
	return getContext<FirebaseStorage>('firebase/storage');
}

/** Returns the Realtime Database `Database` instance set by `<FirebaseApp>`. */
export function getRTDBContext(): Database | undefined {
	return getContext<Database>('firebase/rtdb');
}

/** Returns the Cloud Functions `Functions` instance set by `<FirebaseApp>`. */
export function getFunctionsContext(): Functions | undefined {
	return getContext<Functions>('firebase/functions');
}

/** Returns the `AppCheck` instance set by `<FirebaseApp>`, or null if App Check is not enabled. */
export function getAppCheckContext(): AppCheck | null | undefined {
	return getContext<AppCheck | null>('firebase/app-check');
}

/** Returns the `firekitAnalytics` singleton set by `<FirebaseApp>`. */
export function getAnalyticsContext(): typeof firekitAnalytics | undefined {
	return getContext<typeof firekitAnalytics>('firebase/analytics');
}

/** Returns the `firekitMessaging` singleton set by `<FirebaseApp>`. */
export function getMessagingContext(): typeof firekitMessaging | undefined {
	return getContext<typeof firekitMessaging>('firebase/messaging');
}
