---
title: FirebaseApp
description: Firebase initialization and context provider component
---

# FirebaseApp

The `FirebaseApp` component is the foundation of Svelte Firekit. It initializes Firebase services and provides them through Svelte context to all child components.

## 🚀 Basic Usage

```svelte
<script>
	import { FirebaseApp } from 'svelte-firekit';
</script>

<FirebaseApp>
	<!-- Your entire app content -->
	<main>
		<h1>My Firebase App</h1>
		<!-- Other components will have access to Firebase context -->
	</main>
</FirebaseApp>
```

## 📋 Props

The `FirebaseApp` component accepts a single prop:

| Prop       | Type      | Required | Description                             |
| ---------- | --------- | -------- | --------------------------------------- |
| `children` | `Snippet` | ✅       | Content to render with Firebase context |

## 🔧 How It Works

### **Firebase Initialization**

The component automatically initializes all Firebase services when running in the browser:

- **Firebase App** - Core Firebase application
- **Authentication** - User authentication service
- **Firestore** - Document database
- **Storage** - File storage service
- **Realtime Database** - Real-time data synchronization
- **Analytics** - User analytics tracking
- **Functions** - Cloud functions

### **Context Provision**

All Firebase instances are made available through Svelte context:

```typescript
// Available context keys:
'firebase/app'; // Firebase app instance
'firebase/auth'; // Authentication service
'firebase/firestore'; // Firestore database
'firebase/storage'; // Storage service
'firebase/rtdb'; // Realtime Database
'firebase/analytics'; // Analytics service
'firebase/functions'; // Cloud Functions
```

## 🎯 Use Cases

### **App Root Component**

Wrap your entire application to provide Firebase context:

```svelte
<!-- +layout.svelte -->
<script>
	import { FirebaseApp } from 'svelte-firekit';
</script>

<FirebaseApp>
	<slot />
</FirebaseApp>
```

### **Feature-Specific Wrapping**

Wrap specific features that need Firebase access:

```svelte
<script>
	import { FirebaseApp } from 'svelte-firekit';
</script>

<div class="app">
	<header>
		<!-- Header without Firebase -->
	</header>

	<FirebaseApp>
		<main>
			<!-- Main content with Firebase access -->
			<AuthGuard>
				<Dashboard />
			</AuthGuard>
		</main>
	</FirebaseApp>
</div>
```

## 🔍 Accessing Firebase Context

Child components can access Firebase instances through context:

```svelte
<script>
	import { getContext } from 'svelte';
	import type { Auth, Firestore } from 'firebase';

	// Get Firebase instances from context
	const auth = getContext<Auth>('firebase/auth');
	const firestore = getContext<Firestore>('firebase/firestore');
</script>
```

## 🛡️ SSR Compatibility

The component is fully SSR-compatible:

- **Server-side**: No Firebase initialization, components render with fallback data
- **Client-side**: Firebase services initialize automatically on hydration
- **Hydration**: Seamless transition from server to client rendering

## ⚠️ Important Notes

### **Browser-Only Initialization**

Firebase services only initialize in the browser environment:

```svelte
<script>
	import { browser } from '$app/environment';
	import { FirebaseApp } from 'svelte-firekit';
</script>

{#if browser}
	<FirebaseApp>
		<App />
	</FirebaseApp>
{:else}
	<!-- Server-side fallback -->
	<App />
{/if}
```

### **Environment Variables**

Ensure your Firebase configuration is properly set up in environment variables:

```dotenv
PUBLIC_FIREBASE_API_KEY=your_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
PUBLIC_FIREBASE_APP_ID=your_app_id
PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 🔧 Advanced Usage

### **Multiple Firebase Projects**

For applications using multiple Firebase projects:

```svelte
<script>
	import { FirebaseApp } from 'svelte-firekit';

	// Configure different Firebase projects
	const mainProject = {
		apiKey: 'main_api_key',
		projectId: 'main_project'
	};

	const secondaryProject = {
		apiKey: 'secondary_api_key',
		projectId: 'secondary_project'
	};
</script>

<!-- Main app with primary Firebase -->
<FirebaseApp>
	<MainApp />
</FirebaseApp>

<!-- Separate section with secondary Firebase -->
<FirebaseApp>
	<SecondaryApp />
</FirebaseApp>
```

### **Conditional Firebase Loading**

Load Firebase only when needed:

```svelte
<script>
	import { FirebaseApp } from 'svelte-firekit';

	let needsFirebase = false;

	function enableFirebase() {
		needsFirebase = true;
	}
</script>

{#if needsFirebase}
	<FirebaseApp>
		<FirebaseFeatures />
	</FirebaseApp>
{:else}
	<NonFirebaseFeatures />
{/if}

<button onclick={enableFirebase}> Enable Firebase Features </button>
```

## 🐛 Troubleshooting

### **Firebase Not Available Error**

If you see "Firebase instance not available" errors:

1. **Check environment variables** - Ensure all Firebase config is set
2. **Verify initialization order** - FirebaseApp must be rendered before using Firebase services
3. **Check browser console** - Look for Firebase initialization errors

### **Context Not Found**

If child components can't access Firebase context:

```svelte
<script>
	import { getContext } from 'svelte';

	const auth = getContext('firebase/auth');

	if (!auth) {
		console.error('Firebase Auth not found in context');
		// Fallback to service directly
		const { firebaseService } = await import('$lib/firebase.js');
		const auth = firebaseService.getAuthInstance();
	}
</script>
```

## 📚 Related Components

- [`AuthGuard`](./auth-guard.md) - Route protection using Firebase Auth
- [`Doc`](./doc.md) - Firestore document subscription
- [`Collection`](./collection.md) - Firestore collection subscription
- [`StorageList`](./storage-list.md) - Storage file listing

## 🔗 API Reference

### **Component Props**

```typescript
interface FirebaseAppProps {
	children: Snippet;
}
```

### **Context Keys**

```typescript
// Available context keys for child components
'firebase/app': FirebaseApp
'firebase/auth': Auth
'firebase/firestore': Firestore
'firebase/storage': FirebaseStorage
'firebase/rtdb': Database
'firebase/analytics': Analytics
'firebase/functions': Functions
```

---

**Next**: [AuthGuard Component](./auth-guard.md)
