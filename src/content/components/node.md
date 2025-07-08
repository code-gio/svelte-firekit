---
title: Node
description: Firebase Realtime Database node subscription component
---

# Node

The `Node` component provides real-time subscription to Firebase Realtime Database nodes with reactive state management. It automatically handles loading states, error handling, and data updates while providing a clean slot-based API for rendering node data.

## 🚀 Basic Usage

```svelte
<script>
	import { Node } from 'svelte-firekit';
</script>

<Node path="users/123" let:data let:ref let:database>
	<div class="user-profile">
		<h1>{data.name}</h1>
		<p>Email: {data.email}</p>
		<p>Status: {data.status}</p>
	</div>
</Node>
```

## 📋 Props

| Prop        | Type                                          | Required | Description                                 |
| ----------- | --------------------------------------------- | -------- | ------------------------------------------- |
| `path`      | `string`                                      | ✅       | Database reference path (e.g., 'users/123') |
| `startWith` | `any`                                         | ❌       | Initial value to use before node is fetched |
| `children`  | `Snippet<[any, DatabaseReference, Database]>` | ✅       | Content to render when node is loaded       |
| `loading`   | `Snippet<[]>`                                 | ❌       | Custom loading content                      |

## 🎯 Use Cases

### **User Profile Display**

Display real-time user profile data:

```svelte
<script>
	import { Node } from 'svelte-firekit';
</script>

<Node path="users/{userId}" let:data let:ref let:database>
	<div class="user-card">
		<div class="user-header">
			<img src={data.avatar} alt={data.name} class="avatar" />
			<div class="user-info">
				<h2>{data.name}</h2>
				<p>{data.email}</p>
				<span class="status {data.online ? 'online' : 'offline'}">
					{data.online ? '🟢 Online' : '🔴 Offline'}
				</span>
			</div>
		</div>

		<div class="user-details">
			<p><strong>Location:</strong> {data.location}</p>
			<p><strong>Last seen:</strong> {new Date(data.lastSeen).toLocaleString()}</p>
			<p><strong>Bio:</strong> {data.bio}</p>
		</div>
	</div>
</Node>
```

### **Real-time Chat Messages**

Display real-time chat messages:

```svelte
<script>
	import { Node } from 'svelte-firekit';
</script>

<Node path="chats/{chatId}/messages" let:data let:ref let:database>
	<div class="chat-messages">
		{#if data}
			{#each Object.entries(data) as [messageId, message]}
				<div class="message {message.userId === currentUserId ? 'own' : 'other'}">
					<div class="message-content">
						<p>{message.text}</p>
						<small>{new Date(message.timestamp).toLocaleTimeString()}</small>
					</div>
				</div>
			{/each}
		{:else}
			<p class="no-messages">No messages yet. Start the conversation!</p>
		{/if}
	</div>
</Node>
```

### **Game State Management**

Track real-time game state:

```svelte
<script>
	import { Node } from 'svelte-firekit';
</script>

<Node path="games/{gameId}" let:data let:ref let:database>
	<div class="game-status">
		<h2>Game: {data.name}</h2>
		<div class="game-info">
			<p><strong>Status:</strong> {data.status}</p>
			<p><strong>Players:</strong> {data.playerCount}/4</p>
			<p><strong>Current Turn:</strong> {data.currentPlayer}</p>
		</div>

		{#if data.status === 'waiting'}
			<div class="waiting-room">
				<h3>Waiting for players...</h3>
				<div class="player-list">
					{#each data.players as player}
						<div class="player">
							<span>{player.name}</span>
							{#if player.ready}
								<span class="ready">✓ Ready</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{:else if data.status === 'playing'}
			<div class="game-board">
				<!-- Game board content -->
			</div>
		{/if}
	</div>
</Node>
```

## 🔧 Slot Parameters

The `children` slot receives three parameters:

| Parameter  | Type                | Description                 |
| ---------- | ------------------- | --------------------------- |
| `data`     | `any`               | Node data from the database |
| `ref`      | `DatabaseReference` | Firebase Database reference |
| `database` | `Database`          | Firebase Database instance  |

### **Using Slot Parameters**

```svelte
<script>
	import { Node } from 'svelte-firekit';
	import type { DatabaseReference, Database } from 'firebase/database';
</script>

<Node path="users/{userId}" let:data let:ref let:database>
	{#snippet children(data: any, ref: DatabaseReference, database: Database)}
		<div class="user-details">
			<h1>User Profile</h1>
			<p><strong>Database Path:</strong> {ref.toString()}</p>
			<p><strong>User ID:</strong> {ref.key}</p>

			{#if data}
				<div class="user-data">
					<h2>{data.name}</h2>
					<p>Email: {data.email}</p>
					<p>Created: {new Date(data.createdAt).toLocaleDateString()}</p>
				</div>
			{:else}
				<p>No user data found</p>
			{/if}
		</div>
	{/snippet}
</Node>
```

## 🔧 Advanced Usage

### **Nested Data Access**

Access nested database structures:

```svelte
<script>
	import { Node } from 'svelte-firekit';
</script>

<Node path="users/{userId}/preferences" let:data let:ref let:database>
	<div class="user-preferences">
		<h3>User Preferences</h3>

		{#if data}
			<div class="preference-item">
				<label>
					<input
						type="checkbox"
						bindchecked={data.notifications}
						onchange={() => updatePreference(ref, 'notifications', $event.target.checked)}
					/>
					Email Notifications
				</label>
			</div>

			<div class="preference-item">
				<label>
					<input
						type="checkbox"
						bindchecked={data.darkMode}
						onchange={() => updatePreference(ref, 'darkMode', $event.target.checked)}
					/>
					Dark Mode
				</label>
			</div>

			<div class="preference-item">
				<label>
					Language:
					<select
						bindvalue={data.language}
						onchange={() => updatePreference(ref, 'language', $event.target.value)}
					>
						<option value="en">English</option>
						<option value="es">Spanish</option>
						<option value="fr">French</option>
					</select>
				</label>
			</div>
		{:else}
			<p>No preferences set</p>
		{/if}
	</div>
</Node>
```

### **Real-time Counters**

Display real-time counters and statistics:

```svelte
<script>
	import { Node } from 'svelte-firekit';
</script>

<Node path="stats/global" let:data let:ref let:database>
	<div class="stats-dashboard">
		<h2>Live Statistics</h2>

		<div class="stats-grid">
			<div class="stat-card">
				<h3>Total Users</h3>
				<p class="stat-number">{data?.totalUsers || 0}</p>
			</div>

			<div class="stat-card">
				<h3>Active Sessions</h3>
				<p class="stat-number">{data?.activeSessions || 0}</p>
			</div>

			<div class="stat-card">
				<h3>Messages Today</h3>
				<p class="stat-number">{data?.messagesToday || 0}</p>
			</div>

			<div class="stat-card">
				<h3>System Status</h3>
				<p class="stat-status {data?.systemStatus === 'healthy' ? 'healthy' : 'warning'}">
					{data?.systemStatus || 'Unknown'}
				</p>
			</div>
		</div>
	</div>
</Node>
```

### **Conditional Data Display**

Handle different data states:

```svelte
<script>
	import { Node } from 'svelte-firekit';
</script>

<Node path="orders/{orderId}" let:data let:ref let:database>
	{#if data}
		<div class="order-details">
			<h2>Order #{data.orderNumber}</h2>
			<p><strong>Status:</strong> {data.status}</p>
			<p><strong>Total:</strong> ${data.total}</p>

			{#if data.status === 'pending'}
				<div class="order-pending">
					<p>Your order is being processed...</p>
					<div class="progress-bar">
						<div class="progress-fill" style="width: 25%"></div>
					</div>
				</div>
			{:else if data.status === 'shipped'}
				<div class="order-shipped">
					<p>Order shipped on {new Date(data.shippedAt).toLocaleDateString()}</p>
					<p>Tracking: {data.trackingNumber}</p>
				</div>
			{:else if data.status === 'delivered'}
				<div class="order-delivered">
					<p>✅ Order delivered on {new Date(data.deliveredAt).toLocaleDateString()}</p>
				</div>
			{/if}
		</div>
	{:else}
		<div class="order-not-found">
			<h2>Order Not Found</h2>
			<p>The order you're looking for doesn't exist.</p>
		</div>
	{/if}
</Node>
```

## 🎨 Custom Styling

### **Real-time Status Indicators**

Style real-time status displays:

```svelte
<style>
	.status-indicator {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.status-online {
		background: #d1fae5;
		color: #065f46;
	}

	.status-offline {
		background: #fee2e2;
		color: #991b1b;
	}

	.status-away {
		background: #fef3c7;
		color: #92400e;
	}

	.real-time-update {
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.live-counter {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: center;
	}

	.counter-number {
		font-size: 2rem;
		font-weight: bold;
		margin: 0.5rem 0;
	}
</style>
```

### **Data Cards**

Style data display cards:

```svelte
<style>
	.data-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s;
	}

	.data-card:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.data-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.data-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.data-timestamp {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.data-content {
		color: #374151;
		line-height: 1.6;
	}

	.data-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		color: #6b7280;
	}

	.data-error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: center;
	}
</style>
```

## 🔍 Error Handling

### **Database Connection Errors**

Handle database connection issues:

```svelte
<script>
	import { Node } from 'svelte-firekit';
</script>

<Node path="users/{userId}" let:data let:ref let:database let:error>
	{#if error?.code === 'PERMISSION_DENIED'}
		<div class="permission-error">
			<h3>Access Denied</h3>
			<p>You don't have permission to view this data.</p>
			<button onclick={() => signIn()}>Sign In</button>
		</div>
	{:else if error?.code === 'DATABASE_NOT_FOUND'}
		<div class="database-error">
			<h3>Database Not Found</h3>
			<p>The database could not be found. Please check your configuration.</p>
		</div>
	{:else if error}
		<div class="general-error">
			<h3>Error Loading Data</h3>
			<p>{error.message}</p>
			<button onclick={() => window.location.reload()}>Retry</button>
		</div>
	{:else if data}
		<div class="user-data">
			<!-- User data content -->
		</div>
	{:else}
		<div class="no-data">
			<p>No data available</p>
		</div>
	{/if}
</Node>
```

### **Data Validation**

Validate data before display:

```svelte
<script>
	import { Node } from 'svelte-firekit';

	function validateUserData(data) {
		if (!data) return false;
		if (!data.name || !data.email) return false;
		return true;
	}
</script>

<Node path="users/{userId}" let:data let:ref let:database>
	{#if validateUserData(data)}
		<div class="valid-user-data">
			<h2>{data.name}</h2>
			<p>{data.email}</p>
			<!-- More user data -->
		</div>
	{:else}
		<div class="invalid-data">
			<h3>Invalid User Data</h3>
			<p>The user data is incomplete or corrupted.</p>
			<button onclick={() => ref.remove()}>Remove Invalid Data</button>
		</div>
	{/if}
</Node>
```

## 🔧 Performance Optimization

### **Conditional Loading**

Load nodes only when needed:

```svelte
<script>
	import { Node } from 'svelte-firekit';

	let shouldLoadUserData = false;
	let userId = 'user123';
</script>

<button onclick={() => (shouldLoadUserData = true)}> Load User Data </button>

{#if shouldLoadUserData}
	<Node path="users/{userId}" let:data let:ref let:database>
		<div class="user-profile">
			<h2>{data.name}</h2>
			<p>{data.email}</p>
		</div>
	</Node>
{/if}
```

### **Data Caching**

Use initial data to reduce loading time:

```svelte
<script>
	import { Node } from 'svelte-firekit';

	const initialUserData = {
		name: 'Loading...',
		email: 'loading@example.com',
		status: 'unknown'
	};
</script>

<Node path="users/{userId}" startWith={initialUserData} let:data let:ref let:database>
	<div class="user-profile">
		<h2>{data.name}</h2>
		<p>{data.email}</p>
		<p>Status: {data.status}</p>
	</div>
</Node>
```

## 🐛 Troubleshooting

### **Component Not Loading**

If the Node component doesn't load:

```svelte
<script>
	import { Node } from 'svelte-firekit';
	import { firebaseService } from 'svelte-firekit';

	// Debug database availability
	const database = firebaseService.getDatabaseInstance();
	$effect(() => {
		console.log('Database instance:', database);
		console.log('Node path:', nodePath);
	});
</script>

<Node path={nodePath} let:data let:ref let:database>
	{#snippet children(data, ref, database)}
		<div class="debug">
			<p>Database: {database ? 'Available' : 'Not available'}</p>
			<p>Path: {nodePath}</p>
			<p>Data: {JSON.stringify(data, null, 2)}</p>
			<p>Ref: {ref?.toString()}</p>
		</div>
	{/snippet}
</Node>
```

### **Data Not Updating**

If data doesn't update in real-time:

```svelte
<script>
	import { Node } from 'svelte-firekit';

	let nodePath = 'users/123';

	$effect(() => {
		console.log('Node path changed:', nodePath);
	});
</script>

<Node path={nodePath} let:data let:ref let:database>
	{#snippet children(data, ref, database)}
		<div class="debug-updates">
			<p>Current path: {nodePath}</p>
			<p>Data timestamp: {new Date().toISOString()}</p>
			<p>Data: {JSON.stringify(data, null, 2)}</p>
		</div>
	{/snippet}
</Node>
```

## 📚 Related Components

- [`NodeList`](./node-list.md) - List nodes in Realtime Database
- [`Doc`](./doc.md) - Firestore document subscription
- [`Collection`](./collection.md) - Firestore collection subscription

## 🔗 API Reference

### **Component Props**

```typescript
interface NodeProps {
	path: string; // Database reference path
	startWith?: any; // Initial data
	children: Snippet<[any, DatabaseReference, Database]>;
	loading?: Snippet<[]>;
}
```

### **Slot Parameters**

```typescript
// children slot parameters
data: any; // Node data from database
ref: DatabaseReference; // Firebase Database reference
database: Database; // Firebase Database instance
```

### **Database Reference Methods**

```typescript
// Common methods available on ref
ref.set(value); // Set node value
ref.update(updates); // Update specific fields
ref.remove(); // Delete node
ref.push(value); // Push to list
ref.once('value'); // Get value once
```

---

**Next**: [NodeList Component](./node-list.md)
