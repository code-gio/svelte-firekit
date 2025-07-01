/**
 * @fileoverview FirekitPresence - Clean presence tracking for Svelte applications
 * @module FirekitPresence
 * @version 1.0.0
 */

import { ref, onValue, onDisconnect, set, get, serverTimestamp } from 'firebase/database';
import { firebaseService } from '../firebase.js';
import { browser } from '$app/environment';
import {
	type GeolocationConfig,
	type PresenceConfig,
	type Location,
	type DeviceInfo,
	type SessionData,
	type PresenceStats,
	PresenceErrorCode,
	PresenceError
} from '../types/presence.js';

/**
 * Handles geolocation tracking
 */
class GeolocationService {
	private config: GeolocationConfig;
	private watchId: number | null = null;
	private _hasConsent = $state(false);
	private _location = $state<Location | null>(null);
	private _error = $state<Error | null>(null);

	constructor(config: GeolocationConfig) {
		this.config = config;
	}

	get hasConsent(): boolean {
		return this._hasConsent;
	}

	get location(): Location | null {
		return this._location;
	}

	get error(): Error | null {
		return this._error;
	}

	/**
	 * Request user consent for location tracking
	 */
	async requestConsent(): Promise<boolean> {
		if (!this.config.enabled || !browser) return false;

		try {
			if (this.config.type === 'browser') {
				const success = await new Promise<boolean>((resolve) => {
					navigator.geolocation.getCurrentPosition(
						() => resolve(true),
						() => resolve(false),
						{
							timeout: this.config.timeout || 10000,
							enableHighAccuracy: this.config.enableHighAccuracy || false
						}
					);
				});

				this._hasConsent = success;
				return success;
			}

			this._hasConsent = true;
			return true;
		} catch (error) {
			this._error = error as Error;
			return false;
		}
	}

	/**
	 * Get current location
	 */
	async getCurrentLocation(): Promise<Location | null> {
		if (!this.config.enabled || (this.config.requireConsent && !this._hasConsent)) {
			return null;
		}

		try {
			switch (this.config.type) {
				case 'browser':
					return this.getBrowserLocation();

				case 'ip':
					return this.getIPLocation();

				case 'custom':
					return this.getCustomLocation();

				default:
					return null;
			}
		} catch (error) {
			this._error = error as Error;
			return null;
		}
	}

	/**
	 * Start watching location changes
	 */
	startWatching(updateInterval: number): void {
		if (!this.config.enabled || this.watchId) return;

		const watchLocation = async () => {
			const location = await this.getCurrentLocation();
			if (location) {
				this._location = location;
			}
		};

		watchLocation();
		this.watchId = window.setInterval(watchLocation, updateInterval);
	}

	/**
	 * Stop watching location changes
	 */
	stopWatching(): void {
		if (this.watchId) {
			clearInterval(this.watchId);
			this.watchId = null;
		}
	}

	private async getBrowserLocation(): Promise<Location | null> {
		return new Promise((resolve) => {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					resolve({
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						accuracy: position.coords.accuracy,
						altitude: position.coords.altitude || undefined,
						altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
						heading: position.coords.heading || undefined,
						speed: position.coords.speed || undefined,
						lastUpdated: new Date().toISOString(),
						source: 'browser'
					});
				},
				() => resolve(null),
				{
					timeout: this.config.timeout || 10000,
					enableHighAccuracy: this.config.enableHighAccuracy || false,
					maximumAge: this.config.maximumAge || 300000
				}
			);
		});
	}

	private async getIPLocation(): Promise<Location | null> {
		if (!this.config.ipServiceUrl) return null;

		try {
			const response = await fetch(this.config.ipServiceUrl);
			const data = await response.json();

			return {
				latitude: data.latitude,
				longitude: data.longitude,
				accuracy: data.accuracy || undefined,
				lastUpdated: new Date().toISOString(),
				source: 'ip'
			};
		} catch {
			return null;
		}
	}

	private async getCustomLocation(): Promise<Location | null> {
		if (!this.config.customGeolocationFn) return null;

		try {
			const result = await this.config.customGeolocationFn();
			return {
				...result,
				lastUpdated: new Date().toISOString(),
				source: 'custom'
			};
		} catch {
			return null;
		}
	}

	dispose(): void {
		this.stopWatching();
		this._hasConsent = false;
		this._location = null;
		this._error = null;
	}
}

/**
 * Handles device information detection
 */
class DeviceInfoService {
	static getDeviceInfo(): DeviceInfo {
		const userAgent = navigator.userAgent;
		const platform = navigator.platform;

		// Detect device type
		const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
		const isTablet = /iPad|Android(?=.*Tablet)|Windows NT.*Touch/i.test(userAgent);

		let deviceType: DeviceInfo['type'] = 'unknown';
		if (isTablet) deviceType = 'tablet';
		else if (isMobile) deviceType = 'mobile';
		else deviceType = 'desktop';

		// Detect browser and version
		const browserMatch = userAgent.match(
			/(firefox|chrome|safari|opera|edge|msie|trident(?=\/))\/?\s*(\d+)/i
		);
		const browser = browserMatch ? browserMatch[1] : 'Unknown';
		const browserVersion = browserMatch ? browserMatch[2] : '';

		// Detect OS and version
		let os = 'Unknown';
		let osVersion = '';

		if (userAgent.includes('Windows NT')) {
			os = 'Windows';
			const winMatch = userAgent.match(/Windows NT ([\d.]+)/);
			osVersion = winMatch ? winMatch[1] : '';
		} else if (userAgent.includes('Mac OS X')) {
			os = 'macOS';
			const macMatch = userAgent.match(/Mac OS X ([\d_]+)/);
			osVersion = macMatch ? macMatch[1].replace(/_/g, '.') : '';
		} else if (userAgent.includes('Linux')) {
			os = 'Linux';
		} else if (userAgent.includes('Android')) {
			os = 'Android';
			const androidMatch = userAgent.match(/Android ([\d.]+)/);
			osVersion = androidMatch ? androidMatch[1] : '';
		} else if (userAgent.includes('iOS')) {
			os = 'iOS';
			const iosMatch = userAgent.match(/OS ([\d_]+)/);
			osVersion = iosMatch ? iosMatch[1].replace(/_/g, '.') : '';
		}

		// Generate device ID
		const deviceId = `${browser}-${os}-${platform}`.replace(/[^a-zA-Z0-9-]/g, '');

		// Get screen resolution and timezone
		const screenResolution = `${screen.width}x${screen.height}`;
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		return {
			id: deviceId,
			type: deviceType,
			browser,
			browserVersion,
			os,
			osVersion,
			userAgent,
			screenResolution,
			timezone
		};
	}
}

/**
 * Main presence tracking service
 *
 * @class FirekitPresence
 * @example
 * ```typescript
 * import { firekitPresence } from 'svelte-firekit';
 *
 * // Initialize
 * await firekitPresence.initialize(user, {
 *   geolocation: { enabled: true, type: 'browser' },
 *   sessionTTL: 30 * 60 * 1000
 * });
 *
 * // Access reactive state
 * $: console.log('Status:', firekitPresence.status);
 * ```
 */
class FirekitPresence {
	private static instance: FirekitPresence;
	private config: PresenceConfig = {
		sessionTTL: 30 * 60 * 1000,
		updateInterval: 60 * 1000,
		trackDeviceInfo: true
	};

	private geolocationService: GeolocationService | null = null;
	private connectedListener: (() => void) | null = null;
	private currentUser: any = null;

	// Reactive state using Svelte 5 runes
	private _initialized = $state(false);
	private _status = $state<SessionData['status']>('offline');
	private _loading = $state(false);
	private _error = $state<PresenceError | null>(null);
	private _currentSession = $state<SessionData | null>(null);
	private _sessions = $state<SessionData[]>([]);

	private constructor() {
		if (browser) {
			this.setupVisibilityListener();
		}
	}

	/**
	 * Gets singleton instance of FirekitPresence
	 */
	static getInstance(): FirekitPresence {
		if (!FirekitPresence.instance) {
			FirekitPresence.instance = new FirekitPresence();
		}
		return FirekitPresence.instance;
	}

	// ========================================
	// REACTIVE GETTERS
	// ========================================

	get initialized(): boolean {
		return this._initialized;
	}

	get status(): SessionData['status'] {
		return this._status;
	}

	get loading(): boolean {
		return this._loading;
	}

	get error(): PresenceError | null {
		return this._error;
	}

	get currentSession(): SessionData | null {
		return this._currentSession;
	}

	get sessions(): SessionData[] {
		return this._sessions;
	}

	get location(): Location | null {
		return this.geolocationService?.location || null;
	}

	get hasLocationConsent(): boolean {
		return this.geolocationService?.hasConsent || false;
	}

	// ========================================
	// INITIALIZATION
	// ========================================

	/**
	 * Initialize presence tracking
	 * @param user Current authenticated user
	 * @param config Presence configuration options
	 */
	async initialize(user: any, config?: PresenceConfig): Promise<void> {
		try {
			if (!browser) {
				throw new PresenceError(
					PresenceErrorCode.INITIALIZATION_FAILED,
					'Presence service can only be initialized in browser environment'
				);
			}

			if (this._initialized) {
				console.warn('Presence service is already initialized');
				return;
			}

			this._loading = true;
			this.currentUser = user;
			this.config = { ...this.config, ...config };

			// Initialize geolocation service if enabled
			if (this.config.geolocation?.enabled) {
				this.geolocationService = new GeolocationService(this.config.geolocation);

				if (this.config.geolocation.requireConsent) {
					const hasConsent = await this.geolocationService.requestConsent();
				}

				// Start location tracking if consent granted
				if (!this.config.geolocation.requireConsent || this.geolocationService.hasConsent) {
					this.geolocationService.startWatching(this.config.updateInterval!);
				}
			}

			// Set up Firebase connection monitoring
			await this.setupConnectionMonitoring();

			this._initialized = true;
		} catch (error) {
			this._error =
				error instanceof PresenceError
					? error
					: new PresenceError(
							PresenceErrorCode.INITIALIZATION_FAILED,
							`Failed to initialize presence service: ${(error as Error).message}`,
							error
						);
			throw this._error;
		} finally {
			this._loading = false;
		}
	}

	/**
	 * Set up Firebase connection monitoring
	 */
	private async setupConnectionMonitoring(): Promise<void> {
		const db = firebaseService.getDatabaseInstance();
		if (!db) {
			throw new PresenceError(
				PresenceErrorCode.DATABASE_ERROR,
				'Firebase Database instance not available'
			);
		}

		const connectedRef = ref(db, '.info/connected');

		this.connectedListener = onValue(connectedRef, async (snapshot) => {
			if (snapshot.val() === true) {
				await this.setPresence('online');
				await this.setupDisconnectHandler();
			} else {
				await this.setPresence('offline');
			}
		});
	}

	/**
	 * Set up disconnect handler for graceful offline transitions
	 */
	private async setupDisconnectHandler(): Promise<void> {
		if (!this.currentUser || !this._currentSession) return;

		const db = firebaseService.getDatabaseInstance();
		if (!db) return;

		const sessionPath = this.config.sessionPath || 'presence';
		const sessionRef = ref(
			db,
			`${sessionPath}/${this.currentUser.uid}/sessions/${this._currentSession.id}`
		);

		await onDisconnect(sessionRef).update({
			status: 'offline',
			lastSeen: serverTimestamp()
		});
	}

	/**
	 * Set up page visibility listener
	 */
	private setupVisibilityListener(): void {
		if (!browser) return;

		document.addEventListener('visibilitychange', async () => {
			if (!this._initialized) return;

			if (document.visibilityState === 'hidden') {
				await this.setPresence('away');
			} else {
				await this.setPresence('online');
			}
		});
	}

	// ========================================
	// PRESENCE MANAGEMENT
	// ========================================

	/**
	 * Set presence status
	 */
	async setPresence(status: SessionData['status']): Promise<void> {
		try {
			if (!this.currentUser) {
				throw new PresenceError(
					PresenceErrorCode.USER_NOT_AUTHENTICATED,
					'No authenticated user found'
				);
			}

			const db = firebaseService.getDatabaseInstance();
			if (!db) {
				throw new PresenceError(
					PresenceErrorCode.DATABASE_ERROR,
					'Firebase Database instance not available'
				);
			}

			// Get current location if available
			const location = await this.geolocationService?.getCurrentLocation();

			// Get device info if enabled
			const device = this.config.trackDeviceInfo ? DeviceInfoService.getDeviceInfo() : undefined;

			let session: SessionData;

			if (!this._currentSession) {
				// Create new session
				session = {
					id: `${this.currentUser.uid}_${device?.id || Date.now()}`,
					userId: this.currentUser.uid,
					status,
					createdAt: new Date().toISOString(),
					lastSeen: new Date().toISOString(),
					lastActivity: new Date().toISOString(),
					...(location && { location }),
					...(device && { device }),
					...(this.config.customMetadata && { metadata: this.config.customMetadata })
				};
			} else {
				// Update existing session
				session = {
					...this._currentSession,
					status,
					lastSeen: new Date().toISOString(),
					lastActivity: new Date().toISOString(),
					...(location && { location })
				};
			}

			// Save session to Firebase
			const sessionPath = this.config.sessionPath || 'presence';
			const sessionRef = ref(db, `${sessionPath}/${this.currentUser.uid}/sessions/${session.id}`);
			await set(sessionRef, session);

			// Update local state
			this._currentSession = session;
			this._status = status;

			// Load and update all sessions
			await this.loadSessions();
		} catch (error) {
			this._error =
				error instanceof PresenceError
					? error
					: new PresenceError(
							PresenceErrorCode.DATABASE_ERROR,
							`Failed to set presence: ${(error as Error).message}`,
							error
						);
			throw this._error;
		}
	}

	/**
	 * Load all sessions for current user
	 */
	private async loadSessions(): Promise<void> {
		if (!this.currentUser) return;

		try {
			const db = firebaseService.getDatabaseInstance();
			if (!db) return;

			const sessionPath = this.config.sessionPath || 'presence';
			const sessionsRef = ref(db, `${sessionPath}/${this.currentUser.uid}/sessions`);
			const snapshot = await get(sessionsRef);

			if (snapshot.exists()) {
				const sessionsData = snapshot.val();
				let sessions = Object.values(sessionsData) as SessionData[];

				// Clean up stale sessions
				if (this.config.sessionTTL) {
					const cutoffTime = new Date(Date.now() - this.config.sessionTTL).toISOString();
					const expiredSessions = sessions.filter((session) => session.lastSeen < cutoffTime);
					sessions = sessions.filter((session) => session.lastSeen >= cutoffTime);

					// Remove stale sessions from database
					for (const expiredSession of expiredSessions) {
						const staleSessionRef = ref(
							db,
							`${sessionPath}/${this.currentUser.uid}/sessions/${expiredSession.id}`
						);
						await set(staleSessionRef, null);
					}
				}

				this._sessions = sessions;
			} else {
				this._sessions = [];
			}
		} catch (error) {
			console.error('Failed to load sessions:', error);
		}
	}

	// ========================================
	// UTILITY METHODS
	// ========================================

	/**
	 * Get presence statistics
	 */
	getPresenceStats(): PresenceStats {
		const sessions = this._sessions;
		let totalSessionTime = 0;
		const deviceSet = new Set<string>();
		let lastActivityTime = 0;

		sessions.forEach((session) => {
			if (session.device?.id) {
				deviceSet.add(session.device.id);
			}

			const sessionStart = new Date(session.createdAt).getTime();
			const sessionEnd = new Date(session.lastSeen).getTime();
			totalSessionTime += sessionEnd - sessionStart;

			if (session.lastActivity) {
				const activityTime = new Date(session.lastActivity).getTime();
				lastActivityTime = Math.max(lastActivityTime, activityTime);
			}
		});

		const averageSessionDuration = sessions.length > 0 ? totalSessionTime / sessions.length : 0;

		return {
			totalSessions: sessions.length,
			onlineSessions: sessions.filter((s) => s.status === 'online').length,
			awaySessions: sessions.filter((s) => s.status === 'away').length,
			offlineSessions: sessions.filter((s) => s.status === 'offline').length,
			uniqueDevices: deviceSet.size,
			averageSessionDuration,
			lastActivity: lastActivityTime > 0 ? new Date(lastActivityTime).toISOString() : ''
		};
	}

	/**
	 * Request location consent manually
	 */
	async requestLocationConsent(): Promise<boolean> {
		if (!this.geolocationService) {
			throw new PresenceError(
				PresenceErrorCode.GEOLOCATION_UNAVAILABLE,
				'Geolocation service not available'
			);
		}
		return await this.geolocationService.requestConsent();
	}

	/**
	 * Get current user's online sessions count
	 */
	getOnlineSessionsCount(): number {
		return this._sessions.filter((session) => session.status === 'online').length;
	}

	/**
	 * Check if user is online on any device
	 */
	isUserOnline(): boolean {
		return this._sessions.some((session) => session.status === 'online');
	}

	/**
	 * Get sessions by status
	 */
	getSessionsByStatus(status: SessionData['status']): SessionData[] {
		return this._sessions.filter((session) => session.status === status);
	}

	/**
	 * Force refresh presence data
	 */
	async refresh(): Promise<void> {
		if (!this._initialized) return;

		this._loading = true;
		try {
			await this.loadSessions();
			if (this._currentSession) {
				await this.setPresence(this._status);
			}
		} finally {
			this._loading = false;
		}
	}

	// ========================================
	// CLEANUP
	// ========================================

	/**
	 * Dispose of all resources and cleanup
	 */
	async dispose(): Promise<void> {
		try {
			// Set status to offline before cleanup
			if (this._currentSession) {
				await this.setPresence('offline');
			}
		} catch (error) {
			console.error('Error setting offline status during disposal:', error);
		}

		// Stop location tracking
		this.geolocationService?.dispose();

		// Remove connection listener
		if (this.connectedListener) {
			this.connectedListener();
			this.connectedListener = null;
		}

		// Reset state
		this._initialized = false;
		this._status = 'offline';
		this._loading = false;
		this._error = null;
		this._currentSession = null;
		this._sessions = [];
	}
}

/**
 * Pre-initialized singleton instance of FirekitPresence.
 *
 * @example
 * ```typescript
 * import { firekitPresence } from 'svelte-firekit';
 *
 * // Initialize presence tracking
 * await firekitPresence.initialize(user, {
 *   geolocation: { enabled: true, type: 'browser' },
 *   sessionTTL: 30 * 60 * 1000
 * });
 * ```
 */
export const firekitPresence = FirekitPresence.getInstance();
