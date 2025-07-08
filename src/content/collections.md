---
title: Collection Service
description: Real-time Firestore collection subscriptions with advanced querying and reactive state management
---

# Collection Service

The `firekitCollection` service provides real-time Firestore collection subscriptions with advanced querying capabilities, pagination, caching, and reactive state management using Svelte 5 runes.

## Overview

The collection service provides:

- Real-time collection subscriptions
- Advanced querying with type safety
- Pagination and infinite scrolling
- Caching and performance optimization
- Data transformation and filtering
- Collection groups support
- Error handling and retry mechanisms
- Reactive state management

## Quick Start

```svelte
<script>
	import { firekitCollection, where, orderBy, limit } from 'svelte-firekit';

	// Simple collection subscription
	const posts = firekitCollection('posts');

	// Reactive collection state
	const postsData = $derived(posts.data);
	const postsLoading = $derived(posts.loading);
	const postsError = $derived(posts.error);

	// Watch for data changes
	$effect(() => {
		if (postsData) {
			console.log('Posts loaded:', postsData.length);
		}
	});
</script>

{#if postsLoading}
	<div>Loading posts...</div>
{:else if postsError}
	<div>Error: {postsError.message}</div>
{:else}
	<div>
		<h2>Posts ({postsData.length})</h2>
		{#each postsData as post}
			<article>
				<h3>{post.title}</h3>
				<p>{post.content}</p>
			</article>
		{/each}
	</div>
{/if}
```

## Basic Collection Usage

### Simple Collection

```typescript
import { firekitCollection } from 'svelte-firekit';

// Basic collection subscription
const users = firekitCollection<User>('users');

// Access reactive state
const usersData = $derived(users.data);
const usersLoading = $derived(users.loading);
const usersError = $derived(users.error);
```

### With Query Constraints

```typescript
import { firekitCollection, where, orderBy, limit } from 'svelte-firekit';

// Collection with query constraints
const activeUsers = firekitCollection<User>('users', [
	where('active', '==', true),
	orderBy('name'),
	limit(10)
]);

// Multiple conditions
const recentPosts = firekitCollection<Post>('posts', [
	where('published', '==', true),
	where('authorId', '==', userId),
	orderBy('createdAt', 'desc'),
	limit(20)
]);
```

### With Options

```typescript
import { firekitCollection } from 'svelte-firekit';

// Collection with options
const posts = firekitCollection<Post>('posts', {
	pagination: { enabled: true, pageSize: 20 },
	cache: { enabled: true, ttl: 300000 }, // 5 minutes
	transform: (doc) => ({
		...doc,
		formattedDate: new Date(doc.createdAt).toLocaleDateString()
	})
});
```

## Advanced Querying

### Complex Queries

```typescript
import { firekitCollection, where, orderBy, limit, startAfter } from 'svelte-firekit';

// Complex query with multiple conditions
const featuredPosts = firekitCollection<Post>('posts', [
	where('published', '==', true),
	where('featured', '==', true),
	where('category', 'in', ['tech', 'design']),
	orderBy('createdAt', 'desc'),
	orderBy('views', 'desc'),
	limit(10)
]);

// Query with array conditions
const postsWithTags = firekitCollection<Post>('posts', [
	where('tags', 'array-contains-any', ['javascript', 'svelte']),
	where('published', '==', true)
]);

// Query with date ranges
const recentPosts = firekitCollection<Post>('posts', [
	where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
	where('published', '==', true),
	orderBy('createdAt', 'desc')
]);
```

### Dynamic Queries

```svelte
<script>
	import { firekitCollection, where, orderBy } from 'svelte-firekit';

	let category = 'all';
	let sortBy = 'createdAt';

	// Dynamic collection based on reactive variables
	const posts = firekitCollection<Post>('posts', [
		...(category !== 'all' ? [where('category', '==', category)] : []),
		orderBy(sortBy, 'desc')
	]);

	const postsData = $derived(posts.data);
</script>

<div>
	<select bindvalue={category}>
		<option value="all">All Categories</option>
		<option value="tech">Technology</option>
		<option value="design">Design</option>
		<option value="business">Business</option>
	</select>

	<select bindvalue={sortBy}>
		<option value="createdAt">Date</option>
		<option value="title">Title</option>
		<option value="views">Views</option>
	</select>

	{#each postsData as post}
		<article>
			<h3>{post.title}</h3>
			<p>Category: {post.category}</p>
		</article>
	{/each}
</div>
```

## Pagination

### Basic Pagination

```typescript
import { firekitCollection } from 'svelte-firekit';

// Collection with pagination
const posts = firekitCollection<Post>('posts', {
	pagination: {
		enabled: true,
		pageSize: 10
	}
});

// Access pagination state
const currentPage = $derived(posts.pagination.currentPage);
const totalPages = $derived(posts.pagination.totalPages);
const hasNextPage = $derived(posts.pagination.hasNextPage);
const hasPreviousPage = $derived(posts.pagination.hasPreviousPage);

// Pagination methods
async function nextPage() {
	await posts.pagination.next();
}

async function previousPage() {
	await posts.pagination.previous();
}

async function goToPage(page: number) {
	await posts.pagination.goTo(page);
}
```

### Infinite Scrolling

```svelte
<script>
	import { firekitCollection, orderBy, limit } from 'svelte-firekit';
	import { onMount } from 'svelte';

	const posts = firekitCollection<Post>('posts', [orderBy('createdAt', 'desc'), limit(20)], {
		pagination: {
			enabled: true,
			pageSize: 20,
			mode: 'infinite'
		}
	});

	const postsData = $derived(posts.data);
	const isLoading = $derived(posts.loading);
	const hasMore = $derived(posts.pagination.hasNextPage);

	// Load more when scrolling
	async function loadMore() {
		if (hasMore && !isLoading) {
			await posts.pagination.next();
		}
	}

	// Intersection observer for infinite scroll
	let loadMoreTrigger: HTMLElement;

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore) {
					loadMore();
				}
			},
			{ threshold: 0.1 }
		);

		if (loadMoreTrigger) {
			observer.observe(loadMoreTrigger);
		}

		return () => observer.disconnect();
	});
</script>

<div class="posts-container">
	{#each postsData as post}
		<article>
			<h3>{post.title}</h3>
			<p>{post.content}</p>
		</article>
	{/each}

	{#if isLoading}
		<div class="loading">Loading more posts...</div>
	{/if}

	{#if hasMore}
		<div bindthis={loadMoreTrigger} class="load-more-trigger"></div>
	{/if}
</div>
```

## Caching

### Cache Configuration

```typescript
import { firekitCollection } from 'svelte-firekit';

// Collection with caching
const posts = firekitCollection<Post>('posts', {
	cache: {
		enabled: true,
		ttl: 300000, // 5 minutes
		maxSize: 100, // Maximum cached documents
		strategy: 'memory' // 'memory' | 'localStorage' | 'sessionStorage'
	}
});

// Check cache status
const isCached = $derived(posts.cache.isCached);
const cacheSize = $derived(posts.cache.size);
const cacheHitRate = $derived(posts.cache.hitRate);

// Cache methods
async function refreshCache() {
	await posts.cache.refresh();
}

async function clearCache() {
	await posts.cache.clear();
}
```

### Cache Strategies

```typescript
// Memory cache (default)
const memoryCache = firekitCollection<Post>('posts', {
	cache: { enabled: true, strategy: 'memory' }
});

// Local storage cache
const localStorageCache = firekitCollection<Post>('posts', {
	cache: { enabled: true, strategy: 'localStorage' }
});

// Session storage cache
const sessionStorageCache = firekitCollection<Post>('posts', {
	cache: { enabled: true, strategy: 'sessionStorage' }
});
```

## Data Transformation

### Transform Functions

```typescript
import { firekitCollection } from 'svelte-firekit';

// Transform data on the fly
const posts = firekitCollection<Post>('posts', {
	transform: (doc) => ({
		...doc,
		formattedDate: new Date(doc.createdAt).toLocaleDateString(),
		excerpt: doc.content.substring(0, 150) + '...',
		readTime: Math.ceil(doc.content.length / 200) // ~200 words per minute
	})
});

// Transform with async operations
const postsWithAuthor = firekitCollection<Post>('posts', {
	transform: async (doc) => {
		const author = await getUser(doc.authorId);
		return {
			...doc,
			author: author
		};
	}
});
```

### Filter Functions

```typescript
import { firekitCollection } from 'svelte-firekit';

// Filter data after fetching
const publishedPosts = firekitCollection<Post>('posts', {
	filter: (doc) => doc.published === true
});

// Complex filtering
const recentPublishedPosts = firekitCollection<Post>('posts', {
	filter: (doc) => {
		const isPublished = doc.published === true;
		const isRecent = new Date(doc.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		return isPublished && isRecent;
	}
});
```

## Collection Groups

### Basic Collection Group

```typescript
import { firekitCollectionGroup } from 'svelte-firekit';

// Query across all subcollections with the same name
const allComments = firekitCollectionGroup<Comment>('comments', {
	transform: (doc) => ({
		...doc,
		path: doc.ref.path
	})
});
```

### Collection Group with Queries

```typescript
import { firekitCollectionGroup, where, orderBy } from 'svelte-firekit';

// Collection group with constraints
const recentComments = firekitCollectionGroup<Comment>(
	'comments',
	where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
	orderBy('createdAt', 'desc'),
	{
		transform: (doc) => ({
			...doc,
			path: doc.ref.path,
			parentType: doc.ref.parent.parent?.id || 'unknown'
		})
	}
);
```

## Performance Optimization

### Lazy Loading

```svelte
<script>
	import { firekitCollection } from 'svelte-firekit';

	let shouldLoad = false;

	// Lazy load collection
	const posts = firekitCollection<Post>('posts', {
		lazy: true, // Don't load until explicitly requested
		pageSize: 10
	});

	async function loadPosts() {
		shouldLoad = true;
		await posts.load();
	}
</script>

{#if !shouldLoad}
	<button onclick={loadPosts}>Load Posts</button>
{:else if posts.loading}
	<div>Loading posts...</div>
{:else}
	{#each posts.data as post}
		<article>{post.title}</article>
	{/each}
{/if}
```

### Virtual Scrolling

```svelte
<script>
	import { firekitCollection } from 'svelte-firekit';
	import { VirtualList } from 'svelte-virtual-list';

	const posts = firekitCollection<Post>('posts', {
		pagination: {
			enabled: true,
			pageSize: 100,
			mode: 'virtual'
		}
	});

	const postsData = $derived(posts.data);
</script>

<VirtualList items={postsData} let:item>
	<article>
		<h3>{item.title}</h3>
		<p>{item.content}</p>
	</article>
</VirtualList>
```

## Error Handling

### Error States

```svelte
<script>
	import { firekitCollection } from 'svelte-firekit';

	const posts = firekitCollection<Post>('posts');
	const error = $derived(posts.error);
	const hasError = $derived(!!error);

	async function retry() {
		await posts.refresh();
	}
</script>

{#if hasError}
	<div class="error-message">
		<h3>Error loading posts</h3>
		<p>{error.message}</p>
		<button onclick={retry}>Retry</button>
	</div>
{:else}
	<!-- Normal content -->
{/if}
```

### Retry Configuration

```typescript
import { firekitCollection } from 'svelte-firekit';

// Collection with retry configuration
const posts = firekitCollection<Post>('posts', {
	retry: {
		enabled: true,
		maxAttempts: 3,
		delay: 1000, // 1 second
		backoff: 'exponential' // 'linear' | 'exponential'
	}
});
```

## Svelte Component Integration

### Collection List Component

```svelte
<script>
	import { firekitCollection, where, orderBy } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';

	export let collectionPath: string;
	export let queryConstraints = [];
	export let pageSize = 10;

	const collection = firekitCollection(collectionPath, ...queryConstraints, {
		pagination: { enabled: true, pageSize }
	});

	const data = $derived(collection.data);
	const loading = $derived(collection.loading);
	const error = $derived(collection.error);
	const hasMore = $derived(collection.pagination.hasNextPage);

	async function loadMore() {
		if (hasMore && !loading) {
			await collection.pagination.next();
		}
	}
</script>

<div class="collection-list">
	{#if loading && !data.length}
		{#each Array(pageSize) as _}
			<Skeleton class="h-20 w-full" />
		{/each}
	{:else if error}
		<div class="error">
			<p>{error.message}</p>
			<Button onclick={() => collection.refresh()}>Retry</Button>
		</div>
	{:else}
		{#each data as item}
			<slot {item} />
		{/each}

		{#if hasMore}
			<Button onclick={loadMore} disabled={loading}>
				{loading ? 'Loading...' : 'Load More'}
			</Button>
		{/if}
	{/if}
</div>
```

### Search Component

```svelte
<script>
	import { firekitCollection, where, orderBy } from 'svelte-firekit';
	import { Input } from '$lib/components/ui/input';
	import { debounce } from 'lodash-es';

	let searchTerm = '';
	let debouncedSearch = '';

	// Debounce search to avoid too many queries
	$effect(() => {
		const timeout = setTimeout(() => {
			debouncedSearch = searchTerm;
		}, 300);

		return () => clearTimeout(timeout);
	});

	// Dynamic collection based on search
	const posts = firekitCollection<Post>(
		'posts',
		...(debouncedSearch
			? [where('title', '>=', debouncedSearch), where('title', '<=', debouncedSearch + '\uf8ff')]
			: []),
		orderBy('title')
	);

	const postsData = $derived(posts.data);
	const loading = $derived(posts.loading);
</script>

<div class="search-container">
	<Input type="text" bindvalue={searchTerm} placeholder="Search posts..." />

	{#if loading}
		<div>Searching...</div>
	{:else}
		<div class="results">
			{#each postsData as post}
				<article>
					<h3>{post.title}</h3>
					<p>{post.content}</p>
				</article>
			{/each}
		</div>
	{/if}
</div>
```

## Type Definitions

### Collection Options

```typescript
interface CollectionOptions<T = any> {
	pagination?: {
		enabled?: boolean;
		pageSize?: number;
		mode?: 'page' | 'infinite' | 'virtual';
		initialPage?: number;
	};
	cache?: {
		enabled?: boolean;
		ttl?: number;
		maxSize?: number;
		strategy?: 'memory' | 'localStorage' | 'sessionStorage';
	};
	transform?: (doc: T) => T | Promise<T>;
	filter?: (doc: T) => boolean;
	retry?: {
		enabled?: boolean;
		maxAttempts?: number;
		delay?: number;
		backoff?: 'linear' | 'exponential';
	};
	lazy?: boolean;
	realtime?: boolean;
}
```

### Collection State

```typescript
interface CollectionState<T = any> {
	data: T[];
	loading: boolean;
	error: Error | null;
	pagination: {
		currentPage: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
		pageSize: number;
		totalCount: number;
	};
	cache: {
		isCached: boolean;
		size: number;
		hitRate: number;
	};
}
```

## Best Practices

### Performance

1. **Use appropriate page sizes**

   ```typescript
   // Good for lists
   const posts = firekitCollection<Post>('posts', { pagination: { pageSize: 20 } });

   // Good for grids
   const products = firekitCollection<Product>('products', { pagination: { pageSize: 12 } });
   ```

2. **Implement proper caching**

   ```typescript
   // Cache frequently accessed data
   const userPosts = firekitCollection<Post>('posts', {
   	cache: { enabled: true, ttl: 600000 } // 10 minutes
   });
   ```

3. **Use lazy loading for large collections**
   ```typescript
   const allUsers = firekitCollection<User>('users', { lazy: true });
   ```

### Error Handling

1. **Provide fallback UI**

   ```svelte
   {#if error}
   	<div class="error-state">
   		<p>Unable to load data</p>
   		<button onclick={() => collection.refresh()}>Retry</button>
   	</div>
   {/if}
   ```

2. **Handle empty states**
   ```svelte
   {#if data.length === 0 && !loading}
   	<div class="empty-state">
   		<p>No items found</p>
   	</div>
   {/if}
   ```

### Query Optimization

1. **Use compound indexes**

   ```typescript
   // Ensure you have a compound index for this query
   const posts = firekitCollection<Post>(
   	'posts',
   	where('category', '==', 'tech'),
   	where('published', '==', true),
   	orderBy('createdAt', 'desc')
   );
   ```

2. **Limit query results**
   ```typescript
   // Always limit large collections
   const recentPosts = firekitCollection<Post>('posts', orderBy('createdAt', 'desc'), limit(50));
   ```

## API Reference

### Core Methods

- `firekitCollection(path, ...constraints, options?)` - Create collection subscription
- `firekitCollectionGroup(name, ...constraints, options?)` - Create collection group subscription
- `firekitCollectionOnce(path, ...constraints)` - One-time collection fetch

### Collection Methods

- `refresh()` - Refresh collection data
- `load()` - Load collection (for lazy collections)
- `unsubscribe()` - Unsubscribe from real-time updates
- `pagination.next()` - Load next page
- `pagination.previous()` - Load previous page
- `pagination.goTo(page)` - Go to specific page
- `cache.refresh()` - Refresh cache
- `cache.clear()` - Clear cache

### Query Constraints

- `where(field, op, value)` - Filter documents
- `orderBy(field, direction?)` - Sort documents
- `limit(count)` - Limit results
- `startAfter(doc)` - Start after specific document
- `startAt(doc)` - Start at specific document
- `endBefore(doc)` - End before specific document
- `endAt(doc)` - End at specific document
