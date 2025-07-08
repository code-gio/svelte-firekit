---
title: User Service
description: Reactive user state management with Svelte 5 runes and extended user data
---

# User Service

The `firekitUser` service provides reactive user state management for your Svelte 5 application, automatically syncing with Firebase Authentication and providing extended user data capabilities.

## Overview

The user service provides:

- Reactive user state using Svelte 5 runes
- Automatic synchronization with Firebase Auth
- Extended user profile data
- Email verification status
- Loading and error states
- Real-time user updates
- Type-safe user data

## Quick Start

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	// Reactive user state
	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const isLoading = $derived(firekitUser.loading);
	const isEmailVerified = $derived(firekitUser.isEmailVerified);
	const error = $derived(firekitUser.error);

	// Watch for user changes
	$effect(() => {
		if (isAuthenticated && user) {
			console.log('User signed in:', user.displayName);
		}
	});
</script>

{#if isLoading}
	<div>Loading user...</div>
{:else if error}
	<div>Error: {error.message}</div>
{:else if isAuthenticated}
	<div>
		<h1>Welcome, {user?.displayName || user?.email}!</h1>
		{#if isEmailVerified}
			<p>✓ Email verified</p>
		{:else}
			<p>⚠ Email not verified</p>
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

	// Core user state
	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const isLoading = $derived(firekitUser.loading);
	const error = $derived(firekitUser.error);

	// User properties
	const userId = $derived(user?.uid);
	const email = $derived(user?.email);
	const displayName = $derived(user?.displayName);
	const photoURL = $derived(user?.photoURL);
	const phoneNumber = $derived(user?.phoneNumber);
</script>
```

### Email Verification State

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const isEmailVerified = $derived(firekitUser.isEmailVerified);
	const emailVerificationStatus = $derived(firekitUser.emailVerificationStatus);

	// Watch for email verification changes
	$effect(() => {
		if (isEmailVerified) {
			console.log('Email verified!');
		}
	});
</script>

{#if isEmailVerified}
	<div class="text-green-500">✓ Email verified</div>
{:else}
	<div class="text-yellow-500">⚠ Email not verified</div>
{/if}
```

### User Metadata

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const user = $derived(firekitUser.user);
	const metadata = $derived(user?.metadata);

	// Extract metadata
	const createdAt = $derived(metadata?.creationTime);
	const lastSignIn = $derived(metadata?.lastSignInTime);
	const lastRefresh = $derived(metadata?.lastRefreshTime);
</script>

{#if metadata}
	<div>
		<p>Account created: {new Date(createdAt).toLocaleDateString()}</p>
		<p>Last sign in: {new Date(lastSignIn).toLocaleDateString()}</p>
	</div>
{/if}
```

## Profile Management

### Extended User Profile

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const user = $derived(firekitUser.user);
	const profile = $derived(user?.profile);
	const extended = $derived(user?.extended);

	// Profile data
	const firstName = $derived(profile?.firstName);
	const lastName = $derived(profile?.lastName);
	const birthDate = $derived(profile?.birthDate);
	const location = $derived(profile?.location);
	const bio = $derived(profile?.bio);

	// Extended data
	const preferences = $derived(extended?.preferences);
	const settings = $derived(extended?.settings);
	const subscription = $derived(extended?.subscription);
</script>

{#if profile}
	<div class="user-profile">
		<h2>{firstName} {lastName}</h2>
		{#if location}
			<p>📍 {location}</p>
		{/if}
		{#if bio}
			<p>{bio}</p>
		{/if}
		{#if birthDate}
			<p>🎂 {new Date(birthDate).toLocaleDateString()}</p>
		{/if}
	</div>
{/if}
```

### User Preferences

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const user = $derived(firekitUser.user);
	const preferences = $derived(user?.extended?.preferences);

	// Extract preferences
	const theme = $derived(preferences?.theme || 'light');
	const language = $derived(preferences?.language || 'en');
	const notifications = $derived(preferences?.notifications || true);
</script>

<div class="user-preferences">
	<h3>Preferences</h3>
	<p>Theme: {theme}</p>
	<p>Language: {language}</p>
	<p>Notifications: {notifications ? 'On' : 'Off'}</p>
</div>
```

### Subscription Status

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const user = $derived(firekitUser.user);
	const subscription = $derived(user?.extended?.subscription);

	// Subscription details
	const plan = $derived(subscription?.plan);
	const status = $derived(subscription?.status);
	const expiresAt = $derived(subscription?.expiresAt);
	const isActive = $derived(status === 'active');
	const isExpired = $derived(expiresAt && new Date(expiresAt) < new Date());
</script>

{#if subscription}
	<div class="subscription-status">
		<h3>Subscription</h3>
		<p>Plan: {plan}</p>
		<p>Status: {status}</p>
		{#if expiresAt}
			<p>Expires: {new Date(expiresAt).toLocaleDateString()}</p>
		{/if}
		{#if isActive && !isExpired}
			<span class="text-green-500">✓ Active</span>
		{:else}
			<span class="text-red-500">✗ Inactive</span>
		{/if}
	</div>
{/if}
```

## State Management

### Authentication State Changes

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const user = $derived(firekitUser.user);

	// Watch for authentication changes
	$effect(() => {
		if (isAuthenticated) {
			console.log('User authenticated:', user?.displayName);
			// Perform authenticated actions
			loadUserData();
		} else {
			console.log('User signed out');
			// Clean up user data
			clearUserData();
		}
	});

	function loadUserData() {
		// Load user-specific data
	}

	function clearUserData() {
		// Clear user-specific data
	}
</script>
```

### Loading States

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const isLoading = $derived(firekitUser.loading);
	const isInitialized = $derived(firekitUser.initialized);
</script>

{#if !isInitialized}
	<div class="loading">Initializing...</div>
{:else if isLoading}
	<div class="loading">Loading user data...</div>
{:else}
	<!-- User content -->
{/if}
```

### Error Handling

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const error = $derived(firekitUser.error);
	const hasError = $derived(!!error);

	// Watch for errors
	$effect(() => {
		if (error) {
			console.error('User service error:', error);
			// Handle error (show notification, retry, etc.)
		}
	});
</script>

{#if hasError}
	<div class="error-message">
		<p>Error loading user data: {error.message}</p>
		<button onclick={() => firekitUser.refresh()}>Retry</button>
	</div>
{/if}
```

## Svelte Component Integration

### User Profile Component

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const isEmailVerified = $derived(firekitUser.isEmailVerified);
	const profile = $derived(user?.profile);
</script>

{#if isAuthenticated && user}
	<div class="user-profile-card">
		<div class="profile-header">
			<Avatar>
				<AvatarImage src={user.photoURL} alt={user.displayName} />
				<AvatarFallback>
					{user.displayName?.charAt(0) || user.email?.charAt(0)}
				</AvatarFallback>
			</Avatar>

			<div class="profile-info">
				<h2>{user.displayName || 'User'}</h2>
				<p>{user.email}</p>
				{#if isEmailVerified}
					<Badge variant="success">Verified</Badge>
				{:else}
					<Badge variant="warning">Unverified</Badge>
				{/if}
			</div>
		</div>

		{#if profile}
			<div class="profile-details">
				{#if profile.location}
					<p>📍 {profile.location}</p>
				{/if}
				{#if profile.bio}
					<p>{profile.bio}</p>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.user-profile-card {
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: white;
	}

	.profile-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.profile-info h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.profile-info p {
		margin: 0.25rem 0;
		color: #6b7280;
	}

	.profile-details {
		border-top: 1px solid #e2e8f0;
		padding-top: 1rem;
	}
</style>
```

### User Menu Component

```svelte
<script>
	import { firekitUser, firekitAuth } from 'svelte-firekit';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';

	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);

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
					<AvatarFallback>
						{user.displayName?.charAt(0) || user.email?.charAt(0)}
					</AvatarFallback>
				</Avatar>
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent class="w-56" align="end" forceMount>
			<div class="flex items-center justify-start gap-2 p-2">
				<div class="flex flex-col space-y-1 leading-none">
					{#if user.displayName}
						<p class="font-medium">{user.displayName}</p>
					{/if}
					<p class="text-muted-foreground w-[200px] truncate text-sm">
						{user.email}
					</p>
				</div>
			</div>
			<DropdownMenuItem onclick={() => (window.location.href = '/profile')}>
				Profile
			</DropdownMenuItem>
			<DropdownMenuItem onclick={() => (window.location.href = '/settings')}>
				Settings
			</DropdownMenuItem>
			<DropdownMenuItem onclick={handleSignOut}>Sign out</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
{:else}
	<Button onclick={() => (window.location.href = '/login')}>Sign In</Button>
{/if}
```

### Authentication Guard

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const isLoading = $derived(firekitUser.loading);

	export let fallback = '/login';
	export let requireEmailVerification = false;
</script>

{#if isLoading}
	<div class="loading">Loading...</div>
{:else if !isAuthenticated}
	{@html `<script>window.location.href = '${fallback}';</script>`}
{:else if requireEmailVerification && !firekitUser.isEmailVerified}
	<div class="email-verification-required">
		<h2>Email Verification Required</h2>
		<p>Please verify your email address to access this page.</p>
		<button onclick={() => firekitAuth.sendEmailVerification()}> Resend Verification Email </button>
	</div>
{:else}
	<slot />
{/if}
```

## Type Definitions

### User Interface

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
	profile?: UserProfile;
	extended?: ExtendedUserData;
}

interface UserMetadata {
	creationTime: string;
	lastSignInTime: string;
	lastRefreshTime: string;
}

interface UserInfo {
	uid: string;
	displayName: string | null;
	email: string | null;
	photoURL: string | null;
	providerId: string;
}

interface UserProfile {
	firstName?: string;
	lastName?: string;
	birthDate?: string;
	location?: string;
	bio?: string;
	website?: string;
	company?: string;
	jobTitle?: string;
}

interface ExtendedUserData {
	preferences?: UserPreferences;
	settings?: UserSettings;
	subscription?: Subscription;
	statistics?: UserStatistics;
}

interface UserPreferences {
	theme?: 'light' | 'dark' | 'system';
	language?: string;
	timezone?: string;
	notifications?: boolean;
	emailNotifications?: boolean;
	pushNotifications?: boolean;
}

interface UserSettings {
	privacy?: {
		profileVisibility?: 'public' | 'private' | 'friends';
		showEmail?: boolean;
		showPhone?: boolean;
	};
	security?: {
		twoFactorEnabled?: boolean;
		loginNotifications?: boolean;
	};
}

interface Subscription {
	plan: string;
	status: 'active' | 'inactive' | 'cancelled' | 'expired';
	expiresAt?: string;
	features?: string[];
}

interface UserStatistics {
	lastActive?: string;
	loginCount?: number;
	postsCount?: number;
	followersCount?: number;
	followingCount?: number;
}
```

### Service State

```typescript
interface UserServiceState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isInitialized: boolean;
	isEmailVerified: boolean;
	emailVerificationStatus: 'verified' | 'unverified' | 'unknown';
	error: Error | null;
}
```

## Best Practices

### Performance

1. **Use reactive state efficiently**

   ```svelte
   // Good: Use derived values for computed properties
   const fullName = $derived(
     user?.profile?.firstName && user?.profile?.lastName
       ? `${user.profile.firstName} ${user.profile.lastName}`
       : user?.displayName || 'User'
   );

   // Avoid: Don't create unnecessary derived values
   const userCopy = $derived({ ...user }); // Unnecessary
   ```

2. **Minimize re-renders**

   ```svelte
   // Good: Use specific derived values const displayName = $derived(user?.displayName); const email
   = $derived(user?.email); // Avoid: Deriving the entire user object const userData =
   $derived(user); // May cause unnecessary updates
   ```

### Error Handling

1. **Handle loading states**

   ```svelte
   {#if isLoading}
   	<LoadingSpinner />
   {:else if error}
   	<ErrorMessage {error} />
   {:else if isAuthenticated}
   	<UserContent />
   {:else}
   	<SignInPrompt />
   {/if}
   ```

2. **Provide fallback values**
   ```svelte
   const displayName = $derived(user?.displayName || 'Anonymous User'); const avatarUrl =
   $derived(user?.photoURL || '/default-avatar.png');
   ```

### Security

1. **Validate user data**

   ```typescript
   // Always validate user input before updating
   function updateProfile(data: Partial<UserProfile>) {
   	if (data.firstName && data.firstName.length > 50) {
   		throw new Error('First name too long');
   	}
   	// Update profile
   }
   ```

2. **Check authentication before sensitive operations**
   ```typescript
   function performSensitiveOperation() {
   	if (!firekitUser.isAuthenticated) {
   		throw new Error('Authentication required');
   	}
   	// Perform operation
   }
   ```

## API Reference

### Properties

- `user` - Current user object (reactive)
- `isAuthenticated` - Authentication status (reactive)
- `isLoading` - Loading state (reactive)
- `isInitialized` - Initialization state (reactive)
- `isEmailVerified` - Email verification status (reactive)
- `emailVerificationStatus` - Detailed email verification status (reactive)
- `error` - Current error (reactive)

### Methods

- `refresh()` - Refresh user data
- `reload()` - Reload user from Firebase
- `waitForAuth()` - Wait for authentication to complete
- `cleanup()` - Clean up resources and listeners

### Events

The service automatically handles:

- Authentication state changes
- User profile updates
- Email verification status changes
- Error state updates
- Loading state changes
