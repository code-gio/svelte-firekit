---
title: AuthGuard
description: Route protection and authentication guard component
---

# AuthGuard

The `AuthGuard` component provides route protection based on Firebase authentication state. It automatically redirects users based on their authentication status and renders protected content only when authentication requirements are met.

## 🚀 Basic Usage

```svelte
<script>
	import { AuthGuard } from 'svelte-firekit';
</script>

<!-- Require authentication -->
<AuthGuard requireAuth={true} redirectTo="/login">
	<h1>Protected Dashboard</h1>
	<p>Only authenticated users can see this content.</p>
</AuthGuard>
```

## 📋 Props

| Prop          | Type                                                | Required | Default | Description                                            |
| ------------- | --------------------------------------------------- | -------- | ------- | ------------------------------------------------------ |
| `children`    | `Snippet<[UserProfile, Auth, () => Promise<void>]>` | ✅       | -       | Content to render when auth state matches requirements |
| `requireAuth` | `boolean`                                           | ❌       | `true`  | Whether authentication is required to view content     |
| `redirectTo`  | `string`                                            | ❌       | `'/'`   | Path to redirect to if auth state doesn't match        |
| `fallback`    | `Snippet<[]>`                                       | ❌       | -       | Content to show while checking auth state              |

## 🎯 Use Cases

### **Protected Routes**

Require authentication for sensitive content:

```svelte
<script>
	import { AuthGuard } from 'svelte-firekit';
</script>

<AuthGuard requireAuth={true} redirectTo="/login">
	<div class="dashboard">
		<h1>User Dashboard</h1>
		<ProfileSettings />
		<PrivateData />
	</div>
</AuthGuard>
```

### **Public-Only Routes**

Redirect authenticated users away from public pages:

```svelte
<script>
	import { AuthGuard } from 'svelte-firekit';
</script>

<AuthGuard requireAuth={false} redirectTo="/dashboard">
	<div class="landing">
		<h1>Welcome to Our App</h1>
		<SignUpForm />
		<LoginForm />
	</div>
</AuthGuard>
```

### **Custom Loading State**

Show custom loading content while checking authentication:

```svelte
<script>
	import { AuthGuard } from 'svelte-firekit';
</script>

<AuthGuard requireAuth={true} redirectTo="/login">
	{#snippet fallback()}
		<div class="auth-loading">
			<Spinner />
			<p>Checking authentication...</p>
		</div>
	{/snippet}

	{#snippet default(user, auth, signOut)}
		<h1>Welcome, {user.displayName}!</h1>
		<button onclick={signOut}>Sign Out</button>
	{/snippet}
</AuthGuard>
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
	import { AuthGuard } from 'svelte-firekit';
	import type { UserProfile } from 'svelte-firekit';
	import type { Auth } from 'firebase/auth';
</script>

<AuthGuard requireAuth={true} redirectTo="/login">
	{#snippet default(user: UserProfile, auth: Auth, signOut: () => Promise<void>)}
		<div class="user-profile">
			<img src={user.photoURL} alt={user.displayName} />
			<h1>Welcome, {user.displayName}!</h1>
			<p>Email: {user.email}</p>

			<div class="actions">
				<button onclick={() => signOut()}>
					Sign Out
				</button>
			</div>
		</div>
	{/snippet}
</AuthGuard>
```

## 🛡️ Authentication Flow

### **Loading State**

1. Component initializes and subscribes to auth state changes
2. Shows fallback content while checking authentication
3. Waits for Firebase Auth to initialize

### **Authentication Check**

1. Evaluates current auth state against `requireAuth` prop
2. If requirements not met, redirects to `redirectTo` path
3. If requirements met, renders protected content

### **Real-time Updates**

- Automatically responds to auth state changes
- Re-evaluates protection requirements on sign in/out
- Handles token refresh and session updates

## 🔧 Advanced Usage

### **Role-Based Protection**

Combine with custom guards for role-based access:

```svelte
<script>
	import { AuthGuard, CustomGuard } from 'svelte-firekit';

	function checkAdminRole(user) {
		return user?.role === 'admin';
	}
</script>

<AuthGuard requireAuth={true} redirectTo="/login">
	<CustomGuard check={checkAdminRole} redirectTo="/unauthorized">
		<h1>Admin Dashboard</h1>
		<AdminTools />
	</CustomGuard>
</AuthGuard>
```

### **Conditional Authentication**

Dynamic authentication requirements:

```svelte
<script>
	import { AuthGuard } from 'svelte-firekit';

	let requireAuth = true;

	function toggleAuthRequirement() {
		requireAuth = !requireAuth;
	}
</script>

<AuthGuard {requireAuth} redirectTo="/login">
	<div class="content">
		<h1>Dynamic Protection</h1>
		<button onclick={toggleAuthRequirement}> Toggle Auth Requirement </button>
	</div>
</AuthGuard>
```

### **Multiple Redirect Paths**

Handle different scenarios with custom logic:

```svelte
<script>
	import { AuthGuard } from 'svelte-firekit';
	import { page } from '$app/stores';

	// Dynamic redirect based on current page
	$: redirectPath = $page.url.pathname.startsWith('/admin') ? '/admin/login' : '/login';
</script>

<AuthGuard requireAuth={true} redirectTo={redirectPath}>
	<slot />
</AuthGuard>
```

## 🎨 Custom Styling

### **Loading State Styling**

Customize the default loading state:

```svelte
<style>
	:global(.auth-guard-loading) {
		@apply flex min-h-screen items-center justify-center;
	}

	:global(.auth-guard-spinner) {
		@apply mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900;
	}

	:global(.auth-guard-text) {
		@apply mt-2 text-gray-600;
	}
</style>
```

### **Error State Styling**

Style error states when Firebase is unavailable:

```svelte
<style>
	:global(.auth-guard-error) {
		@apply flex min-h-screen items-center justify-center;
	}

	:global(.auth-guard-error-content) {
		@apply text-center;
	}

	:global(.auth-guard-error-title) {
		@apply mb-2 text-lg font-semibold text-red-500;
	}

	:global(.auth-guard-error-message) {
		@apply text-gray-600;
	}
</style>
```

## 🔍 Error Handling

### **Firebase Unavailable**

Graceful handling when Firebase services are not available:

```svelte
<script>
	import { AuthGuard } from 'svelte-firekit';
</script>

<AuthGuard requireAuth={true} redirectTo="/login">
	{#snippet fallback()}
		<div class="firebase-error">
			<h2>Firebase Not Available</h2>
			<p>Please check your configuration and try again.</p>
		</div>
	{/snippet}

	<ProtectedContent />
</AuthGuard>
```

### **Network Issues**

Handle authentication failures gracefully:

```svelte
<script>
	import { AuthGuard } from 'svelte-firekit';

	let authError = null;
</script>

<AuthGuard requireAuth={true} redirectTo="/login">
	{#snippet fallback()}
		{#if authError}
			<div class="auth-error">
				<p>Authentication failed: {authError.message}</p>
				<button onclick={() => window.location.reload()}> Retry </button>
			</div>
		{:else}
			<div class="loading">Checking authentication...</div>
		{/if}
	{/snippet}

	<ProtectedContent />
</AuthGuard>
```

## 🐛 Troubleshooting

### **Infinite Redirect Loop**

If you encounter redirect loops:

1. **Check redirect paths** - Ensure they don't create circular references
2. **Verify auth state** - Make sure Firebase Auth is properly initialized
3. **Check console errors** - Look for Firebase initialization issues

### **Component Not Rendering**

If the component doesn't render protected content:

```svelte
<script>
	import { AuthGuard } from 'svelte-firekit';
	import { firekitAuth } from 'svelte-firekit';

	// Debug auth state
	$effect(() => {
		console.log('Auth state:', firekitAuth.getState());
	});
</script>

<AuthGuard requireAuth={true} redirectTo="/login">
	{#snippet default(user, auth, signOut)}
		<div class="debug">
			<p>User: {user?.uid}</p>
			<p>Authenticated: {firekitAuth.isAuthenticated()}</p>
		</div>
	{/snippet}
</AuthGuard>
```

## 📚 Related Components

- [`FirebaseApp`](./firebase-app.md) - Firebase initialization
- [`SignedIn`](./signed-in.md) - Simple authenticated user rendering
- [`SignedOut`](./signed-out.md) - Simple unauthenticated user rendering
- [`CustomGuard`](./custom-guard.md) - Custom authentication guards

## 🔗 API Reference

### **Component Props**

```typescript
interface AuthGuardProps {
	children: Snippet<[UserProfile, Auth, () => Promise<void>]>;
	requireAuth?: boolean;
	redirectTo?: string;
	fallback?: Snippet<[]>;
}
```

### **Slot Parameters**

```typescript
// children slot parameters
user: UserProfile; // Current user profile
auth: Auth; // Firebase Auth instance
signOut: () => Promise<void>; // Sign out function
```

---

**Next**: [SignedIn Component](./signed-in.md)
