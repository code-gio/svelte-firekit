---
title: Document Service
description: Real-time Firestore document subscriptions with reactive state management and advanced operations
---

# Document Service

The `firekitDoc` service provides real-time Firestore document subscriptions with reactive state management, automatic updates, and advanced document operations using Svelte 5 runes.

## Overview

The document service provides:

- Real-time document subscriptions
- Reactive state management with Svelte 5 runes
- Document operations (refresh, retry, ensure ready)
- Real-time mode control
- Stale data detection
- Error handling and retry mechanisms
- One-time document fetching
- Document with metadata support

## Quick Start

```svelte
<script>
	import { firekitDoc } from 'svelte-firekit';

	// Real-time document subscription
	const userDoc = firekitDoc<User>('users/123', {
		name: 'Loading...',
		email: ''
	});

	// Reactive document state
	const userData = $derived(userDoc.data);
	const isLoading = $derived(userDoc.loading);
	const error = $derived(userDoc.error);

	// Watch for document changes
	$effect(() => {
		if (userData) {
			console.log('User data updated:', userData.name);
		}
	});
</script>

{#if isLoading}
	<div>Loading user...</div>
{:else if error}
	<div>Error: {error.message}</div>
{:else if userData}
	<div>
		<h2>{userData.name}</h2>
		<p>Email: {userData.email}</p>
	</div>
{/if}
```

## Basic Document Usage

### Simple Document Subscription

```typescript
import { firekitDoc } from 'svelte-firekit';

// Basic document subscription
const userDoc = firekitDoc<User>('users/123');

// Access reactive state
const userData = $derived(userDoc.data);
const isLoading = $derived(userDoc.loading);
const error = $derived(userDoc.error);
```

### With Default Values

```typescript
import { firekitDoc } from 'svelte-firekit';

// Document with default values
const userDoc = firekitDoc<User>('users/123', {
	name: 'Loading...',
	email: '',
	avatar: '/default-avatar.png'
});

// Document will show default values while loading
const userData = $derived(userDoc.data);
```

### With Options

```typescript
import { firekitDoc } from 'svelte-firekit';

// Document with options
const userDoc = firekitDoc<User>(
	'users/123',
	{
		name: 'Loading...'
	},
	{
		cache: { enabled: true, ttl: 300000 }, // 5 minutes
		retry: { enabled: true, maxAttempts: 3 },
		realtime: true
	}
);
```

## Document Operations

### Refresh Document

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>('users/123');

// Manually refresh document
async function refreshUser() {
	try {
		await userDoc.refresh();
		console.log('User data refreshed');
	} catch (error) {
		console.error('Failed to refresh:', error);
	}
}

// Refresh with specific options
await userDoc.refresh({
	force: true, // Force refresh even if cached
	source: 'server' // Always fetch from server
});
```

### Retry Failed Requests

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>('users/123');

// Retry failed request
async function retryUser() {
	try {
		await userDoc.retry();
		console.log('User data retried successfully');
	} catch (error) {
		console.error('Retry failed:', error);
	}
}

// Check if retry is available
const canRetry = $derived(userDoc.canRetry);
```

### Ensure Document is Ready

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>('users/123');

// Wait for document to be ready
async function ensureUserReady() {
	try {
		await userDoc.ensureReady();
		console.log('User document is ready');
		return userDoc.data;
	} catch (error) {
		console.error('Document not ready:', error);
		return null;
	}
}

// Use in async operations
async function performUserAction() {
	const user = await ensureUserReady();
	if (user) {
		// Perform action with user data
		console.log('Performing action for:', user.name);
	}
}
```

## Real-time Mode Control

### Enable/Disable Real-time Updates

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>('users/123');

// Disable real-time updates
await userDoc.setRealtime(false);

// Enable real-time updates
await userDoc.setRealtime(true);

// Check real-time status
const isRealtime = $derived(userDoc.isRealtime);
```

### Conditional Real-time Updates

```svelte
<script>
	import { firekitDoc } from 'svelte-firekit';

	let enableRealtime = true;

	// Dynamic real-time control
	$effect(() => {
		userDoc.setRealtime(enableRealtime);
	});

	const userDoc = firekitDoc<User>('users/123');
	const userData = $derived(userDoc.data);
</script>

<div>
	<label>
		<input type="checkbox" bindchecked={enableRealtime} />
		Enable real-time updates
	</label>

	{#if userData}
		<div>
			<h2>{userData.name}</h2>
			<p>Last updated: {new Date().toLocaleTimeString()}</p>
		</div>
	{/if}
</div>
```

## Stale Data Detection

### Check Data Freshness

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>('users/123');

// Check if data is stale
const isStale = $derived(userDoc.isStale);
const lastUpdated = $derived(userDoc.lastUpdated);
const staleThreshold = $derived(userDoc.staleThreshold);

// Configure stale threshold
const userDocWithStale = firekitDoc<User>(
	'users/123',
	{},
	{
		staleThreshold: 60000 // 1 minute
	}
);

// React to stale data
$effect(() => {
	if (userDocWithStale.isStale) {
		console.log('User data is stale, consider refreshing');
	}
});
```

### Auto-refresh Stale Data

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>(
	'users/123',
	{},
	{
		staleThreshold: 300000, // 5 minutes
		autoRefresh: true // Auto-refresh stale data
	}
);

// Monitor stale state
$effect(() => {
	if (userDoc.isStale && userDoc.autoRefresh) {
		console.log('Auto-refreshing stale data');
	}
});
```

## Error Handling

### Error States

```svelte
<script>
	import { firekitDoc } from 'svelte-firekit';

	const userDoc = firekitDoc<User>('users/123');
	const error = $derived(userDoc.error);
	const hasError = $derived(!!error);

	async function retry() {
		try {
			await userDoc.retry();
		} catch (error) {
			console.error('Retry failed:', error);
		}
	}
</script>

{#if hasError}
	<div class="error-message">
		<h3>Error loading user</h3>
		<p>{error.message}</p>
		<button onclick={retry}>Retry</button>
	</div>
{:else}
	<!-- Normal content -->
{/if}
```

### Error Recovery

```typescript
import { firekitDoc } from 'svelte-firekit';

const userDoc = firekitDoc<User>(
	'users/123',
	{},
	{
		retry: {
			enabled: true,
			maxAttempts: 3,
			delay: 1000,
			backoff: 'exponential'
		}
	}
);

// Monitor error state
$effect(() => {
	if (userDoc.error) {
		console.error('Document error:', userDoc.error);

		// Auto-retry on network errors
		if (userDoc.error.code === 'unavailable') {
			setTimeout(() => userDoc.retry(), 2000);
		}
	}
});
```

## One-time Document Fetch

### Single Document Fetch

```typescript
import { firekitDocOnce } from 'svelte-firekit';

// One-time document fetch
async function fetchUser(userId: string) {
	try {
		const userData = await firekitDocOnce<User>(`users/${userId}`);
		console.log('User fetched:', userData);
		return userData;
	} catch (error) {
		console.error('Failed to fetch user:', error);
		return null;
	}
}

// Usage
const user = await fetchUser('123');
```

### One-time Fetch with Default Values

```typescript
import { firekitDocOnce } from 'svelte-firekit';

// One-time fetch with defaults
const userData = await firekitDocOnce<User>('users/123', {
	name: 'Unknown User',
	email: 'unknown@example.com'
});
```

## Document with Metadata

### Fetch Document with Metadata

```typescript
import { firekitDocWithMetadata } from 'svelte-firekit';

// Document with metadata
const userDocWithMeta = firekitDocWithMetadata<User>('users/123');

// Access document and metadata
const userData = $derived(userDocWithMeta.data);
const metadata = $derived(userDocWithMeta.metadata);

// Metadata properties
const exists = $derived(metadata?.exists);
const hasPendingWrites = $derived(metadata?.hasPendingWrites);
const fromCache = $derived(metadata?.fromCache);
const createTime = $derived(metadata?.createTime);
const updateTime = $derived(metadata?.updateTime);
const readTime = $derived(metadata?.readTime);
```

### Metadata Usage

```svelte
<script>
	import { firekitDocWithMetadata } from 'svelte-firekit';

	const userDoc = firekitDocWithMetadata<User>('users/123');
	const userData = $derived(userDoc.data);
	const metadata = $derived(userDoc.metadata);
</script>

{#if userData}
	<div class="user-card">
		<h2>{userData.name}</h2>
		<p>Email: {userData.email}</p>

		<div class="metadata">
			{#if metadata?.exists}
				<p>✓ Document exists</p>
			{:else}
				<p>✗ Document does not exist</p>
			{/if}

			{#if metadata?.hasPendingWrites}
				<p>⚠ Has pending writes</p>
			{/if}

			{#if metadata?.fromCache}
				<p>📋 Data from cache</p>
			{:else}
				<p>🌐 Data from server</p>
			{/if}

			{#if metadata?.updateTime}
				<p>Last updated: {new Date(metadata.updateTime.toDate()).toLocaleString()}</p>
			{/if}
		</div>
	</div>
{/if}
```

## Svelte Component Integration

### Document Display Component

```svelte
<script>
	import { firekitDoc } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';

	export let documentPath: string;
	export let defaultData = {};

	const doc = firekitDoc(documentPath, defaultData);
	const data = $derived(doc.data);
	const loading = $derived(doc.loading);
	const error = $derived(doc.error);

	async function refresh() {
		try {
			await doc.refresh();
		} catch (error) {
			console.error('Refresh failed:', error);
		}
	}
</script>

<div class="document-display">
	{#if loading}
		<Skeleton class="h-32 w-full" />
	{:else if error}
		<div class="error-state">
			<p>Error: {error.message}</p>
			<Button onclick={refresh}>Retry</Button>
		</div>
	{:else if data}
		<slot {data} />
	{:else}
		<div class="empty-state">
			<p>No data available</p>
		</div>
	{/if}
</div>
```

### User Profile Component

```svelte
<script>
	import { firekitDoc } from 'svelte-firekit';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';

	export let userId: string;

	const userDoc = firekitDoc<User>(`users/${userId}`, {
		name: 'Loading...',
		email: '',
		avatar: '/default-avatar.png'
	});

	const user = $derived(userDoc.data);
	const loading = $derived(userDoc.loading);
	const error = $derived(userDoc.error);
</script>

{#if loading}
	<div class="user-profile-skeleton">
		<Avatar>
			<AvatarFallback>...</AvatarFallback>
		</Avatar>
		<div>
			<h2>Loading...</h2>
			<p>Loading user data...</p>
		</div>
	</div>
{:else if error}
	<div class="error-state">
		<p>Failed to load user: {error.message}</p>
	</div>
{:else if user}
	<div class="user-profile">
		<Avatar>
			<AvatarImage src={user.avatar} alt={user.name} />
			<AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
		</Avatar>

		<div class="user-info">
			<h2>{user.name}</h2>
			<p>{user.email}</p>

			{#if user.verified}
				<Badge variant="success">Verified</Badge>
			{:else}
				<Badge variant="warning">Unverified</Badge>
			{/if}
		</div>
	</div>
{/if}

<style>
	.user-profile {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
	}

	.user-info h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.user-info p {
		margin: 0.25rem 0;
		color: #6b7280;
	}

	.user-profile-skeleton {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		opacity: 0.7;
	}
</style>
```

### Document Form Component

```svelte
<script>
	import { firekitDoc } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	export let documentPath: string;
	export let fields: string[];

	const doc = firekitDoc(documentPath);
	const data = $derived(doc.data);
	const loading = $derived(doc.loading);
	const saving = $derived(doc.saving);

	let formData = {};

	// Initialize form data when document loads
	$effect(() => {
		if (data) {
			formData = { ...data };
		}
	});

	async function save() {
		try {
			await doc.update(formData);
			console.log('Document updated successfully');
		} catch (error) {
			console.error('Failed to update document:', error);
		}
	}
</script>

<form onsubmit|preventDefault={save} class="document-form">
	{#if loading}
		<div>Loading document...</div>
	{:else if data}
		{#each fields as field}
			<div class="form-field">
				<label for={field}>{field}</label>
				<Input id={field} bindvalue={formData[field]} placeholder={`Enter ${field}`} />
			</div>
		{/each}

		<Button type="submit" disabled={saving}>
			{saving ? 'Saving...' : 'Save'}
		</Button>
	{:else}
		<div>Document not found</div>
	{/if}
</form>

<style>
	.document-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 400px;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-field label {
		font-weight: 500;
	}
</style>
```

## Type Definitions

### Document Options

```typescript
interface DocumentOptions {
	cache?: {
		enabled?: boolean;
		ttl?: number;
		strategy?: 'memory' | 'localStorage' | 'sessionStorage';
	};
	retry?: {
		enabled?: boolean;
		maxAttempts?: number;
		delay?: number;
		backoff?: 'linear' | 'exponential';
	};
	realtime?: boolean;
	staleThreshold?: number;
	autoRefresh?: boolean;
}
```

### Document State

```typescript
interface DocumentState<T = any> {
	data: T | null;
	loading: boolean;
	saving: boolean;
	error: Error | null;
	isRealtime: boolean;
	isStale: boolean;
	lastUpdated: Date | null;
	staleThreshold: number;
	canRetry: boolean;
}
```

### Document Metadata

```typescript
interface DocumentMetadata {
	exists: boolean;
	hasPendingWrites: boolean;
	fromCache: boolean;
	createTime: Timestamp;
	updateTime: Timestamp;
	readTime: Timestamp;
}
```

## Best Practices

### Performance

1. **Use appropriate default values**

   ```typescript
   // Good: Provide meaningful defaults
   const userDoc = firekitDoc<User>('users/123', {
   	name: 'Loading...',
   	email: '',
   	avatar: '/default-avatar.png'
   });
   ```

2. **Implement proper caching**

   ```typescript
   // Cache frequently accessed documents
   const userDoc = firekitDoc<User>(
   	'users/123',
   	{},
   	{
   		cache: { enabled: true, ttl: 600000 } // 10 minutes
   	}
   );
   ```

3. **Control real-time updates**
   ```typescript
   // Disable real-time for static data
   const configDoc = firekitDoc<Config>(
   	'config/app',
   	{},
   	{
   		realtime: false
   	}
   );
   ```

### Error Handling

1. **Provide fallback UI**

   ```svelte
   {#if error}
   	<div class="error-state">
   		<p>Unable to load data</p>
   		<button onclick={() => doc.retry()}>Retry</button>
   	</div>
   {/if}
   ```

2. **Handle missing documents**
   ```svelte
   {#if data}
   	<!-- Document exists -->
   {:else if !loading}
   	<div class="not-found">Document not found</div>
   {/if}
   ```

### Data Management

1. **Use stale data detection**

   ```typescript
   const userDoc = firekitDoc<User>(
   	'users/123',
   	{},
   	{
   		staleThreshold: 300000, // 5 minutes
   		autoRefresh: true
   	}
   );
   ```

2. **Implement proper cleanup**

   ```typescript
   import { onDestroy } from 'svelte';

   onDestroy(() => {
   	userDoc.unsubscribe();
   });
   ```

## API Reference

### Core Methods

- `firekitDoc(path, defaultData?, options?)` - Create document subscription
- `firekitDocOnce(path, defaultData?)` - One-time document fetch
- `firekitDocWithMetadata(path, defaultData?, options?)` - Document with metadata

### Document Methods

- `refresh(options?)` - Refresh document data
- `retry()` - Retry failed request
- `ensureReady()` - Wait for document to be ready
- `setRealtime(enabled)` - Enable/disable real-time updates
- `update(data)` - Update document
- `delete()` - Delete document
- `unsubscribe()` - Unsubscribe from updates

### Properties

- `data` - Document data (reactive)
- `loading` - Loading state (reactive)
- `saving` - Saving state (reactive)
- `error` - Error state (reactive)
- `isRealtime` - Real-time status (reactive)
- `isStale` - Stale data status (reactive)
- `canRetry` - Retry availability (reactive)
- `metadata` - Document metadata (reactive)
