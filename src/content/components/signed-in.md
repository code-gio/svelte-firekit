---
title: SignedIn
description: Conditional rendering component for authenticated users
---

# SignedIn

The `SignedIn` component provides simple conditional rendering for authenticated users. It automatically shows content only when a user is signed in and provides the user profile data to the rendered content.

## 🚀 Basic Usage

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
</script>

<SignedIn let:user>
	<h1>Welcome back, {user.displayName}!</h1>
	<p>You are signed in as {user.email}</p>
</SignedIn>
```

## 📋 Props

| Prop       | Type                     | Required | Description                              |
| ---------- | ------------------------ | -------- | ---------------------------------------- |
| `children` | `Snippet<[UserProfile]>` | ✅       | Content to render when user is signed in |

## 🎯 Use Cases

### **Simple Welcome Message**

Display personalized content for authenticated users:

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
</script>

<SignedIn let:user>
	<div class="welcome-section">
		<img src={user.photoURL} alt={user.displayName} class="avatar" />
		<h1>Welcome back, {user.displayName}!</h1>
		<p>You're signed in as {user.email}</p>
		<button onclick={() => signOut()}>Sign Out</button>
	</div>
</SignedIn>
```

### **User Profile Display**

Show user profile information:

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
</script>

<SignedIn let:user>
	<div class="user-profile">
		<div class="profile-header">
			<img src={user.photoURL} alt={user.displayName} />
			<div class="profile-info">
				<h2>{user.displayName}</h2>
				<p>{user.email}</p>
				{#if user.emailVerified}
					<span class="verified-badge">✓ Verified</span>
				{/if}
			</div>
		</div>

		<div class="profile-details">
			<p><strong>User ID:</strong> {user.uid}</p>
			<p><strong>Provider:</strong> {user.providerData[0]?.providerId}</p>
			<p><strong>Created:</strong> {new Date(user.metadata.creationTime).toLocaleDateString()}</p>
		</div>
	</div>
</SignedIn>
```

### **Navigation Menu**

Show authenticated user navigation:

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
</script>

<nav class="main-nav">
	<SignedIn let:user>
		<div class="user-nav">
			<img src={user.photoURL} alt={user.displayName} class="nav-avatar" />
			<div class="nav-menu">
				<a href="/dashboard">Dashboard</a>
				<a href="/profile">Profile</a>
				<a href="/settings">Settings</a>
				<button onclick={() => signOut()}>Sign Out</button>
			</div>
		</div>
	</SignedIn>
</nav>
```

## 🔧 Slot Parameters

The `children` slot receives one parameter:

| Parameter | Type          | Description                        |
| --------- | ------------- | ---------------------------------- |
| `user`    | `UserProfile` | Current authenticated user profile |

### **Using Slot Parameters**

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
	import type { UserProfile } from 'svelte-firekit';
</script>

<SignedIn let:user>
	{#snippet children(user: UserProfile)}
		<div class="user-welcome">
			<h1>Hello, {user.displayName || user.email}!</h1>
			{#if user.photoURL}
				<img src={user.photoURL} alt="Profile" class="profile-photo" />
			{/if}
			<p>You're successfully signed in.</p>
		</div>
	{/snippet}
</SignedIn>
```

## 🔧 Advanced Usage

### **Conditional Content Based on User Properties**

Show different content based on user attributes:

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
</script>

<SignedIn let:user>
	<div class="user-dashboard">
		<h1>Welcome, {user.displayName}!</h1>

		{#if user.emailVerified}
			<div class="verified-user">
				<p>✓ Your email is verified</p>
				<a href="/premium">Upgrade to Premium</a>
			</div>
		{:else}
			<div class="unverified-user">
				<p>⚠️ Please verify your email address</p>
				<button onclick={() => sendVerificationEmail()}> Resend Verification </button>
			</div>
		{/if}

		{#if user.providerData[0]?.providerId === 'google.com'}
			<div class="google-user">
				<p>Signed in with Google</p>
			</div>
		{:else if user.providerData[0]?.providerId === 'facebook.com'}
			<div class="facebook-user">
				<p>Signed in with Facebook</p>
			</div>
		{/if}
	</div>
</SignedIn>
```

### **User Role-Based Content**

Show content based on user roles (requires custom user data):

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
	import { Doc } from 'svelte-firekit';
</script>

<SignedIn let:user>
	<Doc ref="users/{user.uid}" let:data let:ref let:firestore>
		{#if data}
			{#if data.role === 'admin'}
				<div class="admin-dashboard">
					<h1>Admin Dashboard</h1>
					<AdminTools />
				</div>
			{:else if data.role === 'moderator'}
				<div class="moderator-dashboard">
					<h1>Moderator Dashboard</h1>
					<ModeratorTools />
				</div>
			{:else}
				<div class="user-dashboard">
					<h1>User Dashboard</h1>
					<UserTools />
				</div>
			{/if}
		{:else}
			<div class="loading">Loading user data...</div>
		{/if}
	</Doc>
</SignedIn>
```

### **User Preferences**

Display user-specific settings and preferences:

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
	import { Doc } from 'svelte-firekit';
</script>

<SignedIn let:user>
	<Doc ref="users/{user.uid}/preferences" let:data let:ref let:firestore>
		<div class="user-preferences">
			<h2>Your Preferences</h2>

			{#if data}
				<div class="preference-item">
					<label>
						<input
							type="checkbox"
							bindchecked={data.emailNotifications}
							onchange={() => updatePreference('emailNotifications', $event.target.checked)}
						/>
						Email Notifications
					</label>
				</div>

				<div class="preference-item">
					<label>
						<input
							type="checkbox"
							bindchecked={data.darkMode}
							onchange={() => updatePreference('darkMode', $event.target.checked)}
						/>
						Dark Mode
					</label>
				</div>
			{:else}
				<p>Loading preferences...</p>
			{/if}
		</div>
	</Doc>
</SignedIn>
```

## 🎨 Custom Styling

### **User Avatar Styling**

Style user avatars and profile information:

```svelte
<style>
	.user-welcome {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 0.5rem;
	}

	.profile-photo {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		border: 3px solid white;
		object-fit: cover;
	}

	.user-info h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.user-info p {
		margin: 0.25rem 0 0 0;
		opacity: 0.9;
	}
</style>
```

### **Navigation Styling**

Style navigation menus for authenticated users:

```svelte
<style>
	.user-nav {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.nav-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.nav-avatar:hover {
		transform: scale(1.1);
	}

	.nav-menu {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.nav-menu a {
		color: #374151;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		transition: background-color 0.2s;
	}

	.nav-menu a:hover {
		background-color: #f3f4f6;
	}

	.nav-menu button {
		background-color: #ef4444;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.nav-menu button:hover {
		background-color: #dc2626;
	}
</style>
```

## 🔍 Error Handling

### **Firebase Auth Unavailable**

Handle cases where Firebase Auth is not available:

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
	import { firebaseService } from 'svelte-firekit';

	// Check if Firebase Auth is available
	const auth = firebaseService.getAuthInstance();
</script>

{#if auth}
	<SignedIn let:user>
		<div class="user-content">
			<h1>Welcome, {user.displayName}!</h1>
			<!-- User content -->
		</div>
	</SignedIn>
{:else}
	<div class="auth-error">
		<p>Firebase Auth is not available. Please check your configuration.</p>
	</div>
{/if}
```

### **User Data Loading**

Handle loading states for user data:

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
	import { firekitAuth } from 'svelte-firekit';
</script>

{#if firekitAuth.getState().loading}
	<div class="loading">Checking authentication...</div>
{:else}
	<SignedIn let:user>
		<div class="user-content">
			<h1>Welcome, {user.displayName}!</h1>
			<!-- User content -->
		</div>
	</SignedIn>
{/if}
```

## 🔧 Performance Optimization

### **Conditional Rendering**

Only render SignedIn component when needed:

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
	import { firekitAuth } from 'svelte-firekit';

	let showUserContent = false;

	// Only show user content when auth is initialized
	$effect(() => {
		const authState = firekitAuth.getState();
		showUserContent = authState.initialized && !authState.loading;
	});
</script>

{#if showUserContent}
	<SignedIn let:user>
		<div class="user-content">
			<h1>Welcome, {user.displayName}!</h1>
			<!-- User content -->
		</div>
	</SignedIn>
{/if}
```

## 🐛 Troubleshooting

### **Component Not Rendering**

If the SignedIn component doesn't render:

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
	import { firekitAuth } from 'svelte-firekit';

	// Debug auth state
	$effect(() => {
		const authState = firekitAuth.getState();
		console.log('Auth state:', authState);
		console.log('Is authenticated:', firekitAuth.isAuthenticated());
	});
</script>

<SignedIn let:user>
	{#snippet children(user)}
		<div class="debug">
			<p>User ID: {user.uid}</p>
			<p>Email: {user.email}</p>
			<p>Display Name: {user.displayName}</p>
		</div>
	{/snippet}
</SignedIn>
```

### **User Data Not Available**

If user data is not available:

```svelte
<script>
	import { SignedIn } from 'svelte-firekit';
</script>

<SignedIn let:user>
	{#if user}
		<div class="user-content">
			<h1>Welcome, {user.displayName || user.email}!</h1>
			<!-- User content -->
		</div>
	{:else}
		<div class="no-user-data">
			<p>User data is not available.</p>
		</div>
	{/if}
</SignedIn>
```

## 📚 Related Components

- [`SignedOut`](./signed-out.md) - Conditional rendering for unauthenticated users
- [`AuthGuard`](./auth-guard.md) - Route protection with redirects
- [`CustomGuard`](./custom-guard.md) - Custom authentication guards

## 🔗 API Reference

### **Component Props**

```typescript
interface SignedInProps {
	children: Snippet<[UserProfile]>;
}
```

### **Slot Parameters**

```typescript
// children slot parameters
user: UserProfile; // Current authenticated user profile
```

### **UserProfile Interface**

```typescript
interface UserProfile {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
	emailVerified: boolean;
	providerData: UserInfo[];
	metadata: UserMetadata;
}
```

---

**Next**: [SignedOut Component](./signed-out.md)
