export interface AnalyticsEvent {
	name: string;
	parameters?: Record<string, unknown>;
}

export interface EcommerceItem {
	item_id: string;
	item_name: string;
	item_category?: string;
	item_variant?: string;
	item_brand?: string;
	price?: number;
	quantity?: number;
	currency?: string;
}

export interface PurchaseEvent {
	transaction_id: string;
	value: number;
	currency?: string;
	tax?: number;
	shipping?: number;
	items?: EcommerceItem[];
}

export interface FormSubmissionEvent {
	form_name: string;
	form_id?: string;
	success?: boolean;
	error_message?: string;
}

export interface SearchEvent {
	search_term: string;
	results_count?: number;
	category?: string;
}

export interface PageViewEvent {
	page_path: string;
	page_title?: string;
	page_location?: string;
	page_referrer?: string;
}

export interface EngagementEvent {
	engagement_time_msec?: number;
	session_id?: string;
}

export interface AnalyticsConfig {
	debugMode?: boolean;
	enablePageTracking?: boolean;
	enableUserTracking?: boolean;
	customParameters?: Record<string, unknown>;
	enabled?: boolean;
}
