---
title: UploadTask
description: Firebase Storage file upload component with progress tracking
---

# UploadTask

The `UploadTask` component provides reactive file upload functionality to Firebase Storage with progress tracking, error handling, and completion states. It automatically manages the upload process and provides real-time feedback through slot parameters.

## 🚀 Basic Usage

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedFile = null;
</script>

<input type="file" onchange={(e) => (selectedFile = e.target.files[0])} />

{#if selectedFile}
	<UploadTask
		ref="uploads/{selectedFile.name}"
		data={selectedFile}
		let:snapshot
		let:task
		let:progress
		let:storage
	>
		<div class="upload-progress">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>
			<p>{progress}% uploaded</p>
		</div>
	</UploadTask>
{/if}
```

## 📋 Props

| Prop       | Type                                                      | Required | Description                                       |
| ---------- | --------------------------------------------------------- | -------- | ------------------------------------------------- |
| `ref`      | `string`                                                  | ✅       | Storage reference path (e.g., 'uploads/file.pdf') |
| `data`     | `Blob \| Uint8Array \| ArrayBuffer`                       | ✅       | File data to upload                               |
| `metadata` | `UploadMetadata`                                          | ❌       | Optional file metadata                            |
| `children` | `Snippet<[UploadTaskSnapshot \| null, any, number, any]>` | ✅       | Content to render during upload                   |

## 🎯 Use Cases

### **Simple File Upload**

Basic file upload with progress:

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedFile = null;
</script>

<div class="file-upload">
	<input type="file" onchange={(e) => (selectedFile = e.target.files[0])} accept="image/*" />

	{#if selectedFile}
		<UploadTask
			ref="images/{selectedFile.name}"
			data={selectedFile}
			let:snapshot
			let:task
			let:progress
			let:storage
		>
			<div class="upload-status">
				<div class="progress-container">
					<div class="progress-bar">
						<div class="progress-fill" style="width: {progress}%"></div>
					</div>
					<span class="progress-text">{Math.round(progress)}%</span>
				</div>
				<p>Uploading {selectedFile.name}...</p>
			</div>
		</UploadTask>
	{/if}
</div>
```

### **Image Upload with Preview**

Upload images with preview and metadata:

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedImage = null;
	let imagePreview = null;

	function handleImageSelect(event) {
		const file = event.target.files[0];
		if (file) {
			selectedImage = file;
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => (imagePreview = e.target.result);
			reader.readAsDataURL(file);
		}
	}
</script>

<div class="image-upload">
	<input type="file" accept="image/*" onchange={handleImageSelect} />

	{#if selectedImage && imagePreview}
		<div class="image-preview">
			<img src={imagePreview} alt="Preview" />
			<p>{selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)</p>
		</div>

		<UploadTask
			ref="images/{selectedImage.name}"
			data={selectedImage}
			metadata={{
				contentType: selectedImage.type,
				customMetadata: {
					uploadedAt: new Date().toISOString(),
					originalName: selectedImage.name
				}
			}}
			let:snapshot
			let:task
			let:progress
			let:storage
		>
			<div class="upload-progress">
				<div class="progress-bar">
					<div class="progress-fill" style="width: {progress}%"></div>
				</div>
				<p>Uploading image... {progress}%</p>

				{#if progress === 100}
					<p class="success">✅ Upload complete!</p>
				{/if}
			</div>
		</UploadTask>
	{/if}
</div>
```

### **Multiple File Upload**

Upload multiple files with individual progress:

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedFiles = [];

	function handleFileSelect(event) {
		selectedFiles = Array.from(event.target.files);
	}
</script>

<div class="multi-upload">
	<input type="file" multiple onchange={handleFileSelect} />

	{#if selectedFiles.length > 0}
		<div class="upload-list">
			{#each selectedFiles as file, index}
				<div class="upload-item">
					<p>{file.name}</p>
					<UploadTask
						ref="uploads/{file.name}"
						data={file}
						let:snapshot
						let:task
						let:progress
						let:storage
					>
						<div class="file-progress">
							<div class="progress-bar">
								<div class="progress-fill" style="width: {progress}%"></div>
							</div>
							<span>{progress}%</span>
						</div>
					</UploadTask>
				</div>
			{/each}
		</div>
	{/if}
</div>
```

## 🔧 Slot Parameters

The `children` slot receives four parameters:

| Parameter  | Type                         | Description                          |
| ---------- | ---------------------------- | ------------------------------------ |
| `snapshot` | `UploadTaskSnapshot \| null` | Upload task snapshot with state info |
| `task`     | `any`                        | Upload task service instance         |
| `progress` | `number`                     | Upload progress percentage (0-100)   |
| `storage`  | `any`                        | Firebase Storage instance            |

### **Using Slot Parameters**

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';
	import type { UploadTaskSnapshot } from 'firebase/storage';

	let selectedFile = null;
</script>

<UploadTask ref="uploads/{selectedFile?.name}" data={selectedFile} let:snapshot let:task let:progress let:storage>
	{#snippet default(snapshot: UploadTaskSnapshot | null, task: any, progress: number, storage: any)}
		<div class="upload-details">
			<div class="progress-info">
				<p>Progress: {progress}%</p>
				{#if snapshot}
					<p>Bytes transferred: {snapshot.bytesTransferred}</p>
					<p>Total bytes: {snapshot.totalBytes}</p>
					<p>State: {snapshot.state}</p>
				{/if}
			</div>

			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>

			{#if progress === 100}
				<p class="upload-complete">✅ Upload completed successfully!</p>
			{/if}
		</div>
	{/snippet}
</UploadTask>
```

## 🔧 Advanced Usage

### **Upload with Custom Metadata**

Add custom metadata to uploads:

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedFile = null;
	let uploadMetadata = {
		contentType: '',
		customMetadata: {
			uploadedBy: '',
			description: '',
			tags: ''
		}
	};
</script>

<div class="upload-form">
	<input type="file" onchange={(e) => (selectedFile = e.target.files[0])} />

	{#if selectedFile}
		<div class="metadata-form">
			<label>
				Content Type:
				<input bindvalue={uploadMetadata.contentType} placeholder="image/jpeg" />
			</label>
			<label>
				Uploaded By:
				<input bindvalue={uploadMetadata.customMetadata.uploadedBy} />
			</label>
			<label>
				Description:
				<textarea bindvalue={uploadMetadata.customMetadata.description}></textarea>
			</label>
			<label>
				Tags:
				<input bindvalue={uploadMetadata.customMetadata.tags} placeholder="tag1,tag2,tag3" />
			</label>
		</div>

		<UploadTask
			ref="uploads/{selectedFile.name}"
			data={selectedFile}
			metadata={uploadMetadata}
			let:snapshot
			let:task
			let:progress
			let:storage
		>
			<div class="upload-progress">
				<div class="progress-bar">
					<div class="progress-fill" style="width: {progress}%"></div>
				</div>
				<p>Uploading with metadata... {progress}%</p>
			</div>
		</UploadTask>
	{/if}
</div>
```

### **Upload with Error Handling**

Handle upload errors gracefully:

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedFile = null;
	let uploadError = null;
</script>

<UploadTask
	ref="uploads/{selectedFile?.name}"
	data={selectedFile}
	let:snapshot
	let:task
	let:progress
	let:storage
	let:error
>
	{#if error}
		<div class="upload-error">
			<h3>Upload Failed</h3>
			<p>Error: {error.message}</p>
			<button onclick={() => task?.retry()}>Retry Upload</button>
			<button onclick={() => task?.cancel()}>Cancel</button>
		</div>
	{:else}
		<div class="upload-progress">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>
			<p>Uploading... {progress}%</p>

			{#if progress < 100}
				<button onclick={() => task?.cancel()}>Cancel</button>
			{/if}
		</div>
	{/if}
</UploadTask>
```

### **Upload with State Management**

Track upload states and completion:

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedFile = null;
	let uploadState = 'idle'; // idle, uploading, completed, error

	function handleUploadComplete(snapshot) {
		uploadState = 'completed';
		console.log('Upload completed:', snapshot.ref.fullPath);
	}
</script>

<UploadTask
	ref="uploads/{selectedFile?.name}"
	data={selectedFile}
	let:snapshot
	let:task
	let:progress
	let:storage
>
	{#if snapshot?.state === 'success'}
		<div class="upload-success">
			<h3>✅ Upload Complete!</h3>
			<p>File uploaded to: {snapshot.ref.fullPath}</p>
			<p>Download URL: {snapshot.ref.fullPath}</p>
			<button onclick={() => (uploadState = 'idle')}>Upload Another File</button>
		</div>
	{:else if snapshot?.state === 'running'}
		<div class="upload-progress">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>
			<p>Uploading... {progress}%</p>
			<button onclick={() => task?.cancel()}>Cancel</button>
		</div>
	{:else if snapshot?.state === 'paused'}
		<div class="upload-paused">
			<p>Upload paused</p>
			<button onclick={() => task?.resume()}>Resume</button>
			<button onclick={() => task?.cancel()}>Cancel</button>
		</div>
	{/if}
</UploadTask>
```

## 🎨 Custom Styling

### **Modern Progress Bar**

Style a contemporary upload progress bar:

```svelte
<style>
	.upload-container {
		max-width: 500px;
		margin: 2rem auto;
		padding: 2rem;
		background: white;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.progress-container {
		margin: 1rem 0;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: #e5e7eb;
		border-radius: 4px;
		overflow: hidden;
		position: relative;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #3b82f6, #1d4ed8);
		border-radius: 4px;
		transition: width 0.3s ease;
		position: relative;
	}

	.progress-fill::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.progress-text {
		display: block;
		text-align: center;
		margin-top: 0.5rem;
		font-weight: 600;
		color: #374151;
	}

	.upload-success {
		text-align: center;
		color: #059669;
		padding: 1rem;
		background: #d1fae5;
		border-radius: 0.5rem;
	}

	.upload-error {
		text-align: center;
		color: #dc2626;
		padding: 1rem;
		background: #fee2e2;
		border-radius: 0.5rem;
	}
</style>
```

### **File Upload Card**

Style file upload as cards:

```svelte
<style>
	.upload-card {
		border: 2px dashed #d1d5db;
		border-radius: 0.75rem;
		padding: 2rem;
		text-align: center;
		transition: all 0.3s;
	}

	.upload-card:hover {
		border-color: #3b82f6;
		background: #f8fafc;
	}

	.upload-card.dragover {
		border-color: #3b82f6;
		background: #eff6ff;
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 1rem 0;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 0.5rem;
	}

	.file-icon {
		width: 40px;
		height: 40px;
		background: #3b82f6;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 1.2rem;
	}

	.file-details {
		flex: 1;
		text-align: left;
	}

	.file-name {
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.file-size {
		color: #6b7280;
		font-size: 0.875rem;
	}
</style>
```

## 🔍 Error Handling

### **Network Errors**

Handle network-related upload failures:

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedFile = null;
</script>

<UploadTask
	ref="uploads/{selectedFile?.name}"
	data={selectedFile}
	let:snapshot
	let:task
	let:progress
	let:storage
	let:error
>
	{#if error?.code === 'storage/retry-limit-exceeded'}
		<div class="upload-error">
			<h3>Upload Failed</h3>
			<p>Network connection is unstable. Please try again.</p>
			<button onclick={() => task?.retry()}>Retry Upload</button>
		</div>
	{:else if error?.code === 'storage/unauthorized'}
		<div class="upload-error">
			<h3>Permission Denied</h3>
			<p>You don't have permission to upload to this location.</p>
			<button onclick={() => signIn()}>Sign In</button>
		</div>
	{:else if error}
		<div class="upload-error">
			<h3>Upload Error</h3>
			<p>{error.message}</p>
			<button onclick={() => task?.retry()}>Retry</button>
		</div>
	{:else}
		<div class="upload-progress">
			<!-- Progress content -->
		</div>
	{/if}
</UploadTask>
```

### **File Size Validation**

Validate file size before upload:

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedFile = null;
	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

	function validateFile(file) {
		if (file.size > MAX_FILE_SIZE) {
			alert(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
			return false;
		}
		return true;
	}

	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (file && validateFile(file)) {
			selectedFile = file;
		}
	}
</script>

<input type="file" onchange={handleFileSelect} />

{#if selectedFile}
	<UploadTask
		ref="uploads/{selectedFile.name}"
		data={selectedFile}
		let:snapshot
		let:task
		let:progress
		let:storage
	>
		<div class="upload-progress">
			<p>File: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>
			<p>{progress}% uploaded</p>
		</div>
	</UploadTask>
{/if}
```

## 🔧 Performance Optimization

### **Chunked Upload**

Handle large files with chunked uploads:

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedFile = null;
	const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

	async function uploadInChunks(file) {
		const chunks = Math.ceil(file.size / CHUNK_SIZE);
		const uploadPromises = [];

		for (let i = 0; i < chunks; i++) {
			const start = i * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunk = file.slice(start, end);

			const chunkPath = `uploads/${file.name}.part${i}`;
			uploadPromises.push(uploadChunk(chunkPath, chunk));
		}

		await Promise.all(uploadPromises);
		// Combine chunks logic here
	}
</script>

<input type="file" onchange={(e) => (selectedFile = e.target.files[0])} />

{#if selectedFile && selectedFile.size > 50 * 1024 * 1024}
	<!-- 50MB -->
	<button onclick={() => uploadInChunks(selectedFile)}> Upload Large File (Chunked) </button>
{:else if selectedFile}
	<UploadTask
		ref="uploads/{selectedFile.name}"
		data={selectedFile}
		let:snapshot
		let:task
		let:progress
		let:storage
	>
		<div class="upload-progress">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>
			<p>{progress}% uploaded</p>
		</div>
	</UploadTask>
{/if}
```

## 🐛 Troubleshooting

### **Upload Not Starting**

If uploads don't start:

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';
	import { firebaseService } from 'svelte-firekit';

	let selectedFile = null;

	// Debug storage availability
	const storage = firebaseService.getStorageInstance();
	$effect(() => {
		console.log('Storage instance:', storage);
		console.log('Selected file:', selectedFile);
	});
</script>

<UploadTask ref="uploads/{selectedFile?.name}" data={selectedFile} let:snapshot let:task let:progress let:storage>
	{#snippet default(snapshot, task, progress, storage)}
		<div class="debug">
			<p>Storage: {storage ? 'Available' : 'Not available'}</p>
			<p>File: {selectedFile?.name}</p>
			<p>File size: {selectedFile?.size}</p>
			<p>Progress: {progress}%</p>
			<p>Task state: {task?.state}</p>
		</div>
	{/snippet}
</UploadTask>
```

### **Progress Not Updating**

If progress doesn't update:

```svelte
<script>
	import { UploadTask } from 'svelte-firekit';

	let selectedFile = null;

	$effect(() => {
		console.log('File changed:', selectedFile);
	});
</script>

<UploadTask ref="uploads/{selectedFile?.name}" data={selectedFile} let:snapshot let:task let:progress let:storage>
	{#snippet default(snapshot, task, progress, storage)}
		<div class="debug-progress">
			<p>Progress: {progress}%</p>
			<p>Snapshot state: {snapshot?.state}</p>
			<p>Bytes transferred: {snapshot?.bytesTransferred}</p>
			<p>Total bytes: {snapshot?.totalBytes}</p>
		</div>
	{/snippet}
</UploadTask>
```

## 📚 Related Components

- [`DownloadURL`](./download-url.md) - Get download URLs from Storage
- [`StorageList`](./storage-list.md) - List files in Storage
- [`Doc`](./doc.md) - Firestore document subscription

## 🔗 API Reference

### **Component Props**

```typescript
interface UploadTaskProps {
	ref: string; // Storage reference path
	data: Blob | Uint8Array | ArrayBuffer; // File data
	metadata?: UploadMetadata; // Optional metadata
	children: Snippet<[UploadTaskSnapshot | null, any, number, any]>;
}
```

### **Slot Parameters**

```typescript
// children slot parameters
snapshot: UploadTaskSnapshot | null; // Upload task snapshot
task: any; // Upload task service
progress: number; // Progress percentage (0-100)
storage: any; // Firebase Storage instance
```

### **Upload States**

```typescript
// Upload task states
'paused'; // Upload paused
'running'; // Upload in progress
'success'; // Upload completed
'error'; // Upload failed
```

---

**Next**: [Node Component](./node.md)
