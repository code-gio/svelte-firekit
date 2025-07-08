---
title: Authentication Service
description: Complete authentication system with multiple providers and reactive state management
---

# Authentication Service

The `firekitAuth` service provides a comprehensive authentication system for your Svelte 5 application, supporting multiple authentication providers with reactive state management.

## Overview

The authentication service handles:

- Multiple sign-in providers (Google, Facebook, Apple, Email/Password, Phone, Anonymous)
- User registration and profile management
- Email verification and password reset
- Account deletion and data export
- Reactive authentication state
- Token management and refresh
- Error handling and retry mechanisms

## Quick Start

```svelte
<script>
	import { firekitAuth, firekitUser } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';

	// Reactive authentication state
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

// Register new account
const newUser = await firekitAuth.registerWithEmail(
	'newuser@example.com',
	'securepassword',
	'John Doe' // Optional display name
);

// Sign in with custom display name
const userWithName = await firekitAuth.signInWithEmail(
	'user@example.com',
	'password',
	'Custom Name'
);
```

### Google Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Sign in with Google
const result = await firekitAuth.signInWithGoogle();

// Sign in with custom provider
const customGoogle = await firekitAuth.signInWithProvider('google', {
	scopes: ['email', 'profile'],
	customParameters: {
		prompt: 'select_account'
	}
});
```

### Facebook Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Sign in with Facebook
const result = await firekitAuth.signInWithFacebook();

// With custom permissions
const facebookWithPermissions = await firekitAuth.signInWithProvider('facebook', {
	scopes: ['email', 'public_profile']
});
```

### Apple Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Sign in with Apple
const result = await firekitAuth.signInWithApple();

// With custom options
const appleWithOptions = await firekitAuth.signInWithProvider('apple', {
	scopes: ['email', 'name']
});
```

### Phone Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Send verification code
await firekitAuth.sendPhoneVerificationCode('+1234567890');

// Verify code and sign in
const result = await firekitAuth.verifyPhoneCode('+1234567890', '123456');
```

### Anonymous Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Sign in anonymously
const result = await firekitAuth.signInAnonymously();
```

### Custom Provider Authentication

```typescript
import { firekitAuth } from 'svelte-firekit';

// Sign in with any custom provider
const result = await firekitAuth.signInWithProvider('github', {
	scopes: ['user:email']
});
```

## User Registration

### Email Registration

```typescript
import { firekitAuth } from 'svelte-firekit';

// Basic registration
const user = await firekitAuth.registerWithEmail('user@example.com', 'password');

// Registration with profile data
const userWithProfile = await firekitAuth.registerWithEmail(
	'user@example.com',
	'password',
	'John Doe',
	{
		photoURL: 'https://example.com/avatar.jpg',
		phoneNumber: '+1234567890'
	}
);
```

### Profile Completion

```typescript
import { firekitAuth } from 'svelte-firekit';

// Complete profile after registration
await firekitAuth.completeProfile({
	displayName: 'John Doe',
	photoURL: 'https://example.com/avatar.jpg',
	phoneNumber: '+1234567890'
});
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

// Update email address
await firekitAuth.updateEmail('newemail@example.com');

// Update email with password verification
await firekitAuth.updateEmail('newemail@example.com', 'currentpassword');
```

### Update Password

```typescript
import { firekitAuth } from 'svelte-firekit';

// Update password
await firekitAuth.updatePassword('newpassword');

// Update password with current password verification
await firekitAuth.updatePassword('newpassword', 'currentpassword');
```

### Delete Account

```typescript
import { firekitAuth } from 'svelte-firekit';

// Delete account
await firekitAuth.deleteAccount();

// Delete account with password verification
await firekitAuth.deleteAccount('currentpassword');
```

## Email Verification

### Send Verification Email

```typescript
import { firekitAuth } from 'svelte-firekit';

// Send verification email
await firekitAuth.sendEmailVerification();

// Send with custom action code settings
await firekitAuth.sendEmailVerification({
	url: 'https://yourapp.com/verify',
	handleCodeInApp: true
});
```

### Check Email Verification

```typescript
import { firekitAuth } from 'svelte-firekit';

// Reload user to check verification status
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

// Send with custom action code settings
await firekitAuth.sendPasswordResetEmail('user@example.com', {
	url: 'https://yourapp.com/reset-password',
	handleCodeInApp: true
});
```

### Confirm Password Reset

```typescript
import { firekitAuth } from 'svelte-firekit';

// Confirm password reset with action code
await firekitAuth.confirmPasswordReset('action-code', 'newpassword');
```

## Authentication State Management

### Reactive State

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';

	// Reactive user state
	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const isLoading = $derived(firekitUser.loading);
	const isEmailVerified = $derived(firekitUser.isEmailVerified);
	const authError = $derived(firekitUser.error);

	// Watch for authentication changes
	$effect(() => {
		if (isAuthenticated) {
			console.log('User signed in:', user);
		} else {
			console.log('User signed out');
		}
	});
</script>
```

### Manual State Management

```typescript
import { firekitAuth } from 'svelte-firekit';

// Get current user
const currentUser = firekitAuth.currentUser;

// Check authentication state
const isAuthenticated = firekitAuth.isAuthenticated;

// Listen to auth state changes
const unsubscribe = firekitAuth.onAuthStateChanged((user) => {
	if (user) {
		console.log('User signed in:', user);
	} else {
		console.log('User signed out');
	}
});

// Clean up listener
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

### Get Access Token

```typescript
import { firekitAuth } from 'svelte-firekit';

// Get access token for specific provider
const accessToken = await firekitAuth.getAccessToken('google');
```

### Token Refresh

```typescript
import { firekitAuth } from 'svelte-firekit';

// Refresh tokens
await firekitAuth.refreshTokens();
```

## Extended User Data

### User Profile

```typescript
import { firekitAuth } from 'svelte-firekit';

// Get user profile
const profile = firekitAuth.currentUser?.profile;

// Extended user data
const extendedUser = firekitAuth.currentUser?.extended;
```

### User Metadata

```typescript
import { firekitAuth } from 'svelte-firekit';

// Get user metadata
const metadata = firekitAuth.currentUser?.metadata;

// Check creation time
const createdAt = metadata?.creationTime;

// Check last sign in
const lastSignIn = metadata?.lastSignInTime;
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

### Authentication Guard Component

```svelte
<script>
	import { firekitUser } from 'svelte-firekit';
	import { AuthGuard } from 'svelte-firekit';

	const isAuthenticated = $derived(firekitUser.isAuthenticated);
</script>

<AuthGuard fallback="/login">
	<slot />
</AuthGuard>
```

### Sign In Component

```svelte
<script>
	import { firekitAuth } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

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
	<Input type="email" bindvalue={email} placeholder="Email" required />
	<Input type="password" bindvalue={password} placeholder="Password" required />

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
	let displayName = user?.displayName || '';
	let loading = false;

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
		<Input bindvalue={displayName} />
	</div>

	<Button onclick={updateProfile} disabled={loading}>
		{loading ? 'Updating...' : 'Update Profile'}
	</Button>
</div>
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

interface UserProfile {
	firstName?: string;
	lastName?: string;
	birthDate?: string;
	location?: string;
	bio?: string;
}

interface ExtendedUserData {
	preferences?: Record<string, any>;
	settings?: Record<string, any>;
	subscription?: {
		plan: string;
		status: string;
		expiresAt: string;
	};
}
```

### Authentication Options

```typescript
interface AuthOptions {
	persistence?: 'local' | 'session' | 'none';
	languageCode?: string;
	timeout?: number;
}

interface SignInOptions {
	displayName?: string;
	photoURL?: string;
	phoneNumber?: string;
}

interface ProviderOptions {
	scopes?: string[];
	customParameters?: Record<string, string>;
}
```

## Best Practices

### Security

1. **Always validate user input** before authentication
2. **Use strong password requirements** for email/password auth
3. **Implement rate limiting** for authentication attempts
4. **Enable email verification** for sensitive applications
5. **Use HTTPS** in production environments

### User Experience

1. **Show loading states** during authentication
2. **Provide clear error messages** for failed attempts
3. **Implement progressive enhancement** for offline scenarios
4. **Use persistent authentication** for better UX
5. **Handle edge cases** like network errors gracefully

### Performance

1. **Lazy load authentication providers** when needed
2. **Cache user data** to reduce API calls
3. **Use reactive state** for real-time updates
4. **Implement proper cleanup** for listeners and subscriptions

## API Reference

### Core Methods

- `signInWithEmail(email, password, displayName?)` - Email/password sign in
- `registerWithEmail(email, password, displayName?, profile?)` - User registration
- `signInWithGoogle()` - Google sign in
- `signInWithFacebook()` - Facebook sign in
- `signInWithApple()` - Apple sign in
- `signInWithPhone(phoneNumber)` - Phone number sign in
- `signInAnonymously()` - Anonymous sign in
- `signInWithProvider(provider, options?)` - Custom provider sign in
- `signOut()` - Sign out current user

### Profile Management

- `updateProfile(updates)` - Update user profile
- `updateEmail(email, password?)` - Update email address
- `updatePassword(password, currentPassword?)` - Update password
- `deleteAccount(password?)` - Delete user account

### Email Operations

- `sendEmailVerification(options?)` - Send verification email
- `sendPasswordResetEmail(email, options?)` - Send reset email
- `confirmPasswordReset(code, newPassword)` - Confirm password reset

### Token Management

- `getIdToken(forceRefresh?)` - Get ID token
- `getAccessToken(provider)` - Get provider access token
- `refreshTokens()` - Refresh all tokens

### State Management

- `onAuthStateChanged(callback)` - Listen to auth state changes
- `reloadUser()` - Reload user data
- `get currentUser()` - Get current user
- `get isAuthenticated()` - Check authentication status
