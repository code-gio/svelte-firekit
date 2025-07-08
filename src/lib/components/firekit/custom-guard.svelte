<script lang="ts">
	import { firekitAuth } from '$lib/services/auth.js';
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import type { UserProfile } from '$lib/types/auth.js';
	import type { Auth } from 'firebase/auth';
	import type { Snippet } from 'svelte';

	/**
	 * Props for CustomGuard component
	 */
	let {
		children,
		requireAuth = true,
		redirectTo = '/',
		fallback,
		verificationChecks = []
	}: {
		/**
		 * Children content to render when all checks pass
		 */
		children: Snippet<[UserProfile, Auth, () => Promise<void>]>;
		/**
		 * Whether authentication is required to view the content
		 * @default true
		 */
		requireAuth?: boolean;
		/**
		 * Path to redirect to if checks fail
		 * @default '/'
		 */
		redirectTo?: string;
		/**
		 * Fallback content to show while checking auth state
		 */
		fallback?: Snippet<[]>;
		/**
		 * Array of verification functions that must return true to allow access
		 * Each function receives the user profile and auth instance
		 */
		verificationChecks?: ((user: UserProfile, auth: Auth) => boolean | Promise<boolean>)[];
	} = $props();

	// Try to get Firebase Auth from context first, fallback to service
	let auth: Auth | null = $state(null);
	let unsubscribe: (() => void) | null = null;
	let authState = $state(firekitAuth.getState());
	let verificationPassed = $state(true);
	let isVerifying = $state(false);

	// Sign out function
	async function signOut() {
		await firekitAuth.signOut();
	}

	// Check verification functions
	async function runVerificationChecks(): Promise<boolean> {
		if (!auth || !authState.user || verificationChecks.length === 0) {
			return true;
		}

		try {
			const results = await Promise.all(
				verificationChecks.map((check) => check(authState.user!, auth!))
			);
			return results.every((result) => result === true);
		} catch (error) {
			console.error('Verification check failed:', error);
			return false;
		}
	}

	// Check if current auth state and verification checks pass
	async function checkAccess() {
		if (authState.loading) return;

		const isAuthenticated = firekitAuth.isAuthenticated();
		const shouldRedirect = requireAuth ? !isAuthenticated : isAuthenticated;

		if (shouldRedirect) {
			goto(redirectTo);
			return;
		}

		// If authenticated and verification checks exist, run them
		if (isAuthenticated && verificationChecks.length > 0) {
			isVerifying = true;
			try {
				verificationPassed = await runVerificationChecks();
				if (!verificationPassed) {
					goto(redirectTo);
				}
			} finally {
				isVerifying = false;
			}
		} else {
			verificationPassed = true;
		}
	}

	onMount(async () => {
		try {
			// Try to get auth from context first
			auth = getContext<Auth>('firebase/auth');

			// If context doesn't exist, get from service
			if (!auth) {
				console.warn('Firebase Auth not found in context, using service directly');
				const { firebaseService } = await import('$lib/firebase.js');
				auth = firebaseService.getAuthInstance();
			}

			if (!auth) {
				throw new Error('Firebase Auth instance not available');
			}

			// Subscribe to auth state changes
			unsubscribe = firekitAuth.onAuthStateChanged((state) => {
				authState = state;
			});

			// Initial access check
			await checkAccess();
		} catch (error) {
			console.error('Failed to initialize CustomGuard:', error);
			authState = {
				user: null,
				loading: false,
				initialized: true
			};
		}
	});

	// Watch for auth state changes
	$effect(() => {
		checkAccess();
	});

	// Cleanup subscription on component destruction
	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

{#if authState.loading || isVerifying}
	{#if fallback}
		{@render fallback()}
	{:else}
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center">
				<div class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
				<p class="mt-2 text-gray-600">
					{isVerifying ? 'Verifying access...' : 'Loading...'}
				</p>
			</div>
		</div>
	{/if}
{:else if auth && firekitAuth.isAuthenticated() === requireAuth && verificationPassed}
	{@render children(authState.user!, auth, signOut)}
{/if}
