<script lang="ts">
	import { firekitAuth } from '../services/auth.js';
	import { firebaseService } from '../firebase.js';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import type { UserProfile } from '../types/auth.js';
	import type { Auth } from 'firebase/auth';
	import type { Snippet } from 'svelte';

	/**
	 * Props for AuthGuard component
	 */
	let {
		children,
		requireAuth = true,
		redirectTo = '/',
		fallback
	}: {
		/**
		 * Children content to render when auth state matches requirements
		 */
		children: Snippet<[UserProfile, Auth, () => Promise<void>]>;
		/**
		 * Whether authentication is required to view the content
		 * @default true
		 */
		requireAuth?: boolean;
		/**
		 * Path to redirect to if auth state doesn't match requirements
		 * @default '/'
		 */
		redirectTo?: string;
		/**
		 * Fallback content to show while checking auth state
		 */
		fallback?: Snippet<[]>;
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

	// Sign out function
	async function signOut() {
		await firekitAuth.signOut();
	}

	// Check if current auth state matches requirements
	$effect(() => {
		if (authState.loading) return;

		const isAuthenticated = firekitAuth.isAuthenticated();
		const shouldRedirect = requireAuth ? !isAuthenticated : isAuthenticated;

		if (shouldRedirect) {
			goto(redirectTo);
		}
	});

	// Cleanup subscription on component destruction
	onDestroy(() => {
		unsubscribe();
	});
</script>

{#if authState.loading}
	{#if fallback}
		{@render fallback()}
	{:else}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
				<p class="mt-2 text-gray-600">Loading...</p>
			</div>
		</div>
	{/if}
{:else if firekitAuth.isAuthenticated() === requireAuth}
	{@render children(authState.user!, auth, signOut)}
{/if}
