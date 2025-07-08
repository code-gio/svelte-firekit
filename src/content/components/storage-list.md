---
title: StorageList
description: Firebase Storage directory listing component
---

# StorageList

The `StorageList` component provides real-time listing of Firebase Storage files and directories. It automatically handles loading states, error handling, and updates when storage contents change.

## 🚀 Basic Usage

```svelte
<script>
	import { StorageList } from 'svelte-firekit';
</script>

<StorageList path="uploads/" let:items let:prefixes let:loading let:error>
	{#if loading}
		<p>Loading files...</p>
	{:else if error}
		<p>Error: {error.message}</p>
	{:else}
		<h2>Files ({items.length})</h2>
		{#each items as item}
			<div class="file-item">
				<span>{item.name}</span>
				<span>{item.size} bytes</span>
			</div>
		{/each}

		<h2>Folders ({prefixes.length})</h2>
		{#each prefixes as prefix}
			<div class="folder-item">
				<span>{prefix.name}</span>
			</div>
		{/each}
	{/if}
</StorageList>
```

## 📋 Props

| Prop       | Type                                                                        | Required | Description                         |
| ---------- | --------------------------------------------------------------------------- | -------- | ----------------------------------- |
| `path`     | `string`                                                                    | ✅       | Storage directory path to list      |
| `children` | `Snippet<[StorageReference[], StorageReference[], boolean, Error \| null]>` | ✅       | Content to render with storage data |

## 🎯 Use Cases

### **Simple File Browser**

Display files and folders in a directory:

```svelte
<script>
	import { StorageList } from 'svelte-firekit';
</script>

<StorageList path="uploads/" let:items let:prefixes let:loading let:error>
	{#if loading}
		<div class="loading">Loading storage contents...</div>
	{:else if error}
		<div class="error">Error: {error.message}</div>
	{:else}
		<div class="storage-browser">
			<div class="files-section">
				<h3>Files ({items.length})</h3>
				{#each items as item}
					<div class="file-item">
						<Icon name="file" />
						<span>{item.name}</span>
						<small>{item.size} bytes</small>
					</div>
				{/each}
			</div>

			<div class="folders-section">
				<h3>Folders ({prefixes.length})</h3>
				{#each prefixes as prefix}
					<div class="folder-item">
						<Icon name="folder" />
						<span>{prefix.name}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</StorageList>
```

### **File Gallery**

Display images in a grid layout:

```svelte
<script>
	import { StorageList, DownloadURL } from 'svelte-firekit';
</script>

<StorageList path="images/" let:items let:prefixes let:loading let:error>
	{#if loading}
		<div class="loading">Loading images...</div>
	{:else if error}
		<div class="error">Error: {error.message}</div>
	{:else}
		<div class="image-gallery">
			{#each items as item}
				{#if item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)}
					<div class="image-item">
						<DownloadURL path={item.fullPath} let:url let:loading let:error>
							{#if loading}
								<div class="image-placeholder">Loading...</div>
							{:else if url}
								<img src={url} alt={item.name} />
							{:else}
								<div class="image-error">Failed to load</div>
							{/if}
						</DownloadURL>
						<p>{item.name}</p>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</StorageList>
```

### **Nested Directory Navigation**

Navigate through nested directories:

```svelte
<script>
	import { StorageList } from 'svelte-firekit';

	let currentPath = 'uploads/';

	function navigateToFolder(folderPath) {
		currentPath = folderPath;
	}

	function goBack() {
		const parts = currentPath.split('/').filter(Boolean);
		parts.pop();
		currentPath = parts.length > 0 ? parts.join('/') + '/' : '';
	}
</script>

<div class="storage-navigator">
	<div class="breadcrumb">
		<button onclick={goBack} disabled={currentPath === ''}> ← Back </button>
		<span>Current: {currentPath}</span>
	</div>

	<StorageList path={currentPath} let:items let:prefixes let:loading let:error>
		{#if loading}
			<div class="loading">Loading...</div>
		{:else if error}
			<div class="error">Error: {error.message}</div>
		{:else}
			<div class="storage-contents">
				{#each prefixes as prefix}
					<button class="folder-button" onclick={() => navigateToFolder(prefix.fullPath)}>
						📁 {prefix.name}
					</button>
				{/each}

				{#each items as item}
					<div class="file-item">
						📄 {item.name}
					</div>
				{/each}
			</div>
		{/if}
	</StorageList>
</div>
```

## 🔧 Slot Parameters

The `children` slot receives four parameters:

| Parameter  | Type                 | Description                           |
| ---------- | -------------------- | ------------------------------------- |
| `items`    | `StorageReference[]` | Array of file references              |
| `prefixes` | `StorageReference[]` | Array of folder references            |
| `loading`  | `boolean`            | Whether the list is currently loading |
| `error`    | `Error \| null`      | Error object if listing failed        |

### **Using Slot Parameters**

```svelte
<script>
	import { StorageList } from 'svelte-firekit';
	import type { StorageReference } from 'firebase/storage';
</script>

<StorageList path="uploads/" let:items let:prefixes let:loading let:error>
	{#snippet default(items: StorageReference[], prefixes: StorageReference[], loading: boolean, error: Error | null)}
		{#if loading}
			<div class="loading">Loading storage contents...</div>
		{:else if error}
			<div class="error">
				<h3>Error loading storage</h3>
				<p>{error.message}</p>
			</div>
		{:else}
			<div class="storage-listing">
				<div class="files">
					<h3>Files ({items.length})</h3>
					{#each items as item}
						<div class="file">
							<span>{item.name}</span>
							<small>Path: {item.fullPath}</small>
						</div>
					{/each}
				</div>

				<div class="folders">
					<h3>Folders ({prefixes.length})</h3>
					{#each prefixes as prefix}
						<div class="folder">
							<span>{prefix.name}</span>
							<small>Path: {prefix.fullPath}</small>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/snippet}
</StorageList>
```

## 🔧 Advanced Usage

### **File Type Filtering**

Filter files by type or extension:

```svelte
<script>
	import { StorageList } from 'svelte-firekit';

	function filterByType(items, allowedTypes) {
		return items.filter((item) =>
			allowedTypes.some((type) => item.name.toLowerCase().endsWith(type))
		);
	}

	const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
	const documentTypes = ['.pdf', '.doc', '.docx', '.txt'];
</script>

<StorageList path="uploads/" let:items let:prefixes let:loading let:error>
	{#if loading}
		<div class="loading">Loading...</div>
	{:else if error}
		<div class="error">Error: {error.message}</div>
	{:else}
		<div class="filtered-listing">
			<div class="images">
				<h3>Images</h3>
				{#each filterByType(items, imageTypes) as item}
					<div class="image-item">
						<img src={item.fullPath} alt={item.name} />
						<p>{item.name}</p>
					</div>
				{/each}
			</div>

			<div class="documents">
				<h3>Documents</h3>
				{#each filterByType(items, documentTypes) as item}
					<div class="document-item">
						<span>{item.name}</span>
						<a href={item.fullPath} download>Download</a>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</StorageList>
```

### **File Size Display**

Show file sizes in human-readable format:

```svelte
<script>
	import { StorageList } from 'svelte-firekit';

	function formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
</script>

<StorageList path="uploads/" let:items let:prefixes let:loading let:error>
	{#if loading}
		<div class="loading">Loading...</div>
	{:else if error}
		<div class="error">Error: {error.message}</div>
	{:else}
		<div class="file-list">
			{#each items as item}
				<div class="file-item">
					<div class="file-info">
						<span class="file-name">{item.name}</span>
						<span class="file-size">{formatFileSize(item.size)}</span>
					</div>
					<div class="file-actions">
						<button onclick={() => downloadFile(item)}>Download</button>
						<button onclick={() => deleteFile(item)}>Delete</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</StorageList>
```

### **Search and Filter**

Add search functionality to file listings:

```svelte
<script>
	import { StorageList } from 'svelte-firekit';

	let searchTerm = '';

	function filterFiles(items, search) {
		if (!search) return items;
		return items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
	}
</script>

<div class="file-browser">
	<div class="search-bar">
		<input type="text" placeholder="Search files..." bindvalue={searchTerm} />
	</div>

	<StorageList path="uploads/" let:items let:prefixes let:loading let:error>
		{#if loading}
			<div class="loading">Loading...</div>
		{:else if error}
			<div class="error">Error: {error.message}</div>
		{:else}
			<div class="search-results">
				{#each filterFiles(items, searchTerm) as item}
					<div class="file-item">
						<span>{item.name}</span>
						<small>{item.size} bytes</small>
					</div>
				{/each}

				{#if filterFiles(items, searchTerm).length === 0 && searchTerm}
					<p>No files found matching "{searchTerm}"</p>
				{/if}
			</div>
		{/if}
	</StorageList>
</div>
```

## 🎨 Custom Styling

### **File List Styling**

Style the file listing components:

```svelte
<style>
	:global(.storage-list) {
		@apply space-y-4;
	}

	:global(.file-item) {
		@apply flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50;
	}

	:global(.folder-item) {
		@apply flex cursor-pointer items-center rounded-lg border p-3 hover:bg-blue-50;
	}

	:global(.file-name) {
		@apply font-medium text-gray-900;
	}

	:global(.file-size) {
		@apply text-sm text-gray-500;
	}

	:global(.storage-loading) {
		@apply flex items-center justify-center p-8;
	}

	:global(.storage-error) {
		@apply rounded border border-red-200 bg-red-50 p-4 text-red-700;
	}
</style>
```

### **Grid Layout**

Create a grid layout for file thumbnails:

```svelte
<style>
	.file-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		padding: 1rem;
	}

	.file-card {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		text-align: center;
		transition: all 0.2s;
	}

	.file-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.file-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.file-name {
		font-size: 0.875rem;
		color: #374151;
		word-break: break-word;
	}
</style>
```

## 🔍 Error Handling

### **Permission Errors**

Handle access denied scenarios:

```svelte
<script>
	import { StorageList } from 'svelte-firekit';
</script>

<StorageList path="private/" let:items let:prefixes let:loading let:error>
	{#if error?.code === 'storage/unauthorized'}
		<div class="permission-error">
			<h3>Access Denied</h3>
			<p>You don't have permission to access this storage location.</p>
			<button onclick={() => signIn()}>Sign In</button>
		</div>
	{:else if error}
		<div class="error">
			<h3>Error loading storage</h3>
			<p>{error.message}</p>
		</div>
	{:else if !loading}
		<div class="storage-contents">
			<!-- File listing content -->
		</div>
	{/if}
</StorageList>
```

### **Empty Directory**

Handle empty directories gracefully:

```svelte
<script>
	import { StorageList } from 'svelte-firekit';
</script>

<StorageList path="uploads/" let:items let:prefixes let:loading let:error>
	{#if loading}
		<div class="loading">Loading...</div>
	{:else if error}
		<div class="error">Error: {error.message}</div>
	{:else if items.length === 0 && prefixes.length === 0}
		<div class="empty-state">
			<h3>No files found</h3>
			<p>This directory is empty. Upload some files to get started.</p>
			<button onclick={() => uploadFiles()}>Upload Files</button>
		</div>
	{:else}
		<div class="storage-contents">
			<!-- File listing content -->
		</div>
	{/if}
</StorageList>
```

## 🔧 Performance Optimization

### **Lazy Loading**

Load storage contents only when needed:

```svelte
<script>
	import { StorageList } from 'svelte-firekit';

	let shouldLoadStorage = false;
	let storagePath = 'uploads/';
</script>

<button onclick={() => (shouldLoadStorage = true)}> Load Storage Contents </button>

{#if shouldLoadStorage}
	<StorageList path={storagePath} let:items let:prefixes let:loading let:error>
		{#if loading}
			<div class="loading">Loading...</div>
		{:else if error}
			<div class="error">Error: {error.message}</div>
		{:else}
			<div class="storage-contents">
				<!-- File listing content -->
			</div>
		{/if}
	</StorageList>
{/if}
```

## 🐛 Troubleshooting

### **Storage Not Loading**

If storage contents don't load:

1. **Check storage rules** - Ensure read permissions are correct
2. **Verify path format** - Make sure path ends with `/` for directories
3. **Check Firebase config** - Ensure Storage is properly initialized

### **Component Not Updating**

If the component doesn't update when files change:

```svelte
<script>
	import { StorageList } from 'svelte-firekit';

	// Debug storage path
	let storagePath = 'uploads/';
	$effect(() => {
		console.log('Storage path:', storagePath);
	});
</script>

<StorageList path={storagePath} let:items let:prefixes let:loading let:error>
	{#snippet default(items, prefixes, loading, error)}
		<div class="debug">
			<p>Path: {storagePath}</p>
			<p>Loading: {loading}</p>
			<p>Error: {error?.message}</p>
			<p>Files: {items.length}</p>
			<p>Folders: {prefixes.length}</p>
		</div>
	{/snippet}
</StorageList>
```

## 📚 Related Components

- [`DownloadURL`](./download-url.md) - File download URL management
- [`UploadTask`](./upload-task.md) - File upload with progress
- [`Doc`](./doc.md) - Firestore document subscription

## 🔗 API Reference

### **Component Props**

```typescript
interface StorageListProps {
	path: string;
	children: Snippet<[StorageReference[], StorageReference[], boolean, Error | null]>;
}
```

### **Slot Parameters**

```typescript
// children slot parameters
items: StorageReference[];     // Array of file references
prefixes: StorageReference[];  // Array of folder references
loading: boolean;             // Loading state
error: Error | null;          // Error state
```

### **StorageReference Properties**

```typescript
interface StorageReference {
	name: string; // File/folder name
	fullPath: string; // Full storage path
	size?: number; // File size in bytes (files only)
	contentType?: string; // MIME type (files only)
}
```

---

**Next**: [DownloadURL Component](./download-url.md)
