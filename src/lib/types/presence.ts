export interface GeolocationConfig {
	enabled: boolean;
	type: 'browser' | 'ip' | 'custom';
	customGeolocationFn?: () => Promise<{ latitude: number; longitude: number }>;
	ipServiceUrl?: string;
	requireConsent?: boolean;
	enableHighAccuracy?: boolean;
	timeout?: number;
	maximumAge?: number;
}

export interface PresenceConfig {
	geolocation?: GeolocationConfig;
	sessionTTL?: number;
	updateInterval?: number;
	customMetadata?: Record<string, unknown>;
	trackDeviceInfo?: boolean;
	sessionPath?: string;
	enableAutoStatusDetection?: boolean;
}

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

export interface SessionData {
	id: string;
	userId: string;
	status: 'online' | 'offline' | 'away' | 'busy' | 'invisible';
	createdAt: string;
	lastSeen: string;
	location?: Location;
	device?: DeviceInfo;
	metadata?: Record<string, unknown>;
	connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
	lastActivity?: string;
}

export interface UserPresence {
	userId: string;
	status: SessionData['status'];
	lastSeen: string;
	sessionCount: number;
	activeDevices: string[];
	primarySession?: SessionData;
	location?: Location;
}

export interface PresenceStats {
	totalSessions: number;
	onlineSessions: number;
	awaySessions: number;
	offlineSessions: number;
	uniqueDevices: number;
	averageSessionDuration: number;
	lastActivity: string;
}

export interface GeolocationProvider {
	getCurrentLocation(): Promise<Location | null>;
	watchPosition?(callback: (location: Location | null) => void): number;
	clearWatch?(watchId: number): void;
	requestPermission?(): Promise<boolean>;
}

export interface PresenceService {
	initialize(user: unknown, config?: PresenceConfig): Promise<void>;
	setPresence(status: SessionData['status']): Promise<void>;
	getCurrentSession(): SessionData | null;
	getAllSessions(): SessionData[];
	getPresenceStats(): PresenceStats;
	dispose(): Promise<void>;
}

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

export class PresenceError extends Error {
	constructor(
		public code: PresenceErrorCode,
		message: string,
		public originalError?: unknown
	) {
		super(message);
		this.name = 'PresenceError';
	}

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

	isRetryable(): boolean {
		const retryableCodes = [
			PresenceErrorCode.NETWORK_ERROR,
			PresenceErrorCode.GEOLOCATION_TIMEOUT,
			PresenceErrorCode.DATABASE_ERROR
		];
		return retryableCodes.includes(this.code);
	}

	requiresUserAction(): boolean {
		const userActionCodes = [
			PresenceErrorCode.GEOLOCATION_DENIED,
			PresenceErrorCode.USER_NOT_AUTHENTICATED,
			PresenceErrorCode.PERMISSION_DENIED
		];
		return userActionCodes.includes(this.code);
	}
}
