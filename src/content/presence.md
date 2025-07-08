---
title: Presence Service
description: User online/offline tracking with geolocation and session management
---

# Presence Service

The `firekitPresence` service provides real-time user presence tracking, allowing you to monitor when users are online, offline, or away. It includes geolocation support and session management for comprehensive presence monitoring.

## Overview

The presence service handles:

- Real-time online/offline status tracking
- Geolocation support (browser and device-based)
- Session management and cleanup
- Presence status updates (online, away, busy, offline)
- Cross-device presence synchronization
- Automatic reconnection handling
- Privacy controls and consent management

## Quick Start

```svelte
<script>
	import { firekitPresence, firekitUser } from 'svelte-firekit';
	import { onMount } from 'svelte';

	const user = $derived(firekitUser.user);
	const isAuthenticated = $derived(firekitUser.isAuthenticated);

	// Reactive presence state
	const presenceStatus = $derived(firekitPresence.status);
	const presenceLocation = $derived(firekitPresence.location);
	const presenceSessions = $derived(firekitPresence.sessions);

	onMount(async () => {
		if (isAuthenticated && user) {
			await firekitPresence.initialize(user, {
				geolocation: {
					enabled: true,
					type: 'browser',
					requireConsent: true
				}
			});
		}
	});
</script>

{#if isAuthenticated}
	<div class="presence-indicator">
		<span class="status-{presenceStatus}">{presenceStatus}</span>
		{#if presenceLocation}
			<span>📍 {presenceLocation.city}, {presenceLocation.country}</span>
		{/if}
	</div>
{/if}
```

## Initialization

### Basic Setup

```typescript
import { firekitPresence } from 'svelte-firekit';

// Initialize with default settings
await firekitPresence.initialize(user);

// Initialize with custom configuration
await firekitPresence.initialize(user, {
	presencePath: 'presence/{userId}',
	sessionTimeout: 30000, // 30 seconds
	geolocation: {
		enabled: false
	}
});
```

### Advanced Configuration

```typescript
import { firekitPresence } from 'svelte-firekit';

await firekitPresence.initialize(user, {
	// Custom presence path
	presencePath: 'users/{userId}/presence',

	// Session management
	sessionTimeout: 60000, // 1 minute
	maxSessions: 3,

	// Geolocation settings
	geolocation: {
		enabled: true,
		type: 'browser', // 'browser' | 'device'
		requireConsent: true,
		timeout: 10000,
		highAccuracy: true
	},

	// Presence settings
	presence: {
		updateInterval: 30000, // 30 seconds
		statuses: ['online', 'away', 'busy', 'offline'],
		defaultStatus: 'online'
	}
});
```

## Presence Status Management

### Set Presence Status

```typescript
import { firekitPresence } from 'svelte-firekit';

// Set basic status
await firekitPresence.setPresence('online');
await firekitPresence.setPresence('away');
await firekitPresence.setPresence('busy');
await firekitPresence.setPresence('offline');

// Set status with custom data
await firekitPresence.setPresence('away', {
	reason: 'In a meeting',
	until: new Date(Date.now() + 3600000), // 1 hour from now
	message: 'Back at 3 PM'
});
```

### Get Current Status

```typescript
import { firekitPresence } from 'svelte-firekit';

// Reactive status
const status = $derived(firekitPresence.status);
const statusData = $derived(firekitPresence.statusData);

// Manual status check
const currentStatus = firekitPresence.getCurrentStatus();
const isOnline = firekitPresence.isOnline();
const isAway = firekitPresence.isAway();
```

## Geolocation Support

### Enable Geolocation

```typescript
import { firekitPresence } from 'svelte-firekit';

// Initialize with geolocation
await firekitPresence.initialize(user, {
	geolocation: {
		enabled: true,
		type: 'browser',
		requireConsent: true,
		timeout: 10000,
		highAccuracy: true
	}
});

// Request location permission
const hasPermission = await firekitPresence.requestLocationPermission();

// Get current location
const location = await firekitPresence.getCurrentLocation();
```

### Location Tracking

```typescript
import { firekitPresence } from 'svelte-firekit';

// Reactive location state
const location = $derived(firekitPresence.location);
const locationError = $derived(firekitPresence.locationError);
const locationLoading = $derived(firekitPresence.locationLoading);

// Start location tracking
await firekitPresence.startLocationTracking({
	interval: 60000, // Update every minute
	highAccuracy: true
});

// Stop location tracking
firekitPresence.stopLocationTracking();

// Update location manually
await firekitPresence.updateLocation({
	latitude: 40.7128,
	longitude: -74.006,
	city: 'New York',
	country: 'US',
	timestamp: new Date()
});
```

## Session Management

### Session Information

```typescript
import { firekitPresence } from 'svelte-firekit';

// Reactive session state
const sessions = $derived(firekitPresence.sessions);
const activeSessions = $derived(firekitPresence.activeSessions);
const currentSession = $derived(firekitPresence.currentSession);

// Get session details
const sessionInfo = firekitPresence.getSessionInfo();
const sessionCount = firekitPresence.getSessionCount();

// Check if session is active
const isSessionActive = firekitPresence.isSessionActive();
```

### Session Control

```typescript
import { firekitPresence } from 'svelte-firekit';

// End current session
await firekitPresence.endSession();

// End all sessions
await firekitPresence.endAllSessions();

// End specific session
await firekitPresence.endSession('session-id-123');

// Refresh session
await firekitPresence.refreshSession();
```

## Real-time Presence Monitoring

### Monitor Other Users

```typescript
import { firekitPresence } from 'svelte-firekit';

// Monitor specific user
const userPresence = firekitPresence.monitorUser('user-id-123');

// Reactive user presence
const userStatus = $derived(userPresence.status);
const userLocation = $derived(userPresence.location);
const userLastSeen = $derived(userPresence.lastSeen);

// Monitor multiple users
const teamPresence = firekitPresence.monitorUsers(['user1', 'user2', 'user3']);

// Reactive team presence
const teamStatuses = $derived(teamPresence.statuses);
const onlineUsers = $derived(teamPresence.onlineUsers);
const awayUsers = $derived(teamPresence.awayUsers);
```

### Presence Events

```typescript
import { firekitPresence } from 'svelte-firekit';

// Listen to presence changes
firekitPresence.onStatusChange((userId, status, data) => {
	console.log(`User ${userId} is now ${status}`, data);
});

// Listen to location updates
firekitPresence.onLocationChange((userId, location) => {
	console.log(`User ${userId} location:`, location);
});

// Listen to session events
firekitPresence.onSessionStart((sessionId, data) => {
	console.log('Session started:', sessionId, data);
});

firekitPresence.onSessionEnd((sessionId) => {
	console.log('Session ended:', sessionId);
});
```

## Privacy and Consent

### Consent Management

```typescript
import { firekitPresence } from 'svelte-firekit';

// Check consent status
const hasLocationConsent = firekitPresence.hasLocationConsent();
const hasPresenceConsent = firekitPresence.hasPresenceConsent();

// Request consent
const locationConsent = await firekitPresence.requestLocationConsent();
const presenceConsent = await firekitPresence.requestPresenceConsent();

// Revoke consent
firekitPresence.revokeLocationConsent();
firekitPresence.revokePresenceConsent();
```

### Privacy Controls

```typescript
import { firekitPresence } from 'svelte-firekit';

// Set privacy level
await firekitPresence.setPrivacyLevel('public'); // Show location to everyone
await firekitPresence.setPrivacyLevel('friends'); // Show location to friends only
await firekitPresence.setPrivacyLevel('private'); // Hide location

// Get privacy settings
const privacyLevel = firekitPresence.getPrivacyLevel();
const isLocationVisible = firekitPresence.isLocationVisible();
```

## Svelte Component Integration

### Presence Indicator Component

```svelte
<script>
	import { firekitPresence } from 'svelte-firekit';
	import { Avatar } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';

	export let userId: string;
	export let showLocation = false;

	const userPresence = firekitPresence.monitorUser(userId);
	const status = $derived(userPresence.status);
	const location = $derived(userPresence.location);
	const lastSeen = $derived(userPresence.lastSeen);
</script>

<div class="flex items-center gap-2">
	<Avatar src={user.photoURL} alt={user.displayName} />
	<div class="flex items-center gap-1">
		<span class="text-sm font-medium">{user.displayName}</span>
		<Badge variant={status === 'online' ? 'default' : 'secondary'}>
			{status}
		</Badge>
	</div>
	{#if showLocation && location}
		<span class="text-muted-foreground text-xs">
			📍 {location.city}
		</span>
	{/if}
</div>
```

### Team Presence Component

```svelte
<script>
	import { firekitPresence } from 'svelte-firekit';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	export let teamMembers: string[] = [];

	const teamPresence = firekitPresence.monitorUsers(teamMembers);
	const onlineUsers = $derived(teamPresence.onlineUsers);
	const awayUsers = $derived(teamPresence.awayUsers);
	const offlineUsers = $derived(teamPresence.offlineUsers);
</script>

<Card>
	<CardHeader>
		<CardTitle>Team Status</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="space-y-4">
			<div class="flex items-center gap-2">
				<div class="h-3 w-3 rounded-full bg-green-500"></div>
				<span class="text-sm">Online ({onlineUsers.length})</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="h-3 w-3 rounded-full bg-yellow-500"></div>
				<span class="text-sm">Away ({awayUsers.length})</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="h-3 w-3 rounded-full bg-gray-500"></div>
				<span class="text-sm">Offline ({offlineUsers.length})</span>
			</div>
		</div>
	</CardContent>
</Card>
```

### Location Sharing Component

```svelte
<script>
	import { firekitPresence } from 'svelte-firekit';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';

	const location = $derived(firekitPresence.location);
	const locationError = $derived(firekitPresence.locationError);
	const hasConsent = $derived(firekitPresence.hasLocationConsent);

	async function requestLocation() {
		const consent = await firekitPresence.requestLocationConsent();
		if (consent) {
			await firekitPresence.startLocationTracking();
		}
	}

	function stopLocation() {
		firekitPresence.stopLocationTracking();
		firekitPresence.revokeLocationConsent();
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<span class="text-sm font-medium">Share Location</span>
		<Switch
			checked={hasConsent}
			onCheckedChange={(checked) => (checked ? requestLocation() : stopLocation())}
		/>
	</div>

	{#if location}
		<div class="rounded-lg border p-4">
			<p class="text-sm">
				📍 {location.city}, {location.country}
			</p>
			<p class="text-muted-foreground text-xs">
				Last updated: {location.timestamp.toLocaleTimeString()}
			</p>
		</div>
	{:else if locationError}
		<div class="rounded-lg border border-red-200 p-4">
			<p class="text-sm text-red-600">
				Location error: {locationError.message}
			</p>
		</div>
	{/if}
</div>
```

## Type Definitions

### Presence Status

```typescript
type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

interface PresenceData {
	status: PresenceStatus;
	timestamp: Date;
	reason?: string;
	message?: string;
	until?: Date;
}
```

### Location Data

```typescript
interface LocationData {
	latitude: number;
	longitude: number;
	city?: string;
	country?: string;
	region?: string;
	timestamp: Date;
	accuracy?: number;
}
```

### Session Data

```typescript
interface SessionData {
	id: string;
	startTime: Date;
	lastActivity: Date;
	device: string;
	browser: string;
	location?: LocationData;
	status: PresenceStatus;
}
```

### Configuration Options

```typescript
interface PresenceConfig {
	presencePath?: string;
	sessionTimeout?: number;
	maxSessions?: number;
	geolocation?: {
		enabled: boolean;
		type: 'browser' | 'device';
		requireConsent: boolean;
		timeout?: number;
		highAccuracy?: boolean;
	};
	presence?: {
		updateInterval?: number;
		statuses?: PresenceStatus[];
		defaultStatus?: PresenceStatus;
	};
}
```

## Best Practices

### 1. Initialize Early

```typescript
// ✅ Good - Initialize in layout or early in app lifecycle
onMount(async () => {
	if (isAuthenticated && user) {
		await firekitPresence.initialize(user);
	}
});

// ❌ Avoid - Initialize in individual components
```

### 2. Handle Consent Properly

```typescript
// ✅ Good - Check consent before enabling features
if (await firekitPresence.requestLocationConsent()) {
	await firekitPresence.startLocationTracking();
}

// ❌ Avoid - Force location tracking without consent
```

### 3. Clean Up Sessions

```typescript
// ✅ Good - Clean up on page unload
onDestroy(() => {
	firekitPresence.endSession();
});

// ❌ Avoid - Leave sessions hanging
```

### 4. Use Appropriate Update Intervals

```typescript
// ✅ Good - Reasonable update intervals
await firekitPresence.initialize(user, {
	presence: {
		updateInterval: 30000 // 30 seconds
	}
});

// ❌ Avoid - Too frequent updates
```

### 5. Handle Errors Gracefully

```typescript
// ✅ Good - Handle location errors
const locationError = $derived(firekitPresence.locationError);

$effect(() => {
	if (locationError) {
		console.warn('Location error:', locationError.message);
		// Fallback to IP-based location or disable location features
	}
});
```

## API Reference

### Core Methods

- `initialize(user, config?)` - Initialize presence tracking
- `setPresence(status, data?)` - Set presence status
- `getCurrentStatus()` - Get current status
- `isOnline()` - Check if user is online
- `isAway()` - Check if user is away

### Geolocation Methods

- `requestLocationPermission()` - Request location permission
- `getCurrentLocation()` - Get current location
- `startLocationTracking(options?)` - Start location tracking
- `stopLocationTracking()` - Stop location tracking
- `updateLocation(location)` - Update location manually

### Session Methods

- `getSessionInfo()` - Get current session info
- `endSession(sessionId?)` - End current or specific session
- `endAllSessions()` - End all sessions
- `refreshSession()` - Refresh current session

### Monitoring Methods

- `monitorUser(userId)` - Monitor specific user
- `monitorUsers(userIds)` - Monitor multiple users
- `onStatusChange(callback)` - Listen to status changes
- `onLocationChange(callback)` - Listen to location changes

### Privacy Methods

- `requestLocationConsent()` - Request location consent
- `requestPresenceConsent()` - Request presence consent
- `setPrivacyLevel(level)` - Set privacy level
- `getPrivacyLevel()` - Get current privacy level

### Reactive State

- `status` - Current presence status
- `location` - Current location data
- `sessions` - Active sessions
- `locationError` - Location error state
- `locationLoading` - Location loading state
