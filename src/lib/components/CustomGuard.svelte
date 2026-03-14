<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { UserProfile } from '../types/auth.js';
	import { firekitUser } from '../services/user.svelte.js';
	import { firekitAuth } from '../services/auth.js';

	/**
	 * Extended route guard that runs async verification checks on top of auth.
	 * All checks must return `true` for `children` to render.
	 *
	 * @example
	 * <CustomGuard
	 *   verificationChecks={[
	 *     async (user) => user.emailVerified,
	 *     async (user) => await hasRequiredRole(user.uid, 'admin')
	 *   ]}
	 *   onUnauthorized={() => goto('/403')}
	 * >
	 *   {#snippet children(user, signOut)}
	 *     <AdminPanel {user} {signOut} />
	 *   {/snippet}
	 * </CustomGuard>
	 */
	let {
		children,
		requireAuth = true,
		onUnauthorized,
		fallback,
		verificationChecks = []
	}: {
		children: Snippet<[UserProfile, () => Promise<void>]>;
		requireAuth?: boolean;
		onUnauthorized?: () => void;
		fallback?: Snippet;
		/** Array of async checks — all must resolve to true for access to be granted. */
		verificationChecks?: ((user: UserProfile) => boolean | Promise<boolean>)[];
	} = $props();

	let verificationPassed = $state(true);
	let isVerifying = $state(false);

	function signOut() {
		return firekitAuth.signOut();
	}

	async function runChecks(user: UserProfile): Promise<boolean> {
		if (verificationChecks.length === 0) return true;
		try {
			const results = await Promise.all(verificationChecks.map((fn) => fn(user)));
			return results.every(Boolean);
		} catch {
			return false;
		}
	}

	$effect(() => {
		if (firekitUser.loading) return;

		const isAuth = firekitUser.isAuthenticated;
		const shouldBlock = requireAuth ? !isAuth : isAuth;

		if (shouldBlock) {
			onUnauthorized?.();
			return;
		}

		if (isAuth && firekitUser.user && verificationChecks.length > 0) {
			const user = firekitUser.user;
			isVerifying = true;
			runChecks(user).then((passed) => {
				verificationPassed = passed;
				isVerifying = false;
				if (!passed) onUnauthorized?.();
			});
		} else {
			verificationPassed = true;
		}
	});
</script>

{#if firekitUser.loading || isVerifying}
	{#if fallback}
		{@render fallback()}
	{/if}
{:else if firekitUser.isAuthenticated === requireAuth && verificationPassed && firekitUser.user}
	{@render children(firekitUser.user, signOut)}
{/if}
