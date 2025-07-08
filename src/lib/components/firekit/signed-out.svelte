<script lang="ts">
	import { firekitAuth } from '$lib/services/auth.js';
	import { firebaseService } from '$lib/firebase.js';
	import { onDestroy } from 'svelte';
	import type { Auth } from 'firebase/auth';
	import type { Snippet } from 'svelte';

	/**
	 * Props for SignedOut component
	 */
	let {
		children
	}: {
		/**
		 * Children content to render when user is signed out
		 */
		children: Snippet<[Auth]>;
	} = $props();

	// Get Firebase Auth instance
	const auth = firebaseService.getAuthInstance();
	if (!auth) {
		throw new Error('Firebase Auth instance not available');
	}

	// Reactive auth state
	let authState = $state(firekitAuth.getState());

	// Subscribe to auth state changes
	const unsubscribe = firekitAuth.onAuthStateChanged((state) => {
		authState = state;
	});

	// Cleanup subscription on component destruction
	onDestroy(() => {
		unsubscribe();
	});
</script>

{#if !firekitAuth.isAuthenticated()}
	{@render children(auth)}
{/if}
