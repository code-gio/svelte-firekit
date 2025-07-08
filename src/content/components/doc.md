---
title: Doc
description: Real-time Firestore document subscription component
---

# Doc

The `Doc` component provides real-time Firestore document subscriptions with reactive state management. It automatically handles loading states, error handling, and data updates while providing a clean slot-based API.

## 🚀 Basic Usage

```svelte
<script>
	import { Doc } from 'svelte-firekit';
</script>

<Doc ref="users/123" let:data let:ref let:firestore>
	<h1>{data.name}</h1>
	<p>Email: {data.email}</p>
	<p>Created: {new Date(data.createdAt).toLocaleDateString()}</p>
</Doc>
```

## 📋 Props

| Prop        | Type                                                            | Required | Description                                 |
| ----------- | --------------------------------------------------------------- | -------- | ------------------------------------------- |
| `ref`       | `DocumentReference \| string`                                   | ✅       | Firestore document reference or path string |
| `startWith` | `DocumentData \| null`                                          | ❌       | Initial data to show while loading          |
| `children`  | `Snippet<[DocumentData \| null, DocumentReference, Firestore]>` | ✅       | Content to render with document data        |
| `loading`   | `Snippet<[]>`                                                   | ❌       | Custom loading content                      |
| `options`   | `DocumentOptions`                                               | ❌       | Document configuration options              |

## 🎯 Use Cases

### **Simple Document Display**

Display a single document with automatic updates:

```svelte
<script>
	import { Doc } from 'svelte-firekit';
</script>

<Doc ref="users/123" let:data let:ref let:firestore>
	{#if data}
		<div class="user-profile">
			<img src={data.photoURL} alt={data.displayName} />
			<h1>{data.displayName}</h1>
			<p>{data.email}</p>
			<p>Member since: {new Date(data.createdAt).toLocaleDateString()}</p>
		</div>
	{:else}
		<p>User not found</p>
	{/if}
</Doc>
```

### **Custom Loading State**

Show custom loading content while fetching data:

```svelte
<script>
	import { Doc } from 'svelte-firekit';
</script>

<Doc ref="users/123" let:data let:ref let:firestore>
	{#snippet loading()}
		<div class="loading-skeleton">
			<div class="avatar-skeleton"></div>
			<div class="name-skeleton"></div>
			<div class="email-skeleton"></div>
		</div>
	{/snippet}

	{#snippet default(data, ref, firestore)}
		{#if data}
			<div class="user-profile">
				<img src={data.photoURL} alt={data.displayName} />
				<h1>{data.displayName}</h1>
				<p>{data.email}</p>
			</div>
		{:else}
			<p>User not found</p>
		{/if}
	{/snippet}
</Doc>
```

### **Document with Initial Data**

Provide fallback data while loading:

```svelte
<script>
	import { Doc } from 'svelte-firekit';

	const initialUser = {
		name: 'Loading...',
		email: 'loading@example.com',
		createdAt: new Date()
	};
</script>

<Doc ref="users/123" startWith={initialUser} let:data let:ref let:firestore>
	<div class="user-card">
		<h2>{data.name}</h2>
		<p>{data.email}</p>
		<small>Created: {new Date(data.createdAt).toLocaleDateString()}</small>
	</div>
</Doc>
```

## 🔧 Slot Parameters

The `children` slot receives three parameters:

| Parameter   | Type                   | Description                        |
| ----------- | ---------------------- | ---------------------------------- |
| `data`      | `DocumentData \| null` | Document data or null if not found |
| `ref`       | `DocumentReference`    | Firestore document reference       |
| `firestore` | `Firestore`            | Firestore instance                 |

### **Using Slot Parameters**

```svelte
<script>
	import { Doc } from 'svelte-firekit';
	import type { DocumentData, DocumentReference, Firestore } from 'firebase/firestore';
</script>

<Doc ref="users/123" let:data let:ref let:firestore>
	{#snippet default(data: DocumentData | null, ref: DocumentReference, firestore: Firestore)}
		{#if data}
			<div class="user-info">
				<h1>{data.name}</h1>
				<p>Document ID: {ref.id}</p>
				<p>Collection: {ref.parent.id}</p>
				<p>Path: {ref.path}</p>
			</div>
		{:else}
			<p>Document not found</p>
		{/if}
	{/snippet}
</Doc>
```

## 🔧 Advanced Usage

### **Document Options**

Configure document behavior with options:

```svelte
<script>
	import { Doc } from 'svelte-firekit';

	const docOptions = {
		realtime: true,
		includeMetadata: true,
		source: 'cache' // 'default' | 'server' | 'cache'
	};
</script>

<Doc ref="users/123" options={docOptions} let:data let:ref let:firestore>
	{#if data}
		<div class="user-profile">
			<h1>{data.name}</h1>
			<p>Last updated: {data.updatedAt?.toDate().toLocaleString()}</p>
		</div>
	{/if}
</Doc>
```

### **Dynamic Document Paths**

Use reactive document paths:

```svelte
<script>
	import { Doc } from 'svelte-firekit';

	let userId = '123';

	function changeUser(newId) {
		userId = newId;
	}
</script>

<div class="user-selector">
	<button onclick={() => changeUser('123')}>User 1</button>
	<button onclick={() => changeUser('456')}>User 2</button>
	<button onclick={() => changeUser('789')}>User 3</button>
</div>

<Doc ref="users/{userId}" let:data let:ref let:firestore>
	{#if data}
		<div class="user-profile">
			<h1>{data.name}</h1>
			<p>{data.email}</p>
		</div>
	{:else}
		<p>Select a user to view profile</p>
	{/if}
</Doc>
```

### **Document with Error Handling**

Handle errors gracefully:

```svelte
<script>
	import { Doc } from 'svelte-firekit';
</script>

<Doc ref="users/123" let:data let:ref let:firestore let:error let:loading>
	{#if loading}
		<div class="loading">Loading user data...</div>
	{:else if error}
		<div class="error">
			<h3>Error loading user</h3>
			<p>{error.message}</p>
			<button onclick={() => window.location.reload()}> Retry </button>
		</div>
	{:else if data}
		<div class="user-profile">
			<h1>{data.name}</h1>
			<p>{data.email}</p>
		</div>
	{:else}
		<p>User not found</p>
	{/if}
</Doc>
```

## 🎨 Custom Styling

### **Loading State Styling**

Customize loading appearance:

```svelte
<style>
	:global(.doc-loading) {
		@apply flex min-h-screen items-center justify-center;
	}

	:global(.doc-spinner) {
		@apply mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900;
	}

	:global(.doc-loading-text) {
		@apply mt-2 text-gray-600;
	}
</style>
```

### **Error State Styling**

Style error states:

```svelte
<style>
	:global(.doc-error) {
		@apply flex min-h-screen items-center justify-center;
	}

	:global(.doc-error-content) {
		@apply text-center;
	}

	:global(.doc-error-title) {
		@apply mb-2 text-lg font-semibold text-red-500;
	}

	:global(.doc-error-message) {
		@apply mb-4 text-gray-600;
	}

	:global(.doc-error-button) {
		@apply rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600;
	}
</style>
```

## 🔍 Error Handling

### **Document Not Found**

Handle missing documents:

```svelte
<script>
	import { Doc } from 'svelte-firekit';
</script>

<Doc ref="users/nonexistent" let:data let:ref let:firestore>
	{#if data}
		<div class="user-profile">
			<h1>{data.name}</h1>
		</div>
	{:else}
		<div class="not-found">
			<h2>User Not Found</h2>
			<p>The requested user does not exist.</p>
			<a href="/users">Browse all users</a>
		</div>
	{/if}
</Doc>
```

### **Permission Errors**

Handle access denied scenarios:

```svelte
<script>
	import { Doc } from 'svelte-firekit';
</script>

<Doc ref="private/users/123" let:data let:ref let:firestore let:error>
	{#if error?.code === 'permission-denied'}
		<div class="permission-error">
			<h2>Access Denied</h2>
			<p>You don't have permission to view this user's data.</p>
			<button onclick={() => signIn()}>Sign In</button>
		</div>
	{:else if data}
		<div class="user-profile">
			<h1>{data.name}</h1>
		</div>
	{/if}
</Doc>
```

## 🔧 Performance Optimization

### **Conditional Loading**

Load documents only when needed:

```svelte
<script>
	import { Doc } from 'svelte-firekit';

	let shouldLoadUser = false;
	let userId = '123';
</script>

<button onclick={() => (shouldLoadUser = true)}> Load User Profile </button>

{#if shouldLoadUser}
	<Doc ref="users/{userId}" let:data let:ref let:firestore>
		{#if data}
			<div class="user-profile">
				<h1>{data.name}</h1>
				<p>{data.email}</p>
			</div>
		{/if}
	</Doc>
{/if}
```

### **Document Caching**

Use cache-first loading for better performance:

```svelte
<script>
	import { Doc } from 'svelte-firekit';

	const cacheOptions = {
		source: 'cache',
		realtime: false
	};
</script>

<Doc ref="users/123" options={cacheOptions} let:data let:ref let:firestore>
	{#if data}
		<div class="user-profile">
			<h1>{data.name}</h1>
			<p>{data.email}</p>
		</div>
	{/if}
</Doc>
```

## 🐛 Troubleshooting

### **Document Not Updating**

If the document doesn't update in real-time:

1. **Check realtime option** - Ensure `realtime: true` is set
2. **Verify Firestore rules** - Make sure read permissions are correct
3. **Check network connectivity** - Ensure Firebase connection is active

### **Component Not Rendering**

If the component doesn't render:

```svelte
<script>
	import { Doc } from 'svelte-firekit';

	// Debug document path
	let docPath = 'users/123';
	$effect(() => {
		console.log('Document path:', docPath);
	});
</script>

<Doc ref={docPath} let:data let:ref let:firestore>
	{#snippet default(data, ref, firestore)}
		<div class="debug">
			<p>Path: {docPath}</p>
			<p>Data: {JSON.stringify(data)}</p>
			<p>Ref: {ref?.path}</p>
		</div>
	{/snippet}
</Doc>
```

## 📚 Related Components

- [`Collection`](./collection.md) - Firestore collection subscription
- [`AuthGuard`](./auth-guard.md) - Route protection
- [`FirebaseApp`](./firebase-app.md) - Firebase initialization

## 🔗 API Reference

### **Component Props**

```typescript
interface DocProps {
	ref: DocumentReference | string;
	startWith?: DocumentData | null;
	children: Snippet<[DocumentData | null, DocumentReference, Firestore]>;
	loading?: Snippet<[]>;
	options?: DocumentOptions;
}
```

### **Slot Parameters**

```typescript
// children slot parameters
data: DocumentData | null; // Document data
ref: DocumentReference; // Document reference
firestore: Firestore; // Firestore instance
```

### **Document Options**

```typescript
interface DocumentOptions {
	realtime?: boolean;
	includeMetadata?: boolean;
	source?: 'default' | 'server' | 'cache';
}
```

---

**Next**: [Collection Component](./collection.md)
