---
title: Storage Service
description: File upload/download operations with progress tracking, reactive state management, and advanced storage features
---

# Storage Service

The `firekitStorage` service provides comprehensive file upload/download operations for Firebase Storage with progress tracking, reactive state management, and advanced storage features using Svelte 5 runes.

## Overview

The storage service provides:

- File upload with progress tracking
- File download with URL generation
- Storage listing and management
- Reactive state management
- Error handling and retry mechanisms
- File metadata management
- Security and access control
- Performance optimization

## Quick Start

```svelte
<script>
	import { firekitUploadTask, firekitDownloadUrl } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';

	let selectedFile: File | null = null;
	let uploadPath = 'uploads/';

	async function handleUpload() {
		if (!selectedFile) return;

		const upload = firekitUploadTask(uploadPath + selectedFile.name, selectedFile);

		// Reactive upload state
		const progress = $derived(upload.progress);
		const state = $derived(upload.state);
		const downloadUrl = $derived(upload.downloadUrl);

		// Watch for completion
		$effect(() => {
			if (state === 'success' && downloadUrl) {
				console.log('Upload complete:', downloadUrl);
			}
		});
	}
</script>

<input type="file" bindfiles={selectedFile} />
<input type="text" bindvalue={uploadPath} placeholder="Upload path" />

<Button onclick={handleUpload} disabled={!selectedFile}>Upload File</Button>

{#if upload && upload.state === 'running'}
	<Progress value={upload.progress} />
	<p>Uploading: {upload.progress}%</p>
{/if}
```

## File Upload

### Basic Upload

```typescript
import { firekitUploadTask } from 'svelte-firekit';

// Basic file upload
const file = new File(['Hello World'], 'hello.txt', { type: 'text/plain' });
const upload = firekitUploadTask('uploads/hello.txt', file);

// Access reactive state
const progress = $derived(upload.progress);
const state = $derived(upload.state);
const downloadUrl = $derived(upload.downloadUrl);
const error = $derived(upload.error);
```

### Upload with Options

```typescript
import { firekitUploadTask } from 'svelte-firekit';

// Upload file
const upload = firekitUploadTask('uploads/image.jpg', file);
```

### Upload with Validation

```typescript
import { firekitUploadTask } from 'svelte-firekit';

// Upload file (validation should be done before calling firekitUploadTask)
const upload = firekitUploadTask('uploads/document.pdf', file);

// Check upload state
const progress = $derived(upload.progress);
const error = $derived(upload.error);
```

### Multiple File Upload

```svelte
<script>
	import { firekitUploadTask } from 'svelte-firekit';

	let files: FileList | null = null;
	let uploads: any[] = [];

	async function uploadMultiple() {
		if (!files) return;

		uploads = Array.from(files).map((file, index) => {
			return firekitUploadTask(`uploads/${Date.now()}_${index}_${file.name}`, file);
		});

		// Wait for all uploads to complete
		await Promise.all(uploads.map((upload) => upload.complete()));
	}

	// Track overall progress
	const totalProgress = $derived(
		uploads.length > 0
			? uploads.reduce((sum, upload) => sum + upload.progress, 0) / uploads.length
			: 0
	);

	const allComplete = $derived(uploads.every((upload) => upload.state === 'success'));
</script>

<input type="file" bindfiles multiple />
<Button onclick={uploadMultiple} disabled={!files}>
	Upload {files?.length || 0} Files
</Button>

{#if uploads.length > 0}
	<div class="uploads-list">
		{#each uploads as upload, index}
			<div class="upload-item">
				<span>{upload.file.name}</span>
				<Progress value={upload.progress} />
				<span>{upload.state}</span>
			</div>
		{/each}
	</div>

	<div class="overall-progress">
		<Progress value={totalProgress} />
		<p>Overall: {Math.round(totalProgress)}%</p>
		{#if allComplete}
			<p>All uploads complete!</p>
		{/if}
	</div>
{/if}
```

## File Download

### Get Download URL

```typescript
import { firekitDownloadUrl } from 'svelte-firekit';

// Get download URL for file
const downloadUrl = firekitDownloadUrl('uploads/image.jpg');

// Access reactive state
const url = $derived(downloadUrl.url);
const loading = $derived(downloadUrl.loading);
const error = $derived(downloadUrl.error);

// Watch for URL changes
$effect(() => {
	if (url) {
		console.log('Download URL ready:', url);
	}
});
```

### Download with Options

```typescript
import { firekitDownloadUrl } from 'svelte-firekit';

// Get download URL
const downloadUrl = firekitDownloadUrl('uploads/image.jpg');

// Force refresh URL
await downloadUrl.refresh();
```

### Download File Content

```typescript
import { firekitDownloadUrl } from 'svelte-firekit';

// Download file content
const downloadUrl = firekitDownloadUrl('uploads/document.txt');

async function downloadFile() {
	try {
		const response = await fetch(downloadUrl.url);
		const content = await response.text();
		console.log('File content:', content);
	} catch (error) {
		console.error('Download failed:', error);
	}
}
```

## Storage Listing

### List Files

```typescript
import { firekitStorageList } from 'svelte-firekit';

// List files in storage
const storageList = firekitStorageList('uploads/');

// Access reactive state
const files = $derived(storageList.files);
const loading = $derived(storageList.loading);
const error = $derived(storageList.error);

// Watch for file list changes
$effect(() => {
	if (files) {
		console.log('Files found:', files.length);
	}
});
```

### List with Options

```typescript
import { firekitStorageList } from 'svelte-firekit';

// List files
const storageList = firekitStorageList('uploads/');

// Access file list
const items = $derived(storageList.items);
const prefixes = $derived(storageList.prefixes);

// Load more files
async function loadMore() {
	if (hasMore) {
		await storageList.loadMore();
	}
}
```

### Filter and Search

```svelte
<script>
	import { firekitStorageList } from 'svelte-firekit';

	let searchTerm = '';
	let fileType = 'all';

	// Dynamic storage list based on filters
	const storageList = firekitStorageList('uploads/', {
		prefix: searchTerm || undefined
	});

	const files = $derived(storageList.files);
	const filteredFiles = $derived(
		files?.filter((file) => {
			if (fileType === 'all') return true;
			return file.contentType?.startsWith(fileType);
		}) || []
	);
</script>

<input type="text" bindvalue={searchTerm} placeholder="Search files..." />
<select bindvalue={fileType}>
	<option value="all">All Types</option>
	<option value="image/">Images</option>
	<option value="video/">Videos</option>
	<option value="application/">Documents</option>
</select>

{#if files}
	<div class="files-list">
		{#each filteredFiles as file}
			<div class="file-item">
				<span>{file.name}</span>
				<span>{file.size} bytes</span>
				<span>{file.contentType}</span>
			</div>
		{/each}
	</div>
{/if}
```

## File Management

### Delete Files

```typescript
import { firekitStorageList } from 'svelte-firekit';

const storageList = firekitStorageList('uploads/');

// Delete single file
async function deleteFile(filePath: string) {
	try {
		await storageList.deleteFile(filePath);
		console.log('File deleted:', filePath);
	} catch (error) {
		console.error('Delete failed:', error);
	}
}

// Delete multiple files
async function deleteMultiple(filePaths: string[]) {
	try {
		await storageList.deleteFiles(filePaths);
		console.log('Files deleted:', filePaths.length);
	} catch (error) {
		console.error('Batch delete failed:', error);
	}
}
```

### File Metadata

```typescript
import { firekitStorageList } from 'svelte-firekit';

const storageList = firekitStorageList('uploads/');

// Get file metadata
async function getFileMetadata(filePath: string) {
	try {
		const metadata = await storageList.getFileMetadata(filePath);
		console.log('File metadata:', metadata);
		return metadata;
	} catch (error) {
		console.error('Failed to get metadata:', error);
		return null;
	}
}

// Update file metadata
async function updateFileMetadata(filePath: string, metadata: any) {
	try {
		await storageList.updateFileMetadata(filePath, metadata);
		console.log('Metadata updated');
	} catch (error) {
		console.error('Failed to update metadata:', error);
	}
}
```

## Svelte Component Integration

### File Upload Component

```svelte
<script>
	import { firekitUploadTask } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { Input } from '$lib/components/ui/input';

	export let uploadPath = 'uploads/';
	export let allowedTypes = ['image/*', 'application/pdf'];
	export let maxSize = 10 * 1024 * 1024; // 10MB

	let selectedFile: File | null = null;
	let upload: any = null;

	async function handleUpload() {
		if (!selectedFile) return;

		upload = firekitUploadTask(uploadPath + selectedFile.name, selectedFile, {
			validate: {
				maxSize,
				allowedTypes
			}
		});

		// Watch for completion
		$effect(() => {
			if (upload?.state === 'success') {
				dispatch('uploadComplete', { url: upload.downloadUrl, file: selectedFile });
			}
		});
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		selectedFile = input.files?.[0] || null;
	}
</script>

<div class="file-upload">
	<Input type="file" accept={allowedTypes.join(',')} onchange={handleFileSelect} />

	{#if selectedFile}
		<div class="file-info">
			<p>Selected: {selectedFile.name}</p>
			<p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
		</div>
	{/if}

	<Button onclick={handleUpload} disabled={!selectedFile || upload?.state === 'running'}>
		{upload?.state === 'running' ? 'Uploading...' : 'Upload'}
	</Button>

	{#if upload}
		{#if upload.state === 'running'}
			<Progress value={upload.progress} />
			<p>Progress: {upload.progress}%</p>
		{:else if upload.state === 'success'}
			<p class="success">Upload complete!</p>
		{:else if upload.state === 'error'}
			<p class="error">Upload failed: {upload.error?.message}</p>
		{/if}
	{/if}
</div>

<style>
	.file-upload {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		border: 2px dashed #e2e8f0;
		border-radius: 0.5rem;
	}

	.file-info {
		background: #f8f9fa;
		padding: 0.5rem;
		border-radius: 0.25rem;
	}

	.success {
		color: #059669;
		font-weight: 500;
	}

	.error {
		color: #dc2626;
		font-weight: 500;
	}
</style>
```

### File Gallery Component

```svelte
<script>
	import { firekitStorageList, firekitDownloadUrl } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	export let folderPath = 'uploads/';
	export let fileTypes = ['image/*'];

	const storageList = firekitStorageList(folderPath, {
		prefix: folderPath
	});

	const files = $derived(storageList.files);
	const loading = $derived(storageList.loading);

	async function deleteFile(filePath: string) {
		if (confirm('Are you sure you want to delete this file?')) {
			try {
				await storageList.deleteFile(filePath);
			} catch (error) {
				console.error('Delete failed:', error);
			}
		}
	}

	function isImage(file: any) {
		return file.contentType?.startsWith('image/');
	}
</script>

<div class="file-gallery">
	<h2>Files in {folderPath}</h2>

	{#if loading}
		<div>Loading files...</div>
	{:else if files}
		<div class="files-grid">
			{#each files as file}
				<Card class="file-card">
					<CardHeader>
						<CardTitle>{file.name}</CardTitle>
					</CardHeader>
					<CardContent>
						{#if isImage(file)}
							{@const downloadUrl = firekitDownloadUrl(file.fullPath)}
							<img src={downloadUrl.url} alt={file.name} class="file-preview" />
						{:else}
							<div class="file-icon">📄</div>
						{/if}

						<div class="file-details">
							<p>Size: {(file.size / 1024).toFixed(1)} KB</p>
							<p>Type: {file.contentType}</p>
							<p>Updated: {new Date(file.updated).toLocaleDateString()}</p>
						</div>

						<div class="file-actions">
							<Button size="sm" onclick={() => window.open(downloadUrl.url)}>Download</Button>
							<Button size="sm" variant="destructive" onclick={() => deleteFile(file.fullPath)}>
								Delete
							</Button>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else}
		<p>No files found</p>
	{/if}
</div>

<style>
	.file-gallery {
		padding: 1rem;
	}

	.files-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.file-card {
		overflow: hidden;
	}

	.file-preview {
		width: 100%;
		height: 150px;
		object-fit: cover;
		border-radius: 0.25rem;
	}

	.file-icon {
		font-size: 3rem;
		text-align: center;
		padding: 2rem;
		background: #f8f9fa;
		border-radius: 0.25rem;
	}

	.file-details {
		margin: 1rem 0;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.file-details p {
		margin: 0.25rem 0;
	}

	.file-actions {
		display: flex;
		gap: 0.5rem;
	}
</style>
```

### Drag and Drop Upload

```svelte
<script>
	import { firekitUploadTask } from 'svelte-firekit';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let dragOver = false;
	let uploads: any[] = [];

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;

		const files = event.dataTransfer?.files;
		if (!files) return;

		uploads = Array.from(files).map((file, index) => {
			return firekitUploadTask(`uploads/${Date.now()}_${index}_${file.name}`, file);
		});

		// Watch for completion
		$effect(() => {
			const completed = uploads.filter((upload) => upload.state === 'success');
			if (completed.length === uploads.length && uploads.length > 0) {
				dispatch('allComplete', { uploads: completed });
			}
		});
	}
</script>

<div
	class="drop-zone"
	class:drag-over={dragOver}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<div class="drop-content">
		<p>Drag and drop files here</p>
		<p class="drop-hint">or click to select files</p>
	</div>

	{#if uploads.length > 0}
		<div class="uploads-progress">
			{#each uploads as upload, index}
				<div class="upload-item">
					<span>{upload.file.name}</span>
					<div class="progress-bar">
						<div class="progress-fill" style="width: {upload.progress}%"></div>
					</div>
					<span>{upload.state}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.drop-zone {
		border: 2px dashed #e2e8f0;
		border-radius: 0.5rem;
		padding: 2rem;
		text-align: center;
		transition: all 0.2s ease;
	}

	.drop-zone.drag-over {
		border-color: #3b82f6;
		background: #eff6ff;
	}

	.drop-content {
		pointer-events: none;
	}

	.drop-hint {
		font-size: 0.875rem;
		color: #6b7280;
		margin-top: 0.5rem;
	}

	.uploads-progress {
		margin-top: 1rem;
	}

	.upload-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 0.5rem 0;
		padding: 0.5rem;
		background: #f8f9fa;
		border-radius: 0.25rem;
	}

	.progress-bar {
		flex: 1;
		height: 4px;
		background: #e2e8f0;
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #3b82f6;
		transition: width 0.3s ease;
	}
</style>
```

## Type Definitions

### Upload Options

```typescript
interface UploadOptions {
	metadata?: {
		customMetadata?: Record<string, string>;
		contentType?: string;
		cacheControl?: string;
		contentDisposition?: string;
		contentEncoding?: string;
		contentLanguage?: string;
	};
	validate?: {
		maxSize?: number;
		allowedTypes?: string[];
		allowedExtensions?: string[];
	};
	retry?: {
		enabled?: boolean;
		maxAttempts?: number;
		delay?: number;
	};
	onProgress?: (progress: number) => void;
	onValidationError?: (error: Error) => void;
}
```

### Download Options

```typescript
interface DownloadOptions {
	expires?: number;
	action?: 'read' | 'write';
	responseDisposition?: string;
	responseType?: string;
	forceRefresh?: boolean;
}
```

### Storage List Options

```typescript
interface StorageListOptions {
	maxResults?: number;
	pageToken?: string | null;
	prefix?: string;
	delimiter?: string;
}
```

### File Metadata

```typescript
interface FileMetadata {
	name: string;
	fullPath: string;
	size: number;
	contentType: string;
	updated: string;
	created: string;
	customMetadata?: Record<string, string>;
	downloadTokens?: string[];
}
```

## Best Practices

### Performance

1. **Use appropriate file sizes**

   ```typescript
   // Validate file size before upload
   const upload = firekitUploadTask('uploads/file.jpg', file, {
   	validate: { maxSize: 5 * 1024 * 1024 } // 5MB limit
   });
   ```

2. **Implement progress tracking**

   ```typescript
   // Show progress to users
   const upload = firekitUploadTask('uploads/file.jpg', file, {
   	onProgress: (progress) => {
   		console.log(`Upload: ${progress}%`);
   	}
   });
   ```

3. **Use batch operations for multiple files**
   ```typescript
   // Upload multiple files efficiently
   const uploads = files.map((file) => firekitUploadTask(`uploads/${file.name}`, file));
   await Promise.all(uploads.map((upload) => upload.complete()));
   ```

### Security

1. **Validate file types**

   ```typescript
   // Only allow specific file types
   const upload = firekitUploadTask('uploads/file.jpg', file, {
   	validate: {
   		allowedTypes: ['image/jpeg', 'image/png'],
   		allowedExtensions: ['.jpg', '.png']
   	}
   });
   ```

2. **Use secure download URLs**

   ```typescript
   // Generate secure download URLs
   const downloadUrl = firekitDownloadUrl('uploads/file.jpg', {
   	expires: 3600 // 1 hour expiration
   });
   ```

3. **Implement proper access control**
   ```typescript
   // Use Firebase Security Rules
   // rules_version = '2';
   // service firebase.storage {
   //   match /b/{bucket}/o {
   //     match /uploads/{userId}/{allPaths=**} {
   //       allow read, write: if request.auth != null && request.auth.uid == userId;
   //     }
   //   }
   // }
   ```

### Error Handling

1. **Handle upload errors**

   ```typescript
   const upload = firekitUploadTask('uploads/file.jpg', file);

   $effect(() => {
   	if (upload.error) {
   		console.error('Upload failed:', upload.error);
   		// Show error message to user
   	}
   });
   ```

2. **Implement retry logic**

   ```typescript
   const upload = firekitUploadTask('uploads/file.jpg', file, {
   	retry: { enabled: true, maxAttempts: 3 }
   });
   ```

3. **Validate before upload**
   ```typescript
   const upload = firekitUploadTask('uploads/file.jpg', file, {
   	validate: { maxSize: 10 * 1024 * 1024 },
   	onValidationError: (error) => {
   		alert('File validation failed: ' + error.message);
   	}
   });
   ```

## API Reference

### Core Methods

- `firekitUploadTask(path, file, options?)` - Create upload task
- `firekitDownloadUrl(path, options?)` - Get download URL
- `firekitStorageList(path, options?)` - List storage files

### Upload Task Methods

- `upload.pause()` - Pause upload
- `upload.resume()` - Resume upload
- `upload.cancel()` - Cancel upload
- `upload.complete()` - Wait for completion

### Download URL Methods

- `downloadUrl.refresh()` - Refresh download URL
- `downloadUrl.revoke()` - Revoke download URL

### Storage List Methods

- `storageList.loadMore()` - Load more files
- `storageList.refresh()` - Refresh file list
- `storageList.deleteFile(path)` - Delete single file
- `storageList.deleteFiles(paths)` - Delete multiple files
- `storageList.getFileMetadata(path)` - Get file metadata
- `storageList.updateFileMetadata(path, metadata)` - Update file metadata

### Properties

- `upload.progress` - Upload progress (0-100)
- `upload.state` - Upload state (running, success, error, paused, cancelled)
- `upload.downloadUrl` - Download URL when complete
- `upload.error` - Upload error
- `upload.file` - File being uploaded
- `downloadUrl.url` - Download URL
- `downloadUrl.loading` - Loading state
- `downloadUrl.error` - Error state
- `storageList.files` - List of files
- `storageList.loading` - Loading state
- `storageList.error` - Error state
- `storageList.hasMore` - More files available
- `storageList.nextPageToken` - Next page token
