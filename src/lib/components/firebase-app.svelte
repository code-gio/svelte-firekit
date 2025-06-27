<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import { firebaseService } from '../firebase.js';

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

		// Set Firebase instances in context
		setContext('firebase/app', app);
		setContext('firebase/auth', auth);
		setContext('firebase/firestore', firestore);
		setContext('firebase/storage', storage);
		setContext('firebase/rtdb', rtdb);
	}
</script>

{@render children()}
