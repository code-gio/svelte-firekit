/**
 * @fileoverview FirekitAnalytics - Google Analytics Service for SvelteKit with Firebase Analytics
 * @module FirekitAnalytics
 * @version 1.0.0
 */

import {
	logEvent,
	setUserId,
	setUserProperties,
	setAnalyticsCollectionEnabled,
	type Analytics
} from 'firebase/analytics';
import { firebaseService } from '../firebase.js';
import { firekitAuth } from './auth.js';
import type { UserProfile } from '../types/auth.js';
import type {
	AnalyticsEvent,
	EcommerceItem,
	PurchaseEvent,
	FormSubmissionEvent,
	SearchEvent,
	PageViewEvent,
	EngagementEvent
} from '../types/analytics.js';

/**
 * Comprehensive Firebase Analytics service for SvelteKit applications.
 * Provides a complete analytics solution with automatic user tracking,
 * e-commerce tracking, and SvelteKit-specific features.
 *
 * @class FirekitAnalytics
 * @example
 * ```typescript
 * import { firekitAnalytics } from 'svelte-firekit';
 *
 * // Track a custom event
 * firekitAnalytics.trackEvent('button_click', { button_name: 'signup' });
 *
 * // Track a purchase
 * firekitAnalytics.trackPurchase({
 *   transaction_id: 'T12345',
 *   value: 29.99,
 *   currency: 'USD',
 *   items: [{ item_id: 'prod_123', item_name: 'Premium Plan' }]
 * });
 * ```
 */
class FirekitAnalytics {
	private static instance: FirekitAnalytics;
	private analytics: Analytics | null = null;
	private _initialized = false;
	private customParameters: Record<string, any> = {};
	private debugMode = false;

	private constructor() {
		if (typeof window !== 'undefined') {
			this.initialize();
		}
	}

	/**
	 * Gets singleton instance of FirekitAnalytics
	 * @returns {FirekitAnalytics} The FirekitAnalytics instance
	 */
	static getInstance(): FirekitAnalytics {
		if (!FirekitAnalytics.instance) {
			FirekitAnalytics.instance = new FirekitAnalytics();
		}
		return FirekitAnalytics.instance;
	}

	/**
	 * Initializes the analytics service
	 */
	private initialize(): void {
		if (this._initialized || typeof window === 'undefined') return;

		try {
			this.analytics = firebaseService.getAnalyticsInstance();
			this._initialized = true;
			console.log('FirekitAnalytics initialized successfully');
		} catch (error) {
			console.error('Failed to initialize FirekitAnalytics:', error);
			this._initialized = false;
		}
	}

	/**
	 * Checks if analytics is available
	 * @private
	 */
	private isAnalyticsAvailable(): boolean {
		return this._initialized && this.analytics !== null;
	}

	/**
	 * Gets the analytics instance
	 * @returns {Analytics | null} Firebase Analytics instance
	 */
	getAnalyticsInstance(): Analytics | null {
		return this.analytics;
	}

	/**
	 * Checks if analytics is initialized
	 * @returns {boolean} True if analytics is initialized
	 */
	isInitialized(): boolean {
		return this._initialized;
	}

	// ========================================
	// CORE TRACKING FUNCTIONS
	// ========================================

	/**
	 * Logs a custom analytics event
	 * @param {string} eventName Name of the event
	 * @param {Record<string, any>} parameters Event parameters
	 *
	 * @example
	 * ```typescript
	 * firekitAnalytics.trackEvent('button_click', {
	 *   button_name: 'signup',
	 *   page_location: '/home'
	 * });
	 * ```
	 */
	trackEvent(eventName: string, parameters: Record<string, any> = {}): void {
		if (!this.isAnalyticsAvailable()) {
			console.warn('Analytics not available, event not tracked:', eventName);
			return;
		}

		try {
			const mergedParameters = { ...this.customParameters, ...parameters };
			logEvent(this.analytics!, eventName, mergedParameters);

			if (this.debugMode) {
				console.log('Analytics Event:', eventName, mergedParameters);
			}
		} catch (error) {
			console.error('Failed to track event:', eventName, error);
		}
	}

	/**
	 * Tracks page view events
	 * @param {PageViewEvent} pageView Page view data
	 *
	 * @example
	 * ```typescript
	 * firekitAnalytics.trackPageView({
	 *   page_path: '/products',
	 *   page_title: 'Products Page'
	 * });
	 * ```
	 */
	trackPageView(pageView: PageViewEvent): void {
		this.trackEvent('page_view', {
			page_path: pageView.page_path,
			page_title: pageView.page_title || document.title,
			page_location: pageView.page_location || window.location.href,
			page_referrer: pageView.page_referrer || document.referrer
		});
	}

	/**
	 * Sets user ID for analytics
	 * @param {string | null} userId User ID or null to clear
	 */
	setUserId(userId: string | null): void {
		if (!this.isAnalyticsAvailable()) return;

		try {
			setUserId(this.analytics!, userId);
		} catch (error) {
			console.error('Failed to set user ID:', error);
		}
	}

	/**
	 * Sets user properties for analytics
	 * @param {Record<string, any>} properties User properties
	 *
	 * @example
	 * ```typescript
	 * firekitAnalytics.setUserProperties({
	 *   user_type: 'premium',
	 *   subscription_plan: 'pro'
	 * });
	 * ```
	 */
	setUserProperties(properties: Record<string, any>): void {
		if (!this.isAnalyticsAvailable()) return;

		try {
			setUserProperties(this.analytics!, properties);
		} catch (error) {
			console.error('Failed to set user properties:', error);
		}
	}

	// ========================================
	// E-COMMERCE TRACKING
	// ========================================

	/**
	 * Tracks purchase events
	 * @param {PurchaseEvent} purchase Purchase data
	 *
	 * @example
	 * ```typescript
	 * firekitAnalytics.trackPurchase({
	 *   transaction_id: 'T12345',
	 *   value: 29.99,
	 *   currency: 'USD',
	 *   items: [{
	 *     item_id: 'prod_123',
	 *     item_name: 'Premium Plan',
	 *     price: 29.99
	 *   }]
	 * });
	 * ```
	 */
	trackPurchase(purchase: PurchaseEvent): void {
		const parameters: Record<string, any> = {
			transaction_id: purchase.transaction_id,
			value: purchase.value,
			currency: purchase.currency || 'USD'
		};

		if (purchase.tax !== undefined) parameters.tax = purchase.tax;
		if (purchase.shipping !== undefined) parameters.shipping = purchase.shipping;
		if (purchase.items) parameters.items = purchase.items;

		this.trackEvent('purchase', parameters);
	}

	/**
	 * Tracks add to cart events
	 * @param {EcommerceItem} item Item being added to cart
	 * @param {number} value Total value of the cart
	 * @param {string} currency Currency code
	 *
	 * @example
	 * ```typescript
	 * firekitAnalytics.trackAddToCart({
	 *   item_id: 'prod_123',
	 *   item_name: 'Premium Plan',
	 *   price: 29.99
	 * }, 29.99, 'USD');
	 * ```
	 */
	trackAddToCart(item: EcommerceItem, value: number, currency: string = 'USD'): void {
		this.trackEvent('add_to_cart', {
			currency,
			value,
			items: [item]
		});
	}

	/**
	 * Tracks remove from cart events
	 * @param {EcommerceItem} item Item being removed from cart
	 * @param {number} value Total value of the cart
	 * @param {string} currency Currency code
	 */
	trackRemoveFromCart(item: EcommerceItem, value: number, currency: string = 'USD'): void {
		this.trackEvent('remove_from_cart', {
			currency,
			value,
			items: [item]
		});
	}

	/**
	 * Tracks view item events
	 * @param {EcommerceItem} item Item being viewed
	 */
	trackViewItem(item: EcommerceItem): void {
		this.trackEvent('view_item', {
			items: [item]
		});
	}

	/**
	 * Tracks begin checkout events
	 * @param {EcommerceItem[]} items Items in cart
	 * @param {number} value Total value
	 * @param {string} currency Currency code
	 */
	trackBeginCheckout(items: EcommerceItem[], value: number, currency: string = 'USD'): void {
		this.trackEvent('begin_checkout', {
			currency,
			value,
			items
		});
	}

	// ========================================
	// ENGAGEMENT TRACKING
	// ========================================

	/**
	 * Tracks form submission events
	 * @param {FormSubmissionEvent} formSubmission Form submission data
	 *
	 * @example
	 * ```typescript
	 * firekitAnalytics.trackFormSubmission({
	 *   form_name: 'contact_form',
	 *   success: true
	 * });
	 * ```
	 */
	trackFormSubmission(formSubmission: FormSubmissionEvent): void {
		const parameters: Record<string, any> = {
			form_name: formSubmission.form_name
		};

		if (formSubmission.form_id) parameters.form_id = formSubmission.form_id;
		if (formSubmission.success !== undefined) parameters.success = formSubmission.success;
		if (formSubmission.error_message) parameters.error_message = formSubmission.error_message;

		this.trackEvent('form_submit', parameters);
	}

	/**
	 * Tracks search events
	 * @param {SearchEvent} search Search data
	 *
	 * @example
	 * ```typescript
	 * firekitAnalytics.trackSearch({
	 *   search_term: 'premium features',
	 *   results_count: 15
	 * });
	 * ```
	 */
	trackSearch(search: SearchEvent): void {
		const parameters: Record<string, any> = {
			search_term: search.search_term
		};

		if (search.results_count !== undefined) parameters.results_count = search.results_count;
		if (search.category) parameters.category = search.category;

		this.trackEvent('search', parameters);
	}

	/**
	 * Tracks custom conversion events
	 * @param {string} conversionName Name of the conversion
	 * @param {number} value Conversion value
	 * @param {string} currency Currency code
	 */
	trackConversion(conversionName: string, value?: number, currency: string = 'USD'): void {
		const parameters: Record<string, any> = {};
		if (value !== undefined) {
			parameters.value = value;
			parameters.currency = currency;
		}

		this.trackEvent(conversionName, parameters);
	}

	/**
	 * Tracks user engagement events
	 * @param {EngagementEvent} engagement Engagement data
	 */
	trackEngagement(engagement: EngagementEvent): void {
		const parameters: Record<string, any> = {};
		if (engagement.engagement_time_msec)
			parameters.engagement_time_msec = engagement.engagement_time_msec;
		if (engagement.session_id) parameters.session_id = engagement.session_id;

		this.trackEvent('user_engagement', parameters);
	}

	// ========================================
	// SVELTEKIT-SPECIFIC FUNCTIONS
	// ========================================

	/**
	 * Initializes automatic page tracking for SvelteKit
	 * @param {boolean} trackInitialPage Whether to track the initial page load
	 *
	 * @example
	 * ```typescript
	 * // In your app.html or layout
	 * firekitAnalytics.initPageTracking();
	 * ```
	 */
	initPageTracking(trackInitialPage: boolean = true): void {
		if (typeof window === 'undefined') return;

		// Track initial page load
		if (trackInitialPage) {
			this.trackPageView({
				page_path: window.location.pathname,
				page_title: document.title
			});
		}

		// Listen for SvelteKit navigation events
		window.addEventListener('sveltekit:navigation-end', () => {
			this.trackPageView({
				page_path: window.location.pathname,
				page_title: document.title
			});
		});

		// Fallback for other navigation events
		window.addEventListener('popstate', () => {
			this.trackPageView({
				page_path: window.location.pathname,
				page_title: document.title
			});
		});
	}

	/**
	 * Tracks route changes manually (useful for custom routing)
	 * @param {string} route Route path
	 * @param {string} title Page title
	 */
	trackRouteChange(route: string, title?: string): void {
		this.trackPageView({
			page_path: route,
			page_title: title || document.title
		});
	}

	// ========================================
	// UTILITY FUNCTIONS
	// ========================================

	/**
	 * Sets custom parameters that will be included in all subsequent events
	 * @param {Record<string, any>} parameters Custom parameters
	 */
	setCustomParameters(parameters: Record<string, any>): void {
		this.customParameters = { ...this.customParameters, ...parameters };
	}

	/**
	 * Clears custom parameters
	 */
	clearCustomParameters(): void {
		this.customParameters = {};
	}

	/**
	 * Tracks multiple events in batch
	 * @param {AnalyticsEvent[]} events Array of events to track
	 */
	trackEvents(events: AnalyticsEvent[]): void {
		events.forEach((event) => {
			this.trackEvent(event.name, event.parameters);
		});
	}

	/**
	 * Enables or disables analytics collection
	 * @param {boolean} enabled Whether to enable analytics collection
	 */
	setAnalyticsEnabled(enabled: boolean): void {
		if (!this.isAnalyticsAvailable()) return;

		try {
			setAnalyticsCollectionEnabled(this.analytics!, enabled);
		} catch (error) {
			console.error('Failed to set analytics collection enabled:', error);
		}
	}

	/**
	 * Sets debug mode for analytics
	 * @param {boolean} enabled Whether to enable debug mode
	 */
	setDebugMode(enabled: boolean): void {
		this.debugMode = enabled;
	}

	/**
	 * Gets current debug mode status
	 * @returns {boolean} Current debug mode status
	 */
	getDebugMode(): boolean {
		return this.debugMode;
	}

	/**
	 * Cleans up analytics resources
	 */
	cleanup(): void {
		this.customParameters = {};
		this.debugMode = false;
	}
}

/**
 * Pre-initialized singleton instance of FirekitAnalytics.
 * This is the main export that should be used throughout your application.
 *
 * @example
 * ```typescript
 * import { firekitAnalytics } from 'svelte-firekit';
 *
 * // Track a custom event
 * firekitAnalytics.trackEvent('button_click', { button_name: 'signup' });
 *
 * // Initialize page tracking
 * firekitAnalytics.initPageTracking();
 *
 * // Track a purchase
 * firekitAnalytics.trackPurchase({
 *   transaction_id: 'T12345',
 *   value: 29.99,
 *   currency: 'USD'
 * });
 * ```
 */
export const firekitAnalytics = FirekitAnalytics.getInstance();
