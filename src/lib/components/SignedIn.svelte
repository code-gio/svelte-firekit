<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { UserProfile } from '../types/auth.js';
	import { firekitUser } from '../services/user.svelte.js';

	/**
	 * Renders `children` only when a non-anonymous user is signed in.
	 * Optionally renders a `fallback` while auth state is loading.
	 *
	 * @example
	 * <SignedIn>
	 *   {#snippet children(user)}
	 *     <p>Hello {user.displayName}</p>
	 *   {/snippet}
	 *   {#snippet fallback()}
	 *     <p>Loading…</p>
	 *   {/snippet}
	 * </SignedIn>
	 */
	let {
		children,
		fallback
	}: {
		children: Snippet<[UserProfile]>;
		/** Shown while auth state is being determined. */
		fallback?: Snippet;
	} = $props();
</script>

{#if !firekitUser.initialized}
	{#if fallback}
		{@render fallback()}
	{/if}
{:else if firekitUser.isAuthenticated && firekitUser.user}
	{@render children(firekitUser.user)}
{/if}
