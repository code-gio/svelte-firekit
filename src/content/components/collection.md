---
title: Collection
description: Real-time Firestore collection subscription component
---

# Collection

The `Collection` component provides real-time Firestore collection subscriptions with reactive state management. It automatically handles loading states, error handling, and data updates while providing a clean slot-based API for rendering collections of documents.

## 🚀 Basic Usage

```svelte
<script>
	import { Collection } from 'svelte-firekit';
</script>

<Collection ref="posts" let:data let:ref let:firestore let:count>
	<h1>Posts ({count})</h1>
	{#each data as post}
		<article>
			<h2>{post.title}</h2>
			<p>{post.content}</p>
			<small>By {post.author}</small>
		</article>
	{/each}
</Collection>
```

## 📋 Props

| Prop               | Type                                                                         | Required | Description                                           |
| ------------------ | ---------------------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| `ref`              | `CollectionReference \| Query \| string`                                     | ✅       | Firestore collection reference, query, or path string |
| `startWith`        | `DocumentData[]`                                                             | ❌       | Initial data array to show while loading              |
| `children`         | `Snippet<[DocumentData[], CollectionReference \| Query, Firestore, number]>` | ✅       | Content to render with collection data                |
| `loading`          | `Snippet<[]>`                                                                | ❌       | Custom loading content                                |
| `queryConstraints` | `QueryConstraint[]`                                                          | ❌       | Query constraints to apply to the collection          |

## 🎯 Use Cases

### **Simple Collection Display**

Display a collection of documents with automatic updates:

```svelte
<script>
	import { Collection } from 'svelte-firekit';
</script>

<Collection ref="users" let:data let:ref let:firestore let:count>
	<h1>Users ({count})</h1>
	<div class="users-grid">
		{#each data as user}
			<div class="user-card">
				<img src={user.photoURL} alt={user.displayName} />
				<h3>{user.displayName}</h3>
				<p>{user.email}</p>
				<small>Joined: {new Date(user.createdAt).toLocaleDateString()}</small>
			</div>
		{/each}
	</div>
</Collection>
```

### **Collection with Query Constraints**

Apply filters and sorting to collections:

```svelte
<script>
	import { Collection } from 'svelte-firekit';
	import { where, orderBy, limit } from 'firebase/firestore';

	const queryConstraints = [
		where('published', '==', true),
		orderBy('createdAt', 'desc'),
		limit(10)
	];
</script>

<Collection ref="posts" {queryConstraints} let:data let:ref let:firestore let:count>
	<h1>Recent Posts ({count})</h1>
	{#each data as post}
		<article class="post">
			<h2>{post.title}</h2>
			<p>{post.excerpt}</p>
			<div class="post-meta">
				<span>By {post.author}</span>
				<span>{new Date(post.createdAt).toLocaleDateString()}</span>
			</div>
		</article>
	{/each}
</Collection>
```

### **Custom Loading State**

Show custom loading content while fetching data:

```svelte
<script>
	import { Collection } from 'svelte-firekit';
</script>

<Collection ref="posts" let:data let:ref let:firestore let:count>
	{#snippet loading()}
		<div class="loading-skeleton">
			{#each Array(5) as _}
				<div class="post-skeleton">
					<div class="title-skeleton"></div>
					<div class="content-skeleton"></div>
					<div class="meta-skeleton"></div>
				</div>
			{/each}
		</div>
	{/snippet}

	{#snippet default(data, ref, firestore, count)}
		<h1>Posts ({count})</h1>
		{#each data as post}
			<article>
				<h2>{post.title}</h2>
				<p>{post.content}</p>
			</article>
		{/each}
	{/snippet}
</Collection>
```

## 🔧 Slot Parameters

The `children` slot receives four parameters:

| Parameter   | Type                           | Description                           |
| ----------- | ------------------------------ | ------------------------------------- |
| `data`      | `DocumentData[]`               | Array of document data                |
| `ref`       | `CollectionReference \| Query` | Collection or query reference         |
| `firestore` | `Firestore`                    | Firestore instance                    |
| `count`     | `number`                       | Number of documents in the collection |

### **Using Slot Parameters**

```svelte
<script>
	import { Collection } from 'svelte-firekit';
	import type { DocumentData, CollectionReference, Query, Firestore } from 'firebase/firestore';
</script>

<Collection ref="posts" let:data let:ref let:firestore let:count>
	{#snippet default(data: DocumentData[], ref: CollectionReference | Query, firestore: Firestore, count: number)}
		<div class="collection-info">
			<h1>Posts Collection</h1>
			<p>Total documents: {count}</p>
			<p>Collection path: {ref.path}</p>
		</div>

		<div class="posts-list">
			{#each data as post, index}
				<article class="post">
					<h2>{post.title}</h2>
					<p>{post.content}</p>
					<small>Index: {index}</small>
				</article>
			{/each}
		</div>
	{/snippet}
</Collection>
```

## 🔧 Advanced Usage

### **Dynamic Query Constraints**

Use reactive query constraints:

```svelte
<script>
	import { Collection } from 'svelte-firekit';
	import { where, orderBy, limit } from 'firebase/firestore';

	let category = $state('all');
	let sortBy = $state('createdAt');
	let limitCount = $state(10);

	let queryConstraints = $derived([
		...(category !== 'all' ? [where('category', '==', category)] : []),
		orderBy(sortBy, 'desc'),
		limit(limitCount)
	]);
</script>

<div class="filters">
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

	<select bindvalue={limitCount}>
		<option value={5}>5 posts</option>
		<option value={10}>10 posts</option>
		<option value={20}>20 posts</option>
	</select>
</div>

<Collection ref="posts" {queryConstraints} let:data let:ref let:firestore let:count>
	<h1>Posts ({count})</h1>
	{#each data as post}
		<article>
			<h2>{post.title}</h2>
			<p>Category: {post.category}</p>
			<p>{post.content}</p>
		</article>
	{/each}
</Collection>
```

### **Collection with Initial Data**

Provide fallback data while loading:

```svelte
<script>
	import { Collection } from 'svelte-firekit';

	const initialPosts = [
		{
			title: 'Loading...',
			content: 'Please wait while we load the posts.',
			author: 'System',
			createdAt: new Date()
		}
	];
</script>

<Collection ref="posts" startWith={initialPosts} let:data let:ref let:firestore let:count>
	<h1>Posts ({count})</h1>
	{#each data as post}
		<article>
			<h2>{post.title}</h2>
			<p>{post.content}</p>
			<small>By {post.author}</small>
		</article>
	{/each}
</Collection>
```

### **Collection with Error Handling**

Handle errors gracefully:

```svelte
<script>
	import { Collection } from 'svelte-firekit';
</script>

<Collection ref="posts" let:data let:ref let:firestore let:count let:error let:loading>
	{#if loading}
		<div class="loading">Loading posts...</div>
	{:else if error}
		<div class="error">
			<h3>Error loading posts</h3>
			<p>{error.message}</p>
			<button onclick={() => window.location.reload()}> Retry </button>
		</div>
	{:else if data.length === 0}
		<div class="empty-state">
			<h3>No posts found</h3>
			<p>There are no posts in this collection yet.</p>
			<button onclick={() => createPost()}>Create First Post</button>
		</div>
	{:else}
		<h1>Posts ({count})</h1>
		{#each data as post}
			<article>
				<h2>{post.title}</h2>
				<p>{post.content}</p>
			</article>
		{/each}
	{/if}
</Collection>
```

## 🎨 Custom Styling

### **Collection Grid Layout**

Style collections in a grid format:

```svelte
<style>
	.collection-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		padding: 1rem;
	}

	.collection-item {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		transition: all 0.2s;
	}

	.collection-item:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.collection-loading {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
	}

	.collection-error {
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: center;
	}
</style>
```

### **Loading Skeleton**

Create loading skeleton animations:

```svelte
<style>
	.skeleton {
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
	}

	@keyframes loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.post-skeleton {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.title-skeleton {
		height: 1.5rem;
		width: 70%;
		margin-bottom: 0.5rem;
	}

	.content-skeleton {
		height: 1rem;
		width: 100%;
		margin-bottom: 0.25rem;
	}

	.content-skeleton:last-child {
		width: 60%;
	}
</style>
```

## 🔍 Error Handling

### **Permission Errors**

Handle access denied scenarios:

```svelte
<script>
	import { Collection } from 'svelte-firekit';
</script>

<Collection ref="private/posts" let:data let:ref let:firestore let:count let:error>
	{#if error?.code === 'permission-denied'}
		<div class="permission-error">
			<h3>Access Denied</h3>
			<p>You don't have permission to view this collection.</p>
			<button onclick={() => signIn()}>Sign In</button>
		</div>
	{:else if error}
		<div class="error">
			<h3>Error loading collection</h3>
			<p>{error.message}</p>
		</div>
	{:else}
		<div class="collection-contents">
			<!-- Collection content -->
		</div>
	{/if}
</Collection>
```

### **Empty Collections**

Handle empty collections gracefully:

```svelte
<script>
	import { Collection } from 'svelte-firekit';
</script>

<Collection ref="posts" let:data let:ref let:firestore let:count>
	{#if data.length === 0}
		<div class="empty-collection">
			<h3>No posts yet</h3>
			<p>This collection is empty. Create the first post to get started.</p>
			<button onclick={() => createPost()}>Create Post</button>
		</div>
	{:else}
		<h1>Posts ({count})</h1>
		{#each data as post}
			<article>
				<h2>{post.title}</h2>
				<p>{post.content}</p>
			</article>
		{/each}
	{/if}
</Collection>
```

## 🔧 Performance Optimization

### **Conditional Loading**

Load collections only when needed:

```svelte
<script>
	import { Collection } from 'svelte-firekit';

	let shouldLoadPosts = false;
	let category = 'tech';
</script>

<button onclick={() => (shouldLoadPosts = true)}> Load Posts </button>

{#if shouldLoadPosts}
	<Collection
		ref="posts"
		queryConstraints={[where('category', '==', category)]}
		let:data
		let:ref
		let:firestore
		let:count
	>
		<h1>Posts ({count})</h1>
		{#each data as post}
			<article>
				<h2>{post.title}</h2>
				<p>{post.content}</p>
			</article>
		{/each}
	</Collection>
{/if}
```

### **Pagination**

Implement pagination for large collections:

```svelte
<script>
	import { Collection } from 'svelte-firekit';
	import { orderBy, limit, startAfter } from 'firebase/firestore';

	let pageSize = 10;
	let lastDoc = null;
	let posts = [];

	function loadNextPage() {
		// Implementation for pagination
	}
</script>

<Collection
	ref="posts"
	queryConstraints={[orderBy('createdAt', 'desc'), limit(pageSize)]}
	let:data
	let:ref
	let:firestore
	let:count
>
	<h1>Posts ({count})</h1>
	{#each data as post}
		<article>
			<h2>{post.title}</h2>
			<p>{post.content}</p>
		</article>
	{/each}

	{#if data.length === pageSize}
		<button onclick={loadNextPage}>Load More</button>
	{/if}
</Collection>
```

## 🐛 Troubleshooting

### **Collection Not Updating**

If the collection doesn't update in real-time:

1. **Check Firestore rules** - Ensure read permissions are correct
2. **Verify query constraints** - Make sure constraints are valid
3. **Check network connectivity** - Ensure Firebase connection is active

### **Component Not Rendering**

If the component doesn't render:

```svelte
<script>
	import { Collection } from 'svelte-firekit';

	// Debug collection path
	let collectionPath = 'posts';
	$effect(() => {
		console.log('Collection path:', collectionPath);
	});
</script>

<Collection ref={collectionPath} let:data let:ref let:firestore let:count>
	{#snippet default(data, ref, firestore, count)}
		<div class="debug">
			<p>Path: {collectionPath}</p>
			<p>Data length: {data.length}</p>
			<p>Count: {count}</p>
			<p>Ref: {ref?.path}</p>
		</div>
	{/snippet}
</Collection>
```

## 📚 Related Components

- [`Doc`](./doc.md) - Firestore document subscription
- [`AuthGuard`](./auth-guard.md) - Route protection
- [`FirebaseApp`](./firebase-app.md) - Firebase initialization

## 🔗 API Reference

### **Component Props**

```typescript
interface CollectionProps {
	ref: CollectionReference | Query | string;
	startWith?: DocumentData[];
	children: Snippet<[DocumentData[], CollectionReference | Query, Firestore, number]>;
	loading?: Snippet<[]>;
	queryConstraints?: QueryConstraint[];
}
```

### **Slot Parameters**

```typescript
// children slot parameters
data: DocumentData[];                    // Array of document data
ref: CollectionReference | Query;        // Collection or query reference
firestore: Firestore;                    // Firestore instance
count: number;                           // Number of documents
```

### **Query Constraints**

```typescript
// Common query constraints
where(field, operator, value); // Filter documents
orderBy(field, direction); // Sort documents
limit(count); // Limit results
startAfter(doc); // Pagination
```

---

**Next**: [SignedIn Component](./signed-in.md)
