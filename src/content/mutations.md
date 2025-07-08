---
title: Mutations Service
description: Comprehensive CRUD operations for Firestore with validation, batch processing, and reactive state management
---

# Mutations Service

The `firekitDocMutations` service provides comprehensive CRUD operations for Firestore documents with validation, batch processing, error handling, and reactive state management using Svelte 5 runes.

## Overview

The mutations service provides:

- Complete CRUD operations (Create, Read, Update, Delete)
- Batch operations for multiple documents
- Data validation and sanitization
- Automatic timestamp management
- Error handling and retry mechanisms
- Performance analytics and monitoring
- Reactive state management
- Type-safe operations

## Quick Start

```svelte
<script>
	import { firekitDocMutations } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let title = '';
	let content = '';
	let loading = false;

	async function createPost() {
		loading = true;
		try {
			const result = await firekitDocMutations.add(
				'posts',
				{
					title,
					content,
					authorId: 'user123',
					published: false
				},
				{
					timestamps: true,
					validate: true
				}
			);

			console.log('Post created:', result.id);
			title = '';
			content = '';
		} catch (error) {
			console.error('Failed to create post:', error);
		} finally {
			loading = false;
		}
	}
</script>

<form onsubmit|preventDefault={createPost}>
	<Input bindvalue={title} placeholder="Post title" required />
	<Input bindvalue={content} placeholder="Post content" required />
	<Button type="submit" disabled={loading}>
		{loading ? 'Creating...' : 'Create Post'}
	</Button>
</form>
```

## Basic CRUD Operations

### Create Documents

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Basic document creation
const result = await firekitDocMutations.add('users', {
	name: 'John Doe',
	email: 'john@example.com',
	age: 30
});

console.log('Document created with ID:', result.id);

// Create with custom ID
const customResult = await firekitDocMutations.set('users/john123', {
	name: 'John Doe',
	email: 'john@example.com'
});

// Create with merge option
const mergeResult = await firekitDocMutations.set(
	'users/john123',
	{
		age: 31,
		lastUpdated: new Date()
	},
	{ merge: true }
);
```

### Read Documents

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Get single document
const user = await firekitDocMutations.get('users/123');
if (user.exists()) {
	console.log('User data:', user.data());
}

// Get multiple documents
const userIds = ['123', '456', '789'];
const users = await firekitDocMutations.getAll('users', userIds);

users.forEach((user) => {
	if (user.exists()) {
		console.log('User:', user.data());
	}
});
```

### Update Documents

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Update entire document
await firekitDocMutations.set('users/123', {
	name: 'John Doe',
	email: 'john@example.com',
	age: 30
});

// Update specific fields
await firekitDocMutations.update('users/123', {
	age: 31,
	lastUpdated: new Date()
});

// Update with validation
await firekitDocMutations.update(
	'users/123',
	{
		email: 'newemail@example.com'
	},
	{
		validate: true,
		validateFields: ['email']
	}
);
```

### Delete Documents

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Delete single document
await firekitDocMutations.delete('users/123');

// Delete with confirmation
const confirmed = await firekitDocMutations.delete('users/123', {
	requireConfirmation: true,
	confirmationMessage: 'Are you sure you want to delete this user?'
});

if (confirmed) {
	console.log('User deleted successfully');
}
```

## Advanced Operations

### Batch Operations

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Batch write operations
const batch = firekitDocMutations.batch();

// Add operations to batch
batch.add('users', { name: 'Alice', email: 'alice@example.com' });
batch.update('users/123', { age: 31 });
batch.delete('users/456');

// Execute batch
try {
	await batch.commit();
	console.log('Batch operations completed');
} catch (error) {
	console.error('Batch failed:', error);
}

// Batch with validation
const validatedBatch = firekitDocMutations.batch({
	validate: true,
	timestamps: true
});

validatedBatch.add('posts', {
	title: 'New Post',
	content: 'Post content',
	authorId: 'user123'
});

await validatedBatch.commit();
```

### Transaction Operations

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Run operations in transaction
const result = await firekitDocMutations.runTransaction(async (transaction) => {
	// Read operations
	const userDoc = await transaction.get('users/123');
	const userData = userDoc.data();

	// Update based on current data
	const newBalance = userData.balance + 100;

	// Write operations
	transaction.update('users/123', { balance: newBalance });
	transaction.add('transactions', {
		userId: '123',
		amount: 100,
		type: 'credit',
		timestamp: new Date()
	});

	return { newBalance };
});

console.log('Transaction completed, new balance:', result.newBalance);
```

### Array Operations

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Array union (add unique elements)
await firekitDocMutations.update('users/123', {
	tags: firekitDocMutations.arrayUnion('javascript', 'svelte')
});

// Array remove (remove elements)
await firekitDocMutations.update('users/123', {
	tags: firekitDocMutations.arrayRemove('old-tag')
});

// Increment numeric values
await firekitDocMutations.update('posts/123', {
	views: firekitDocMutations.increment(1),
	likes: firekitDocMutations.increment(5)
});
```

## Data Validation

### Schema Validation

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Define validation schema
const userSchema = {
	name: { type: 'string', required: true, minLength: 2 },
	email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
	age: { type: 'number', min: 0, max: 150 },
	verified: { type: 'boolean', default: false }
};

// Create with validation
const result = await firekitDocMutations.add(
	'users',
	{
		name: 'John Doe',
		email: 'john@example.com',
		age: 30
	},
	{
		validate: true,
		schema: userSchema
	}
);
```

### Custom Validation

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Custom validation function
const validateUser = (data: any) => {
	const errors = [];

	if (!data.name || data.name.length < 2) {
		errors.push('Name must be at least 2 characters');
	}

	if (!data.email || !data.email.includes('@')) {
		errors.push('Valid email is required');
	}

	if (data.age && (data.age < 0 || data.age > 150)) {
		errors.push('Age must be between 0 and 150');
	}

	if (errors.length > 0) {
		throw new Error(`Validation failed: ${errors.join(', ')}`);
	}

	return data;
};

// Use custom validation
await firekitDocMutations.add('users', userData, {
	validate: true,
	validator: validateUser
});
```

### Field-level Validation

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Validate specific fields
await firekitDocMutations.update(
	'users/123',
	{
		email: 'newemail@example.com',
		age: 31
	},
	{
		validate: true,
		validateFields: ['email', 'age'],
		schema: {
			email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
			age: { type: 'number', min: 0, max: 150 }
		}
	}
);
```

## Timestamp Management

### Automatic Timestamps

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Create with automatic timestamps
const result = await firekitDocMutations.add(
	'posts',
	{
		title: 'My Post',
		content: 'Post content'
	},
	{
		timestamps: true // Adds createdAt and updatedAt
	}
);

// Update with timestamp
await firekitDocMutations.update(
	'posts/123',
	{
		content: 'Updated content'
	},
	{
		timestamps: true // Updates updatedAt
	}
);
```

### Custom Timestamp Fields

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Custom timestamp field names
await firekitDocMutations.add(
	'posts',
	{
		title: 'My Post',
		content: 'Post content'
	},
	{
		timestamps: {
			createdAt: 'created',
			updatedAt: 'modified'
		}
	}
);
```

### Server Timestamps

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Use server timestamps
await firekitDocMutations.add('posts', {
	title: 'My Post',
	content: 'Post content',
	createdAt: firekitDocMutations.serverTimestamp(),
	updatedAt: firekitDocMutations.serverTimestamp()
});
```

## Error Handling

### Basic Error Handling

```typescript
import { firekitDocMutations } from 'svelte-firekit';

try {
	const result = await firekitDocMutations.add('users', userData);
	console.log('User created:', result.id);
} catch (error) {
	if (error.code === 'permission-denied') {
		console.error('Permission denied');
	} else if (error.code === 'not-found') {
		console.error('Document not found');
	} else {
		console.error('Operation failed:', error.message);
	}
}
```

### Retry Configuration

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Operation with retry
const result = await firekitDocMutations.add('users', userData, {
	retry: {
		enabled: true,
		maxAttempts: 3,
		delay: 1000,
		backoff: 'exponential'
	}
});
```

### Error Recovery

```typescript
import { firekitDocMutations } from 'svelte-firekit';

async function createUserWithRetry(userData: any) {
	let attempts = 0;
	const maxAttempts = 3;

	while (attempts < maxAttempts) {
		try {
			return await firekitDocMutations.add('users', userData);
		} catch (error) {
			attempts++;

			if (error.code === 'unavailable' && attempts < maxAttempts) {
				// Wait before retry
				await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
				continue;
			}

			throw error;
		}
	}
}
```

## Performance Analytics

### Operation Monitoring

```typescript
import { firekitDocMutations } from 'svelte-firekit';

// Monitor operation performance
const result = await firekitDocMutations.add('users', userData, {
	analytics: {
		enabled: true,
		operationName: 'create_user',
		trackPerformance: true
	}
});

// Access performance data
console.log('Operation duration:', result.performance?.duration);
console.log('Bytes written:', result.performance?.bytesWritten);
```

### Batch Performance

```typescript
import { firekitDocMutations } from 'svelte-firekit';

const batch = firekitDocMutations.batch({
	analytics: {
		enabled: true,
		operationName: 'batch_user_updates'
	}
});

// Add operations
for (let i = 0; i < 100; i++) {
	batch.update(`users/${i}`, { lastSeen: new Date() });
}

const result = await batch.commit();
console.log('Batch performance:', result.performance);
```

## Svelte Component Integration

### Form Component with Mutations

```svelte
<script>
	import { firekitDocMutations } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	export let collection: string;
	export let documentId?: string;

	let formData = {
		name: '',
		email: '',
		age: ''
	};
	let loading = false;
	let error = '';

	// Load existing data if editing
	$effect(async () => {
		if (documentId) {
			try {
				const doc = await firekitDocMutations.get(`${collection}/${documentId}`);
				if (doc.exists()) {
					formData = { ...doc.data() };
				}
			} catch (err) {
				error = 'Failed to load document';
			}
		}
	});

	async function save() {
		loading = true;
		error = '';

		try {
			if (documentId) {
				// Update existing document
				await firekitDocMutations.update(`${collection}/${documentId}`, formData, {
					timestamps: true,
					validate: true
				});
			} else {
				// Create new document
				const result = await firekitDocMutations.add(collection, formData, {
					timestamps: true,
					validate: true
				});
				documentId = result.id;
			}
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<form onsubmit|preventDefault={save} class="mutation-form">
	<div class="form-field">
		<label for="name">Name</label>
		<Input id="name" bindvalue={formData.name} required />
	</div>

	<div class="form-field">
		<label for="email">Email</label>
		<Input id="email" type="email" bindvalue={formData.email} required />
	</div>

	<div class="form-field">
		<label for="age">Age</label>
		<Input id="age" type="number" bindvalue={formData.age} />
	</div>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	<Button type="submit" disabled={loading}>
		{loading ? 'Saving...' : documentId ? 'Update' : 'Create'}
	</Button>
</form>

<style>
	.mutation-form {
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

	.error {
		color: #dc2626;
		font-size: 0.875rem;
	}
</style>
```

### Batch Operations Component

```svelte
<script>
	import { firekitDocMutations } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';

	let selectedUsers: string[] = [];
	let loading = false;
	let progress = 0;

	async function deleteSelected() {
		if (selectedUsers.length === 0) return;

		loading = true;
		progress = 0;

		try {
			const batch = firekitDocMutations.batch({
				analytics: { enabled: true, operationName: 'batch_delete_users' }
			});

			selectedUsers.forEach((userId) => {
				batch.delete(`users/${userId}`);
			});

			await batch.commit();
			selectedUsers = [];
			progress = 100;
		} catch (error) {
			console.error('Batch delete failed:', error);
		} finally {
			loading = false;
		}
	}

	async function updateSelected(field: string, value: any) {
		if (selectedUsers.length === 0) return;

		loading = true;
		progress = 0;

		try {
			const batch = firekitDocMutations.batch({
				timestamps: true
			});

			selectedUsers.forEach((userId) => {
				batch.update(`users/${userId}`, { [field]: value });
			});

			await batch.commit();
			progress = 100;
		} catch (error) {
			console.error('Batch update failed:', error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="batch-operations">
	<h3>Batch Operations</h3>

	{#if selectedUsers.length > 0}
		<p>Selected: {selectedUsers.length} users</p>

		<div class="batch-actions">
			<Button onclick={() => updateSelected('active', true)} disabled={loading}>
				Activate Selected
			</Button>
			<Button onclick={() => updateSelected('active', false)} disabled={loading}>
				Deactivate Selected
			</Button>
			<Button onclick={deleteSelected} disabled={loading} variant="destructive">
				Delete Selected
			</Button>
		</div>

		{#if loading}
			<div class="progress">
				<div class="progress-bar" style="width: {progress}%"></div>
			</div>
		{/if}
	{:else}
		<p>No users selected</p>
	{/if}
</div>

<style>
	.batch-operations {
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
	}

	.batch-actions {
		display: flex;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.progress {
		width: 100%;
		height: 4px;
		background: #e2e8f0;
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: #3b82f6;
		transition: width 0.3s ease;
	}
</style>
```

## Type Definitions

### Mutation Options

```typescript
interface MutationOptions {
	timestamps?:
		| boolean
		| {
				createdAt?: string;
				updatedAt?: string;
		  };
	validate?: boolean;
	schema?: ValidationSchema;
	validator?: (data: any) => any;
	validateFields?: string[];
	retry?: {
		enabled?: boolean;
		maxAttempts?: number;
		delay?: number;
		backoff?: 'linear' | 'exponential';
	};
	analytics?: {
		enabled?: boolean;
		operationName?: string;
		trackPerformance?: boolean;
	};
	requireConfirmation?: boolean;
	confirmationMessage?: string;
	merge?: boolean;
}
```

### Validation Schema

```typescript
interface ValidationSchema {
	[key: string]: {
		type: 'string' | 'number' | 'boolean' | 'array' | 'object';
		required?: boolean;
		minLength?: number;
		maxLength?: number;
		min?: number;
		max?: number;
		pattern?: RegExp;
		default?: any;
		validator?: (value: any) => boolean | string;
	};
}
```

### Batch Options

```typescript
interface BatchOptions extends MutationOptions {
	maxOperations?: number;
	analytics?: {
		enabled?: boolean;
		operationName?: string;
	};
}
```

## Best Practices

### Performance

1. **Use batch operations for multiple documents**

   ```typescript
   // Good: Use batch for multiple operations
   const batch = firekitDocMutations.batch();
   users.forEach((user) => batch.add('users', user));
   await batch.commit();

   // Avoid: Multiple individual operations
   for (const user of users) {
   	await firekitDocMutations.add('users', user);
   }
   ```

2. **Implement proper validation**

   ```typescript
   // Always validate user input
   await firekitDocMutations.add('users', userData, {
   	validate: true,
   	schema: userSchema
   });
   ```

3. **Use transactions for related operations**
   ```typescript
   // Use transactions when operations depend on each other
   await firekitDocMutations.runTransaction(async (transaction) => {
   	// Related operations here
   });
   ```

### Error Handling

1. **Handle specific error types**

   ```typescript
   try {
   	await firekitDocMutations.add('users', userData);
   } catch (error) {
   	switch (error.code) {
   		case 'permission-denied':
   			// Handle permission error
   			break;
   		case 'not-found':
   			// Handle not found error
   			break;
   		default:
   		// Handle other errors
   	}
   }
   ```

2. **Implement retry logic**
   ```typescript
   // Use retry for transient errors
   await firekitDocMutations.add('users', userData, {
   	retry: { enabled: true, maxAttempts: 3 }
   });
   ```

### Data Integrity

1. **Use timestamps for tracking**

   ```typescript
   // Always include timestamps for important data
   await firekitDocMutations.add('posts', postData, {
   	timestamps: true
   });
   ```

2. **Validate data before writing**
   ```typescript
   // Validate all user input
   const validatedData = validateUserInput(rawData);
   await firekitDocMutations.add('users', validatedData);
   ```

## API Reference

### Core Methods

- `add(collection, data, options?)` - Create new document
- `set(path, data, options?)` - Set document data
- `update(path, data, options?)` - Update document fields
- `delete(path, options?)` - Delete document
- `get(path)` - Get single document
- `getAll(collection, ids)` - Get multiple documents

### Batch Operations

- `batch(options?)` - Create batch operation
- `batch.add(collection, data)` - Add to batch
- `batch.update(path, data)` - Update in batch
- `batch.delete(path)` - Delete in batch
- `batch.commit()` - Execute batch

### Transaction Operations

- `runTransaction(updateFunction)` - Run transaction
- `transaction.get(path)` - Get in transaction
- `transaction.set(path, data)` - Set in transaction
- `transaction.update(path, data)` - Update in transaction
- `transaction.delete(path)` - Delete in transaction

### Utility Methods

- `arrayUnion(...elements)` - Array union operation
- `arrayRemove(...elements)` - Array remove operation
- `increment(value)` - Increment operation
- `serverTimestamp()` - Server timestamp

## Next Steps

- [Collection Service](/docs/collection) - Firestore collection management
- [Document Service](/docs/document) - Real-time document subscriptions
- [Storage Service](/docs/storage) - File upload/download
- [Presence Service](/docs/presence) - User online/offline tracking
- [Analytics Service](/docs/analytics) - Event tracking
