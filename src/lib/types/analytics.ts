/**
 * @fileoverview Analytics types and interfaces for FirekitAnalytics
 * @module AnalyticsTypes
 * @version 1.0.0
 */

/**
 * Analytics event interface
 */
export interface AnalyticsEvent {
	name: string;
	parameters?: Record<string, any>;
}

/**
 * E-commerce item interface
 */
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

/**
 * Purchase event interface
 */
export interface PurchaseEvent {
	transaction_id: string;
	value: number;
	currency?: string;
	tax?: number;
	shipping?: number;
	items?: EcommerceItem[];
}

/**
 * Form submission event interface
 */
export interface FormSubmissionEvent {
	form_name: string;
	form_id?: string;
	success?: boolean;
	error_message?: string;
}

/**
 * Search event interface
 */
export interface SearchEvent {
	search_term: string;
	results_count?: number;
	category?: string;
}

/**
 * Page view event interface
 */
export interface PageViewEvent {
	page_path: string;
	page_title?: string;
	page_location?: string;
	page_referrer?: string;
}

/**
 * User engagement event interface
 */
export interface EngagementEvent {
	engagement_time_msec?: number;
	session_id?: string;
}

/**
 * Analytics configuration interface
 */
export interface AnalyticsConfig {
	/** Enable debug mode for analytics */
	debugMode?: boolean;
	/** Enable automatic page tracking */
	enablePageTracking?: boolean;
	/** Enable automatic user tracking */
	enableUserTracking?: boolean;
	/** Custom parameters to include in all events */
	customParameters?: Record<string, any>;
	/** Enable analytics collection */
	enabled?: boolean;
}
