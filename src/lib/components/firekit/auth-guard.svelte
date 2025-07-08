<script lang="ts">
	import { firekitAuth } from '$lib/services/auth.js';
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import type { UserProfile } from '$lib/types/auth.js';
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

	// Try to get Firebase Auth from context first, fallback to service
	let auth: Auth | null = $state(null);
	let unsubscribe: (() => void) | null = null;
	let authState = $state(firekitAuth.getState());

	// Sign out function
	async function signOut() {
		await firekitAuth.signOut();
	}

	onMount(async () => {
		try {
			// Try to get auth from context first
			auth = getContext<Auth>('firebase/auth');

			// If context doesn't exist, get from service
			if (!auth) {
				console.warn('Firebase Auth not found in context, using service directly');
				const { firebaseService } = await import('../../firebase.js');
				auth = firebaseService.getAuthInstance();
			}

			if (!auth) {
				throw new Error('Firebase Auth instance not available');
			}

			// Subscribe to auth state changes
			unsubscribe = firekitAuth.onAuthStateChanged((state) => {
				authState = state;
			});

			// Initial auth check
			checkAuthState();
		} catch (error) {
			console.error('Failed to initialize AuthGuard:', error);
			authState = {
				user: null,
				loading: false,
				initialized: true
			};
		}
	});

	// Check if current auth state matches requirements
	function checkAuthState() {
		if (authState.loading) return;

		const isAuthenticated = firekitAuth.isAuthenticated();
		const shouldRedirect = requireAuth ? !isAuthenticated : isAuthenticated;

		if (shouldRedirect) {
			goto(redirectTo);
		}
	}

	// Watch for auth state changes
	$effect(() => {
		checkAuthState();
	});

	// Cleanup subscription on component destruction
	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

{#if authState.loading}
	{#if fallback}
		{@render fallback()}
	{:else}
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center">
				<div class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
				<p class="mt-2 text-gray-600">Loading...</p>
			</div>
		</div>
	{/if}
{:else if auth && firekitAuth.isAuthenticated() === requireAuth}
	{@render children(authState.user!, auth, signOut)}
{/if}
