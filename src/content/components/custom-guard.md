---
title: CustomGuard
description: Advanced authentication guard with custom verification checks
---

# CustomGuard

The `CustomGuard` component provides advanced authentication protection with custom verification checks. It allows you to define custom logic to determine access permissions beyond simple authentication state, including role-based access, email verification, and other custom conditions.

## 🚀 Basic Usage

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';
</script>

<CustomGuard let:user let:auth let:signOut>
	<h1>Welcome, {user.displayName}!</h1>
	<p>You have access to this protected content.</p>
	<button onclick={signOut}>Sign Out</button>
</CustomGuard>
```

## 📋 Props

| Prop                 | Type                                                                 | Required | Description                                          |
| -------------------- | -------------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| `children`           | `Snippet<[UserProfile, Auth, () => Promise<void>]>`                  | ✅       | Content to render when all checks pass               |
| `requireAuth`        | `boolean`                                                            | ❌       | Whether authentication is required (default: `true`) |
| `redirectTo`         | `string`                                                             | ❌       | Path to redirect to if checks fail (default: `'/'`)  |
| `fallback`           | `Snippet<[]>`                                                        | ❌       | Custom loading/fallback content                      |
| `verificationChecks` | `((user: UserProfile, auth: Auth) => boolean \| Promise<boolean>)[]` | ❌       | Array of custom verification functions               |

## 🎯 Use Cases

### **Role-Based Access Control**

Restrict access based on user roles:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';
	import { Doc } from 'svelte-firekit';

	// Custom verification function for admin access
	async function requireAdmin(user, auth) {
		const userDoc = await getDoc(doc(db, 'users', user.uid));
		return userDoc.exists() && userDoc.data().role === 'admin';
	}

	// Custom verification function for premium users
	async function requirePremium(user, auth) {
		const userDoc = await getDoc(doc(db, 'users', user.uid));
		return userDoc.exists() && userDoc.data().subscription === 'premium';
	}
</script>

<CustomGuard
	verificationChecks={[requireAdmin]}
	redirectTo="/unauthorized"
	let:user
	let:auth
	let:signOut
>
	<div class="admin-dashboard">
		<h1>Admin Dashboard</h1>
		<p>Welcome, {user.displayName}!</p>

		<div class="admin-tools">
			<button onclick={() => manageUsers()}>Manage Users</button>
			<button onclick={() => viewAnalytics()}>View Analytics</button>
			<button onclick={() => systemSettings()}>System Settings</button>
		</div>

		<button onclick={signOut}>Sign Out</button>
	</div>
</CustomGuard>
```

### **Email Verification Required**

Require email verification before access:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	// Custom verification function for email verification
	function requireEmailVerification(user, auth) {
		return user.emailVerified;
	}
</script>

<CustomGuard
	verificationChecks={[requireEmailVerification]}
	redirectTo="/verify-email"
	let:user
	let:auth
	let:signOut
>
	<div class="verified-content">
		<h1>Welcome, {user.displayName}!</h1>
		<p>✅ Your email is verified</p>

		<div class="user-dashboard">
			<h2>Your Dashboard</h2>
			<p>Access to all features unlocked.</p>
		</div>

		<button onclick={signOut}>Sign Out</button>
	</div>
</CustomGuard>
```

### **Multiple Verification Checks**

Combine multiple verification conditions:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	// Check if user has completed profile
	async function requireCompleteProfile(user, auth) {
		const userDoc = await getDoc(doc(db, 'users', user.uid));
		const data = userDoc.data();
		return data && data.profileComplete === true;
	}

	// Check if user has accepted terms
	async function requireTermsAccepted(user, auth) {
		const userDoc = await getDoc(doc(db, 'users', user.uid));
		const data = userDoc.data();
		return data && data.termsAccepted === true;
	}

	// Check if user is not suspended
	async function requireNotSuspended(user, auth) {
		const userDoc = await getDoc(doc(db, 'users', user.uid));
		const data = userDoc.data();
		return data && data.status !== 'suspended';
	}
</script>

<CustomGuard
	verificationChecks={[requireCompleteProfile, requireTermsAccepted, requireNotSuspended]}
	redirectTo="/profile-setup"
	let:user
	let:auth
	let:signOut
>
	<div class="full-access">
		<h1>Full Access Granted</h1>
		<p>Welcome, {user.displayName}!</p>
		<p>All verification checks passed.</p>

		<div class="main-content">
			<!-- Full application content -->
		</div>

		<button onclick={signOut}>Sign Out</button>
	</div>
</CustomGuard>
```

### **Custom Loading State**

Show custom loading content during verification:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	async function complexVerification(user, auth) {
		// Simulate complex verification process
		await new Promise(resolve => setTimeout(resolve, 2000));
		return user.emailVerified;
	}
</script>

<CustomGuard
	verificationChecks={[complexVerification]}
	redirectTo="/unauthorized"
	let:user let:auth let:signOut
>
	{#snippet fallback()}
		<div class="verification-loading">
			<div class="loading-spinner"></div>
			<h2>Verifying Your Access</h2>
			<p>Please wait while we verify your permissions...</p>
			<div class="verification-steps">
				<div class="step">✓ Authentication</div>
				<div class="step">⏳ Permission Check</div>
				<div class="step">⏳ Access Grant</div>
			</div>
		</div>
	{/snippet}

	{#snippet default(user, auth, signOut)}
		<div class="verified-content">
			<h1>Access Granted!</h1>
			<p>Welcome, {user.displayName}</p>
			<!-- Protected content -->
		</div>
	{/snippet}
</CustomGuard>
```

## 🔧 Slot Parameters

The `children` slot receives three parameters:

| Parameter | Type                  | Description                        |
| --------- | --------------------- | ---------------------------------- |
| `user`    | `UserProfile`         | Current authenticated user profile |
| `auth`    | `Auth`                | Firebase Auth instance             |
| `signOut` | `() => Promise<void>` | Function to sign out the user      |

### **Using Slot Parameters**

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';
	import type { UserProfile, Auth } from 'firebase/auth';
</script>

<CustomGuard let:user let:auth let:signOut>
	{#snippet default(user: UserProfile, auth: Auth, signOut: () => Promise<void>)}
		<div class="protected-content">
			<div class="user-header">
				<img src={user.photoURL} alt={user.displayName} class="avatar" />
				<div class="user-info">
					<h1>Welcome, {user.displayName}!</h1>
					<p>Email: {user.email}</p>
					<p>User ID: {user.uid}</p>
				</div>
			</div>

			<div class="content-area">
				<h2>Protected Content</h2>
				<p>This content is only visible to authenticated users.</p>
			</div>

			<div class="actions">
				<button onclick={() => updateProfile(auth)}>Update Profile</button>
				<button onclick={signOut}>Sign Out</button>
			</div>
		</div>
	{/snippet}
</CustomGuard>
```

## 🔧 Advanced Usage

### **Conditional Authentication**

Show different content based on authentication state:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	// Show content only to non-authenticated users
	function requireGuest(user, auth) {
		return !user; // Return true if no user (guest)
	}
</script>

<CustomGuard
	requireAuth={false}
	verificationChecks={[requireGuest]}
	redirectTo="/dashboard"
	let:user
	let:auth
	let:signOut
>
	<div class="guest-content">
		<h1>Welcome Guest!</h1>
		<p>Please sign in to access the full application.</p>

		<div class="signin-options">
			<button onclick={() => signInWithGoogle(auth)}> Sign in with Google </button>
			<button onclick={() => signInWithEmail(auth)}> Sign in with Email </button>
		</div>
	</div>
</CustomGuard>
```

### **Time-Based Access**

Restrict access based on time or date:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	// Allow access only during business hours
	function requireBusinessHours(user, auth) {
		const now = new Date();
		const hour = now.getHours();
		const day = now.getDay();

		// Monday to Friday, 9 AM to 5 PM
		return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
	}

	// Allow access only on specific dates
	function requireValidDate(user, auth) {
		const now = new Date();
		const startDate = new Date('2024-01-01');
		const endDate = new Date('2024-12-31');

		return now >= startDate && now <= endDate;
	}
</script>

<CustomGuard
	verificationChecks={[requireBusinessHours, requireValidDate]}
	redirectTo="/outside-hours"
	let:user
	let:auth
	let:signOut
>
	<div class="business-content">
		<h1>Business Hours Access</h1>
		<p>Welcome, {user.displayName}!</p>
		<p>You have access during business hours.</p>

		<div class="business-tools">
			<!-- Business-specific content -->
		</div>
	</div>
</CustomGuard>
```

### **Geographic Restrictions**

Restrict access based on location:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	// Allow access only from specific countries
	async function requireLocation(user, auth) {
		try {
			const response = await fetch('https://ipapi.co/json/');
			const data = await response.json();
			const allowedCountries = ['US', 'CA', 'GB', 'AU'];
			return allowedCountries.includes(data.country_code);
		} catch (error) {
			console.error('Location check failed:', error);
			return false;
		}
	}
</script>

<CustomGuard
	verificationChecks={[requireLocation]}
	redirectTo="/location-restricted"
	let:user
	let:auth
	let:signOut
>
	<div class="location-allowed">
		<h1>Location Verified</h1>
		<p>Welcome, {user.displayName}!</p>
		<p>You're accessing from an allowed location.</p>

		<div class="regional-content">
			<!-- Location-specific content -->
		</div>
	</div>
</CustomGuard>
```

### **Subscription-Based Access**

Restrict access based on subscription status:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	// Check if user has active subscription
	async function requireActiveSubscription(user, auth) {
		const userDoc = await getDoc(doc(db, 'users', user.uid));
		const data = userDoc.data();

		if (!data || !data.subscription) return false;

		const now = new Date();
		const expiryDate = new Date(data.subscription.expiresAt);

		return expiryDate > now && data.subscription.status === 'active';
	}

	// Check subscription tier
	async function requirePremiumTier(user, auth) {
		const userDoc = await getDoc(doc(db, 'users', user.uid));
		const data = userDoc.data();

		return data && data.subscription && data.subscription.tier === 'premium';
	}
</script>

<CustomGuard
	verificationChecks={[requireActiveSubscription, requirePremiumTier]}
	redirectTo="/upgrade"
	let:user
	let:auth
	let:signOut
>
	<div class="premium-content">
		<h1>Premium Access</h1>
		<p>Welcome, {user.displayName}!</p>
		<p>You have access to premium features.</p>

		<div class="premium-features">
			<h2>Premium Features</h2>
			<ul>
				<li>Advanced Analytics</li>
				<li>Priority Support</li>
				<li>Custom Integrations</li>
				<li>Unlimited Storage</li>
			</ul>
		</div>
	</div>
</CustomGuard>
```

## 🎨 Custom Styling

### **Verification Loading States**

Style verification loading screens:

```svelte
<style>
	.verification-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.loading-spinner {
		width: 60px;
		height: 60px;
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-top: 4px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 2rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.verification-steps {
		margin-top: 2rem;
		text-align: left;
	}

	.step {
		padding: 0.5rem 1rem;
		margin: 0.5rem 0;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		transition: all 0.3s;
	}

	.step.completed {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}
</style>
```

### **Access Denied Styling**

Style access denied states:

```svelte
<style>
	.access-denied {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: #fef2f2;
		color: #991b1b;
		text-align: center;
	}

	.access-denied-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.access-denied h1 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.access-denied p {
		font-size: 1.125rem;
		margin-bottom: 2rem;
		max-width: 500px;
		line-height: 1.6;
	}

	.access-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.access-actions button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.primary-btn {
		background: #dc2626;
		color: white;
	}

	.primary-btn:hover {
		background: #b91c1c;
	}

	.secondary-btn {
		background: white;
		color: #dc2626;
		border: 2px solid #dc2626;
	}

	.secondary-btn:hover {
		background: #dc2626;
		color: white;
	}
</style>
```

## 🔍 Error Handling

### **Verification Check Failures**

Handle verification check errors:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	async function riskyVerification(user, auth) {
		try {
			// Simulate a verification that might fail
			const response = await fetch('/api/verify-user');
			if (!response.ok) {
				throw new Error('Verification failed');
			}
			return true;
		} catch (error) {
			console.error('Verification error:', error);
			return false;
		}
	}
</script>

<CustomGuard
	verificationChecks={[riskyVerification]}
	redirectTo="/verification-failed"
	let:user
	let:auth
	let:signOut
>
	<div class="verified-content">
		<h1>Verification Successful</h1>
		<p>Welcome, {user.displayName}!</p>
		<!-- Protected content -->
	</div>
</CustomGuard>
```

### **Fallback Error Handling**

Provide fallback content for errors:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	async function complexVerification(user, auth) {
		// Complex verification that might fail
		const result = await someComplexCheck(user);
		return result;
	}
</script>

<CustomGuard
	verificationChecks={[complexVerification]}
	redirectTo="/error"
	let:user let:auth let:signOut
>
	{#snippet fallback()}
		<div class="verification-fallback">
			<div class="fallback-content">
				<h2>Verifying Access</h2>
				<p>Please wait while we verify your permissions...</p>

				{#if verificationError}
					<div class="error-message">
						<p>Verification failed: {verificationError}</p>
						<button onclick={() => retryVerification()}>Retry</button>
					</div>
				{/if}
			</div>
		</div>
	{/snippet}

	{#snippet default(user, auth, signOut)}
		<div class="success-content">
			<h1>Access Granted</h1>
			<p>Welcome, {user.displayName}!</p>
		</div>
	{/snippet}
</CustomGuard>
```

## 🔧 Performance Optimization

### **Caching Verification Results**

Cache verification results to avoid repeated checks:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	const verificationCache = new Map();

	async function cachedVerification(user, auth) {
		const cacheKey = `${user.uid}-verification`;

		// Check cache first
		if (verificationCache.has(cacheKey)) {
			const cached = verificationCache.get(cacheKey);
			if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
				// 5 minutes
				return cached.result;
			}
		}

		// Perform verification
		const result = await performExpensiveVerification(user);

		// Cache result
		verificationCache.set(cacheKey, {
			result,
			timestamp: Date.now()
		});

		return result;
	}
</script>

<CustomGuard verificationChecks={[cachedVerification]} let:user let:auth let:signOut>
	<div class="cached-content">
		<h1>Welcome, {user.displayName}!</h1>
		<!-- Content with cached verification -->
	</div>
</CustomGuard>
```

## 🐛 Troubleshooting

### **Verification Not Working**

If verification checks aren't working:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	async function debugVerification(user, auth) {
		console.log('Verification called with:', { user, auth });

		try {
			const result = await someVerification(user);
			console.log('Verification result:', result);
			return result;
		} catch (error) {
			console.error('Verification error:', error);
			return false;
		}
	}
</script>

<CustomGuard
	verificationChecks={[debugVerification]}
	redirectTo="/debug"
	let:user
	let:auth
	let:signOut
>
	<div class="debug-content">
		<h1>Debug Mode</h1>
		<p>Check console for verification logs</p>
		<p>User: {user.displayName}</p>
		<p>Auth: {auth ? 'Available' : 'Not available'}</p>
	</div>
</CustomGuard>
```

### **Redirect Issues**

If redirects aren't working properly:

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	$effect(() => {
		console.log('Auth state changed:', authState);
		console.log('Verification passed:', verificationPassed);
		console.log('Redirect target:', redirectTo);
	});
</script>

<CustomGuard redirectTo="/custom-redirect" let:user let:auth let:signOut>
	<div class="content">
		<h1>Content</h1>
		<p>This should only show if all checks pass</p>
	</div>
</CustomGuard>
```

## 📚 Related Components

- [`AuthGuard`](./auth-guard.md) - Simple authentication guard
- [`SignedIn`](./signed-in.md) - Conditional rendering for authenticated users
- [`SignedOut`](./signed-out.md) - Conditional rendering for unauthenticated users

## 🔗 API Reference

### **Component Props**

```typescript
interface CustomGuardProps {
	children: Snippet<[UserProfile, Auth, () => Promise<void>]>;
	requireAuth?: boolean; // Default: true
	redirectTo?: string; // Default: '/'
	fallback?: Snippet<[]>;
	verificationChecks?: ((user: UserProfile, auth: Auth) => boolean | Promise<boolean>)[];
}
```

### **Slot Parameters**

```typescript
// children slot parameters
user: UserProfile; // Current authenticated user
auth: Auth; // Firebase Auth instance
signOut: () => Promise<void>; // Sign out function
```

### **Verification Function Signature**

```typescript
type VerificationFunction = (user: UserProfile, auth: Auth) => boolean | Promise<boolean>;
```

---

**Next**: [Component Index](./index.md)
