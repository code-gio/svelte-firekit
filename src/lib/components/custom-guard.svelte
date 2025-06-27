<script lang="ts">
	import { firekitAuth } from '../services/auth.js';
	import { firebaseService } from '../firebase.js';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import type { UserProfile } from '../types/auth.js';
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

	// Get Firebase Auth instance
	const auth = firebaseService.getAuthInstance();
	if (!auth) {
		throw new Error('Firebase Auth instance not available');
	}

	// Reactive auth state
	let authState = $state(firekitAuth.getState());
	let verificationPassed = $state(true);
	let isVerifying = $state(false);

	// Subscribe to auth state changes
	const unsubscribe = firekitAuth.onAuthStateChanged((state) => {
		authState = state;
	});

	// Sign out function
	async function signOut() {
		await firekitAuth.signOut();
	}

	// Check if current auth state and verification checks pass
	$effect(() => {
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
			Promise.all(verificationChecks.map((check) => check(authState.user!, auth)))
				.then((results) => {
					verificationPassed = results.every((result) => result === true);
					if (!verificationPassed) {
						goto(redirectTo);
					}
				})
				.catch((error) => {
					console.error('Verification check failed:', error);
					verificationPassed = false;
					goto(redirectTo);
				})
				.finally(() => {
					isVerifying = false;
				});
		} else {
			verificationPassed = true;
		}
	});

	// Cleanup subscription on component destruction
	onDestroy(() => {
		unsubscribe();
	});
</script>

{#if authState.loading || isVerifying}
	{#if fallback}
		{@render fallback()}
	{:else}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
				<p class="mt-2 text-gray-600">
					{isVerifying ? 'Verifying access...' : 'Loading...'}
				</p>
			</div>
		</div>
	{/if}
{:else if firekitAuth.isAuthenticated() === requireAuth && verificationPassed}
	{@render children(authState.user!, auth, signOut)}
{/if}
