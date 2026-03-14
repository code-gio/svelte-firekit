<script lang="ts">
	import type { Snippet } from 'svelte';
	import { firekitUser } from '../services/user.svelte.js';

	/**
	 * Renders `children` only when no authenticated user exists (including during loading).
	 * Passes a sign-in trigger function to children — wire it up to your auth method of choice.
	 *
	 * @example
	 * <SignedOut>
	 *   {#snippet children(signIn)}
	 *     <button onclick={signIn}>Sign in with Google</button>
	 *   {/snippet}
	 * </SignedOut>
	 */
	let {
		children,
		onSignIn
	}: {
		children: Snippet<[() => void]>;
		/** Optional callback invoked when the user triggers sign-in from the snippet. */
		onSignIn?: () => void;
	} = $props();

	function triggerSignIn() {
		onSignIn?.();
	}
</script>

{#if !firekitUser.isAuthenticated && !firekitUser.loading}
	{@render children(triggerSignIn)}
{/if}
