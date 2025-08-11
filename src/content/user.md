---
title: User Service
description: Reactive user state management with Svelte 5 runes and Firebase Authentication sync
---

# User Service

The `firekitUser` service provides reactive user state management for your Svelte 5 application, automatically syncing with Firebase Authentication and providing clean reactive state.

## Overview

The user service provides:

- Reactive user state using Svelte 5 runes
- Automatic synchronization with Firebase Auth
- Email verification status tracking
- Loading and error states
- Real-time user updates
- Type-safe user data

## Quick Start

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	// Reactive user state using Svelte 5 runes
	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const isLoading = $derived(firekitUser.loading);
	const isEmailVerified = $derived(firekitUser.isEmailVerified);
	const error = $derived(firekitUser.error);

	// ✅ Use $derived for computed values
	const displayName = $derived(user?.displayName || user?.email || 'Anonymous User');
	const avatarUrl = $derived(user?.photoURL || '/default-avatar.png');

	// ✅ Use $effect only for side effects
	$effect(() => {
		if (isAuthenticated && user) {
			console.log('User authenticated:', displayName);
		}
	});
</script>

{#if isLoading}
	<div>Loading user...</div>
{:else if error}
	<div>Error: {error.message}</div>
{:else if isAuthenticated}
	<div>
		<img src={avatarUrl} alt={displayName} />
		<h1>Welcome, {displayName}!</h1>
		{#if isEmailVerified}
			<p class="text-green-500">✓ Email verified</p>
		{:else}
			<p class="text-yellow-500">⚠ Email not verified</p>
		{/if}
	</div>
{:else}
	<div>Please sign in</div>
{/if}
```

## Reactive State

### Basic User State

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	// Core reactive user state
	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const isLoading = $derived(firekitUser.loading);
	const error = $derived(firekitUser.error);

	// User properties (all reactive)
	const userId = $derived(user?.uid);
	const email = $derived(user?.email);
	const displayName = $derived(user?.displayName);
	const photoURL = $derived(user?.photoURL);
	const phoneNumber = $derived(user?.phoneNumber);
	const isAnonymous = $derived(user?.isAnonymous || false);
</script>
```

### Email Verification State

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const isEmailVerified = $derived(firekitUser.isEmailVerified);
	const user = $derived(firekitUser.user);
	
	// Computed verification status
	const verificationStatus = $derived(
		!user ? 'unknown' :
		user.isAnonymous ? 'not-required' :
		isEmailVerified ? 'verified' : 'pending'
	);

	const verificationMessage = $derived({
		'unknown': 'User not loaded',
		'not-required': 'Email verification not required',
		'verified': 'Email verified ✓',
		'pending': 'Please verify your email ⚠'
	}[verificationStatus]);
</script>

<div class="verification-status">
	<p>{verificationMessage}</p>
</div>
```

### User Metadata

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const user = $derived(firekitUser.user);
	const metadata = $derived(user?.metadata);

	// Formatted metadata
	const createdAt = $derived(
		metadata?.creationTime 
			? new Date(metadata.creationTime).toLocaleDateString() 
			: null
	);
	
	const lastSignIn = $derived(
		metadata?.lastSignInTime 
			? new Date(metadata.lastSignInTime).toLocaleDateString() 
			: null
	);
</script>

{#if metadata}
	<div class="user-metadata">
		<p>Account created: {createdAt}</p>
		<p>Last sign in: {lastSignIn}</p>
	</div>
{/if}
```

## State Management

### Authentication State Changes

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';
	import { goto } from '$app/navigation';

	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const user = $derived(firekitUser.user);

	// ✅ Use $effect for navigation side effects
	$effect(() => {
		if (isAuthenticated) {
			console.log('User authenticated, loading dashboard...');
			// Side effect: navigation, analytics, etc.
		} else {
			console.log('User not authenticated');
			goto('/login');
		}
	});
</script>
```

### Loading States

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const isLoading = $derived(firekitUser.loading);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	
	// Computed loading state
	const showSpinner = $derived(isLoading);
	const showContent = $derived(!isLoading && isAuthenticated);
</script>

{#if showSpinner}
	<div class="loading-spinner">Loading...</div>
{:else if showContent}
	<!-- User content -->
	<slot />
{:else}
	<!-- Not authenticated content -->
	<div>Please sign in</div>
{/if}
```

### Error Handling

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const error = $derived(firekitUser.error);
	const hasError = $derived(!!error);
	
	// Computed error message
	const errorMessage = $derived(
		error ? `Authentication error: ${error.message}` : null
	);

	// ✅ Use $effect for error tracking side effects
	$effect(() => {
		if (error) {
			console.error('User service error:', error);
			// Side effect: send to error tracking service
		}
	});
</script>

{#if hasError}
	<div class="error-message">
		<p>{errorMessage}</p>
		<button onclick={() => window.location.reload()}>Retry</button>
	</div>
{/if}
```

## Svelte Component Integration

### User Profile Component

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';

	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const isEmailVerified = $derived(firekitUser.isEmailVerified);

	// Computed values using $derived
	const displayName = $derived(user?.displayName || 'User');
	const userInitials = $derived(
		user?.displayName 
			? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
			: user?.email?.[0]?.toUpperCase() || '?'
	);
	const verificationBadge = $derived(
		isEmailVerified 
			? { variant: 'default', text: 'Verified' }
			: { variant: 'secondary', text: 'Unverified' }
	);
</script>

{#if isAuthenticated && user}
	<div class="user-profile-card">
		<div class="profile-header">
			<Avatar>
				<AvatarImage src={user.photoURL} alt={displayName} />
				<AvatarFallback>{userInitials}</AvatarFallback>
			</Avatar>

			<div class="profile-info">
				<h2>{displayName}</h2>
				<p>{user.email}</p>
				<Badge variant={verificationBadge.variant}>
					{verificationBadge.text}
				</Badge>
			</div>
		</div>
	</div>
{/if}
```

### User Menu Component

```svelte
<script>
	import { firekitUser, firekitAuth } from 'svelte-firekit';
	import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '$lib/components/ui/dropdown-menu';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';

	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);

	// Computed values
	const userInitials = $derived(
		user?.displayName 
			? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
			: user?.email?.[0]?.toUpperCase() || '?'
	);

	async function handleSignOut() {
		try {
			await firekitAuth.signOut();
		} catch (error) {
			console.error('Sign out failed:', error);
		}
	}
</script>

{#if isAuthenticated && user}
	<DropdownMenu>
		<DropdownMenuTrigger asChild>
			<Button variant="ghost" class="relative h-8 w-8 rounded-full">
				<Avatar class="h-8 w-8">
					<AvatarImage src={user.photoURL} alt={user.displayName} />
					<AvatarFallback>{userInitials}</AvatarFallback>
				</Avatar>
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent class="w-56" align="end">
			<div class="flex items-center justify-start gap-2 p-2">
				<div class="flex flex-col space-y-1 leading-none">
					{#if user.displayName}
						<p class="font-medium">{user.displayName}</p>
					{/if}
					<p class="w-[200px] truncate text-sm text-muted-foreground">
						{user.email}
					</p>
				</div>
			</div>
			<DropdownMenuItem onclick={() => window.location.href = '/profile'}>
				Profile
			</DropdownMenuItem>
			<DropdownMenuItem onclick={() => window.location.href = '/settings'}>
				Settings
			</DropdownMenuItem>
			<DropdownMenuItem onclick={handleSignOut}>
				Sign out
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
{:else}
	<Button onclick={() => window.location.href = '/login'}>Sign In</Button>
{/if}
```

## Type Definitions

```typescript
interface User {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
	phoneNumber: string | null;
	emailVerified: boolean;
	isAnonymous: boolean;
	metadata: UserMetadata;
	providerData: UserInfo[];
}

interface UserMetadata {
	creationTime: string;
	lastSignInTime: string;
}

interface UserInfo {
	uid: string;
	displayName: string | null;
	email: string | null;
	photoURL: string | null;
	providerId: string;
}
```

## Best Practices

### Reactivity Patterns

#### ✅ Good Patterns

```svelte
<script>
	const user = $derived(firekitUser.user);
	
	// ✅ Use $derived for all computations
	const isAdmin = $derived(user?.email?.includes('admin') || false);
	const canEdit = $derived(isAdmin && user?.emailVerified);
	const userName = $derived(user?.displayName || user?.email || 'Anonymous');
	
	// ✅ Use $effect only for side effects
	$effect(() => {
		if (canEdit) {
			document.title = `Admin Panel - ${userName}`;
		}
	});
</script>
```

#### ❌ Avoid These Patterns

```svelte
<script>
	const user = $derived(firekitUser.user);
	let isAdmin = $state(false);
	let userName = $state('');
	
	// ❌ Don't use $effect for simple computations
	$effect(() => {
		isAdmin = user?.email?.includes('admin') || false;
		userName = user?.displayName || user?.email || 'Anonymous';
	});
</script>
```

### Performance

1. **Use `$derived` for all computed values** - automatic dependency tracking
2. **Minimize `$effect` usage** - only for actual side effects
3. **Avoid deep reactive chains** - keep derivations shallow when possible
4. **Use optional chaining** - `user?.property` instead of checking existence

### Error Handling

```svelte
<script>
	const error = $derived(firekitUser.error);
	const user = $derived(firekitUser.user);
	const isLoading = $derived(firekitUser.loading);
	
	// Comprehensive loading state
	const loadingState = $derived(
		error ? 'error' :
		isLoading ? 'loading' :
		user ? 'loaded' : 'no-user'
	);
</script>

{#if loadingState === 'loading'}
	<LoadingSpinner />
{:else if loadingState === 'error'}
	<ErrorMessage {error} />
{:else if loadingState === 'loaded'}
	<UserContent {user} />
{:else}
	<SignInPrompt />
{/if}
```

## API Reference

### Reactive Properties

All properties are reactive and should be accessed using `$derived()`:

- `user` - Current user object (User | null)
- `isAuthenticated` - Authentication status (boolean)
- `isLoading` - Loading state (boolean)
- `isEmailVerified` - Email verification status (boolean)
- `error` - Current error (Error | null)

### Usage Examples

```typescript
// ✅ Correct usage with $derived
const user = $derived(firekitUser.user);
const isAuth = $derived(firekitUser.isAuthenticated);

// ❌ Incorrect - accessing directly
const user = firekitUser.user; // Won't be reactive
```

### Integration with Firebase Auth

The service automatically:
- Syncs with Firebase Authentication state changes
- Updates when user profile changes
- Handles authentication errors
- Manages loading states during auth operations
- Tracks email verification status changes