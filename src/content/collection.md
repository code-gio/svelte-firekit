---
title: Collection Service
description: Advanced Firestore collection management with real-time updates, querying, and reactive state using Svelte 5 runes
---

# Collection Service

The `firekitCollection` service provides advanced Firestore collection management with real-time updates, complex querying, pagination, caching, and reactive state using Svelte 5 runes.

## Overview

The collection service offers:

- Real-time collection subscriptions with automatic updates
- Advanced query building with type safety
- Pagination and infinite scrolling support
- Intelligent caching with TTL
- Performance monitoring and statistics
- Collection groups and subcollections
- Reactive state management with Svelte 5 runes

## Basic Usage

```typescript
import { firekitCollection, where, orderBy, limit } from 'svelte-firekit';

// Simple collection subscription
const users = firekitCollection<User>('users');

// With query constraints
const activeUsers = firekitCollection<User>(
	'users',
	where('active', '==', true),
	orderBy('name'),
	limit(10)
);
```

## Reactive State Management

### Basic Reactive State

```typescript
import { firekitCollection } from 'svelte-firekit';

// Create collection subscription
const posts = firekitCollection<Post>('posts');

// Access reactive state using Svelte 5 runes
const postsData = $derived(posts.data);
const postsLoading = $derived(posts.loading);
const postsError = $derived(posts.error);
const postsEmpty = $derived(posts.empty);
const postsSize = $derived(posts.size);

// React to state changes
$effect(() => {
	if (postsLoading) {
		console.log('Loading posts...');
	} else if (postsError) {
		console.error('Posts error:', postsError);
	} else {
		console.log('Posts loaded:', postsData.length);
	}
});
```

### Advanced Reactive State

```typescript
import { firekitCollection } from 'svelte-firekit';

// Collection with advanced options
const users = firekitCollection<User>('users', {
	pagination: { enabled: true, pageSize: 20 },
	cache: { enabled: true, ttl: 300000 },
	transform: (doc) => ({ ...doc, displayName: doc.name.toUpperCase() })
});

// Access all reactive properties
const usersData = $derived(users.data);
const usersLoading = $derived(users.loading);
const usersInitialized = $derived(users.initialized);
const usersError = $derived(users.error);
const usersEmpty = $derived(users.empty);
const usersSize = $derived(users.size);
const usersLastUpdated = $derived(users.lastUpdated);
const usersState = $derived(users.state);

// React to collection changes
$effect(() => {
	console.log('Collection state:', {
		loading: usersLoading,
		initialized: usersInitialized,
		error: usersError,
		dataCount: usersData.length,
		lastUpdated: usersLastUpdated
	});
});
```

## Query Building

### Basic Queries

```typescript
import { firekitCollection, where, orderBy, limit } from 'svelte-firekit';

// Simple where clause
const activeUsers = firekitCollection<User>('users', where('active', '==', true));

// Multiple conditions
const premiumUsers = firekitCollection<User>(
	'users',
	where('active', '==', true),
	where('subscription', '==', 'premium'),
	orderBy('createdAt', 'desc')
);

// With limit
const recentPosts = firekitCollection<Post>(
	'posts',
	where('published', '==', true),
	orderBy('createdAt', 'desc'),
	limit(10)
);
```

### Advanced Queries

```typescript
import { firekitCollection, where, orderBy, limit, startAt, endAt } from 'svelte-firekit';

// Complex query with multiple conditions
const filteredPosts = firekitCollection<Post>(
	'posts',
	where('category', 'in', ['tech', 'design', 'business']),
	where('published', '==', true),
	where('authorId', '==', currentUserId),
	orderBy('createdAt', 'desc'),
	orderBy('title'),
	limit(20)
);

// Query with date range
const recentPosts = firekitCollection<Post>(
	'posts',
	where('createdAt', '>=', new Date('2024-01-01')),
	where('createdAt', '<=', new Date('2024-12-31')),
	orderBy('createdAt', 'desc')
);

// Query with array contains
const taggedPosts = firekitCollection<Post>(
	'posts',
	where('tags', 'array-contains', 'javascript'),
	orderBy('createdAt', 'desc')
);
```

### Query Builder Pattern

```typescript
import { firekitCollection } from 'svelte-firekit';

// Create query builder
const query = firekitCollection
	.createQuery()
	.where('status', '==', 'active')
	.where('category', 'in', ['tech', 'design'])
	.orderBy('createdAt', 'desc')
	.limit(20);

// Use the query
const results = firekitCollection<Post>('posts', query.build());

// Chain queries
const techPosts = firekitCollection
	.createQuery()
	.where('category', '==', 'tech')
	.orderBy('createdAt', 'desc')
	.limit(10);

const designPosts = firekitCollection
	.createQuery()
	.where('category', '==', 'design')
	.orderBy('createdAt', 'desc')
	.limit(10);

// Use both queries
const techResults = firekitCollection<Post>('posts', techPosts.build());
const designResults = firekitCollection<Post>('posts', designPosts.build());
```

## Pagination

### Basic Pagination

```typescript
import { firekitCollection } from 'svelte-firekit';

// Collection with pagination enabled
const paginatedUsers = firekitCollection<User>('users', {
	pagination: {
		enabled: true,
		pageSize: 20
	}
});

// Access pagination methods
const currentPage = $derived(paginatedUsers.currentPage);
const totalPages = $derived(paginatedUsers.totalPages);
const hasNextPage = $derived(paginatedUsers.hasNextPage);
const hasPreviousPage = $derived(paginatedUsers.hasPreviousPage);

// Pagination functions
async function loadNextPage() {
	await paginatedUsers.nextPage();
}

async function loadPreviousPage() {
	await paginatedUsers.previousPage();
}

async function goToPage(page: number) {
	await paginatedUsers.goToPage(page);
}
```

### Infinite Scrolling

```typescript
import { firekitCollection } from 'svelte-firekit';

// Collection with infinite scrolling
const infinitePosts = firekitCollection<Post>('posts', {
	pagination: {
		enabled: true,
		pageSize: 10,
		mode: 'infinite'
	},
	orderBy: 'createdAt',
	direction: 'desc'
});

// Load more data
async function loadMorePosts() {
	if (infinitePosts.hasNextPage) {
		await infinitePosts.loadMore();
	}
}

// React to data changes
$effect(() => {
	console.log('Total posts loaded:', infinitePosts.data.length);
	console.log('Has more posts:', infinitePosts.hasNextPage);
});
```

## Caching

### Basic Caching

```typescript
import { firekitCollection } from 'svelte-firekit';

// Collection with caching
const cachedUsers = firekitCollection<User>('users', {
	cache: {
		enabled: true,
		ttl: 300000 // 5 minutes
	}
});

// Access cache statistics
const cacheStats = $derived(cachedUsers.getStats());
console.log('Cache hit rate:', cacheStats.cacheHitRate);
```

### Advanced Caching

```typescript
import { firekitCollection } from 'svelte-firekit';

// Collection with advanced caching
const advancedCachedPosts = firekitCollection<Post>('posts', {
	cache: {
		enabled: true,
		ttl: 600000, // 10 minutes
		maxSize: 1000, // Maximum cache entries
		strategy: 'lru' // Least recently used eviction
	},
	transform: (doc) => ({
		...doc,
		cachedAt: new Date(),
		displayTitle: doc.title.toUpperCase()
	})
});

// Clear cache
function clearCache() {
	advancedCachedPosts.clearCache();
}

// Check cache status
function checkCacheStatus() {
	const stats = advancedCachedPosts.getStats();
	console.log('Cache statistics:', stats);
}
```

## Data Transformation

### Basic Transformation

```typescript
import { firekitCollection } from 'svelte-firekit';

// Transform data on load
const transformedUsers = firekitCollection<User>('users', {
	transform: (user) => ({
		...user,
		displayName: user.name.toUpperCase(),
		fullName: `${user.firstName} ${user.lastName}`,
		age: calculateAge(user.birthDate)
	})
});
```

### Advanced Transformation

```typescript
import { firekitCollection } from 'svelte-firekit';

// Complex transformation with validation
const validatedPosts = firekitCollection<Post>('posts', {
	transform: (post) => {
		// Validate required fields
		if (!post.title || !post.content) {
			console.warn('Invalid post:', post.id);
			return null; // Filter out invalid posts
		}

		// Transform and enrich data
		return {
			...post,
			title: post.title.trim(),
			content: post.content.trim(),
			wordCount: post.content.split(' ').length,
			readingTime: Math.ceil(post.content.split(' ').length / 200), // 200 words per minute
			excerpt: post.content.substring(0, 150) + '...',
			formattedDate: new Date(post.createdAt).toLocaleDateString(),
			isRecent: new Date(post.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
		};
	},
	filter: (post) => post !== null // Remove null values
});
```

## Collection Groups

### Basic Collection Groups

```typescript
import { firekitCollectionGroup } from 'svelte-firekit';

// Query all 'comments' subcollections across all documents
const allComments = firekitCollectionGroup<Comment>('comments', {
	orderBy: 'createdAt',
	direction: 'desc'
});

// Filter comments by author
const userComments = firekitCollectionGroup<Comment>('comments', {
	where: 'authorId',
	operator: '==',
	value: currentUserId,
	orderBy: 'createdAt',
	direction: 'desc'
});
```

### Advanced Collection Groups

```typescript
import { firekitCollectionGroup } from 'svelte-firekit';

// Complex collection group query
const recentComments = firekitCollectionGroup<Comment>('comments', {
	where: 'createdAt',
	operator: '>=',
	value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
	where: 'approved',
	operator: '==',
	value: true,
	orderBy: 'createdAt',
	direction: 'desc',
	limit: 50
});
```

## Data Manipulation

### Filtering Data

```typescript
import { firekitCollection } from 'svelte-firekit';

const posts = firekitCollection<Post>('posts');

// Filter data client-side
const publishedPosts = $derived(posts.filter((post) => post.published));
const recentPosts = $derived(
	posts.filter((post) => new Date(post.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
);

// Find specific item
const specificPost = $derived(posts.find((post) => post.id === 'post-123'));

// Find by ID
const postById = $derived(posts.findById('post-123'));
```

### Sorting and Grouping

```typescript
import { firekitCollection } from 'svelte-firekit';

const users = firekitCollection<User>('users');

// Sort data
const sortedUsers = $derived(users.sort((a, b) => a.name.localeCompare(b.name)));
const recentUsers = $derived(
	users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
);

// Group by field
const usersByRole = $derived(users.groupBy('role'));
const postsByCategory = $derived(posts.groupBy('category'));

// Get unique values
const uniqueCategories = $derived(posts.unique('category'));
const uniqueRoles = $derived(users.unique('role'));
```

### Counting and Aggregation

```typescript
import { firekitCollection } from 'svelte-firekit';

const posts = firekitCollection<Post>('posts');

// Count items
const totalPosts = $derived(posts.count());
const publishedPostsCount = $derived(posts.count((post) => post.published));
const recentPostsCount = $derived(
	posts.count((post) => new Date(post.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
);

// Check conditions
const hasPublishedPosts = $derived(posts.some((post) => post.published));
const allPostsPublished = $derived(posts.every((post) => post.published));
```

## Performance Monitoring

### Collection Statistics

```typescript
import { firekitCollection } from 'svelte-firekit';

const users = firekitCollection<User>('users');

// Get performance statistics
const stats = $derived(users.getStats());

$effect(() => {
	console.log('Collection Statistics:', {
		totalDocuments: stats.totalDocuments,
		readCount: stats.readCount,
		writeCount: stats.writeCount,
		cacheHitRate: stats.cacheHitRate,
		averageQueryTime: stats.averageQueryTime,
		memoryUsage: stats.memoryUsage,
		lastActivity: stats.lastActivity
	});
});
```

### Reset Statistics

```typescript
import { firekitCollection } from 'svelte-firekit';

const posts = firekitCollection<Post>('posts');

// Reset performance statistics
function resetStats() {
	posts.resetStats();
	console.log('Statistics reset');
}
```

## Error Handling

### Basic Error Handling

```typescript
import { firekitCollection } from 'svelte-firekit';

const posts = firekitCollection<Post>('posts');

// React to errors
$effect(() => {
	if (posts.error) {
		console.error('Collection error:', posts.error);

		if (posts.error.isRetryable()) {
			// Retry the operation
			posts.retryIfNeeded();
		}
	}
});
```

### Advanced Error Handling

```typescript
import { firekitCollection } from 'svelte-firekit';

const users = firekitCollection<User>('users');

// Handle different error types
$effect(() => {
	if (users.error) {
		switch (users.error.code) {
			case 'permission-denied':
				console.error('Permission denied - check security rules');
				break;
			case 'not-found':
				console.error('Collection not found');
				break;
			case 'unavailable':
				console.error('Service unavailable - retrying...');
				users.retryIfNeeded();
				break;
			default:
				console.error('Unknown error:', users.error);
		}
	}
});
```

## Svelte Component Integration

### Basic Collection Component

```svelte
<script lang="ts">
	import { firekitCollection, where, orderBy, limit } from 'svelte-firekit';

	interface Post {
		id: string;
		title: string;
		content: string;
		author: string;
		createdAt: Date;
		published: boolean;
	}

	// Create collection subscription
	const posts = firekitCollection<Post>(
		'posts',
		where('published', '==', true),
		orderBy('createdAt', 'desc'),
		limit(10)
	);

	// Reactive state
	const postsData = $derived(posts.data);
	const postsLoading = $derived(posts.loading);
	const postsError = $derived(posts.error);
	const postsEmpty = $derived(posts.empty);
</script>

{#if postsLoading}
	<div class="loading">
		<p>Loading posts...</p>
	</div>
{:else if postsError}
	<div class="error">
		<p>Error loading posts: {postsError.message}</p>
		<button onclick={() => posts.retryIfNeeded()}>Retry</button>
	</div>
{:else if postsEmpty}
	<div class="empty">
		<p>No posts found</p>
	</div>
{:else}
	<div class="posts">
		{#each postsData as post (post.id)}
			<article class="post">
				<h2>{post.title}</h2>
				<p class="author">By {post.author}</p>
				<p class="content">{post.content}</p>
				<p class="date">
					{new Date(post.createdAt).toLocaleDateString()}
				</p>
			</article>
		{/each}
	</div>
{/if}

<style>
	.loading,
	.error,
	.empty {
		text-align: center;
		padding: 2rem;
	}

	.error {
		color: #dc3545;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 8px;
	}

	.posts {
		display: grid;
		gap: 1.5rem;
	}

	.post {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.post h2 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.author {
		color: #666;
		font-size: 0.9rem;
		margin: 0 0 1rem 0;
	}

	.content {
		color: #444;
		line-height: 1.6;
		margin: 0 0 1rem 0;
	}

	.date {
		color: #999;
		font-size: 0.8rem;
		margin: 0;
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

### Advanced Collection Component with Pagination

```svelte
<script lang="ts">
	import { firekitCollection, where, orderBy } from 'svelte-firekit';

	interface User {
		id: string;
		name: string;
		email: string;
		role: string;
		active: boolean;
		createdAt: Date;
	}

	// Collection with pagination
	const users = firekitCollection<User>('users', {
		pagination: {
			enabled: true,
			pageSize: 20
		},
		where: 'active',
		operator: '==',
		value: true,
		orderBy: 'createdAt',
		direction: 'desc'
	});

	// Reactive state
	const usersData = $derived(users.data);
	const usersLoading = $derived(users.loading);
	const usersError = $derived(users.error);
	const currentPage = $derived(users.currentPage);
	const totalPages = $derived(users.totalPages);
	const hasNextPage = $derived(users.hasNextPage);
	const hasPreviousPage = $derived(users.hasPreviousPage);

	// Pagination functions
	async function loadNextPage() {
		if (hasNextPage) {
			await users.nextPage();
		}
	}

	async function loadPreviousPage() {
		if (hasPreviousPage) {
			await users.previousPage();
		}
	}

	async function goToPage(page: number) {
		await users.goToPage(page);
	}

	// Search functionality
	let searchTerm = '';
	let filteredUsers = $derived(
		usersData.filter(
			(user) =>
				user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.email.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);
</script>

<div class="users-dashboard">
	<header class="dashboard-header">
		<h1>Users Dashboard</h1>
		<div class="search">
			<input type="text" placeholder="Search users..." bindvalue={searchTerm} />
		</div>
	</header>

	{#if usersLoading}
		<div class="loading">
			<p>Loading users...</p>
		</div>
	{:else if usersError}
		<div class="error">
			<p>Error: {usersError.message}</p>
			<button onclick={() => users.retryIfNeeded()}>Retry</button>
		</div>
	{:else}
		<main class="dashboard-content">
			<div class="users-table">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Role</th>
							<th>Created</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredUsers as user (user.id)}
							<tr>
								<td>{user.name}</td>
								<td>{user.email}</td>
								<td>
									<span class="role-badge role-{user.role}">
										{user.role}
									</span>
								</td>
								<td>
									{new Date(user.createdAt).toLocaleDateString()}
								</td>
								<td>
									<button class="btn-small">Edit</button>
									<button class="btn-small btn-danger">Delete</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="pagination">
				<button disabled={!hasPreviousPage} onclick={loadPreviousPage}> Previous </button>

				<span class="page-info">
					Page {currentPage} of {totalPages}
				</span>

				<button disabled={!hasNextPage} onclick={loadNextPage}> Next </button>
			</div>

			<div class="stats">
				<p>Showing {filteredUsers.length} of {usersData.length} users</p>
			</div>
		</main>
	{/if}
</div>

<style>
	.users-dashboard {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.search input {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		width: 300px;
	}

	.loading,
	.error {
		text-align: center;
		padding: 2rem;
	}

	.error {
		color: #dc3545;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 8px;
	}

	.users-table {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}

	th {
		background: #f8f9fa;
		font-weight: 600;
		color: #333;
	}

	.role-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.role-admin {
		background: #dc3545;
		color: white;
	}

	.role-user {
		background: #28a745;
		color: white;
	}

	.role-moderator {
		background: #ffc107;
		color: #333;
	}

	.btn-small {
		padding: 0.25rem 0.5rem;
		border: none;
		border-radius: 4px;
		background: #007bff;
		color: white;
		cursor: pointer;
		font-size: 0.8rem;
		margin-right: 0.5rem;
	}

	.btn-danger {
		background: #dc3545;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin: 2rem 0;
	}

	.page-info {
		font-weight: 500;
		color: #666;
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

	.stats {
		text-align: center;
		color: #666;
		font-size: 0.9rem;
	}
</style>
```

## Type Definitions

### Collection Options

```typescript
interface CollectionOptions {
	pagination?: {
		enabled: boolean;
		pageSize?: number;
		mode?: 'paged' | 'infinite';
	};
	cache?: {
		enabled: boolean;
		ttl?: number;
		maxSize?: number;
		strategy?: 'lru' | 'fifo';
	};
	transform?: (doc: T) => T | null;
	filter?: (doc: T) => boolean;
	orderBy?: string;
	direction?: 'asc' | 'desc';
	where?: string;
	operator?: FirestoreOperator;
	value?: any;
}
```

### Collection State

```typescript
interface CollectionState<T> {
	data: T[];
	loading: boolean;
	initialized: boolean;
	error: CollectionError | null;
	empty: boolean;
	size: number;
	lastUpdated: Date | null;
}
```

### Collection Statistics

```typescript
interface CollectionStats {
	totalDocuments: number;
	readCount: number;
	writeCount: number;
	cacheHitRate: number;
	averageQueryTime: number;
	lastActivity: Date;
	memoryUsage: number;
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
	active: boolean;
}

const users = firekitCollection<User>('users');

// ❌ Avoid - Using any
const users = firekitCollection('users');
```

### 2. Optimize Queries

```typescript
// ✅ Good - Specific queries with limits
const recentPosts = firekitCollection<Post>(
	'posts',
	where('published', '==', true),
	orderBy('createdAt', 'desc'),
	limit(20)
);

// ❌ Avoid - Fetching all data
const allPosts = firekitCollection<Post>('posts');
```

### 3. Handle Loading States

```svelte
{#if collection.loading}
	<LoadingSpinner />
{:else if collection.error}
	<ErrorMessage error={collection.error} />
{:else if collection.empty}
	<EmptyState />
{:else}
	<DataList data={collection.data} />
{/if}
```

### 4. Use Caching Appropriately

```typescript
// For frequently accessed, rarely changed data
const userProfiles = firekitCollection<User>('users', {
	cache: { enabled: true, ttl: 300000 } // 5 minutes
});

// For real-time data, disable caching
const chatMessages = firekitCollection<Message>('messages', {
	cache: { enabled: false }
});
```

### 5. Clean Up Resources

```typescript
import { onDestroy } from 'svelte';

const posts = firekitCollection<Post>('posts');

onDestroy(() => {
	posts.dispose();
});
```

## API Reference

### Properties

- `data` - Collection data (reactive)
- `loading` - Loading state (reactive)
- `initialized` - Initialization state (reactive)
- `error` - Current error (reactive)
- `empty` - Empty state (reactive)
- `size` - Collection size (reactive)
- `lastUpdated` - Last update timestamp (reactive)
- `state` - Complete state object (reactive)
- `ref` - Firestore collection reference
- `queryReference` - Firestore query reference
- `path` - Collection path

### Methods

- `refresh()` - Refresh collection data
- `getFromServer()` - Fetch data from server
- `addConstraints(...constraints)` - Add query constraints
- `createQuery()` - Create query builder
- `withQuery(builder)` - Use query builder
- `filter(predicate)` - Filter data client-side
- `find(predicate)` - Find specific item
- `findById(id)` - Find item by ID
- `sort(compareFn)` - Sort data
- `paginate(page, pageSize)` - Paginate data
- `groupBy(field)` - Group data by field
- `unique(field)` - Get unique values
- `count(predicate?)` - Count items
- `some(predicate)` - Check if some items match
- `every(predicate)` - Check if all items match
- `setRealtimeMode(realtime)` - Toggle real-time mode
- `clearCache()` - Clear cache
- `getStats()` - Get performance statistics
- `resetStats()` - Reset statistics
- `waitForInitialization()` - Wait for initialization
- `dispose()` - Clean up resources

### Pagination Methods

- `nextPage()` - Load next page
- `previousPage()` - Load previous page
- `goToPage(page)` - Go to specific page
- `loadMore()` - Load more data (infinite scroll)

## Next Steps

- [Document Service](/docs/document) - Firestore document management
- [Mutations Service](/docs/mutations) - Document mutations and batch operations
- [Storage Service](/docs/storage) - File upload/download
- [Presence Service](/docs/presence) - User online/offline tracking
- [Analytics Service](/docs/analytics) - Event tracking
