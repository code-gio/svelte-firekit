<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { UserProfile } from '../types/auth.js';
	import { firekitUser } from '../services/user.svelte.js';
	import { firekitAuth } from '../services/auth.js';

	/**
	 * Route guard that renders `children` only when the auth requirement is met.
	 * Framework-agnostic — pass `onUnauthorized` to handle navigation yourself.
	 *
	 * @example SvelteKit
	 * <script>
	 *   import { goto } from '$app/navigation';
	 * <\/script>
	 * <AuthGuard onUnauthorized={() => goto('/login')}>
	 *   {#snippet children(user, signOut)}
	 *     <Dashboard {user} {signOut} />
	 *   {/snippet}
	 * </AuthGuard>
	 *
	 * @example Require guest (redirect authenticated users away)
	 * <AuthGuard requireAuth={false} onUnauthorized={() => goto('/dashboard')}>
	 *   {#snippet children()}
	 *     <LoginPage />
	 *   {/snippet}
	 * </AuthGuard>
	 */
	let {
		children,
		requireAuth = true,
		onUnauthorized,
		fallback
	}: {
		/** Content shown when the auth requirement is satisfied. */
		children: Snippet<[UserProfile, () => Promise<void>]>;
		/** When true (default), requires a signed-in user. When false, requires no user. */
		requireAuth?: boolean;
		/** Called when the auth state does not meet the requirement. Use for navigation. */
		onUnauthorized?: () => void;
		/** Shown while auth state is being determined. */
		fallback?: Snippet;
	} = $props();

	function signOut() {
		return firekitAuth.signOut();
	}

	// React to auth state changes — runs whenever isAuthenticated or loading changes.
	$effect(() => {
		if (firekitUser.loading) return;

		const isAuth = firekitUser.isAuthenticated;
		const shouldBlock = requireAuth ? !isAuth : isAuth;
		if (shouldBlock) onUnauthorized?.();
	});
</script>

{#if firekitUser.loading}
	{#if fallback}
		{@render fallback()}
	{/if}
{:else if firekitUser.isAuthenticated === requireAuth && firekitUser.user}
	{@render children(firekitUser.user, signOut)}
{/if}
