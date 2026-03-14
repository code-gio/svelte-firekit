<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { UserProfile } from '../types/auth.js';
	import { firekitUser } from '../services/user.svelte.js';

	/**
	 * Renders `children` only when a non-anonymous user is signed in.
	 * Uses runes — no subscription needed.
	 *
	 * @example
	 * <SignedIn>
	 *   {#snippet children(user)}
	 *     <p>Hello {user.displayName}</p>
	 *   {/snippet}
	 * </SignedIn>
	 */
	let { children }: { children: Snippet<[UserProfile]> } = $props();
</script>

{#if firekitUser.isAuthenticated && firekitUser.user}
	{@render children(firekitUser.user)}
{/if}
