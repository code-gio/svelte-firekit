# Svelte Firebase Library

A comprehensive, production-ready Firebase integration library for Svelte 5 applications. Built with reactive state management using Svelte 5 runes, providing a complete solution for authentication, Firestore, Storage, Realtime Database, Analytics, and more.

## 🚀 Features

- **Complete Firebase Integration** - All Firebase products supported
- **Svelte 5 Runes** - Reactive state management with optimal performance
- **TypeScript First** - Full type safety and excellent developer experience
- **SSR Compatible** - Server-side rendering support
- **Real-time Updates** - Live data synchronization across all services
- **Authentication System** - Complete auth solution with multiple providers
- **Advanced Querying** - Complex Firestore queries with type safety
- **File Management** - Storage upload/download with progress tracking
- **Presence System** - User online/offline tracking with geolocation
- **Analytics Integration** - Comprehensive event tracking
- **Error Handling** - Robust error management with retry mechanisms
- **Performance Optimized** - Persistent cache, memory management, and optimizations

## 📦 Installation

```bash
npm install svelte-firekit firebase
```

## 🔧 Quick Setup

### 1. Environment Variables

Create a `.env` file with your Firebase configuration:

```dotenv
PUBLIC_FIREBASE_API_KEY=your_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
PUBLIC_FIREBASE_APP_ID=your_app_id
PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Initialize Firebase

```svelte
<script>
	import { FirebaseApp } from 'svelte-firekit';
</script>

<FirebaseApp>
	<!-- Your app content -->
</FirebaseApp>
```

### 3. Basic Usage

```svelte
<script>
	import { firekitUser, firekitCollection, firekitDoc } from 'svelte-firekit';

	// Reactive user state
	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);

	// Reactive document
	const userDoc = firekitDoc('users/123');

	// Reactive collection
	const posts = firekitCollection('posts', [
		where('published', '==', true),
		orderBy('createdAt', 'desc'),
		limit(10)
	]);
</script>

{#if isAuthenticated}
	<h1>Welcome, {user?.displayName}!</h1>

	{#if userDoc.loading}
		<p>Loading user data...</p>
	{:else if userDoc.data}
		<p>Email: {userDoc.data.email}</p>
	{/if}

	<h2>Recent Posts</h2>
	{#each posts.data as post}
		<article>
			<h3>{post.title}</h3>
			<p>{post.content}</p>
		</article>
	{/each}
{/if}
```

## 📚 Core Services

### Authentication

```typescript
import { firekitAuth, firekitUser } from 'svelte-firekit';

// Sign in methods
await firekitAuth.signInWithEmail('user@example.com', 'password');
await firekitAuth.signInWithGoogle();
await firekitAuth.signInWithFacebook();
await firekitAuth.signInWithApple();

// User registration
await firekitAuth.registerWithEmail('user@example.com', 'password', 'John Doe');

// Reactive user state
const user = $derived(firekitUser.user);
const isAuthenticated = $derived(firekitUser.isAuthenticated);
const isEmailVerified = $derived(firekitUser.isEmailVerified);
```

### Firestore Documents

```typescript
import { firekitDoc, firekitDocOnce } from 'svelte-firekit';

// Real-time document subscription
const userDoc = firekitDoc<User>('users/123', {
	name: 'Loading...',
	email: ''
});

// One-time document fetch
const userData = firekitDocOnce<User>('users/123');

// Access reactive state
const isLoading = $derived(userDoc.loading);
const userData = $derived(userDoc.data);
const userError = $derived(userDoc.error);

$effect(() => {
	if (isLoading) console.log('Loading...');
	if (userData) console.log('User:', userData);
	if (userError) console.error('Error:', userError);
});
```

### Firestore Collections

```typescript
import { firekitCollection, where, orderBy, limit } from 'svelte-firekit';

// Simple collection
const users = firekitCollection<User>('users');

// With query constraints
const activeUsers = firekitCollection<User>('users', [
	where('active', '==', true),
	orderBy('name'),
	limit(10)
]);

// Advanced options
const paginatedUsers = firekitCollection<User>('users', {
	pagination: { enabled: true, pageSize: 20 },
	cache: { enabled: true, ttl: 300000 }
});

// Access reactive state
const usersData = $derived(users.data);
const usersLoading = $derived(users.loading);
const usersError = $derived(users.error);

$effect(() => {
	console.log('Users:', usersData);
	console.log('Loading:', usersLoading);
	console.log('Error:', usersError);
});
```

### Document Mutations

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Create document
const result = await firekitDocMutations.add(
	'users',
	{
		name: 'John Doe',
		email: 'john@example.com'
	},
	{
		timestamps: true,
		validate: true
	}
);

// Update document
await firekitDocMutations.update('users/123', {
	name: 'Jane Doe'
});

// Delete document
await firekitDocMutations.delete('users/123');

// Batch operations
const batchResult = await firekitDocMutations.batch([
	{ type: 'create', path: 'users', data: userData },
	{ type: 'update', path: 'profiles/123', data: profileUpdate }
]);
```

### Storage Management

```typescript
import { firekitDownloadUrl, firekitUploadTask, firekitStorageList } from 'svelte-firekit';

// Download URL
const imageUrl = firekitDownloadUrl('images/photo.jpg');
const downloadUrl = $derived(imageUrl.url);

// File upload with progress
const upload = firekitUploadTask('uploads/file.pdf', file);
const uploadProgress = $derived(upload.progress);
const uploadCompleted = $derived(upload.completed);
const uploadDownloadUrl = $derived(upload.downloadURL);

$effect(() => {
	if (downloadUrl) console.log('Image URL:', downloadUrl);
	console.log('Upload progress:', uploadProgress);
	if (uploadCompleted) console.log('Download URL:', uploadDownloadUrl);
});

// Storage listing
const files = firekitStorageList('uploads');
const fileItems = $derived(files.items);
const filePrefixes = $derived(files.prefixes);

$effect(() => {
	console.log('Files:', fileItems);
	console.log('Folders:', filePrefixes);
});
```

### Realtime Database

```typescript
import { firekitRealtimeDB, firekitRealtimeList } from 'svelte-firekit';

// Single value
const userStatus = firekitRealtimeDB<{ online: boolean }>('users/123/status');

// List data
const messages = firekitRealtimeList<Message>('messages');

// Access data
const statusData = $derived(userStatus.data);
const messagesList = $derived(messages.list);

$effect(() => {
	console.log('Status:', statusData);
	console.log('Messages:', messagesList);
});

// Update data
await userStatus.set({ online: true });
await messages.push({ text: 'Hello', userId: '123' });
```

### Presence System

```typescript
import { firekitPresence } from 'svelte-firekit';

// Initialize presence
await firekitPresence.initialize(user, {
	geolocation: {
		enabled: true,
		type: 'browser',
		requireConsent: true
	}
});

// Set presence status
await firekitPresence.setPresence('online');

// Access reactive state
const presenceStatus = $derived(firekitPresence.status);
const presenceLocation = $derived(firekitPresence.location);
const presenceSessions = $derived(firekitPresence.sessions);
```

### Analytics

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Track custom events
firekitAnalytics.trackEvent('button_click', {
	button_name: 'signup',
	page_location: '/home'
});

// Track purchases
firekitAnalytics.trackPurchase({
	transaction_id: 'T12345',
	value: 29.99,
	currency: 'USD',
	items: [{ item_id: 'prod_123', item_name: 'Premium Plan' }]
});

// Set user properties
firekitAnalytics.setUserProperties({
	user_type: 'premium',
	subscription_plan: 'pro'
});
```

## 🧩 Components

### Authentication Components

```svelte
<script>
	import { AuthGuard, SignedIn, SignedOut } from 'svelte-firekit';
</script>

<!-- Route protection -->
<AuthGuard requireAuth={true} redirectTo="/login">
	<h1>Protected Content</h1>
</AuthGuard>

<!-- Conditional rendering -->
<SignedIn>
	<h1>Welcome back!</h1>
</SignedIn>

<SignedOut>
	<h1>Please sign in</h1>
</SignedOut>
```

### Data Components

```svelte
<script>
	import { Doc, Collection } from 'svelte-firekit';
</script>

<!-- Document component -->
<Doc ref="users/123" let:data let:ref let:firestore>
	<h1>{data.name}</h1>
	<p>{data.email}</p>
</Doc>

<!-- Collection component -->
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

### Storage Components

```svelte
<script>
	import { StorageList, DownloadURL, UploadTask } from 'svelte-firekit';
</script>

<!-- Storage listing -->
<StorageList path="uploads" let:items let:prefixes>
	<h2>Files</h2>
	{#each items as item}
		<p>{item.name}</p>
	{/each}

	<h2>Folders</h2>
	{#each prefixes as prefix}
		<p>{prefix.name}</p>
	{/each}
</StorageList>

<!-- Download URL -->
<DownloadURL path="images/photo.jpg" let:url let:loading let:error>
	{#if loading}
		<p>Loading image...</p>
	{:else if url}
		<img src={url} alt="Photo" />
	{:else if error}
		<p>Error: {error.message}</p>
	{/if}
</DownloadURL>

<!-- Upload with progress -->
<UploadTask path="uploads/file.pdf" file={selectedFile} let:progress let:completed let:error>
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

## 🎯 Best Practices

### 1. Use Reactive State

```typescript
// ✅ Good - Reactive state
const user = $derived(firekitUser.user);
const isAuthenticated = $derived(firekitUser.isAuthenticated);

// ❌ Avoid - Direct service calls in templates
const user = firekitUser.getCurrentUser();
```

### 2. Handle Loading States

```svelte
{#if userDoc.loading}
	<LoadingSpinner />
{:else if userDoc.error}
	<ErrorMessage error={userDoc.error} />
{:else if userDoc.data}
	<UserProfile user={userDoc.data} />
{/if}
```

### 3. Clean Up Subscriptions

```typescript
import { onDestroy } from 'svelte';

const userDoc = firekitDoc('users/123');

onDestroy(() => {
	userDoc.dispose();
});
```

### 4. Use Type Safety

```typescript
interface User {
	id: string;
	name: string;
	email: string;
	active: boolean;
}

const userDoc = firekitDoc<User>('users/123');
const users = firekitCollection<User>('users');
```

### 5. Optimize Queries

```typescript
// ✅ Good - Specific queries
const activeUsers = firekitCollection('users', where('active', '==', true), limit(10));

// ❌ Avoid - Fetching all data
const allUsers = firekitCollection('users');
```

## 📚 Documentation

For complete documentation, examples, and API reference, visit:

**[https://sveltefirekit.com](https://sveltefirekit.com)**

### Key Sections:

- [Installation Guide](https://sveltefirekit.com/installation) - Complete setup guide
- [Authentication](https://sveltefirekit.com/auth) - User authentication and management
- [Firestore Collections](https://sveltefirekit.com/collections) - Real-time data management
- [Document Operations](https://sveltefirekit.com/documents) - Individual document handling
- [File Storage](https://sveltefirekit.com/storage) - File upload and management
- [Realtime Database](https://sveltefirekit.com/realtime) - Real-time data synchronization
- [Analytics](https://sveltefirekit.com/analytics) - User and event tracking
- [Components](https://sveltefirekit.com/components) - Pre-built Svelte components
- [Presence System](https://sveltefirekit.com/presence) - User online/offline tracking

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- [Documentation](https://sveltefirekit.com)
- [GitHub Issues](https://github.com/code-gio/svelte-firekit/issues)
- [Discussions](https://github.com/code-gio/svelte-firekit/discussions)

---

**Built with ❤️ for the Svelte community**