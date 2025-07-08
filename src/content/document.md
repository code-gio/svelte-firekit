---
title: Document Service
description: Real-time Firestore document management with reactive state using Svelte 5 runes
---

# Document Service

The `firekitDoc` service provides real-time Firestore document subscriptions with reactive state management using Svelte 5 runes, offering automatic updates, error handling, and performance optimizations.

## Overview

The document service offers:

- Real-time document subscriptions with automatic updates
- Reactive state management using Svelte 5 runes
- One-time document fetching
- Error handling and retry mechanisms
- Performance monitoring and caching
- Type-safe document operations
- Metadata support and stale data detection

## Basic Usage

```typescript
import { firekitDoc, firekitDocOnce } from 'svelte-firekit';

// Real-time document subscription
const userDoc = firekitDoc<User>('users/123', {
	name: 'Loading...',
	email: ''
});

// One-time document fetch
const userData = firekitDocOnce<User>('users/123');
```

## Reactive State Management

### Basic Reactive State

```typescript
import { firekitDoc } from 'svelte-firekit';

// Create document subscription
const userDoc = firekitDoc<User>('users/123');

// Access reactive state using Svelte 5 runes
const userData = $derived(userDoc.data);
const isLoading = $derived(userDoc.loading);
const userError = $derived(userDoc.error);
const userExists = $derived(userDoc.exists);
const userId = $derived(userDoc.id);

// React to state changes
$effect(() => {
	if (isLoading) {
		console.log('Loading user data...');
	} else if (userError) {
		console.error('User error:', userError);
	} else if (userExists) {
		console.log('User data:', userData);
	} else {
		console.log('User does not exist');
	}
});
```

### Advanced Reactive State

```typescript
import { firekitDoc } from 'svelte-firekit';

// Document with advanced options
const postDoc = firekitDoc<Post>(
	'posts/456',
	{
		title: 'Loading...',
		content: ''
	},
	{
		realtime: true,
		includeMetadata: true,
		source: 'cache'
	}
);

// Access all reactive properties
const postData = $derived(postDoc.data);
const postLoading = $derived(postDoc.loading);
const postError = $derived(postDoc.error);
const postExists = $derived(postDoc.exists);
const postId = $derived(postDoc.id);
const postRef = $derived(postDoc.ref);
const postState = $derived(postDoc.state);
const postComputedState = $derived(postDoc.computedState);

// React to computed state
$effect(() => {
	console.log('Document computed state:', {
		isValid: postComputedState.isValid,
		canRefresh: postComputedState.canRefresh,
		hasPendingOperations: postComputedState.hasPendingOperations,
		isStale: postComputedState.isStale,
		status: postComputedState.status
	});
});
```

## Document Operations

### Refresh Document

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>('users/123');

// Refresh document data
async function refreshUser() {
	try {
		await userDoc.refresh();
		console.log('User data refreshed');
	} catch (error) {
		console.error('Failed to refresh user:', error);
	}
}

// Refresh if stale (older than 5 minutes)
async function refreshIfStale() {
	await userDoc.refreshIfStale(300000); // 5 minutes
}
```

### Get from Server

```typescript
import { firekitDoc } from 'svelte-firekit';

const postDoc = firekitDoc<Post>('posts/456');

// Force fetch from server
async function getLatestData() {
	try {
		const data = await postDoc.getFromServer();
		console.log('Latest data from server:', data);
		return data;
	} catch (error) {
		console.error('Failed to get from server:', error);
		return null;
	}
}
```

### Retry Operations

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>('users/123');

// Retry if needed (for retryable errors)
async function retryIfNeeded() {
	if (userDoc.error?.isRetryable()) {
		await userDoc.retryIfNeeded();
	}
}

// React to retryable errors
$effect(() => {
	if (userDoc.error && userDoc.error.isRetryable()) {
		console.log('Retryable error detected, attempting retry...');
		retryIfNeeded();
	}
});
```

### Ensure Ready State

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>('users/123');

// Ensure document is ready before operations
async function performOperation() {
	try {
		const userData = await userDoc.ensureReady();
		if (userData) {
			// Perform operation with user data
			console.log('User ready for operation:', userData);
		}
	} catch (error) {
		console.error('Document not ready:', error);
	}
}
```

## Real-time Mode Control

### Toggle Real-time Updates

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>('users/123');

// Disable real-time updates
userDoc.setRealtimeMode(false);

// Re-enable real-time updates
userDoc.setRealtimeMode(true);

// React to real-time mode changes
$effect(() => {
	if (userDoc.loading) {
		console.log('Document is loading...');
	} else {
		console.log('Document is ready');
	}
});
```

## Stale Data Detection

### Check if Data is Stale

```typescript
import { firekitDoc } from 'svelte-firekit';

const postDoc = firekitDoc<Post>('posts/456');

// Check if data is stale (older than 10 minutes)
const isStale = $derived(postDoc.isStale(600000)); // 10 minutes

// React to stale data
$effect(() => {
	if (isStale) {
		console.log('Document data is stale, consider refreshing');
	}
});

// Auto-refresh stale data
async function autoRefreshStale() {
	if (postDoc.isStale(300000)) {
		// 5 minutes
		await postDoc.refresh();
	}
}
```

## Error Handling

### Basic Error Handling

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>('users/123');

// React to errors
$effect(() => {
	if (userDoc.error) {
		console.error('Document error:', userDoc.error);

		if (userDoc.error.isRetryable()) {
			// Retry the operation
			userDoc.retryIfNeeded();
		}
	}
});
```

### Advanced Error Handling

```typescript
import { firekitDoc } from 'svelte-firekit';

const postDoc = firekitDoc<Post>('posts/456');

// Handle different error types
$effect(() => {
	if (postDoc.error) {
		switch (postDoc.error.code) {
			case 'permission-denied':
				console.error('Permission denied - check security rules');
				break;
			case 'not-found':
				console.error('Document not found');
				break;
			case 'unavailable':
				console.error('Service unavailable - retrying...');
				postDoc.retryIfNeeded();
				break;
			default:
				console.error('Unknown error:', postDoc.error);
		}
	}
});
```

## One-time Document Fetching

### Basic One-time Fetch

```typescript
import { firekitDocOnce } from 'svelte-firekit';

// Fetch document once (no real-time updates)
const userData = firekitDocOnce<User>('users/123');

// Access data
const user = $derived(userData.data);
const loading = $derived(userData.loading);
const error = $derived(userData.error);
const exists = $derived(userData.exists);
```

### One-time Fetch with Initial Data

```typescript
import { firekitDocOnce } from 'svelte-firekit';

// Fetch with initial data
const postData = firekitDocOnce<Post>('posts/456', {
	title: 'Loading...',
	content: 'Loading content...',
	author: 'Unknown'
});

// React to data changes
$effect(() => {
	if (postData.data) {
		console.log('Post loaded:', postData.data.title);
	}
});
```

## Document with Metadata

### Fetch Document with Metadata

```typescript
import { firekitDocWithMetadata } from 'svelte-firekit';

// Fetch document with metadata
const userDocWithMeta = firekitDocWithMetadata<User>('users/123');

// Access metadata
const userData = $derived(userDocWithMeta.data);
const metadata = $derived(userDocWithMeta.metadata);

// React to metadata changes
$effect(() => {
	if (metadata) {
		console.log('Document metadata:', {
			hasPendingWrites: metadata.hasPendingWrites,
			fromCache: metadata.fromCache,
			serverTimestamp: metadata.serverTimestamp
		});
	}
});
```

## Svelte Component Integration

### Basic Document Component

```svelte
<script lang="ts">
	import { firekitDoc } from 'svelte-firekit';

	interface User {
		id: string;
		name: string;
		email: string;
		avatar?: string;
		role: string;
		createdAt: Date;
	}

	// Create document subscription
	const userDoc = firekitDoc<User>('users/123', {
		name: 'Loading...',
		email: 'loading@example.com',
		role: 'user'
	});

	// Reactive state
	const userData = $derived(userDoc.data);
	const isLoading = $derived(userDoc.loading);
	const userError = $derived(userDoc.error);
	const userExists = $derived(userDoc.exists);
</script>

{#if isLoading}
	<div class="loading">
		<p>Loading user data...</p>
	</div>
{:else if userError}
	<div class="error">
		<p>Error loading user: {userError.message}</p>
		<button onclick={() => userDoc.retryIfNeeded()}>Retry</button>
	</div>
{:else if !userExists}
	<div class="not-found">
		<p>User not found</p>
	</div>
{:else if userData}
	<div class="user-profile">
		<div class="profile-header">
			{#if userData.avatar}
				<img src={userData.avatar} alt="Avatar" class="avatar" />
			{:else}
				<div class="avatar-placeholder">
					{userData.name[0]}
				</div>
			{/if}

			<div class="profile-info">
				<h1>{userData.name}</h1>
				<p class="email">{userData.email}</p>
				<p class="role">Role: {userData.role}</p>
				<p class="created">
					Member since {new Date(userData.createdAt).toLocaleDateString()}
				</p>
			</div>
		</div>

		<div class="profile-actions">
			<button onclick={() => userDoc.refresh()}>Refresh</button>
			<button onclick={() => userDoc.getFromServer()}>Get Latest</button>
		</div>
	</div>
{/if}

<style>
	.loading,
	.error,
	.not-found {
		text-align: center;
		padding: 2rem;
	}

	.error {
		color: #dc3545;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 8px;
	}

	.user-profile {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem;
	}

	.profile-header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.avatar,
	.avatar-placeholder {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		object-fit: cover;
	}

	.avatar-placeholder {
		background: #007bff;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		font-weight: bold;
	}

	.profile-info h1 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.email,
	.role,
	.created {
		margin: 0.25rem 0;
		color: #666;
	}

	.profile-actions {
		display: flex;
		gap: 1rem;
	}

	button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		background: #007bff;
		color: white;
		cursor: pointer;
	}

	button:hover {
		background: #0056b3;
	}
</style>
```

### Advanced Document Component with Status

```svelte
<script lang="ts">
	import { firekitDoc } from 'svelte-firekit';

	interface Post {
		id: string;
		title: string;
		content: string;
		author: string;
		published: boolean;
		createdAt: Date;
		updatedAt: Date;
		tags: string[];
	}

	// Document with advanced options
	const postDoc = firekitDoc<Post>(
		'posts/456',
		{
			title: 'Loading...',
			content: 'Loading content...',
			author: 'Unknown',
			published: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			tags: []
		},
		{
			realtime: true,
			includeMetadata: true
		}
	);

	// Reactive state
	const postData = $derived(postDoc.data);
	const isLoading = $derived(postDoc.loading);
	const postError = $derived(postDoc.error);
	const postExists = $derived(postDoc.exists);
	const computedState = $derived(postDoc.computedState);

	// Status indicators
	const isStale = $derived(postDoc.isStale(300000)); // 5 minutes
	const canRefresh = $derived(postDoc.canRefresh);
	const hasPendingOperations = $derived(postDoc.hasPendingOperations);

	// Actions
	async function refreshPost() {
		await postDoc.refresh();
	}

	async function getLatestFromServer() {
		await postDoc.getFromServer();
	}

	async function retryIfNeeded() {
		await postDoc.retryIfNeeded();
	}
</script>

<div class="post-document">
	<header class="document-header">
		<h1>Post Document</h1>
		<div class="status-indicators">
			{#if isLoading}
				<span class="status loading">Loading</span>
			{:else if postError}
				<span class="status error">Error</span>
			{:else if !postExists}
				<span class="status not-found">Not Found</span>
			{:else}
				<span class="status success">Loaded</span>
			{/if}

			{#if isStale}
				<span class="status stale">Stale</span>
			{/if}

			{#if hasPendingOperations}
				<span class="status pending">Pending</span>
			{/if}
		</div>
	</header>

	{#if isLoading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading post data...</p>
		</div>
	{:else if postError}
		<div class="error">
			<h2>Error Loading Post</h2>
			<p>{postError.message}</p>
			<div class="error-actions">
				<button onclick={retryIfNeeded}>Retry</button>
				<button onclick={refreshPost}>Refresh</button>
			</div>
		</div>
	{:else if !postExists}
		<div class="not-found">
			<h2>Post Not Found</h2>
			<p>The requested post does not exist.</p>
		</div>
	{:else if postData}
		<main class="document-content">
			<article class="post">
				<header class="post-header">
					<h2>{postData.title}</h2>
					<div class="post-meta">
						<span class="author">By {postData.author}</span>
						<span class="date">
							{new Date(postData.createdAt).toLocaleDateString()}
						</span>
						<span class="status {postData.published ? 'published' : 'draft'}">
							{postData.published ? 'Published' : 'Draft'}
						</span>
					</div>
					{#if postData.tags.length > 0}
						<div class="tags">
							{#each postData.tags as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
					{/if}
				</header>

				<div class="post-content">
					{postData.content}
				</div>

				<footer class="post-footer">
					<p class="updated">
						Last updated: {new Date(postData.updatedAt).toLocaleString()}
					</p>
				</footer>
			</article>

			<aside class="document-actions">
				<h3>Document Actions</h3>
				<div class="action-buttons">
					<button disabled={!canRefresh} onclick={refreshPost}> Refresh </button>
					<button onclick={getLatestFromServer}> Get Latest </button>
					<button disabled={!computedState.canRetry} onclick={retryIfNeeded}> Retry </button>
				</div>

				<div class="document-info">
					<h4>Document Information</h4>
					<ul>
						<li><strong>ID:</strong> {postDoc.id}</li>
						<li><strong>Path:</strong> {postDoc.ref?.path}</li>
						<li><strong>Valid:</strong> {computedState.isValid ? 'Yes' : 'No'}</li>
						<li><strong>Can Refresh:</strong> {canRefresh ? 'Yes' : 'No'}</li>
						<li><strong>Pending Operations:</strong> {hasPendingOperations ? 'Yes' : 'No'}</li>
						<li><strong>Stale:</strong> {isStale ? 'Yes' : 'No'}</li>
					</ul>
				</div>
			</aside>
		</main>
	{/if}
</div>

<style>
	.post-document {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.document-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #eee;
	}

	.status-indicators {
		display: flex;
		gap: 0.5rem;
	}

	.status {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.status.loading {
		background: #ffc107;
		color: #333;
	}

	.status.error {
		background: #dc3545;
		color: white;
	}

	.status.not-found {
		background: #6c757d;
		color: white;
	}

	.status.success {
		background: #28a745;
		color: white;
	}

	.status.stale {
		background: #fd7e14;
		color: white;
	}

	.status.pending {
		background: #17a2b8;
		color: white;
	}

	.loading {
		text-align: center;
		padding: 4rem 2rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error,
	.not-found {
		text-align: center;
		padding: 2rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.error {
		color: #dc3545;
		border: 1px solid #f5c6cb;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1rem;
	}

	.document-content {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 2rem;
	}

	.post {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.post-header h2 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.post-meta {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		color: #666;
	}

	.status.published {
		color: #28a745;
		font-weight: 500;
	}

	.status.draft {
		color: #ffc107;
		font-weight: 500;
	}

	.tags {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.tag {
		background: #e9ecef;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		color: #495057;
	}

	.post-content {
		line-height: 1.6;
		color: #333;
		margin: 2rem 0;
	}

	.post-footer {
		border-top: 1px solid #eee;
		padding-top: 1rem;
		margin-top: 2rem;
	}

	.updated {
		font-size: 0.9rem;
		color: #666;
		margin: 0;
	}

	.document-actions {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		height: fit-content;
	}

	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.document-info h4 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.document-info ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.document-info li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #dee2e6;
		font-size: 0.9rem;
	}

	.document-info li:last-child {
		border-bottom: none;
	}

	button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		background: #007bff;
		color: white;
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		background: #0056b3;
	}

	button:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
</style>
```

## Type Definitions

### Document Options

```typescript
interface DocumentOptions {
	realtime?: boolean;
	includeMetadata?: boolean;
	source?: 'default' | 'cache' | 'server';
}
```

### Document State

```typescript
interface DocumentState<T> {
	data: T | null;
	loading: boolean;
	error: DocumentError | null;
	exists: boolean;
}
```

### Computed State

```typescript
interface ComputedDocumentState<T> {
	data: T | null;
	loading: boolean;
	error: DocumentError | null;
	exists: boolean;
	id: string;
	isEmpty: boolean;
	isReady: boolean;
	hasData: boolean;
	canRetry: boolean;
	isStale: boolean;
	status: string;
}
```

## Best Practices

### 1. Use Type Safety

```typescript
// ✅ Good - Define interfaces
interface User {
	id: string;
	name: string;
	email: string;
}

const userDoc = firekitDoc<User>('users/123');

// ❌ Avoid - Using any
const userDoc = firekitDoc('users/123');
```

### 2. Handle Loading States

```svelte
{#if doc.loading}
	<LoadingSpinner />
{:else if doc.error}
	<ErrorMessage error={doc.error} />
{:else if doc.exists}
	<DocumentContent data={doc.data} />
{:else}
	<NotFoundMessage />
{/if}
```

### 3. Use Initial Data

```typescript
// ✅ Good - Provide initial data
const userDoc = firekitDoc<User>('users/123', {
	name: 'Loading...',
	email: 'loading@example.com'
});

// ❌ Avoid - No initial data
const userDoc = firekitDoc<User>('users/123');
```

### 4. Handle Errors Gracefully

```typescript
$effect(() => {
	if (doc.error) {
		if (doc.error.isRetryable()) {
			doc.retryIfNeeded();
		} else {
			showPermanentError(doc.error);
		}
	}
});
```

### 5. Clean Up Resources

```typescript
import { onDestroy } from 'svelte';

const userDoc = firekitDoc<User>('users/123');

onDestroy(() => {
	userDoc.dispose();
});
```

## API Reference

### Properties

- `data` - Document data (reactive)
- `loading` - Loading state (reactive)
- `error` - Current error (reactive)
- `exists` - Document exists (reactive)
- `id` - Document ID (reactive)
- `ref` - Firestore document reference
- `state` - Complete state object (reactive)
- `computedState` - Computed state with additional properties (reactive)
- `isValid` - Whether document is in valid state (reactive)
- `canRefresh` - Whether document can be refreshed (reactive)
- `hasPendingOperations` - Whether document has pending operations (reactive)

### Methods

- `refresh()` - Refresh document data
- `getFromServer()` - Fetch data from server
- `retryIfNeeded()` - Retry operation if needed
- `ensureReady()` - Ensure document is ready
- `setRealtimeMode(realtime)` - Toggle real-time mode
- `isStale(maxAge)` - Check if data is stale
- `dispose()` - Clean up resources

### Factory Functions

- `firekitDoc(ref, startWith?, options?)` - Create real-time document subscription
- `firekitDocOnce(ref, startWith?)` - Create one-time document fetch
- `firekitDocWithMetadata(ref, startWith?)` - Create document with metadata

## Next Steps

- [Collection Service](/docs/collection) - Firestore collection management
- [Mutations Service](/docs/mutations) - Document mutations and batch operations
- [Storage Service](/docs/storage) - File upload/download
- [Presence Service](/docs/presence) - User online/offline tracking
- [Analytics Service](/docs/analytics) - Event tracking
