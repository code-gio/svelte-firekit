---
title: Realtime Database Service
description: Real-time data synchronization with Firebase Realtime Database using Svelte 5 runes
---

# Realtime Database Service

The `firekitRealtimeDB` and `firekitRealtimeList` services provide real-time data synchronization with Firebase Realtime Database, offering reactive state management for single values and lists of data.

## Overview

The Realtime Database service handles:

- Real-time data synchronization
- Single value subscriptions
- List data management with pagination
- Data transformations and filtering
- Offline support and caching
- Conflict resolution
- Performance optimization
- Error handling and retry mechanisms

## Quick Start

```svelte
<script>
	import { firekitRealtimeDB, firekitRealtimeList } from 'svelte-firekit';

	// Single value subscription
	const userStatus = firekitRealtimeDB<{ online: boolean; lastSeen: number }>('users/123/status');
	const statusData = $derived(userStatus.data);
	const statusLoading = $derived(userStatus.loading);
	const statusError = $derived(userStatus.error);

	// List data subscription
	const messages = firekitRealtimeList<Message>('messages');
	const messagesList = $derived(messages.list);
	const messagesLoading = $derived(messages.loading);
	const messagesError = $derived(messages.error);

	// Update data
	async function updateStatus() {
		await userStatus.set({ online: true, lastSeen: Date.now() });
	}

	async function addMessage() {
		await messages.push({
			text: 'Hello World',
			userId: '123',
			timestamp: Date.now()
		});
	}
</script>

{#if statusLoading}
	<p>Loading status...</p>
{:else if statusData}
	<div>
		<p>Status: {statusData.online ? 'Online' : 'Offline'}</p>
		<button onclick={updateStatus}>Update Status</button>
	</div>
{/if}

{#if messagesLoading}
	<p>Loading messages...</p>
{:else}
	<div>
		{#each messagesList as message}
			<div>{message.text}</div>
		{/each}
		<button onclick={addMessage}>Add Message</button>
	</div>
{/if}
```

## Single Value Subscriptions

### Basic Usage

```typescript
import { firekitRealtimeDB } from 'svelte-firekit';

// Simple subscription
const userProfile = firekitRealtimeDB<UserProfile>('users/123/profile');

// With default value
const userSettings = firekitRealtimeDB<UserSettings>('users/123/settings', {
	theme: 'light',
	notifications: true
});

// With options
const userStatus = firekitRealtimeDB<UserStatus>(
	'users/123/status',
	{
		online: false,
		lastSeen: 0
	},
	{
		persist: true,
		transform: (data) => ({
			...data,
			lastSeenFormatted: new Date(data.lastSeen).toLocaleString()
		})
	}
);
```

### Data Operations

```typescript
import { firekitRealtimeDB } from 'svelte-firekit';

const userProfile = firekitRealtimeDB<UserProfile>('users/123/profile');

// Set data
await userProfile.set({
	name: 'John Doe',
	email: 'john@example.com',
	age: 30
});

// Update specific fields
await userProfile.update({
	age: 31,
	lastUpdated: Date.now()
});

// Remove data
await userProfile.remove();

// Push data (creates unique key)
const newKey = await userProfile.push({
	name: 'Jane Doe',
	email: 'jane@example.com'
});

// Transaction
await userProfile.transaction((currentData) => {
	if (!currentData) return { name: 'New User' };
	return { ...currentData, visits: (currentData.visits || 0) + 1 };
});
```

### Reactive State

```typescript
import { firekitRealtimeDB } from 'svelte-firekit';

const userProfile = firekitRealtimeDB<UserProfile>('users/123/profile');

// Reactive state
const profileData = $derived(userProfile.data);
const profileLoading = $derived(userProfile.loading);
const profileError = $derived(userProfile.error);
const profileRef = $derived(userProfile.ref);

// Effects
$effect(() => {
	if (profileData) {
		console.log('Profile updated:', profileData);
	}
});

$effect(() => {
	if (profileError) {
		console.error('Profile error:', profileError);
	}
});
```

## List Data Management

### Basic List Usage

```typescript
import { firekitRealtimeList } from 'svelte-firekit';

// Simple list
const messages = firekitRealtimeList<Message>('messages');

// With options
const paginatedMessages = firekitRealtimeList<Message>('messages', {
	limit: 50,
	orderBy: 'timestamp',
	reverse: true
});

// With filters
const userMessages = firekitRealtimeList<Message>('messages', {
	where: [['userId', '==', '123']],
	limit: 20
});
```

### List Operations

```typescript
import { firekitRealtimeList } from 'svelte-firekit';

const messages = firekitRealtimeList<Message>('messages');

// Add item
await messages.push({
	text: 'Hello World',
	userId: '123',
	timestamp: Date.now()
});

// Add item with custom key
await messages.set('custom-key', {
	text: 'Custom message',
	userId: '123',
	timestamp: Date.now()
});

// Update item
await messages.update('message-id', {
	text: 'Updated message'
});

// Remove item
await messages.remove('message-id');

// Clear all items
await messages.clear();

// Batch operations
await messages.batch([
	{ type: 'push', data: { text: 'Message 1', userId: '123' } },
	{ type: 'push', data: { text: 'Message 2', userId: '456' } },
	{ type: 'remove', key: 'old-message' }
]);
```

### Pagination and Filtering

```typescript
import { firekitRealtimeList } from 'svelte-firekit';

// Paginated list
const paginatedMessages = firekitRealtimeList<Message>('messages', {
	limit: 20,
	orderBy: 'timestamp',
	reverse: true
});

// Load more
await paginatedMessages.loadMore();

// Filtered list
const filteredMessages = firekitRealtimeList<Message>('messages', {
	where: [
		['userId', '==', '123'],
		['timestamp', '>', Date.now() - 86400000] // Last 24 hours
	],
	limit: 50
});

// Search functionality
const searchResults = firekitRealtimeList<Message>('messages', {
	where: [['text', 'contains', 'hello']],
	limit: 10
});
```

### Reactive List State

```typescript
import { firekitRealtimeList } from 'svelte-firekit';

const messages = firekitRealtimeList<Message>('messages');

// Reactive state
const messagesList = $derived(messages.list);
const messagesLoading = $derived(messages.loading);
const messagesError = $derived(messages.error);
const messagesCount = $derived(messages.count);
const hasMore = $derived(messages.hasMore);

// Computed values
const sortedMessages = $derived(messagesList.sort((a, b) => b.timestamp - a.timestamp));
const userMessages = $derived(messagesList.filter((m) => m.userId === '123'));

// Effects
$effect(() => {
	console.log('Messages count:', messagesCount);
	console.log('Has more:', hasMore);
});
```

## Advanced Features

### Data Transformations

```typescript
import { firekitRealtimeDB, firekitRealtimeList } from 'svelte-firekit';

// Transform single value
const userProfile = firekitRealtimeDB<UserProfile>('users/123/profile', null, {
	transform: (data) => ({
		...data,
		fullName: `${data.firstName} ${data.lastName}`,
		age: calculateAge(data.birthDate),
		formattedCreated: new Date(data.createdAt).toLocaleDateString()
	})
});

// Transform list items
const messages = firekitRealtimeList<Message>('messages', {
	transform: (item) => ({
		...item,
		formattedTime: new Date(item.timestamp).toLocaleTimeString(),
		isOwn: item.userId === currentUserId
	})
});
```

### Offline Support

```typescript
import { firekitRealtimeDB, firekitRealtimeList } from 'svelte-firekit';

// Enable offline persistence
const userProfile = firekitRealtimeDB<UserProfile>('users/123/profile', null, {
	persist: true,
	offlineFirst: true
});

// Check connection status
const isOnline = $derived(userProfile.isOnline);
const pendingWrites = $derived(userProfile.pendingWrites);

// Sync when online
$effect(() => {
	if (isOnline && pendingWrites.length > 0) {
		userProfile.sync();
	}
});
```

### Conflict Resolution

```typescript
import { firekitRealtimeDB } from 'svelte-firekit';

const userProfile = firekitRealtimeDB<UserProfile>('users/123/profile', null, {
	conflictResolution: 'server-wins', // 'server-wins' | 'client-wins' | 'merge'
	mergeStrategy: (serverData, clientData) => ({
		...serverData,
		...clientData,
		lastModified: Math.max(serverData.lastModified, clientData.lastModified)
	})
});
```

### Performance Optimization

```typescript
import { firekitRealtimeDB, firekitRealtimeList } from 'svelte-firekit';

// Optimize for frequent updates
const userStatus = firekitRealtimeDB<UserStatus>('users/123/status', null, {
	throttle: 1000, // Update at most once per second
	debounce: 500 // Wait 500ms after last change
});

// Optimize list rendering
const messages = firekitRealtimeList<Message>('messages', {
	virtualization: true,
	itemHeight: 60,
	viewportHeight: 400
});
```

## Svelte Component Integration

### Single Value Component

```svelte
<script>
	import { firekitRealtimeDB } from 'svelte-firekit';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	export let path: string;
	export let defaultValue: any = null;

	const data = firekitRealtimeDB(path, defaultValue);
	const value = $derived(data.data);
	const loading = $derived(data.loading);
	const error = $derived(data.error);

	async function updateValue() {
		await data.set({ ...value, updatedAt: Date.now() });
	}

	async function removeValue() {
		await data.remove();
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Realtime Data: {path}</CardTitle>
	</CardHeader>
	<CardContent>
		{#if loading}
			<p>Loading...</p>
		{:else if error}
			<p class="text-red-600">Error: {error.message}</p>
		{:else if value}
			<pre>{JSON.stringify(value, null, 2)}</pre>
			<div class="mt-4 flex gap-2">
				<Button onclick={updateValue}>Update</Button>
				<Button variant="destructive" onclick={removeValue}>Remove</Button>
			</div>
		{:else}
			<p>No data</p>
		{/if}
	</CardContent>
</Card>
```

### List Component

```svelte
<script>
	import { firekitRealtimeList } from 'svelte-firekit';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	export let path: string;
	export let limit = 20;

	let newItemText = '';

	const list = firekitRealtimeList(path, { limit });
	const items = $derived(list.list);
	const loading = $derived(list.loading);
	const error = $derived(list.error);
	const hasMore = $derived(list.hasMore);

	async function addItem() {
		if (newItemText.trim()) {
			await list.push({
				text: newItemText,
				timestamp: Date.now(),
				userId: 'current-user'
			});
			newItemText = '';
		}
	}

	async function removeItem(key: string) {
		await list.remove(key);
	}

	async function loadMore() {
		await list.loadMore();
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Realtime List: {path}</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="space-y-4">
			<!-- Add new item -->
			<div class="flex gap-2">
				<Input
					bindvalue={newItemText}
					placeholder="Enter new item..."
					onkeydown={(e) => e.key === 'Enter' && addItem()}
				/>
				<Button onclick={addItem}>Add</Button>
			</div>

			<!-- List items -->
			{#if loading}
				<p>Loading...</p>
			{:else if error}
				<p class="text-red-600">Error: {error.message}</p>
			{:else}
				<div class="space-y-2">
					{#each items as item, key}
						<div class="flex items-center justify-between rounded border p-2">
							<span>{item.text}</span>
							<Button variant="destructive" size="sm" onclick={() => removeItem(key)}>
								Remove
							</Button>
						</div>
					{/each}
				</div>

				{#if hasMore}
					<Button onclick={loadMore}>Load More</Button>
				{/if}
			{/if}
		</div>
	</CardContent>
</Card>
```

### Real-time Chat Component

```svelte
<script>
	import { firekitRealtimeList } from 'svelte-firekit';
	import { firekitUser } from 'svelte-firekit';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Avatar } from '$lib/components/ui/avatar';

	export let chatId: string;

	const user = $derived(firekitUser.user);
	const messages = firekitRealtimeList<ChatMessage>(`chats/${chatId}/messages`, {
		limit: 50,
		orderBy: 'timestamp',
		reverse: true
	});

	const messagesList = $derived(messages.list);
	const loading = $derived(messages.loading);

	let newMessage = '';

	async function sendMessage() {
		if (newMessage.trim() && user) {
			await messages.push({
				text: newMessage,
				userId: user.uid,
				userName: user.displayName || user.email,
				userPhoto: user.photoURL,
				timestamp: Date.now()
			});
			newMessage = '';
		}
	}
</script>

<Card class="flex h-96 flex-col">
	<CardHeader>
		<CardTitle>Chat Room</CardTitle>
	</CardHeader>
	<CardContent class="flex flex-1 flex-col">
		<!-- Messages -->
		<div class="mb-4 flex-1 space-y-2 overflow-y-auto">
			{#if loading}
				<p>Loading messages...</p>
			{:else}
				{#each messagesList as message, key}
					<div
						class="flex items-start gap-2 {message.userId === user?.uid ? 'flex-row-reverse' : ''}"
					>
						<Avatar src={message.userPhoto} alt={message.userName} />
						<div class="flex flex-col {message.userId === user?.uid ? 'items-end' : 'items-start'}">
							<div class="text-sm font-medium">{message.userName}</div>
							<div class="max-w-xs rounded-lg bg-gray-100 p-2">
								{message.text}
							</div>
							<div class="text-xs text-gray-500">
								{new Date(message.timestamp).toLocaleTimeString()}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Message input -->
		<div class="flex gap-2">
			<Input
				bindvalue={newMessage}
				placeholder="Type a message..."
				onkeydown={(e) => e.key === 'Enter' && sendMessage()}
			/>
			<Button onclick={sendMessage}>Send</Button>
		</div>
	</CardContent>
</Card>
```

## Type Definitions

### Single Value Types

```typescript
interface RealtimeDBOptions<T> {
	defaultValue?: T;
	persist?: boolean;
	offlineFirst?: boolean;
	throttle?: number;
	debounce?: number;
	transform?: (data: T) => T;
	conflictResolution?: 'server-wins' | 'client-wins' | 'merge';
	mergeStrategy?: (serverData: T, clientData: T) => T;
}

interface RealtimeDBState<T> {
	data: T | null;
	loading: boolean;
	error: Error | null;
	ref: any;
	isOnline: boolean;
	pendingWrites: any[];
}
```

### List Types

```typescript
interface RealtimeListOptions<T> {
	limit?: number;
	orderBy?: string;
	reverse?: boolean;
	where?: Array<[string, string, any]>;
	transform?: (item: T) => T;
	virtualization?: boolean;
	itemHeight?: number;
	viewportHeight?: number;
}

interface RealtimeListState<T> {
	list: T[];
	loading: boolean;
	error: Error | null;
	count: number;
	hasMore: boolean;
	keys: string[];
}
```

### Common Types

```typescript
interface ChatMessage {
	text: string;
	userId: string;
	userName: string;
	userPhoto?: string;
	timestamp: number;
}

interface UserProfile {
	name: string;
	email: string;
	age: number;
	createdAt: number;
	lastUpdated: number;
}

interface UserStatus {
	online: boolean;
	lastSeen: number;
	status: 'online' | 'away' | 'busy' | 'offline';
}
```

## Best Practices

### 1. Use Appropriate Data Structure

```typescript
// ✅ Good - Flat structure for simple data
const userStatus = firekitRealtimeDB('users/123/status');

// ✅ Good - Nested structure for complex data
const userProfile = firekitRealtimeDB('users/123/profile');

// ❌ Avoid - Deep nesting
const deepData = firekitRealtimeDB('users/123/profile/settings/notifications/email');
```

### 2. Handle Loading States

```svelte
{#if loading}
	<LoadingSpinner />
{:else if error}
	<ErrorMessage {error} />
{:else if data}
	<DataDisplay {data} />
{/if}
```

### 3. Optimize for Performance

```typescript
// ✅ Good - Use limits for large lists
const messages = firekitRealtimeList('messages', { limit: 50 });

// ✅ Good - Use throttling for frequent updates
const userStatus = firekitRealtimeDB('users/123/status', null, {
	throttle: 1000
});

// ❌ Avoid - Loading all data at once
const allMessages = firekitRealtimeList('messages');
```

### 4. Handle Offline Scenarios

```typescript
// ✅ Good - Enable offline persistence
const userProfile = firekitRealtimeDB('users/123/profile', null, {
	persist: true,
	offlineFirst: true
});

// ✅ Good - Check connection status
const isOnline = $derived(userProfile.isOnline);

$effect(() => {
	if (!isOnline) {
		showOfflineIndicator();
	}
});
```

### 5. Clean Up Subscriptions

```typescript
import { onDestroy } from 'svelte';

const userProfile = firekitRealtimeDB('users/123/profile');

onDestroy(() => {
	userProfile.dispose();
});
```

## API Reference

### RealtimeDB Methods

- `set(data)` - Set data at path
- `update(data)` - Update specific fields
- `remove()` - Remove data at path
- `push(data)` - Push data with auto-generated key
- `transaction(updater)` - Run transaction
- `dispose()` - Clean up subscription

### RealtimeList Methods

- `push(data)` - Add item to list
- `set(key, data)` - Set item with specific key
- `update(key, data)` - Update specific item
- `remove(key)` - Remove specific item
- `clear()` - Clear all items
- `loadMore()` - Load more items
- `batch(operations)` - Batch operations
- `dispose()` - Clean up subscription

### Reactive State

- `data` - Current data value
- `loading` - Loading state
- `error` - Error state
- `ref` - Firebase reference
- `isOnline` - Connection status
- `pendingWrites` - Pending write operations

### List State

- `list` - Array of items
- `count` - Total item count
- `hasMore` - Whether more items are available
- `keys` - Array of item keys
