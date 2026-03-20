<script lang="ts">
	import type { Snippet } from 'svelte';
	import { firekitUser } from '../services/user.svelte.js';

	/**
	 * Renders `children` only when no authenticated user exists.
	 * Waits for auth to initialize before rendering to avoid flashing
	 * a login form to users who are already signed in.
	 * Optionally renders a `fallback` while auth state is loading.
	 *
	 * @example
	 * <SignedOut>
	 *   {#snippet children(signIn)}
	 *     <button onclick={signIn}>Sign in with Google</button>
	 *   {/snippet}
	 *   {#snippet fallback()}
	 *     <p>Checking auth…</p>
	 *   {/snippet}
	 * </SignedOut>
	 */
	let {
		children,
		onSignIn,
		fallback
	}: {
		children: Snippet<[() => void]>;
		/** Optional callback invoked when the user triggers sign-in from the snippet. */
		onSignIn?: () => void;
		/** Shown while auth state is being determined. */
		fallback?: Snippet;
	} = $props();

	function triggerSignIn() {
		onSignIn?.();
	}
</script>

{#if !firekitUser.initialized}
	{#if fallback}
		{@render fallback()}
	{/if}
{:else if !firekitUser.isAuthenticated}
	{@render children(triggerSignIn)}
{/if}
