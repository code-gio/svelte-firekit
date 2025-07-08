---
title: DownloadURL
description: Firebase Storage download URL component with reactive state
---

# DownloadURL

The `DownloadURL` component provides reactive access to Firebase Storage download URLs. It automatically handles loading states, error handling, and URL generation while providing a clean slot-based API for rendering content with the download URL.

## 🚀 Basic Usage

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';
</script>

<DownloadURL ref="images/profile.jpg" let:url let:ref let:storage>
	<img src={url} alt="Profile picture" />
</DownloadURL>
```

## 📋 Props

| Prop       | Type                                       | Required | Description                                     |
| ---------- | ------------------------------------------ | -------- | ----------------------------------------------- |
| `ref`      | `string`                                   | ✅       | Storage reference path (e.g., 'images/pic.png') |
| `children` | `Snippet<[string, StorageReference, any]>` | ✅       | Content to render when URL is loaded            |
| `loading`  | `Snippet<[]>`                              | ❌       | Custom loading content                          |

## 🎯 Use Cases

### **Simple Image Display**

Display images from Firebase Storage:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';
</script>

<DownloadURL ref="images/hero-banner.jpg" let:url let:ref let:storage>
	<img src={url} alt="Hero banner" class="hero-image" />
</DownloadURL>
```

### **User Avatar with Fallback**

Display user avatars with fallback handling:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';
</script>

<DownloadURL ref="avatars/{user.uid}.jpg" let:url let:ref let:storage>
	{#snippet loading()}
		<div class="avatar-skeleton"></div>
	{/snippet}

	{#snippet default(url, ref, storage)}
		<img src={url} alt="User avatar" class="user-avatar" />
	{/snippet}
</DownloadURL>
```

### **Document Preview**

Show document previews with download links:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';
</script>

<DownloadURL ref="documents/{document.id}.pdf" let:url let:ref let:storage>
	<div class="document-preview">
		<div class="preview-header">
			<h3>{document.title}</h3>
			<a href={url} download class="download-btn"> Download PDF </a>
		</div>
		<iframe src={url} class="pdf-preview"></iframe>
	</div>
</DownloadURL>
```

## 🔧 Slot Parameters

The `children` slot receives three parameters:

| Parameter | Type               | Description                |
| --------- | ------------------ | -------------------------- |
| `url`     | `string`           | Download URL for the file  |
| `ref`     | `StorageReference` | Firebase Storage reference |
| `storage` | `any`              | Firebase Storage instance  |

### **Using Slot Parameters**

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';
	import type { StorageReference } from 'firebase/storage';
</script>

<DownloadURL ref="images/photo.jpg" let:url let:ref let:storage>
	{#snippet default(url: string, ref: StorageReference, storage: any)}
		<div class="image-container">
			<img src={url} alt="Photo" />
			<div class="image-info">
				<p>Path: {ref.fullPath}</p>
				<p>Bucket: {ref.bucket}</p>
				<button onclick={() => downloadFile(url, ref.name)}>
					Download {ref.name}
				</button>
			</div>
		</div>
	{/snippet}
</DownloadURL>
```

## 🔧 Advanced Usage

### **Conditional Image Loading**

Handle different image states:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';

	let imagePath = 'images/default.jpg';
</script>

<DownloadURL ref={imagePath} let:url let:ref let:storage let:loading let:error>
	{#if loading}
		<div class="image-loading">
			<div class="loading-spinner"></div>
			<p>Loading image...</p>
		</div>
	{:else if error}
		<div class="image-error">
			<img src="/placeholder.jpg" alt="Placeholder" />
			<p>Failed to load image</p>
		</div>
	{:else}
		<img src={url} alt="Loaded image" class="loaded-image" />
	{/if}
</DownloadURL>
```

### **Image Gallery**

Create an image gallery with multiple images:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';

	const imagePaths = ['gallery/image1.jpg', 'gallery/image2.jpg', 'gallery/image3.jpg'];
</script>

<div class="image-gallery">
	{#each imagePaths as imagePath}
		<DownloadURL ref={imagePath} let:url let:ref let:storage>
			<div class="gallery-item">
				<img src={url} alt="Gallery image" />
				<div class="image-overlay">
					<button onclick={() => openLightbox(url)}> View Full Size </button>
				</div>
			</div>
		</DownloadURL>
	{/each}
</div>
```

### **File Download with Progress**

Create download functionality with progress tracking:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';

	async function downloadFile(url, filename) {
		try {
			const response = await fetch(url);
			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = filename;
			link.click();
			window.URL.revokeObjectURL(downloadUrl);
		} catch (error) {
			console.error('Download failed:', error);
		}
	}
</script>

<DownloadURL ref="documents/report.pdf" let:url let:ref let:storage>
	<div class="file-download">
		<div class="file-info">
			<h3>{ref.name}</h3>
			<p>Click to download</p>
		</div>
		<button class="download-button" onclick={() => downloadFile(url, ref.name)}>
			📥 Download PDF
		</button>
	</div>
</DownloadURL>
```

### **Dynamic Image Paths**

Use reactive image paths:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';

	let userId = 'user123';
	let imageSize = 'large';

	$: imagePath = `users/${userId}/profile-${imageSize}.jpg`;
</script>

<div class="user-profile">
	<DownloadURL ref={imagePath} let:url let:ref let:storage>
		<img src={url} alt="User profile" class="profile-image" />
	</DownloadURL>

	<div class="size-controls">
		<button onclick={() => (imageSize = 'small')}>Small</button>
		<button onclick={() => (imageSize = 'medium')}>Medium</button>
		<button onclick={() => (imageSize = 'large')}>Large</button>
	</div>
</div>
```

## 🎨 Custom Styling

### **Image Loading States**

Style loading and error states:

```svelte
<style>
	.image-container {
		position: relative;
		width: 300px;
		height: 200px;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.loaded-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity 0.3s;
	}

	.image-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		background: #f3f4f6;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.image-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		background: #fef2f2;
		color: #dc2626;
	}

	.image-error img {
		width: 60px;
		height: 60px;
		opacity: 0.5;
		margin-bottom: 0.5rem;
	}
</style>
```

### **Gallery Layout**

Style an image gallery:

```svelte
<style>
	.image-gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
		padding: 1rem;
	}

	.gallery-item {
		position: relative;
		border-radius: 0.5rem;
		overflow: hidden;
		aspect-ratio: 1;
	}

	.gallery-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s;
	}

	.gallery-item:hover img {
		transform: scale(1.05);
	}

	.image-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.3s;
	}

	.gallery-item:hover .image-overlay {
		opacity: 1;
	}

	.image-overlay button {
		background: white;
		color: black;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.image-overlay button:hover {
		background: #f3f4f6;
	}
</style>
```

## 🔍 Error Handling

### **File Not Found**

Handle missing files gracefully:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';
</script>

<DownloadURL ref="images/missing.jpg" let:url let:ref let:storage let:error>
	{#if error?.code === 'storage/object-not-found'}
		<div class="file-not-found">
			<img src="/placeholder.jpg" alt="Placeholder" />
			<p>Image not found</p>
		</div>
	{:else if error}
		<div class="file-error">
			<p>Error loading file: {error.message}</p>
			<button onclick={() => window.location.reload()}> Retry </button>
		</div>
	{:else}
		<img src={url} alt="Loaded image" />
	{/if}
</DownloadURL>
```

### **Permission Errors**

Handle access denied scenarios:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';
</script>

<DownloadURL ref="private/images/secret.jpg" let:url let:ref let:storage let:error>
	{#if error?.code === 'storage/unauthorized'}
		<div class="permission-error">
			<h3>Access Denied</h3>
			<p>You don't have permission to view this file.</p>
			<button onclick={() => signIn()}>Sign In</button>
		</div>
	{:else if error}
		<div class="error">
			<p>Error: {error.message}</p>
		</div>
	{:else}
		<img src={url} alt="Private image" />
	{/if}
</DownloadURL>
```

## 🔧 Performance Optimization

### **Lazy Loading**

Load images only when needed:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';

	let shouldLoadImage = false;
	let imagePath = 'images/large-image.jpg';
</script>

<div class="lazy-image">
	{#if !shouldLoadImage}
		<button onclick={() => (shouldLoadImage = true)}> Load Image </button>
	{:else}
		<DownloadURL ref={imagePath} let:url let:ref let:storage>
			<img src={url} alt="Lazy loaded image" />
		</DownloadURL>
	{/if}
</div>
```

### **Image Preloading**

Preload critical images:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';

	const criticalImages = ['images/logo.png', 'images/hero-banner.jpg'];
</script>

<!-- Preload critical images -->
{#each criticalImages as imagePath}
	<DownloadURL ref={imagePath} let:url let:ref let:storage>
		<!-- Hidden preload -->
		<img src={url} alt="" style="display: none;" />
	</DownloadURL>
{/each}

<!-- Main content -->
<DownloadURL ref="images/hero-banner.jpg" let:url let:ref let:storage>
	<img src={url} alt="Hero banner" class="hero-image" />
</DownloadURL>
```

## 🐛 Troubleshooting

### **Component Not Loading**

If the DownloadURL component doesn't load:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';
	import { firebaseService } from 'svelte-firekit';

	// Debug storage availability
	const storage = firebaseService.getStorageInstance();
	$effect(() => {
		console.log('Storage instance:', storage);
		console.log('Image path:', imagePath);
	});
</script>

<DownloadURL ref="images/test.jpg" let:url let:ref let:storage let:loading let:error>
	{#snippet default(url, ref, storage)}
		<div class="debug">
			<p>URL: {url}</p>
			<p>Ref path: {ref?.fullPath}</p>
			<p>Storage: {storage ? 'Available' : 'Not available'}</p>
		</div>
	{/snippet}
</DownloadURL>
```

### **URL Not Generating**

If download URLs are not generating:

```svelte
<script>
	import { DownloadURL } from 'svelte-firekit';

	let imagePath = 'images/test.jpg';

	// Debug path
	$effect(() => {
		console.log('Current image path:', imagePath);
	});
</script>

<DownloadURL ref={imagePath} let:url let:ref let:storage let:loading let:error>
	{#if loading}
		<p>Loading URL for: {imagePath}</p>
	{:else if error}
		<p>Error: {error.message}</p>
		<p>Code: {error.code}</p>
	{:else if url}
		<p>URL generated successfully!</p>
		<img src={url} alt="Test image" />
	{:else}
		<p>No URL available</p>
	{/if}
</DownloadURL>
```

## 📚 Related Components

- [`StorageList`](./storage-list.md) - List files in Storage
- [`UploadTask`](./upload-task.md) - Upload files to Storage
- [`Doc`](./doc.md) - Firestore document subscription

## 🔗 API Reference

### **Component Props**

```typescript
interface DownloadURLProps {
	ref: string; // Storage reference path
	children: Snippet<[string, StorageReference, any]>;
	loading?: Snippet<[]>;
}
```

### **Slot Parameters**

```typescript
// children slot parameters
url: string; // Download URL
ref: StorageReference; // Firebase Storage reference
storage: any; // Firebase Storage instance
```

### **Error Codes**

```typescript
// Common error codes
'storage/object-not-found'; // File doesn't exist
'storage/unauthorized'; // Permission denied
'storage/canceled'; // Operation canceled
'storage/unknown'; // Unknown error
```

---

**Next**: [UploadTask Component](./upload-task.md)
