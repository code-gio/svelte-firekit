<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import { firebaseService } from '$lib/firebase.js';

	/**
	 * Props for FirebaseApp component
	 */
	let { children }: { children: Snippet } = $props();

	// Only initialize Firebase in the browser
	if (browser) {
		// Get Firebase app instance from service
		const app = firebaseService.getFirebaseApp();
		const auth = firebaseService.getAuthInstance();
		const firestore = firebaseService.getDbInstance();
		const storage = firebaseService.getStorageInstance();
		const rtdb = firebaseService.getDatabaseInstance();
		const analytics = firebaseService.getAnalyticsInstance();
		const functions = firebaseService.getFunctionsInstance();
		// Set Firebase instances in context
		setContext('firebase/app', app);
		setContext('firebase/auth', auth);
		setContext('firebase/firestore', firestore);
		setContext('firebase/storage', storage);
		setContext('firebase/rtdb', rtdb);
		setContext('firebase/analytics', analytics);
		setContext('firebase/functions', functions);
	}
</script>

{@render children()}
