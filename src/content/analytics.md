---
title: Analytics Service
description: Firebase Analytics integration with custom event tracking and user properties
---

# Analytics Service

The `firekitAnalytics` service provides comprehensive Firebase Analytics integration for your Svelte 5 application, offering custom event tracking, user property management, and conversion tracking with reactive state management.

## Overview

The Analytics service handles:

- Custom event tracking with parameters
- User property management
- Conversion and purchase tracking
- Screen view tracking
- User engagement metrics
- Performance monitoring
- Debug mode and testing
- Privacy compliance
- Real-time reporting

## Quick Start

```svelte
<script>
	import { firekitAnalytics } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';

	// Track custom events
	async function handleButtonClick() {
		await firekitAnalytics.trackEvent('button_click', {
			button_name: 'signup',
			page_location: '/home',
			user_type: 'new'
		});
	}

	// Track screen views
	async function trackPageView() {
		await firekitAnalytics.trackScreenView('home_page', {
			page_title: 'Home',
			page_category: 'main'
		});
	}

	// Set user properties
	async function setUserProperties() {
		await firekitAnalytics.setUserProperties({
			user_type: 'premium',
			subscription_plan: 'pro',
			account_age_days: 30
		});
	}
</script>

<Button onclick={handleButtonClick}>Sign Up</Button>
```

## Event Tracking

### Basic Event Tracking

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Simple event
await firekitAnalytics.trackEvent('app_open');

// Event with parameters
await firekitAnalytics.trackEvent('button_click', {
	button_name: 'signup',
	page_location: '/home',
	user_type: 'new'
});

// Event with custom parameters
await firekitAnalytics.trackEvent('product_view', {
	item_id: 'prod_123',
	item_name: 'Premium Plan',
	item_category: 'subscription',
	price: 29.99,
	currency: 'USD'
});
```

### Custom Events

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Track user actions
await firekitAnalytics.trackEvent('user_action', {
	action_type: 'search',
	search_term: 'firebase',
	results_count: 15
});

// Track form interactions
await firekitAnalytics.trackEvent('form_interaction', {
	form_name: 'contact_form',
	field_name: 'email',
	interaction_type: 'focus'
});

// Track navigation
await firekitAnalytics.trackEvent('navigation', {
	from_page: '/home',
	to_page: '/products',
	navigation_type: 'menu_click'
});
```

### E-commerce Events

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Track product views
await firekitAnalytics.trackEvent('view_item', {
	item_id: 'prod_123',
	item_name: 'Premium Plan',
	item_category: 'subscription',
	price: 29.99,
	currency: 'USD'
});

// Track add to cart
await firekitAnalytics.trackEvent('add_to_cart', {
	item_id: 'prod_123',
	item_name: 'Premium Plan',
	item_category: 'subscription',
	price: 29.99,
	currency: 'USD',
	quantity: 1
});

// Track purchases
await firekitAnalytics.trackPurchase({
	transaction_id: 'T12345',
	value: 29.99,
	currency: 'USD',
	tax: 2.99,
	shipping: 0,
	items: [
		{
			item_id: 'prod_123',
			item_name: 'Premium Plan',
			item_category: 'subscription',
			price: 29.99,
			quantity: 1
		}
	]
});
```

## Screen View Tracking

### Automatic Screen Tracking

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Enable automatic screen tracking
firekitAnalytics.enableAutoScreenTracking();

// Track specific screen
await firekitAnalytics.trackScreenView('home_page', {
	page_title: 'Home',
	page_category: 'main',
	user_type: 'premium'
});

// Track with custom parameters
await firekitAnalytics.trackScreenView('product_detail', {
	page_title: 'Product Details',
	item_id: 'prod_123',
	item_category: 'subscription'
});
```

### Route-based Tracking

```svelte
<script>
	import { firekitAnalytics } from 'svelte-firekit';
	import { page } from '$app/stores';

	// Track page changes
	$effect(() => {
		const currentPage = $page.url.pathname;
		firekitAnalytics.trackScreenView(currentPage, {
			page_title: document.title,
			page_category: getPageCategory(currentPage)
		});
	});

	function getPageCategory(pathname: string) {
		if (pathname.startsWith('/products')) return 'products';
		if (pathname.startsWith('/account')) return 'account';
		return 'main';
	}
</script>
```

## User Properties

### Set User Properties

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Set basic user properties
await firekitAnalytics.setUserProperties({
	user_type: 'premium',
	subscription_plan: 'pro',
	account_age_days: 30
});

// Set user ID
await firekitAnalytics.setUserId('user_123');

// Set user properties with custom values
await firekitAnalytics.setUserProperties({
	preferred_language: 'en',
	timezone: 'America/New_York',
	device_type: 'desktop',
	last_login_date: new Date().toISOString()
});
```

### Dynamic User Properties

```typescript
import { firekitAnalytics } from 'svelte-firekit';
import { firekitUser } from 'svelte-firekit';

const user = $derived(firekitUser.user);

// Update user properties when user changes
$effect(() => {
	if (user) {
		firekitAnalytics.setUserProperties({
			user_id: user.uid,
			email: user.email,
			email_verified: user.emailVerified,
			account_created: user.metadata.creationTime,
			last_sign_in: user.metadata.lastSignInTime
		});
	}
});
```

## Conversion Tracking

### Purchase Tracking

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Track purchase
await firekitAnalytics.trackPurchase({
	transaction_id: 'T12345',
	value: 99.99,
	currency: 'USD',
	tax: 8.99,
	shipping: 5.99,
	coupon: 'SAVE10',
	items: [
		{
			item_id: 'prod_123',
			item_name: 'Premium Plan',
			item_category: 'subscription',
			price: 99.99,
			quantity: 1
		}
	]
});

// Track subscription
await firekitAnalytics.trackEvent('subscription_start', {
	subscription_id: 'sub_123',
	plan_name: 'Premium',
	plan_price: 29.99,
	currency: 'USD',
	billing_period: 'monthly'
});
```

### Goal Tracking

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Track signup conversion
await firekitAnalytics.trackEvent('sign_up', {
	method: 'email',
	user_type: 'new',
	referral_source: 'google'
});

// Track trial conversion
await firekitAnalytics.trackEvent('trial_conversion', {
	trial_duration_days: 14,
	conversion_value: 29.99,
	currency: 'USD'
});

// Track feature adoption
await firekitAnalytics.trackEvent('feature_adoption', {
	feature_name: 'advanced_analytics',
	user_type: 'premium',
	adoption_stage: 'first_use'
});
```

## Performance Monitoring

### Custom Metrics

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Track performance metrics
await firekitAnalytics.trackEvent('performance_metric', {
	metric_name: 'page_load_time',
	metric_value: 1200,
	metric_unit: 'ms',
	page_name: 'home'
});

// Track user engagement
await firekitAnalytics.trackEvent('engagement', {
	session_duration: 1800, // 30 minutes
	pages_viewed: 5,
	interactions_count: 12
});

// Track errors
await firekitAnalytics.trackEvent('error', {
	error_type: 'api_error',
	error_message: 'Failed to load data',
	error_code: 'NETWORK_ERROR',
	page_location: '/dashboard'
});
```

## Debug Mode and Testing

### Enable Debug Mode

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Enable debug mode in development
if (import.meta.env.DEV) {
	firekitAnalytics.enableDebugMode();
}

// Test events in debug mode
await firekitAnalytics.trackEvent('test_event', {
	test_parameter: 'test_value',
	debug_mode: true
});
```

### Event Validation

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Validate event before sending
const isValidEvent = firekitAnalytics.validateEvent('custom_event', {
	required_param: 'value',
	optional_param: 'value'
});

if (isValidEvent) {
	await firekitAnalytics.trackEvent('custom_event', {
		required_param: 'value',
		optional_param: 'value'
	});
}
```

## Privacy and Compliance

### Consent Management

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Check analytics consent
const hasConsent = firekitAnalytics.hasConsent();

// Request consent
const consent = await firekitAnalytics.requestConsent();

// Update consent
await firekitAnalytics.updateConsent({
	analytics_storage: 'granted',
	ad_storage: 'denied'
});

// Disable analytics if no consent
if (!hasConsent) {
	firekitAnalytics.disable();
}
```

### Data Anonymization

```typescript
import { firekitAnalytics } from 'svelte-firekit';

// Enable anonymization
firekitAnalytics.enableAnonymization();

// Track events without PII
await firekitAnalytics.trackEvent('user_action', {
	action_type: 'button_click',
	button_id: 'signup_button'
	// No personal information included
});
```

## Svelte Component Integration

### Analytics Hook Component

```svelte
<script>
	import { firekitAnalytics } from 'svelte-firekit';
	import { onMount } from 'svelte';

	export let pageName: string;
	export let pageCategory: string = 'main';

	onMount(() => {
		// Track page view on mount
		firekitAnalytics.trackScreenView(pageName, {
			page_title: document.title,
			page_category: pageCategory
		});
	});
</script>

<slot />
```

### Event Tracking Component

```svelte
<script>
	import { firekitAnalytics } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';

	export let eventName: string;
	export let eventParams: Record<string, any> = {};
	export let disabled = false;

	async function handleClick() {
		if (!disabled) {
			await firekitAnalytics.trackEvent(eventName, eventParams);
		}
	}
</script>

<Button onclick={handleClick} {disabled}>
	<slot />
</Button>
```

### Conversion Tracking Component

```svelte
<script>
	import { firekitAnalytics } from 'svelte-firekit';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	export let product: {
		id: string;
		name: string;
		price: number;
		category: string;
	};

	async function trackView() {
		await firekitAnalytics.trackEvent('view_item', {
			item_id: product.id,
			item_name: product.name,
			item_category: product.category,
			price: product.price,
			currency: 'USD'
		});
	}

	async function trackPurchase() {
		await firekitAnalytics.trackPurchase({
			transaction_id: `T${Date.now()}`,
			value: product.price,
			currency: 'USD',
			items: [
				{
					item_id: product.id,
					item_name: product.name,
					item_category: product.category,
					price: product.price,
					quantity: 1
				}
			]
		});
	}
</script>

<Card onmouseenter={trackView}>
	<CardHeader>
		<CardTitle>{product.name}</CardTitle>
	</CardHeader>
	<CardContent>
		<p class="text-2xl font-bold">${product.price}</p>
		<Button onclick={trackPurchase}>Purchase</Button>
	</CardContent>
</Card>
```

### Analytics Dashboard Component

```svelte
<script>
	import { firekitAnalytics } from 'svelte-firekit';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	// Reactive analytics state
	const analyticsEnabled = $derived(firekitAnalytics.enabled);
	const debugMode = $derived(firekitAnalytics.debugMode);
	const consentStatus = $derived(firekitAnalytics.consentStatus);

	async function enableAnalytics() {
		await firekitAnalytics.enable();
	}

	async function disableAnalytics() {
		await firekitAnalytics.disable();
	}

	async function toggleDebugMode() {
		if (debugMode) {
			firekitAnalytics.disableDebugMode();
		} else {
			firekitAnalytics.enableDebugMode();
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Analytics Settings</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium">Analytics Enabled</span>
			<Switch
				checked={analyticsEnabled}
				onCheckedChange={(checked) => (checked ? enableAnalytics() : disableAnalytics())}
			/>
		</div>

		<div class="flex items-center justify-between">
			<span class="text-sm font-medium">Debug Mode</span>
			<Switch checked={debugMode} onCheckedChange={toggleDebugMode} />
		</div>

		<div class="text-sm">
			<span class="font-medium">Consent Status:</span>
			{consentStatus}
		</div>
	</CardContent>
</Card>
```

## Type Definitions

### Event Parameters

```typescript
interface EventParameters {
	[key: string]: string | number | boolean | null;
}

interface PurchaseParameters {
	transaction_id: string;
	value: number;
	currency: string;
	tax?: number;
	shipping?: number;
	coupon?: string;
	items: PurchaseItem[];
}

interface PurchaseItem {
	item_id: string;
	item_name: string;
	item_category: string;
	price: number;
	quantity: number;
}
```

### User Properties

```typescript
interface UserProperties {
	[key: string]: string | number | boolean | null;
}

interface ConsentSettings {
	analytics_storage: 'granted' | 'denied';
	ad_storage: 'granted' | 'denied';
}
```

### Configuration Options

```typescript
interface AnalyticsConfig {
	enabled?: boolean;
	debugMode?: boolean;
	consentRequired?: boolean;
	anonymizationEnabled?: boolean;
	autoScreenTracking?: boolean;
}
```

## Best Practices

### 1. Use Consistent Event Names

```typescript
// ✅ Good - Consistent naming convention
await firekitAnalytics.trackEvent('button_click', { button_name: 'signup' });
await firekitAnalytics.trackEvent('button_click', { button_name: 'login' });

// ❌ Avoid - Inconsistent naming
await firekitAnalytics.trackEvent('button_click', { button_name: 'signup' });
await firekitAnalytics.trackEvent('login_button_pressed', {});
```

### 2. Include Relevant Parameters

```typescript
// ✅ Good - Include context
await firekitAnalytics.trackEvent('product_view', {
	item_id: 'prod_123',
	item_name: 'Premium Plan',
	item_category: 'subscription',
	price: 29.99,
	currency: 'USD'
});

// ❌ Avoid - Missing context
await firekitAnalytics.trackEvent('product_view', {});
```

### 3. Respect User Privacy

```typescript
// ✅ Good - Check consent before tracking
if (firekitAnalytics.hasConsent()) {
	await firekitAnalytics.trackEvent('user_action', {
		action_type: 'button_click'
	});
}

// ❌ Avoid - Track without consent
await firekitAnalytics.trackEvent('user_action', {
	action_type: 'button_click',
	user_email: user.email // Don't track PII without consent
});
```

### 4. Use Debug Mode in Development

```typescript
// ✅ Good - Enable debug mode in development
if (import.meta.env.DEV) {
	firekitAnalytics.enableDebugMode();
}

// ❌ Avoid - Debug mode in production
firekitAnalytics.enableDebugMode(); // Always enabled
```

### 5. Track Meaningful Events

```typescript
// ✅ Good - Track business-relevant events
await firekitAnalytics.trackEvent('subscription_started', {
	plan_name: 'premium',
	plan_price: 29.99
});

// ❌ Avoid - Track everything
await firekitAnalytics.trackEvent('mouse_move', {
	x: 150,
	y: 200
});
```

## API Reference

### Core Methods

- `trackEvent(name, parameters?)` - Track custom event
- `trackScreenView(screenName, parameters?)` - Track screen view
- `trackPurchase(parameters)` - Track purchase
- `setUserProperties(properties)` - Set user properties
- `setUserId(userId)` - Set user ID

### Configuration Methods

- `enable()` - Enable analytics
- `disable()` - Disable analytics
- `enableDebugMode()` - Enable debug mode
- `disableDebugMode()` - Disable debug mode
- `enableAutoScreenTracking()` - Enable automatic screen tracking

### Consent Methods

- `hasConsent()` - Check if user has consented
- `requestConsent()` - Request user consent
- `updateConsent(settings)` - Update consent settings

### Utility Methods

- `validateEvent(name, parameters)` - Validate event parameters
- `enableAnonymization()` - Enable data anonymization
- `getAnalyticsInstance()` - Get Firebase Analytics instance

### Reactive State

- `enabled` - Whether analytics is enabled
- `debugMode` - Whether debug mode is active
- `consentStatus` - Current consent status
