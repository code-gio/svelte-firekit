import type { Component } from 'svelte';

export type Metadata = {
	title: string;
	description: string;
	openGraph: {
		title: string;
		description: string;
		type: 'article';
		url: string;
		images: Array<{
			url: string;
			width: number;
			height: number;
			alt: string;
		}>;
	};
	twitter: {
		card: 'summary_large_image';
		title: string;
		description: string;
		images: string[];
		creator: string;
	};
};

export type DocMeta = {
	title: string;
	description: string;
	slug: string;
	component: boolean;
	source: string;
	bits?: string;
	icon?: string;
	label?: string;
	disabled?: boolean;
	external?: boolean;
	order?: number; // For custom sorting
	lastModified?: string; // ISO date string
	tags?: string[]; // For categorization
};

export type DocFile = {
	default: Component;
	metadata: DocMeta;
};

export type DocResolver = () => Promise<DocFile>;

export type TableOfContentsItem = {
	title: string;
	url: string;
	items?: TableOfContentsItem[];
	level?: number; // Heading level (1-6)
};

export type TableOfContents = {
	items: TableOfContentsItem[];
};

// API Response types
export type DocsApiResponse = {
	success: boolean;
	data?: DocMeta[];
	error?: string;
	meta?: {
		total: number;
		lastModified: string;
	};
};

// Validation types
export type DocMetaValidation = {
	isValid: boolean;
	errors: string[];
	warnings: string[];
};
