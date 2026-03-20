export interface FileValidationOptions {
	/** Maximum file size in bytes. */
	maxSize?: number;
	/** Minimum file size in bytes. */
	minSize?: number;
	/** Allowed MIME types or extensions. Supports wildcards like `'image/*'` and extensions like `'.jpg'`. */
	accept?: string[];
	/** Maximum image width in pixels. Only checked for image files. */
	maxWidth?: number;
	/** Maximum image height in pixels. Only checked for image files. */
	maxHeight?: number;
	/** Minimum image width in pixels. Only checked for image files. */
	minWidth?: number;
	/** Minimum image height in pixels. Only checked for image files. */
	minHeight?: number;
}

export enum FileValidationErrorCode {
	FILE_TOO_LARGE = 'validation/file-too-large',
	FILE_TOO_SMALL = 'validation/file-too-small',
	INVALID_MIME_TYPE = 'validation/invalid-mime-type',
	IMAGE_TOO_WIDE = 'validation/image-too-wide',
	IMAGE_TOO_TALL = 'validation/image-too-tall',
	IMAGE_TOO_NARROW = 'validation/image-too-narrow',
	IMAGE_TOO_SHORT = 'validation/image-too-short',
	DIMENSION_CHECK_FAILED = 'validation/dimension-check-failed'
}

export interface FileValidationError {
	code: FileValidationErrorCode;
	message: string;
}

export interface FileValidationResult {
	valid: boolean;
	errors: FileValidationError[];
}
