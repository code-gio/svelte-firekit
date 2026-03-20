import {
	type FileValidationOptions,
	type FileValidationResult,
	type FileValidationError,
	FileValidationErrorCode
} from '../types/storage.js';

/** Common extension-to-MIME mappings for the `accept` option. */
const EXT_TO_MIME: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.bmp': 'image/bmp',
	'.ico': 'image/x-icon',
	'.avif': 'image/avif',
	'.pdf': 'application/pdf',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.ogg': 'audio/ogg',
	'.json': 'application/json',
	'.csv': 'text/csv',
	'.txt': 'text/plain',
	'.zip': 'application/zip'
};

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesMime(fileType: string, fileName: string, pattern: string): boolean {
	// Extension pattern: '.jpg'
	if (pattern.startsWith('.')) {
		const expectedMime = EXT_TO_MIME[pattern.toLowerCase()];
		if (expectedMime) return fileType === expectedMime;
		// Fallback: check the file name extension
		return fileName.toLowerCase().endsWith(pattern.toLowerCase());
	}

	// Wildcard MIME: 'image/*'
	if (pattern.endsWith('/*')) {
		const prefix = pattern.slice(0, -1); // 'image/'
		return fileType.startsWith(prefix);
	}

	// Exact MIME: 'image/png'
	return fileType === pattern;
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve({ width: img.naturalWidth, height: img.naturalHeight });
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Failed to load image for dimension check.'));
		};
		img.src = url;
	});
}

/**
 * Validates a File against the given options.
 * Returns a result with `valid: true` if all checks pass, or `valid: false` with an array of errors.
 *
 * @example
 * ```ts
 * const result = await validateFile(file, {
 *   maxSize: 5 * 1024 * 1024,
 *   accept: ['image/png', 'image/jpeg', '.webp'],
 *   maxWidth: 2048,
 *   maxHeight: 2048
 * });
 *
 * if (!result.valid) {
 *   console.log(result.errors);
 * }
 * ```
 */
export async function validateFile(
	file: File,
	options: FileValidationOptions
): Promise<FileValidationResult> {
	const errors: FileValidationError[] = [];

	// ── Size checks ──────────────────────────────────────────────────────────
	if (options.maxSize !== undefined && file.size > options.maxSize) {
		errors.push({
			code: FileValidationErrorCode.FILE_TOO_LARGE,
			message: `File size ${formatBytes(file.size)} exceeds maximum ${formatBytes(options.maxSize)}.`
		});
	}

	if (options.minSize !== undefined && file.size < options.minSize) {
		errors.push({
			code: FileValidationErrorCode.FILE_TOO_SMALL,
			message: `File size ${formatBytes(file.size)} is below minimum ${formatBytes(options.minSize)}.`
		});
	}

	// ── MIME type check ──────────────────────────────────────────────────────
	if (options.accept && options.accept.length > 0) {
		const accepted = options.accept.some((pattern) => matchesMime(file.type, file.name, pattern));
		if (!accepted) {
			errors.push({
				code: FileValidationErrorCode.INVALID_MIME_TYPE,
				message: `File type "${file.type || 'unknown'}" is not accepted. Allowed: ${options.accept.join(', ')}.`
			});
		}
	}

	// ── Image dimension checks ───────────────────────────────────────────────
	const needsDimensions =
		options.maxWidth !== undefined ||
		options.maxHeight !== undefined ||
		options.minWidth !== undefined ||
		options.minHeight !== undefined;

	if (needsDimensions && file.type.startsWith('image/')) {
		try {
			const { width, height } = await getImageDimensions(file);

			if (options.maxWidth !== undefined && width > options.maxWidth) {
				errors.push({
					code: FileValidationErrorCode.IMAGE_TOO_WIDE,
					message: `Image width ${width}px exceeds maximum ${options.maxWidth}px.`
				});
			}
			if (options.maxHeight !== undefined && height > options.maxHeight) {
				errors.push({
					code: FileValidationErrorCode.IMAGE_TOO_TALL,
					message: `Image height ${height}px exceeds maximum ${options.maxHeight}px.`
				});
			}
			if (options.minWidth !== undefined && width < options.minWidth) {
				errors.push({
					code: FileValidationErrorCode.IMAGE_TOO_NARROW,
					message: `Image width ${width}px is below minimum ${options.minWidth}px.`
				});
			}
			if (options.minHeight !== undefined && height < options.minHeight) {
				errors.push({
					code: FileValidationErrorCode.IMAGE_TOO_SHORT,
					message: `Image height ${height}px is below minimum ${options.minHeight}px.`
				});
			}
		} catch {
			errors.push({
				code: FileValidationErrorCode.DIMENSION_CHECK_FAILED,
				message: 'Could not read image dimensions for validation.'
			});
		}
	}

	return { valid: errors.length === 0, errors };
}
