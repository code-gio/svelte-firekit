---
title: Installation Guide
description: Complete setup guide for svelte-firekit in your Svelte 5 project
---

# Installation Guide

This guide will walk you through setting up svelte-firekit in your Svelte 5 project, from initial installation to your first Firebase integration.

## Prerequisites

- Node.js 18+
- Svelte 5 project
- Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))

## Step 1: Install Dependencies

```bash
npm install svelte-firekit firebase
```

## Step 2: Firebase Configuration

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard
4. Enable the services you need:
   - Authentication
   - Firestore Database
   - Storage
   - Realtime Database (optional)
   - Analytics (optional)

### Get Configuration

1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps" section
3. Click the web icon to add a web app
4. Register your app and copy the configuration

## Step 3: Environment Variables

Create a `.env` file in your project root:

```text
PUBLIC_FIREBASE_API_KEY=your_api_key_here
PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
PUBLIC_FIREBASE_APP_ID=your_app_id
PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Important:** All Firebase config variables must be prefixed with `PUBLIC_` for SvelteKit to expose them to the client.

## Step 4: Initialize Firebase in SvelteKit

### Create Firebase Configuration

Create `src/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
	apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
	authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
	measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDB = getDatabase(app);
export const analytics = getAnalytics(app);
```

### Wrap Your App

Update your root layout `src/routes/+layout.svelte`:

```svelte
<script>
	import { FirebaseApp } from 'svelte-firekit';
	import '../app.css';
</script>

<FirebaseApp>
	<slot />
</FirebaseApp>
```

## Step 5: Basic Usage Example

Create a simple authentication component `src/routes/+page.svelte`:

```svelte
<script>
	import { firekitAuth, firekitUser } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';

	// Reactive user state
	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);
	const isLoading = $derived(firekitUser.loading);

	async function handleSignIn() {
		try {
			await firekitAuth.signInWithGoogle();
		} catch (error) {
			console.error('Sign in error:', error);
		}
	}

	async function handleSignOut() {
		try {
			await firekitAuth.signOut();
		} catch (error) {
			console.error('Sign out error:', error);
		}
	}
</script>

<main class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Svelte Firebase Demo</h1>

	{#if isLoading}
		<p>Loading...</p>
	{:else if isAuthenticated}
		<div class="space-y-4">
			<h2>Welcome, {user?.displayName || user?.email}!</h2>
			<Button onclick={handleSignOut}>Sign Out</Button>
		</div>
	{:else}
		<Button onclick={handleSignIn}>Sign In with Google</Button>
	{/if}
</main>
```

## Step 6: Authentication Provider Setup

### Google Authentication

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable Google provider
3. Add your authorized domains

### Email/Password Authentication

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable Email/Password provider
3. Configure email templates if needed

## Step 7: Security Rules

### Firestore Security Rules

Set up basic security rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Allow public read access to published posts
    match /posts/{postId} {
      allow read: if resource.data.published == true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Security Rules

Set up storage rules in Firebase Console > Storage > Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 8: TypeScript Configuration

Update your `tsconfig.json` to include Firebase types:

```json
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "bundler"
	}
}
```

## Step 9: Vite Configuration

Update your `vite.config.ts` to handle Firebase:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		noExternal: ['svelte-firekit']
	},
	optimizeDeps: {
		include: ['firebase/app', 'firebase/auth', 'firebase/firestore']
	}
});
```

## Step 10: Verification

Test your setup by running the development server:

```bash
npm run dev
```

Visit your app and try signing in. Check the browser console for any errors.

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure all variables are prefixed with `PUBLIC_`
   - Restart your dev server after adding environment variables

2. **Firebase initialization errors**
   - Verify your Firebase config is correct
   - Check that all required services are enabled in Firebase Console

3. **Authentication not working**
   - Ensure your domain is added to authorized domains in Firebase Console
   - Check that the authentication provider is enabled

4. **CORS errors**
   - Add your localhost domain to Firebase authorized domains
   - For production, add your actual domain

### Debug Mode

Enable debug logging by setting the debug flag:

```typescript
// In your firebase.ts
const app = initializeApp(firebaseConfig);

// Enable debug mode
if (import.meta.env.DEV) {
	import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
		connectFirestoreEmulator(db, 'localhost', 8080);
	});
}
```

## Next Steps

Now that you have svelte-firekit installed and configured, you can:

1. [Read the Authentication Guide](./auth.md) to learn about user management
2. [Explore Firestore Collections](./collections.md) for data management
3. [Learn about Document Operations](./documents.md) for individual records
4. [Set up File Storage](./storage.md) for media uploads
5. [Configure Analytics](./analytics.md) for user tracking

## Support

If you encounter issues:

1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Review the [Svelte 5 Documentation](https://svelte.dev/docs)
3. Open an issue on the [svelte-firekit GitHub repository](https://github.com/your-repo/svelte-firekit)
