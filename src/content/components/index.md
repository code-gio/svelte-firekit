---
title: Components
description: Reusable Svelte components for Firebase integration
---

# Components

Svelte Firekit provides a comprehensive set of reusable components that make Firebase integration seamless and intuitive. These components are built with Svelte 5 runes for optimal performance and reactivity.

## 🧩 Component Categories

### 🔥 Firebase Core Components

- [`FirebaseApp`](./firebase-app.md) - Firebase initialization and context provider
- [`AuthGuard`](./auth-guard.md) - Route protection and authentication guards
- [`SignedIn`](./signed-in.md) - Conditional rendering for authenticated users
- [`SignedOut`](./signed-out.md) - Conditional rendering for unauthenticated users
- [`CustomGuard`](./custom-guard.md) - Custom authentication guards

### 📄 Data Components

- [`Doc`](./doc.md) - Real-time Firestore document subscription
- [`Collection`](./collection.md) - Real-time Firestore collection subscription
- [`Node`](./node.md) - Realtime Database node subscription
- [`NodeList`](./node-list.md) - Realtime Database list subscription

### 📁 Storage Components

- [`StorageList`](./storage-list.md) - Firebase Storage directory listing
- [`DownloadURL`](./download-url.md) - File download URL management
- [`UploadTask`](./upload-task.md) - File upload with progress tracking

### 🧭 Navigation Components

- [`AppSidebar`](./nav/app-sidebar.md) - Application sidebar navigation
- [`SiteHeader`](./nav/site-header.md) - Site header with navigation
- [`AutoBreadcrumb`](./nav/auto-breadcrumb.md) - Automatic breadcrumb generation
- [`DarkModeToggle`](./nav/dark-mode-toggle.md) - Dark mode toggle component

### 📚 Documentation Components

- [`DocRenderer`](./docs/doc-renderer.md) - Markdown document renderer
- [`TableOfContents`](./docs/table-of-contents.md) - Document table of contents
- [`DocHeader`](./docs/doc-header.md) - Document header component

## 🚀 Quick Start

### 1. Initialize Firebase

```svelte
<script>
	import { FirebaseApp } from 'svelte-firekit';
</script>

<FirebaseApp>
	<!-- Your app content -->
</FirebaseApp>
```

### 2. Protect Routes

```svelte
<script>
	import { AuthGuard } from 'svelte-firekit';
</script>

<AuthGuard requireAuth={true} redirectTo="/login">
	<h1>Protected Content</h1>
</AuthGuard>
```

### 3. Display Data

```svelte
<script>
	import { Doc, Collection } from 'svelte-firekit';
</script>

<!-- Single document -->
<Doc ref="users/123" let:data let:ref let:firestore>
	<h1>{data.name}</h1>
	<p>{data.email}</p>
</Doc>

<!-- Collection of documents -->
<Collection ref="posts" let:data let:ref let:firestore let:count>
	<h1>Posts ({count})</h1>
	{#each data as post}
		<article>
			<h2>{post.title}</h2>
			<p>{post.content}</p>
		</article>
	{/each}
</Collection>
```

## 🎯 Key Features

### **Reactive by Default**

All components automatically update when underlying data changes, providing real-time synchronization with Firebase.

### **Type Safety**

Full TypeScript support with proper type inference for your data structures.

### **SSR Compatible**

Components work seamlessly with server-side rendering, gracefully handling hydration.

### **Error Handling**

Built-in error states and loading indicators for robust user experience.

### **Performance Optimized**

Uses Svelte 5 runes for optimal reactivity and minimal re-renders.

### **Flexible Rendering**

Slot-based rendering allows complete control over UI presentation.

## 📖 Usage Patterns

### **Conditional Rendering**

```svelte
<script>
	import { SignedIn, SignedOut } from 'svelte-firekit';
</script>

<SignedIn>
	<h1>Welcome back!</h1>
	<!-- Authenticated user content -->
</SignedIn>

<SignedOut>
	<h1>Please sign in</h1>
	<!-- Sign-in form -->
</SignedOut>
```

### **Loading States**

```svelte
<script>
	import { Doc } from 'svelte-firekit';
</script>

<Doc ref="users/123" let:data let:loading let:error>
	{#if loading}
		<div class="loading-spinner">Loading...</div>
	{:else if error}
		<div class="error">Error: {error.message}</div>
	{:else if data}
		<h1>{data.name}</h1>
	{/if}
</Doc>
```

### **Custom Loading Components**

```svelte
<script>
	import { Collection } from 'svelte-firekit';
</script>

<Collection ref="posts" let:data let:count>
	{#snippet loading()}
		<div class="custom-loader">
			<Spinner />
			<p>Loading posts...</p>
		</div>
	{/snippet}

	{#snippet children(data, ref, firestore, count)}
		<h1>Posts ({count})</h1>
		{#each data as post}
			<PostCard {post} />
		{/each}
	{/snippet}
</Collection>
```

## 🔧 Component Props

All components follow consistent prop patterns:

- **`ref`** - Firebase reference (path string or reference object)
- **`children`** - Slot content to render with data
- **`loading`** - Optional loading slot
- **`startWith`** - Initial data while loading
- **`options`** - Component-specific configuration

## 🎨 Styling

Components are unstyled by default, giving you complete control over appearance:

```svelte
<style>
	/* Custom styling for your components */
	:global(.firekit-loading) {
		@apply flex items-center justify-center p-4;
	}

	:global(.firekit-error) {
		@apply rounded border border-red-200 bg-red-50 p-4 text-red-700;
	}
</style>
```

## 🔍 Advanced Usage

### **Custom Guards**

```svelte
<script>
	import { CustomGuard } from 'svelte-firekit';

	function checkUserRole(user) {
		return user?.role === 'admin';
	}
</script>

<CustomGuard check={checkUserRole} redirectTo="/unauthorized">
	<h1>Admin Dashboard</h1>
</CustomGuard>
```

### **File Upload with Progress**

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedFile;
</script>

<UploadTask path="uploads/file.jpg" file={selectedFile} let:progress let:completed let:error>
	{#if !completed}
		<div class="progress-bar">
			<div class="progress" style="width: {progress}%"></div>
		</div>
		<p>{progress}% uploaded</p>
	{:else}
		<p>Upload complete!</p>
	{/if}
</UploadTask>
```

## 📚 Next Steps

Explore the individual component documentation to learn about specific features, props, and advanced usage patterns:

- [Firebase Core Components](./firebase-app.md)
- [Data Components](./doc.md)
- [Storage Components](./storage-list.md)
- [Navigation Components](./nav/app-sidebar.md)
- [Documentation Components](./docs/doc-renderer.md)

---

**Built with ❤️ for the Svelte community**
