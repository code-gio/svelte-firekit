---
title: NodeList
description: Firebase Realtime Database list subscription component
---

# NodeList

The `NodeList` component provides real-time subscription to Firebase Realtime Database lists with reactive state management. It automatically handles loading states, error handling, and data updates while providing a clean slot-based API for rendering lists of nodes.

## 🚀 Basic Usage

```svelte
<script>
	import { NodeList } from 'svelte-firekit';
</script>

<NodeList path="users" let:data let:ref let:database>
	<h1>Users ({data.length})</h1>
	{#each data as user}
		<div class="user-item">
			<h3>{user.name}</h3>
			<p>{user.email}</p>
		</div>
	{/each}
</NodeList>
```

## 📋 Props

| Prop               | Type                                            | Required | Description                                 |
| ------------------ | ----------------------------------------------- | -------- | ------------------------------------------- |
| `path`             | `string`                                        | ✅       | Database reference path (e.g., 'users')     |
| `startWith`        | `any[]`                                         | ❌       | Initial array to use before list is fetched |
| `children`         | `Snippet<[any[], DatabaseReference, Database]>` | ✅       | Content to render when list is loaded       |
| `loading`          | `Snippet<[]>`                                   | ❌       | Custom loading content                      |
| `queryConstraints` | `any[]`                                         | ❌       | Query constraints for the list              |

## 🎯 Use Cases

### **User List Display**

Display a list of users with real-time updates:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';
</script>

<NodeList path="users" let:data let:ref let:database>
	<div class="users-list">
		<h1>Active Users ({data.length})</h1>
		<div class="users-grid">
			{#each data as user}
				<div class="user-card">
					<img src={user.avatar} alt={user.name} class="user-avatar" />
					<div class="user-info">
						<h3>{user.name}</h3>
						<p>{user.email}</p>
						<span class="status {user.online ? 'online' : 'offline'}">
							{user.online ? '🟢 Online' : '🔴 Offline'}
						</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</NodeList>
```

### **Real-time Chat Messages**

Display real-time chat messages in chronological order:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';
</script>

<NodeList path="chats/{chatId}/messages" let:data let:ref let:database>
	<div class="chat-container">
		<div class="messages-list">
			{#each data as message}
				<div class="message {message.userId === currentUserId ? 'own' : 'other'}">
					<div class="message-header">
						<span class="sender">{message.senderName}</span>
						<span class="timestamp">{new Date(message.timestamp).toLocaleTimeString()}</span>
					</div>
					<div class="message-content">
						<p>{message.text}</p>
					</div>
				</div>
			{/each}
		</div>

		{#if data.length === 0}
			<div class="no-messages">
				<p>No messages yet. Start the conversation!</p>
			</div>
		{/if}
	</div>
</NodeList>
```

### **Game Leaderboard**

Display a real-time game leaderboard:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';
</script>

<NodeList path="games/{gameId}/leaderboard" let:data let:ref let:database>
	<div class="leaderboard">
		<h2>Leaderboard</h2>
		<div class="leaderboard-list">
			{#each data as player, index}
				<div class="leaderboard-item {index < 3 ? 'top-three' : ''}">
					<div class="rank">#{index + 1}</div>
					<div class="player-info">
						<img src={player.avatar} alt={player.name} class="player-avatar" />
						<span class="player-name">{player.name}</span>
					</div>
					<div class="score">{player.score} points</div>
					<div class="status">
						{#if player.online}
							<span class="online">Playing</span>
						{:else}
							<span class="offline">Offline</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</NodeList>
```

## 🔧 Slot Parameters

The `children` slot receives three parameters:

| Parameter  | Type                | Description                          |
| ---------- | ------------------- | ------------------------------------ |
| `data`     | `any[]`             | Array of node data from the database |
| `ref`      | `DatabaseReference` | Firebase Database reference          |
| `database` | `Database`          | Firebase Database instance           |

### **Using Slot Parameters**

```svelte
<script>
	import { NodeList } from 'svelte-firekit';
	import type { DatabaseReference, Database } from 'firebase/database';
</script>

<NodeList path="posts" let:data let:ref let:database>
	{#snippet default(data: any[], ref: DatabaseReference, database: Database)}
		<div class="posts-container">
			<div class="posts-header">
				<h1>Posts ({data.length})</h1>
				<p>Database path: {ref.toString()}</p>
			</div>

			<div class="posts-list">
				{#each data as post, index}
					<article class="post">
						<h2>{post.title}</h2>
						<p>{post.content}</p>
						<div class="post-meta">
							<span>By {post.author}</span>
							<span>{new Date(post.createdAt).toLocaleDateString()}</span>
							<span>#{index + 1}</span>
						</div>
					</article>
				{/each}
			</div>
		</div>
	{/snippet}
</NodeList>
```

## 🔧 Advanced Usage

### **Filtered Lists**

Display filtered lists based on conditions:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';

	let currentUserId = 'user123';
</script>

<NodeList path="notifications" let:data let:ref let:database>
	<div class="notifications">
		<h2>Your Notifications</h2>

		{#if data.length > 0}
			{#each data.filter((n) => n.userId === currentUserId) as notification}
				<div class="notification {notification.read ? 'read' : 'unread'}">
					<div class="notification-icon">
						{#if notification.type === 'message'}
							💬
						{:else if notification.type === 'like'}
							❤️
						{:else if notification.type === 'follow'}
							👤
						{/if}
					</div>
					<div class="notification-content">
						<p>{notification.message}</p>
						<small>{new Date(notification.timestamp).toLocaleString()}</small>
					</div>
					{#if !notification.read}
						<button onclick={() => markAsRead(ref, notification.id)}> Mark as Read </button>
					{/if}
				</div>
			{/each}
		{:else}
			<p class="no-notifications">No notifications yet.</p>
		{/if}
	</div>
</NodeList>
```

### **Real-time Activity Feed**

Display real-time activity feed:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';
</script>

<NodeList path="activities" let:data let:ref let:database>
	<div class="activity-feed">
		<h2>Recent Activity</h2>

		<div class="activities">
			{#each data.slice(0, 20) as activity}
				<!-- Show last 20 activities -->
				<div class="activity-item">
					<div class="activity-avatar">
						<img src={activity.userAvatar} alt={activity.userName} />
					</div>
					<div class="activity-content">
						<p>
							<strong>{activity.userName}</strong>
							{activity.action}
							{#if activity.target}
								<strong>{activity.target}</strong>
							{/if}
						</p>
						<small>{formatTimeAgo(activity.timestamp)}</small>
					</div>
				</div>
			{/each}
		</div>

		{#if data.length > 20}
			<button onclick={() => loadMoreActivities()}> Load More Activities </button>
		{/if}
	</div>
</NodeList>
```

### **Shopping Cart Items**

Display real-time shopping cart:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';

	let cartId = 'cart123';
</script>

<NodeList path="carts/{cartId}/items" let:data let:ref let:database>
	<div class="shopping-cart">
		<h2>Shopping Cart ({data.length} items)</h2>

		{#if data.length > 0}
			<div class="cart-items">
				{#each data as item}
					<div class="cart-item">
						<img src={item.image} alt={item.name} class="item-image" />
						<div class="item-details">
							<h3>{item.name}</h3>
							<p>${item.price}</p>
							<div class="quantity-controls">
								<button onclick={() => updateQuantity(ref, item.id, item.quantity - 1)}>-</button>
								<span>{item.quantity}</span>
								<button onclick={() => updateQuantity(ref, item.id, item.quantity + 1)}>+</button>
							</div>
						</div>
						<button class="remove-btn" onclick={() => removeItem(ref, item.id)}> Remove </button>
					</div>
				{/each}
			</div>

			<div class="cart-summary">
				<p><strong>Total:</strong> ${calculateTotal(data)}</p>
				<button class="checkout-btn" onclick={() => checkout()}> Proceed to Checkout </button>
			</div>
		{:else}
			<div class="empty-cart">
				<p>Your cart is empty</p>
				<a href="/products">Continue Shopping</a>
			</div>
		{/if}
	</div>
</NodeList>
```

## 🎨 Custom Styling

### **List Grid Layout**

Style lists in a responsive grid:

```svelte
<style>
	.list-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		padding: 1rem;
	}

	.list-item {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.5rem;
		transition: all 0.2s;
	}

	.list-item:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.list-item-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.list-item-avatar {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		object-fit: cover;
	}

	.list-item-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.list-item-subtitle {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0;
	}
</style>
```

### **Real-time Updates Animation**

Add animations for real-time updates:

```svelte
<style>
	.real-time-list {
		position: relative;
	}

	.list-item {
		animation: slideIn 0.3s ease-out;
	}

	.list-item.new {
		animation: highlightNew 2s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes highlightNew {
		0% {
			background-color: #dbeafe;
			transform: scale(1.02);
		}
		100% {
			background-color: white;
			transform: scale(1);
		}
	}

	.live-indicator {
		position: absolute;
		top: 1rem;
		right: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #10b981;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.875rem;
	}

	.live-dot {
		width: 8px;
		height: 8px;
		background: white;
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
```

## 🔍 Error Handling

### **Database Connection Errors**

Handle database connection issues:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';
</script>

<NodeList path="users" let:data let:ref let:database let:error>
	{#if error?.code === 'PERMISSION_DENIED'}
		<div class="permission-error">
			<h3>Access Denied</h3>
			<p>You don't have permission to view this list.</p>
			<button onclick={() => signIn()}>Sign In</button>
		</div>
	{:else if error?.code === 'DATABASE_NOT_FOUND'}
		<div class="database-error">
			<h3>Database Not Found</h3>
			<p>The database could not be found. Please check your configuration.</p>
		</div>
	{:else if error}
		<div class="general-error">
			<h3>Error Loading List</h3>
			<p>{error.message}</p>
			<button onclick={() => window.location.reload()}>Retry</button>
		</div>
	{:else if data.length > 0}
		<div class="list-content">
			<!-- List content -->
		</div>
	{:else}
		<div class="empty-list">
			<p>No items found in this list.</p>
		</div>
	{/if}
</NodeList>
```

### **Empty List Handling**

Handle empty lists gracefully:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';
</script>

<NodeList path="posts" let:data let:ref let:database>
	<div class="posts-container">
		{#if data.length > 0}
			<h1>Posts ({data.length})</h1>
			<div class="posts-list">
				{#each data as post}
					<article class="post">
						<h2>{post.title}</h2>
						<p>{post.content}</p>
					</article>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-icon">📝</div>
				<h2>No Posts Yet</h2>
				<p>Be the first to create a post!</p>
				<button onclick={() => createPost()}>Create Post</button>
			</div>
		{/if}
	</div>
</NodeList>
```

## 🔧 Performance Optimization

### **Pagination**

Implement pagination for large lists:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';

	let pageSize = 10;
	let currentPage = 0;
</script>

<NodeList path="posts" let:data let:ref let:database>
	<div class="posts-container">
		<h1>Posts</h1>

		<div class="posts-list">
			{#each data.slice(currentPage * pageSize, (currentPage + 1) * pageSize) as post}
				<article class="post">
					<h2>{post.title}</h2>
					<p>{post.content}</p>
				</article>
			{/each}
		</div>

		<div class="pagination">
			<button disabled={currentPage === 0} onclick={() => currentPage--}> Previous </button>
			<span>Page {currentPage + 1} of {Math.ceil(data.length / pageSize)}</span>
			<button disabled={(currentPage + 1) * pageSize >= data.length} onclick={() => currentPage++}>
				Next
			</button>
		</div>
	</div>
</NodeList>
```

### **Virtual Scrolling**

Implement virtual scrolling for very large lists:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';

	let visibleItems = 20;
	let scrollTop = 0;
</script>

<NodeList path="messages" let:data let:ref let:database>
	<div class="virtual-list" onscroll={(e) => (scrollTop = e.target.scrollTop)}>
		<div class="list-container" style="height: {data.length * 60}px;">
			{#each data.slice(0, visibleItems) as message, index}
				<div class="message-item" style="position: absolute; top: {index * 60}px;">
					<p>{message.text}</p>
					<small>{new Date(message.timestamp).toLocaleTimeString()}</small>
				</div>
			{/each}
		</div>
	</div>
</NodeList>
```

## 🐛 Troubleshooting

### **Component Not Loading**

If the NodeList component doesn't load:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';
	import { firebaseService } from 'svelte-firekit';

	// Debug database availability
	const database = firebaseService.getDatabaseInstance();
	$effect(() => {
		console.log('Database instance:', database);
		console.log('List path:', listPath);
	});
</script>

<NodeList path={listPath} let:data let:ref let:database>
	{#snippet default(data, ref, database)}
		<div class="debug">
			<p>Database: {database ? 'Available' : 'Not available'}</p>
			<p>Path: {listPath}</p>
			<p>Data length: {data.length}</p>
			<p>Data: {JSON.stringify(data, null, 2)}</p>
			<p>Ref: {ref?.toString()}</p>
		</div>
	{/snippet}
</NodeList>
```

### **List Not Updating**

If the list doesn't update in real-time:

```svelte
<script>
	import { NodeList } from 'svelte-firekit';

	let listPath = 'users';

	$effect(() => {
		console.log('List path changed:', listPath);
		console.log('Current timestamp:', new Date().toISOString());
	});
</script>

<NodeList path={listPath} let:data let:ref let:database>
	{#snippet default(data, ref, database)}
		<div class="debug-updates">
			<p>Current path: {listPath}</p>
			<p>Update timestamp: {new Date().toISOString()}</p>
			<p>Items count: {data.length}</p>
			<p>First item: {JSON.stringify(data[0], null, 2)}</p>
		</div>
	{/snippet}
</NodeList>
```

## 📚 Related Components

- [`Node`](./node.md) - Single node subscription
- [`Collection`](./collection.md) - Firestore collection subscription
- [`Doc`](./doc.md) - Firestore document subscription

## 🔗 API Reference

### **Component Props**

```typescript
interface NodeListProps {
	path: string; // Database reference path
	startWith?: any[]; // Initial data array
	children: Snippet<[any[], DatabaseReference, Database]>;
	loading?: Snippet<[]>;
	queryConstraints?: any[]; // Query constraints
}
```

### **Slot Parameters**

```typescript
// children slot parameters
data: any[];                    // Array of node data
ref: DatabaseReference;         // Firebase Database reference
database: Database;             // Firebase Database instance
```

### **List Methods**

```typescript
// Common methods for list manipulation
ref.push(value); // Add new item to list
ref.child(key).remove(); // Remove specific item
ref.child(key).update(updates); // Update specific item
ref.orderByChild('field'); // Order list by field
ref.limitToFirst(count); // Limit list size
```

---

**Next**: [CustomGuard Component](./custom-guard.md)
