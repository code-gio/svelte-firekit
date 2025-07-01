/**
 * @fileoverview Presence types and interfaces for FirekitPresence
 * @module PresenceTypes
 * @version 1.0.0
 */

/**
 * Geolocation configuration options
 */
export interface GeolocationConfig {
	/** Whether geolocation tracking is enabled */
	enabled: boolean;
	/** Type of geolocation service to use */
	type: 'browser' | 'ip' | 'custom';
	/** Custom function for retrieving geolocation */
	customGeolocationFn?: () => Promise<{ latitude: number; longitude: number }>;
	/** URL for IP-based geolocation service */
	ipServiceUrl?: string;
	/** Whether user consent is required for location tracking */
	requireConsent?: boolean;
	/** High accuracy GPS tracking */
	enableHighAccuracy?: boolean;
	/** Location timeout in milliseconds */
	timeout?: number;
	/** Maximum age of cached location in milliseconds */
	maximumAge?: number;
}

/**
 * Presence service configuration options
 */
export interface PresenceConfig {
	/** Geolocation settings */
	geolocation?: GeolocationConfig;
	/** Session timeout in milliseconds (default: 30 minutes) */
	sessionTTL?: number;
	/** Presence update interval in milliseconds (default: 1 minute) */
	updateInterval?: number;
	/** Custom user metadata to track */
	customMetadata?: Record<string, any>;
	/** Whether to track device information */
	trackDeviceInfo?: boolean;
	/** Custom session collection path in Firebase */
	sessionPath?: string;
	/** Whether to enable automatic status detection based on page visibility */
	enableAutoStatusDetection?: boolean;
}

/**
 * Location data structure
 */
export interface Location {
	latitude: number;
	longitude: number;
	accuracy?: number;
	altitude?: number;
	altitudeAccuracy?: number;
	heading?: number;
	speed?: number;
	lastUpdated: string;
	source: 'browser' | 'ip' | 'custom';
}

/**
 * Device information structure
 */
export interface DeviceInfo {
	id: string;
	type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
	browser: string;
	browserVersion: string;
	os: string;
	osVersion: string;
	userAgent: string;
	screenResolution?: string;
	timezone?: string;
}

/**
 * Session data structure
 */
export interface SessionData {
	id: string;
	userId: string;
	status: 'online' | 'offline' | 'away' | 'busy' | 'invisible';
	createdAt: string;
	lastSeen: string;
	location?: Location;
	device?: DeviceInfo;
	metadata?: Record<string, any>;
	connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
	lastActivity?: string;
}

/**
 * User presence summary
 */
export interface UserPresence {
	userId: string;
	status: SessionData['status'];
	lastSeen: string;
	sessionCount: number;
	activeDevices: string[];
	primarySession?: SessionData;
	location?: Location;
}

/**
 * Presence statistics
 */
export interface PresenceStats {
	totalSessions: number;
	onlineSessions: number;
	awaySessions: number;
	offlineSessions: number;
	uniqueDevices: number;
	averageSessionDuration: number;
	lastActivity: string;
}

/**
 * Geolocation provider interface
 */
export interface GeolocationProvider {
	getCurrentLocation(): Promise<Location | null>;
	watchPosition?(callback: (location: Location | null) => void): number;
	clearWatch?(watchId: number): void;
	requestPermission?(): Promise<boolean>;
}

/**
 * Session storage interface
 */
export interface SessionStorage {
	saveSession(userId: string, session: SessionData): Promise<void>;
	loadSessions(userId: string): Promise<SessionData[]>;
	deleteSession(userId: string, sessionId: string): Promise<void>;
	cleanupExpiredSessions(userId: string, ttl: number): Promise<void>;
}

/**
 * Presence service interface
 */
export interface PresenceService {
	initialize(user: any, config?: PresenceConfig): Promise<void>;
	setPresence(status: SessionData['status']): Promise<void>;
	getCurrentSession(): SessionData | null;
	getAllSessions(): SessionData[];
	getPresenceStats(): PresenceStats;
	dispose(): Promise<void>;
}

/**
 * Connection info structure
 */
export interface ConnectionInfo {
	effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
	type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
	downlink?: number;
	rtt?: number;
	saveData?: boolean;
}

/**
 * Browser capability detection
 */
export interface BrowserCapabilities {
	geolocation: boolean;
	notifications: boolean;
	serviceWorker: boolean;
	indexedDB: boolean;
	webRTC: boolean;
	websockets: boolean;
	localStorage: boolean;
}

/**
 * Presence filter options
 */
export interface PresenceFilter {
	status?: SessionData['status'][];
	deviceTypes?: DeviceInfo['type'][];
	timeRange?: {
		start: string;
		end: string;
	};
	hasLocation?: boolean;
	activeOnly?: boolean;
}

/**
 * Bulk presence update
 */
export interface BulkPresenceUpdate {
	userId: string;
	updates: Partial<SessionData>[];
	timestamp: string;
}

/**
 * Presence query options
 */
export interface PresenceQueryOptions {
	limit?: number;
	orderBy?: 'lastSeen' | 'createdAt' | 'status';
	direction?: 'asc' | 'desc';
	filter?: PresenceFilter;
	includeExpired?: boolean;
}

/**
 * Custom presence status
 */
export interface CustomPresenceStatus {
	key: string;
	label: string;
	color?: string;
	icon?: string;
	priority?: number;
	autoDetect?: boolean;
}

/**
 * Presence analytics data
 */
export interface PresenceAnalytics {
	userId: string;
	dailyActiveTime: number;
	weeklyActiveTime: number;
	monthlyActiveTime: number;
	mostActiveDevice: string;
	mostActiveHour: number;
	averageSessionLength: number;
	locationHistory: Location[];
	statusHistory: Array<{
		status: SessionData['status'];
		timestamp: string;
		duration: number;
	}>;
}

/**
 * Error types for presence service
 */
export enum PresenceErrorCode {
	INITIALIZATION_FAILED = 'presence/initialization-failed',
	USER_NOT_AUTHENTICATED = 'presence/user-not-authenticated',
	GEOLOCATION_DENIED = 'presence/geolocation-denied',
	GEOLOCATION_UNAVAILABLE = 'presence/geolocation-unavailable',
	GEOLOCATION_TIMEOUT = 'presence/geolocation-timeout',
	DATABASE_ERROR = 'presence/database-error',
	SESSION_EXPIRED = 'presence/session-expired',
	INVALID_CONFIG = 'presence/invalid-config',
	BROWSER_NOT_SUPPORTED = 'presence/browser-not-supported',
	NETWORK_ERROR = 'presence/network-error',
	PERMISSION_DENIED = 'presence/permission-denied'
}

/**
 * Custom presence error class
 */
export class PresenceError extends Error {
	constructor(
		public code: PresenceErrorCode,
		message: string,
		public originalError?: any
	) {
		super(message);
		this.name = 'PresenceError';
	}

	/**
	 * Get user-friendly error message
	 */
	getFriendlyMessage(): string {
		switch (this.code) {
			case PresenceErrorCode.GEOLOCATION_DENIED:
				return 'Location access was denied. Please enable location services to use this feature.';
			case PresenceErrorCode.GEOLOCATION_UNAVAILABLE:
				return 'Location services are not available on this device.';
			case PresenceErrorCode.GEOLOCATION_TIMEOUT:
				return 'Location request timed out. Please try again.';
			case PresenceErrorCode.USER_NOT_AUTHENTICATED:
				return 'Please sign in to use presence features.';
			case PresenceErrorCode.NETWORK_ERROR:
				return 'Network connection error. Please check your internet connection.';
			case PresenceErrorCode.BROWSER_NOT_SUPPORTED:
				return 'Your browser does not support all required features.';
			case PresenceErrorCode.SESSION_EXPIRED:
				return 'Your session has expired. Please refresh the page.';
			default:
				return this.message || 'An unknown error occurred.';
		}
	}

	/**
	 * Check if error is retryable
	 */
	isRetryable(): boolean {
		const retryableCodes = [
			PresenceErrorCode.NETWORK_ERROR,
			PresenceErrorCode.GEOLOCATION_TIMEOUT,
			PresenceErrorCode.DATABASE_ERROR
		];
		return retryableCodes.includes(this.code);
	}

	/**
	 * Check if error requires user action
	 */
	requiresUserAction(): boolean {
		const userActionCodes = [
			PresenceErrorCode.GEOLOCATION_DENIED,
			PresenceErrorCode.USER_NOT_AUTHENTICATED,
			PresenceErrorCode.PERMISSION_DENIED
		];
		return userActionCodes.includes(this.code);
	}
}
