---
title: Authentication Service
description: Firebase Authentication service with multiple providers and reactive state management
---

# Authentication Service

The `firekitAuth` service provides a comprehensive authentication system for your Svelte 5 application, supporting multiple authentication providers with reactive state management.

## Overview

The authentication service handles:

- Multiple sign-in providers (Google, Facebook, Apple, Email/Password, Phone, Anonymous)
- User registration and profile management
- Email verification and password reset
- Account deletion
- Reactive authentication state
- Error handling

## Quick Start

```svelte
<script>
	import { firekitAuth, firekitUser } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';

	// Reactive authentication state using Svelte 5 runes
	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const isLoading = $derived(firekitUser.loading);

	async function handleSignIn() {
		try {
			await firekitAuth.signInWithGoogle();
		} catch (error) {
			console.error('Sign in failed:', error);
		}
	}

	async function handleSignOut() {
		try {
			await firekitAuth.signOut();
		} catch (error) {
			console.error('Sign out failed:', error);
		}
	}
</script>

{#if isLoading}
	<div>Loading...</div>
{:else if isAuthenticated}
	<div>
		<h2>Welcome, {user?.displayName || user?.email}!</h2>
		<Button onclick={handleSignOut}>Sign Out</Button>
	</div>
{:else}
	<Button onclick={handleSignIn}>Sign In with Google</Button>
{/if}
```

## Sign-In Methods

### Email/Password Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Sign in with existing account
const result = await firekitAuth.signInWithEmail('user@example.com', 'password');

// Register new account with email/password
const newUser = await firekitAuth.registerWithEmail(
	'newuser@example.com',
	'securepassword'
);
```

### Google Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Sign in with Google popup
const result = await firekitAuth.signInWithGoogle();
```

### Facebook Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Sign in with Facebook popup
const result = await firekitAuth.signInWithFacebook();
```

### Apple Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Sign in with Apple popup
const result = await firekitAuth.signInWithApple();
```

### Phone Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Sign in with phone number (requires reCAPTCHA setup)
const result = await firekitAuth.signInWithPhoneNumber('+1234567890', recaptchaVerifier);
```

### Anonymous Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Sign in anonymously
const result = await firekitAuth.signInAnonymously();
```

## User Management

### Update Profile

```typescript
import { firekitAuth } from 'svelte-firekit';

// Update display name
await firekitAuth.updateProfile({ displayName: 'New Name' });

// Update photo URL
await firekitAuth.updateProfile({ photoURL: 'https://example.com/new-avatar.jpg' });

// Update multiple fields
await firekitAuth.updateProfile({
	displayName: 'John Doe',
	photoURL: 'https://example.com/avatar.jpg'
});
```

### Update Email

```typescript
import { firekitAuth } from 'svelte-firekit';

// Update email address (requires user to be recently authenticated)
await firekitAuth.updateEmail('newemail@example.com');
```

### Update Password

```typescript
import { firekitAuth } from 'svelte-firekit';

// Update password (requires user to be recently authenticated)
await firekitAuth.updatePassword('newpassword');
```

### Delete Account

```typescript
import { firekitAuth } from 'svelte-firekit';

// Delete current user account
await firekitAuth.deleteUser();
```

## Email Verification

### Send Verification Email

```typescript
import { firekitAuth } from 'svelte-firekit';

// Send verification email to current user
await firekitAuth.sendEmailVerification();
```

### Check Email Verification

```typescript
import { firekitAuth } from 'svelte-firekit';

// Reload user data to get latest verification status
await firekitAuth.reloadUser();

// Check if email is verified
const isVerified = firekitAuth.currentUser?.emailVerified;
```

## Password Reset

### Send Password Reset Email

```typescript
import { firekitAuth } from 'svelte-firekit';

// Send password reset email
await firekitAuth.sendPasswordResetEmail('user@example.com');
```

### Confirm Password Reset

```typescript
import { firekitAuth } from 'svelte-firekit';

// Confirm password reset with action code from email
await firekitAuth.confirmPasswordReset('action-code-from-email', 'newpassword');
```

## Authentication State Management

### Reactive State

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	// Reactive user state using Svelte 5 runes
	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const isLoading = $derived(firekitUser.loading);
	const isEmailVerified = $derived(firekitUser.isEmailVerified);
	const authError = $derived(firekitUser.error);

	// ✅ Use $derived for computed values
	const welcomeMessage = $derived(
		isAuthenticated 
			? `Welcome back, ${user?.displayName || user?.email || 'User'}!` 
			: 'Please sign in'
	);
	
	const userInitials = $derived(
		user?.displayName 
			? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
			: user?.email?.[0].toUpperCase() || '?'
	);

	// ✅ Use $effect only for side effects (not for derived values)
	$effect(() => {
		if (isAuthenticated) {
			// Side effect: track analytics, update localStorage, etc.
			console.log('User authenticated');
			localStorage.setItem('lastLogin', new Date().toISOString());
		}
	});
</script>

<!-- Use the derived values in templates -->
<div>
	<h1>{welcomeMessage}</h1>
	{#if isAuthenticated}
		<div class="avatar">{userInitials}</div>
	{/if}
</div>
```

### Manual State Management

```typescript
import { firekitAuth } from 'svelte-firekit';

// Get current user
const currentUser = firekitAuth.currentUser;

// Check authentication state
const isAuthenticated = !!currentUser;

// Listen to auth state changes
const unsubscribe = firekitAuth.onAuthStateChanged((user) => {
	if (user) {
		console.log('User signed in:', user);
	} else {
		console.log('User signed out');
	}
});

// Clean up listener when component unmounts
unsubscribe();
```

## Token Management

### Get ID Token

```typescript
import { firekitAuth } from 'svelte-firekit';

// Get current ID token
const token = await firekitAuth.getIdToken();

// Force refresh token
const freshToken = await firekitAuth.getIdToken(true);
```

## Error Handling

### Authentication Errors

```typescript
import { firekitAuth } from 'svelte-firekit';

try {
	await firekitAuth.signInWithEmail('user@example.com', 'password');
} catch (error) {
	if (error.code === 'auth/user-not-found') {
		console.log('User not found');
	} else if (error.code === 'auth/wrong-password') {
		console.log('Incorrect password');
	} else if (error.code === 'auth/too-many-requests') {
		console.log('Too many failed attempts');
	}
}
```

### Error Types

Common authentication error codes:

- `auth/user-not-found` - User doesn't exist
- `auth/wrong-password` - Incorrect password
- `auth/email-already-in-use` - Email already registered
- `auth/weak-password` - Password too weak
- `auth/invalid-email` - Invalid email format
- `auth/too-many-requests` - Too many failed attempts
- `auth/network-request-failed` - Network error
- `auth/popup-closed-by-user` - User closed popup
- `auth/cancelled-popup-request` - Popup cancelled

## Svelte Component Integration

### Sign In Component

```svelte
<script>
	import { firekitAuth } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleSignIn() {
		loading = true;
		error = '';

		try {
			await firekitAuth.signInWithEmail(email, password);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<form onsubmit|preventDefault={handleSignIn} class="space-y-4">
	<Input type="email" bind:value={email} placeholder="Email" required />
	<Input type="password" bind:value={password} placeholder="Password" required />

	{#if error}
		<p class="text-red-500">{error}</p>
	{/if}

	<Button type="submit" disabled={loading}>
		{loading ? 'Signing in...' : 'Sign In'}
	</Button>
</form>
```

### User Profile Component

```svelte
<script>
	import { firekitAuth, firekitUser } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	const user = $derived(firekitUser.user);
	let displayName = $state(user?.displayName || '');
	let loading = $state(false);

	// Sync displayName with user data - use $effect for state updates
	$effect(() => {
		if (user?.displayName && displayName !== user.displayName) {
			displayName = user.displayName;
		}
	});

	async function updateProfile() {
		loading = true;
		try {
			await firekitAuth.updateProfile({ displayName });
		} catch (error) {
			console.error('Failed to update profile:', error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-4">
	<h2>Profile</h2>

	<div>
		<label>Email: {user?.email}</label>
		{#if user?.emailVerified}
			<span class="text-green-500">✓ Verified</span>
		{:else}
			<span class="text-red-500">✗ Not verified</span>
		{/if}
	</div>

	<div>
		<label>Display Name</label>
		<Input bind:value={displayName} />
	</div>

	<Button onclick={updateProfile} disabled={loading}>
		{loading ? 'Updating...' : 'Update Profile'}
	</Button>
</div>
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
```

## Best Practices

### Security

1. **Always validate user input** before authentication
2. **Use strong password requirements** for email/password auth
3. **Enable email verification** for sensitive applications
4. **Use HTTPS** in production environments

### User Experience

1. **Show loading states** during authentication using `$state`
2. **Provide clear error messages** for failed attempts
3. **Use reactive state** with `$derived` for real-time updates
4. **Handle edge cases** like network errors gracefully

### Performance & Reactivity

1. **Use `$derived` for computed values** - they automatically update when dependencies change
2. **Use `$effect` only for side effects** - DOM updates, API calls, logging, etc.
3. **Avoid unnecessary `$effect` calls** - prefer `$derived` for simple transformations
4. **Implement proper cleanup** for listeners and subscriptions

#### ✅ Good Patterns

```svelte
<script>
	const user = $derived(firekitUser.user);
	
	// ✅ Use $derived for computations
	const isAdmin = $derived(user?.email?.endsWith('@admin.com') || false);
	const displayName = $derived(user?.displayName || 'Anonymous');
	
	// ✅ Use $effect for side effects only
	$effect(() => {
		if (user) {
			analytics.identify(user.uid);
		}
	});
</script>
```

#### ❌ Bad Patterns

```svelte
<script>
	const user = $derived(firekitUser.user);
	let isAdmin = $state(false);
	let displayName = $state('');
	
	// ❌ Don't use $effect for simple computations
	$effect(() => {
		isAdmin = user?.email?.endsWith('@admin.com') || false;
		displayName = user?.displayName || 'Anonymous';
	});
</script>
```

## API Reference

### Core Methods

- `signInWithEmail(email, password)` - Email/password sign in
- `registerWithEmail(email, password)` - User registration
- `signInWithGoogle()` - Google sign in
- `signInWithFacebook()` - Facebook sign in
- `signInWithApple()` - Apple sign in
- `signInWithPhoneNumber(phoneNumber, verifier)` - Phone number sign in
- `signInAnonymously()` - Anonymous sign in
- `signOut()` - Sign out current user

### Profile Management

- `updateProfile(updates)` - Update user profile
- `updateEmail(email)` - Update email address
- `updatePassword(password)` - Update password
- `deleteUser()` - Delete user account

### Email Operations

- `sendEmailVerification()` - Send verification email
- `sendPasswordResetEmail(email)` - Send reset email
- `confirmPasswordReset(code, newPassword)` - Confirm password reset

### Token Management

- `getIdToken(forceRefresh?)` - Get ID token

### State Management

- `onAuthStateChanged(callback)` - Listen to auth state changes
- `reloadUser()` - Reload user data
- `get currentUser()` - Get current user
