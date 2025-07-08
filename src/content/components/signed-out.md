---
title: SignedOut
description: Conditional rendering component for unauthenticated users
---

# SignedOut

The `SignedOut` component provides simple conditional rendering for unauthenticated users. It automatically shows content only when no user is signed in and provides the Firebase Auth instance to the rendered content.

## 🚀 Basic Usage

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
</script>

<SignedOut let:auth>
	<h1>Welcome to our app!</h1>
	<p>Please sign in to continue.</p>
	<button onclick={() => signInWithGoogle(auth)}>Sign In with Google</button>
</SignedOut>
```

## 📋 Props

| Prop       | Type              | Required | Description                               |
| ---------- | ----------------- | -------- | ----------------------------------------- |
| `children` | `Snippet<[Auth]>` | ✅       | Content to render when user is signed out |

## 🎯 Use Cases

### **Simple Sign-In Page**

Display a basic sign-in interface:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
	import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
</script>

<SignedOut let:auth>
	<div class="signin-page">
		<div class="signin-card">
			<h1>Welcome Back</h1>
			<p>Sign in to access your account</p>

			<div class="signin-buttons">
				<button class="google-btn" onclick={() => signInWithPopup(auth, new GoogleAuthProvider())}>
					<img src="/google-icon.svg" alt="Google" />
					Sign in with Google
				</button>

				<button class="email-btn" onclick={() => (showEmailSignIn = true)}>
					Sign in with Email
				</button>
			</div>

			<p class="signup-link">
				Don't have an account?
				<a href="/signup">Sign up</a>
			</p>
		</div>
	</div>
</SignedOut>
```

### **Landing Page for Guests**

Show a landing page for unauthenticated users:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
</script>

<SignedOut let:auth>
	<div class="landing-page">
		<header class="hero">
			<h1>Build Amazing Apps with Firebase</h1>
			<p>Join thousands of developers building the future</p>
			<div class="cta-buttons">
				<button class="primary-btn" onclick={() => signInWithGoogle(auth)}> Get Started </button>
				<button class="secondary-btn" onclick={() => scrollToFeatures()}> Learn More </button>
			</div>
		</header>

		<section class="features">
			<h2>Why Choose Our Platform?</h2>
			<div class="feature-grid">
				<div class="feature">
					<h3>Real-time Data</h3>
					<p>Build responsive apps with live data synchronization</p>
				</div>
				<div class="feature">
					<h3>Secure Authentication</h3>
					<p>Multiple sign-in methods with enterprise-grade security</p>
				</div>
				<div class="feature">
					<h3>Scalable Infrastructure</h3>
					<p>Grow your app without worrying about infrastructure</p>
				</div>
			</div>
		</section>
	</div>
</SignedOut>
```

### **Navigation for Guests**

Show navigation appropriate for unauthenticated users:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
</script>

<nav class="main-nav">
	<div class="nav-brand">
		<a href="/">MyApp</a>
	</div>

	<SignedOut let:auth>
		<div class="nav-actions">
			<a href="/features">Features</a>
			<a href="/pricing">Pricing</a>
			<a href="/docs">Documentation</a>
			<button class="signin-btn" onclick={() => signInWithGoogle(auth)}> Sign In </button>
		</div>
	</SignedOut>
</nav>
```

## 🔧 Slot Parameters

The `children` slot receives one parameter:

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| `auth`    | `Auth` | Firebase Auth instance |

### **Using Slot Parameters**

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
	import type { Auth } from 'firebase/auth';
	import { GoogleAuthProvider, signInWithPopup, EmailAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';

	let email = '';
	let password = '';
	let showEmailForm = false;
</script>

<SignedOut let:auth>
	{#snippet children(auth: Auth)}
		<div class="auth-container">
			{#if !showEmailForm}
				<div class="social-signin">
					<h2>Sign In</h2>
					<button
						class="google-btn"
						onclick={() => signInWithPopup(auth, new GoogleAuthProvider())}
					>
						Continue with Google
					</button>
					<button
						class="email-toggle-btn"
						onclick={() => showEmailForm = true}
					>
						Sign in with Email
					</button>
				</div>
			{:else}
				<form class="email-signin" onsubmit|preventDefault={() => signInWithEmailAndPassword(auth, email, password)}>
					<h2>Sign In with Email</h2>
					<input
						type="email"
						bindvalue={email}
						placeholder="Email address"
						required
					/>
					<input
						type="password"
						bindvalue={password}
						placeholder="Password"
						required
					/>
					<button type="submit">Sign In</button>
					<button type="button" onclick={() => showEmailForm = false}>
						Back to Social Sign In
					</button>
				</form>
			{/if}
		</div>
	{/snippet}
</SignedOut>
```

## 🔧 Advanced Usage

### **Multiple Authentication Methods**

Provide various sign-in options:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
	import {
		GoogleAuthProvider,
		FacebookAuthProvider,
		TwitterAuthProvider,
		signInWithPopup
	} from 'firebase/auth';
</script>

<SignedOut let:auth>
	<div class="auth-methods">
		<h2>Choose your sign-in method</h2>

		<div class="auth-buttons">
			<button
				class="auth-btn google"
				onclick={() => signInWithPopup(auth, new GoogleAuthProvider())}
			>
				<img src="/google-icon.svg" alt="Google" />
				Continue with Google
			</button>

			<button
				class="auth-btn facebook"
				onclick={() => signInWithPopup(auth, new FacebookAuthProvider())}
			>
				<img src="/facebook-icon.svg" alt="Facebook" />
				Continue with Facebook
			</button>

			<button
				class="auth-btn twitter"
				onclick={() => signInWithPopup(auth, new TwitterAuthProvider())}
			>
				<img src="/twitter-icon.svg" alt="Twitter" />
				Continue with Twitter
			</button>
		</div>

		<div class="divider">
			<span>or</span>
		</div>

		<a href="/email-signin" class="email-link"> Sign in with Email </a>
	</div>
</SignedOut>
```

### **Conditional Content Based on Auth State**

Show different content based on authentication loading state:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
	import { firekitAuth } from 'svelte-firekit';
</script>

{#if firekitAuth.getState().loading}
	<div class="loading">Checking authentication...</div>
{:else}
	<SignedOut let:auth>
		<div class="guest-content">
			<h1>Welcome to Our App</h1>
			<p>Please sign in to access your personalized dashboard.</p>
			<button onclick={() => signInWithGoogle(auth)}>Get Started</button>
		</div>
	</SignedOut>
{/if}
```

### **Marketing Page with Sign-In**

Combine marketing content with authentication:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
</script>

<SignedOut let:auth>
	<div class="marketing-page">
		<header class="hero">
			<h1>Transform Your Workflow</h1>
			<p>Join 10,000+ teams using our platform</p>
		</header>

		<main class="content">
			<section class="benefits">
				<h2>Why Teams Choose Us</h2>
				<div class="benefit-grid">
					<div class="benefit">
						<h3>🚀 Fast Setup</h3>
						<p>Get started in minutes, not hours</p>
					</div>
					<div class="benefit">
						<h3>🔒 Enterprise Security</h3>
						<p>Bank-level security for your data</p>
					</div>
					<div class="benefit">
						<h3>📈 Scalable Growth</h3>
						<p>Grow without infrastructure worries</p>
					</div>
				</div>
			</section>

			<section class="cta">
				<h2>Ready to Get Started?</h2>
				<p>Join thousands of developers building amazing apps</p>
				<button class="cta-button" onclick={() => signInWithGoogle(auth)}>
					Start Building Today
				</button>
			</section>
		</main>
	</div>
</SignedOut>
```

## 🎨 Custom Styling

### **Modern Sign-In Form**

Style a contemporary authentication interface:

```svelte
<style>
	.auth-container {
		max-width: 400px;
		margin: 2rem auto;
		padding: 2rem;
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	}

	.auth-container h2 {
		text-align: center;
		margin-bottom: 1.5rem;
		color: #1f2937;
	}

	.social-signin {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.google-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.google-btn:hover {
		background: #f9fafb;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.email-toggle-btn {
		padding: 0.75rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.email-toggle-btn:hover {
		background: #2563eb;
	}
</style>
```

### **Landing Page Styling**

Style a marketing landing page:

```svelte
<style>
	.landing-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.hero {
		text-align: center;
		padding: 4rem 2rem;
	}

	.hero h1 {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.hero p {
		font-size: 1.25rem;
		margin-bottom: 2rem;
		opacity: 0.9;
	}

	.cta-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.primary-btn {
		padding: 1rem 2rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1.1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.primary-btn:hover {
		background: #059669;
		transform: translateY(-2px);
	}

	.secondary-btn {
		padding: 1rem 2rem;
		background: transparent;
		color: white;
		border: 2px solid white;
		border-radius: 0.5rem;
		font-size: 1.1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.secondary-btn:hover {
		background: white;
		color: #667eea;
	}
</style>
```

## 🔍 Error Handling

### **Firebase Auth Unavailable**

Handle cases where Firebase Auth is not available:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
	import { firebaseService } from 'svelte-firekit';

	// Check if Firebase Auth is available
	const auth = firebaseService.getAuthInstance();
</script>

{#if auth}
	<SignedOut let:auth>
		<div class="signin-content">
			<h1>Welcome!</h1>
			<button onclick={() => signInWithGoogle(auth)}>Sign In</button>
		</div>
	</SignedOut>
{:else}
	<div class="auth-error">
		<p>Authentication service is not available. Please check your configuration.</p>
		<a href="/contact">Contact Support</a>
	</div>
{/if}
```

### **Authentication Errors**

Handle authentication errors gracefully:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
	import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

	let authError = null;

	async function handleGoogleSignIn(auth) {
		try {
			await signInWithPopup(auth, new GoogleAuthProvider());
		} catch (error) {
			authError = error.message;
		}
	}
</script>

<SignedOut let:auth>
	<div class="signin-form">
		<h2>Sign In</h2>

		{#if authError}
			<div class="error-message">
				<p>{authError}</p>
				<button onclick={() => (authError = null)}>Dismiss</button>
			</div>
		{/if}

		<button onclick={() => handleGoogleSignIn(auth)}> Sign in with Google </button>
	</div>
</SignedOut>
```

## 🔧 Performance Optimization

### **Conditional Rendering**

Only render SignedOut component when needed:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
	import { firekitAuth } from 'svelte-firekit';

	let showGuestContent = false;

	// Only show guest content when auth is initialized
	$effect(() => {
		const authState = firekitAuth.getState();
		showGuestContent = authState.initialized && !authState.loading;
	});
</script>

{#if showGuestContent}
	<SignedOut let:auth>
		<div class="guest-content">
			<h1>Welcome!</h1>
			<button onclick={() => signInWithGoogle(auth)}>Sign In</button>
		</div>
	</SignedOut>
{/if}
```

### **Lazy Loading**

Load authentication components only when needed:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';

	let showAuthForm = false;
</script>

<SignedOut let:auth>
	<div class="guest-landing">
		<h1>Welcome to Our App</h1>
		<p>Discover amazing features and join our community.</p>

		{#if !showAuthForm}
			<button onclick={() => (showAuthForm = true)}> Get Started </button>
		{:else}
			<div class="auth-form">
				<button onclick={() => signInWithGoogle(auth)}> Continue with Google </button>
				<button onclick={() => (showAuthForm = false)}> Maybe Later </button>
			</div>
		{/if}
	</div>
</SignedOut>
```

## 🐛 Troubleshooting

### **Component Not Rendering**

If the SignedOut component doesn't render:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
	import { firekitAuth } from 'svelte-firekit';

	// Debug auth state
	$effect(() => {
		const authState = firekitAuth.getState();
		console.log('Auth state:', authState);
		console.log('Is authenticated:', firekitAuth.isAuthenticated());
	});
</script>

<SignedOut let:auth>
	{#snippet children(auth)}
		<div class="debug">
			<p>Auth instance: {auth ? 'Available' : 'Not available'}</p>
			<p>Auth app: {auth?.app?.name}</p>
		</div>
	{/snippet}
</SignedOut>
```

### **Authentication Not Working**

If authentication methods don't work:

```svelte
<script>
	import { SignedOut } from 'svelte-firekit';
	import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

	async function debugSignIn(auth) {
		try {
			console.log('Attempting Google sign-in...');
			const result = await signInWithPopup(auth, new GoogleAuthProvider());
			console.log('Sign-in successful:', result.user);
		} catch (error) {
			console.error('Sign-in error:', error);
			alert(`Sign-in failed: ${error.message}`);
		}
	}
</script>

<SignedOut let:auth>
	<div class="debug-auth">
		<h2>Debug Authentication</h2>
		<button onclick={() => debugSignIn(auth)}> Test Google Sign-In </button>
		<p>Check console for detailed logs</p>
	</div>
</SignedOut>
```

## 📚 Related Components

- [`SignedIn`](./signed-in.md) - Conditional rendering for authenticated users
- [`AuthGuard`](./auth-guard.md) - Route protection with redirects
- [`CustomGuard`](./custom-guard.md) - Custom authentication guards

## 🔗 API Reference

### **Component Props**

```typescript
interface SignedOutProps {
	children: Snippet<[Auth]>;
}
```

### **Slot Parameters**

```typescript
// children slot parameters
auth: Auth; // Firebase Auth instance
```

### **Auth Instance Methods**

```typescript
// Common auth methods available in the slot
auth.signInWithPopup(provider); // Sign in with popup
auth.signInWithRedirect(provider); // Sign in with redirect
auth.signOut(); // Sign out
auth.onAuthStateChanged(callback); // Listen to auth changes
```

---

**Next**: [DownloadURL Component](./download-url.md)
