import {
	ref,
	onValue,
	onDisconnect,
	set,
	get,
	serverTimestamp
} from 'firebase/database';
import { firebaseService } from '../firebase.js';
import {
	type PresenceConfig,
	type SessionData,
	type PresenceStats,
	type GeolocationConfig,
	type Location,
	type DeviceInfo,
	PresenceErrorCode,
	PresenceError
} from '../types/presence.js';

// ── Geolocation helper ────────────────────────────────────────────────────────

class GeolocationService {
	private _config: GeolocationConfig;
	private _watchId: number | null = null;
	private _hasConsent = $state(false);
	private _location = $state<Location | null>(null);

	constructor(config: GeolocationConfig) {
		this._config = config;
	}

	get hasConsent(): boolean { return this._hasConsent; }
	get location(): Location | null { return this._location; }

	async requestConsent(): Promise<boolean> {
		if (!this._config.enabled || typeof window === 'undefined') return false;
		if (this._config.type !== 'browser') { this._hasConsent = true; return true; }

		return new Promise<boolean>((resolve) => {
			navigator.geolocation.getCurrentPosition(
				() => { this._hasConsent = true; resolve(true); },
				() => resolve(false),
				{ timeout: this._config.timeout ?? 10_000, enableHighAccuracy: this._config.enableHighAccuracy ?? false }
			);
		});
	}

	async getCurrentLocation(): Promise<Location | null> {
		if (!this._config.enabled) return null;
		if (this._config.requireConsent && !this._hasConsent) return null;

		switch (this._config.type) {
			case 'browser': return this._getBrowserLocation();
			case 'ip': return this._getIPLocation();
			case 'custom': return this._getCustomLocation();
			default: return null;
		}
	}

	startWatching(intervalMs: number): void {
		if (!this._config.enabled || this._watchId) return;
		const tick = async () => {
			const loc = await this.getCurrentLocation();
			if (loc) this._location = loc;
		};
		tick();
		this._watchId = window.setInterval(tick, intervalMs);
	}

	stopWatching(): void {
		if (this._watchId !== null) {
			clearInterval(this._watchId);
			this._watchId = null;
		}
	}

	private _getBrowserLocation(): Promise<Location | null> {
		return new Promise((resolve) => {
			navigator.geolocation.getCurrentPosition(
				(pos) => resolve({
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
					accuracy: pos.coords.accuracy,
					altitude: pos.coords.altitude ?? undefined,
					altitudeAccuracy: pos.coords.altitudeAccuracy ?? undefined,
					heading: pos.coords.heading ?? undefined,
					speed: pos.coords.speed ?? undefined,
					lastUpdated: new Date().toISOString(),
					source: 'browser'
				}),
				() => resolve(null),
				{
					timeout: this._config.timeout ?? 10_000,
					enableHighAccuracy: this._config.enableHighAccuracy ?? false,
					maximumAge: this._config.maximumAge ?? 300_000
				}
			);
		});
	}

	private async _getIPLocation(): Promise<Location | null> {
		if (!this._config.ipServiceUrl) return null;
		try {
			const res = await fetch(this._config.ipServiceUrl);
			const data = await res.json() as { latitude: number; longitude: number; accuracy?: number };
			return {
				latitude: data.latitude,
				longitude: data.longitude,
				accuracy: data.accuracy,
				lastUpdated: new Date().toISOString(),
				source: 'ip'
			};
		} catch { return null; }
	}

	private async _getCustomLocation(): Promise<Location | null> {
		if (!this._config.customGeolocationFn) return null;
		try {
			const result = await this._config.customGeolocationFn();
			return { ...result, lastUpdated: new Date().toISOString(), source: 'custom' };
		} catch { return null; }
	}

	dispose(): void {
		this.stopWatching();
		this._hasConsent = false;
		this._location = null;
	}
}

// ── Device info helper ────────────────────────────────────────────────────────

function getDeviceInfo(): DeviceInfo {
	const ua = navigator.userAgent;
	const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
	const isTablet = /iPad|Android(?=.*Tablet)|Windows NT.*Touch/i.test(ua);
	const type: DeviceInfo['type'] = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

	const browserMatch = ua.match(/(firefox|chrome|safari|opera|edge|msie|trident(?=\/))\/?\s*(\d+)/i);
	const browser = browserMatch ? browserMatch[1] : 'Unknown';
	const browserVersion = browserMatch ? browserMatch[2] : '';

	let os = 'Unknown', osVersion = '';
	if (ua.includes('Windows NT')) {
		os = 'Windows';
		osVersion = ua.match(/Windows NT ([\d.]+)/)?.[1] ?? '';
	} else if (ua.includes('Mac OS X')) {
		os = 'macOS';
		osVersion = (ua.match(/Mac OS X ([\d_]+)/)?.[1] ?? '').replace(/_/g, '.');
	} else if (ua.includes('Android')) {
		os = 'Android';
		osVersion = ua.match(/Android ([\d.]+)/)?.[1] ?? '';
	} else if (ua.includes('Linux')) {
		os = 'Linux';
	} else if (ua.includes('iOS')) {
		os = 'iOS';
		osVersion = (ua.match(/OS ([\d_]+)/)?.[1] ?? '').replace(/_/g, '.');
	}

	return {
		id: `${browser}-${os}`.replace(/[^a-zA-Z0-9-]/g, ''),
		type,
		browser,
		browserVersion,
		os,
		osVersion,
		userAgent: ua,
		screenResolution: `${screen.width}x${screen.height}`,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};
}

// ── Main presence service ─────────────────────────────────────────────────────

/**
 * Reactive user presence tracking via Firebase Realtime Database.
 *
 * Monitors RTDB `.info/connected`, writes session data on connect,
 * registers `onDisconnect` cleanup, and tracks page visibility changes.
 *
 * @example
 * ```ts
 * import { firekitPresence } from 'svelte-firekit';
 * await firekitPresence.initialize(user, { sessionTTL: 30 * 60 * 1000 });
 * ```
 */
class FirekitPresence {
	private static instance: FirekitPresence;

	// ── Reactive state ──────────────────────────────────────────────────────

	private _initialized = $state(false);
	private _status = $state<SessionData['status']>('offline');
	private _loading = $state(false);
	private _error = $state<PresenceError | null>(null);
	private _currentSession = $state<SessionData | null>(null);
	private _sessions = $state<SessionData[]>([]);

	// ── Internal ────────────────────────────────────────────────────────────

	private _config: PresenceConfig = { sessionTTL: 30 * 60_000, updateInterval: 60_000, trackDeviceInfo: true };
	private _geo: GeolocationService | null = null;
	private _connectedUnsub: (() => void) | null = null;
	private _currentUser: { uid: string } | null = null;

	private constructor() {
		if (typeof window !== 'undefined') {
			document.addEventListener('visibilitychange', this._onVisibilityChange);
		}
	}

	static getInstance(): FirekitPresence {
		if (!FirekitPresence.instance) FirekitPresence.instance = new FirekitPresence();
		return FirekitPresence.instance;
	}

	// ── Getters ─────────────────────────────────────────────────────────────

	get initialized(): boolean { return this._initialized; }
	get status(): SessionData['status'] { return this._status; }
	get loading(): boolean { return this._loading; }
	get error(): PresenceError | null { return this._error; }
	get currentSession(): SessionData | null { return this._currentSession; }
	get sessions(): SessionData[] { return this._sessions; }
	get location(): Location | null { return this._geo?.location ?? null; }
	get hasLocationConsent(): boolean { return this._geo?.hasConsent ?? false; }

	// ── Initialization ───────────────────────────────────────────────────────

	async initialize(user: { uid: string }, config?: PresenceConfig): Promise<void> {
		if (typeof window === 'undefined') {
			throw new PresenceError(
				PresenceErrorCode.INITIALIZATION_FAILED,
				'Presence can only be initialized in a browser environment.'
			);
		}
		if (this._initialized) return;

		this._loading = true;
		this._currentUser = user;
		if (config) this._config = { ...this._config, ...config };

		try {
			if (this._config.geolocation?.enabled) {
				this._geo = new GeolocationService(this._config.geolocation);
				if (this._config.geolocation.requireConsent) {
					await this._geo.requestConsent();
				}
				if (!this._config.geolocation.requireConsent || this._geo.hasConsent) {
					this._geo.startWatching(this._config.updateInterval!);
				}
			}

			await this._setupConnectionMonitoring();
			this._initialized = true;
		} catch (err) {
			// Clean up geolocation if it started before the error
			this._geo?.dispose();
			this._geo = null;
			this._error = err instanceof PresenceError
				? err
				: new PresenceError(PresenceErrorCode.INITIALIZATION_FAILED, (err as Error).message, err);
			throw this._error;
		} finally {
			this._loading = false;
		}
	}

	// ── Connection monitoring ────────────────────────────────────────────────

	private async _setupConnectionMonitoring(): Promise<void> {
		const db = firebaseService.getDatabaseInstance();
		if (!db) throw new PresenceError(PresenceErrorCode.DATABASE_ERROR, 'Realtime Database is not initialized.');

		const connectedRef = ref(db, '.info/connected');
		this._connectedUnsub = onValue(connectedRef, async (snap) => {
			if (snap.val() === true) {
				await this.setPresence('online');
				await this._setupDisconnectHandler();
			} else {
				this._status = 'offline';
			}
		});
	}

	private async _setupDisconnectHandler(): Promise<void> {
		if (!this._currentUser || !this._currentSession) return;
		const db = firebaseService.getDatabaseInstance();
		if (!db) return;

		const path = `${this._config.sessionPath ?? 'presence'}/${this._currentUser.uid}/sessions/${this._currentSession.id}`;
		await onDisconnect(ref(db, path)).update({
			status: 'offline',
			lastSeen: serverTimestamp()
		});
	}

	private _onVisibilityChange = async () => {
		if (!this._initialized) return;
		await this.setPresence(document.visibilityState === 'hidden' ? 'away' : 'online');
	};

	// ── Presence management ──────────────────────────────────────────────────

	async setPresence(status: SessionData['status']): Promise<void> {
		if (!this._currentUser) {
			throw new PresenceError(PresenceErrorCode.USER_NOT_AUTHENTICATED, 'No authenticated user.');
		}
		const db = firebaseService.getDatabaseInstance();
		if (!db) throw new PresenceError(PresenceErrorCode.DATABASE_ERROR, 'Realtime Database is not initialized.');

		try {
			const location = await this._geo?.getCurrentLocation() ?? undefined;
			const device = this._config.trackDeviceInfo ? getDeviceInfo() : undefined;
			const now = new Date().toISOString();

			const session: SessionData = this._currentSession
				? { ...this._currentSession, status, lastSeen: now, lastActivity: now, ...(location && { location }) }
				: {
						id: `${this._currentUser.uid}_${device?.id ?? Date.now()}`,
						userId: this._currentUser.uid,
						status,
						createdAt: now,
						lastSeen: now,
						lastActivity: now,
						...(location && { location }),
						...(device && { device }),
						...(this._config.customMetadata && { metadata: this._config.customMetadata })
					};

			const sessionRef = ref(
				db,
				`${this._config.sessionPath ?? 'presence'}/${this._currentUser.uid}/sessions/${session.id}`
			);
			await set(sessionRef, session);

			this._currentSession = session;
			this._status = status;
			await this._loadSessions();
		} catch (err) {
			this._error = err instanceof PresenceError
				? err
				: new PresenceError(PresenceErrorCode.DATABASE_ERROR, (err as Error).message, err);
			throw this._error;
		}
	}

	private async _loadSessions(): Promise<void> {
		if (!this._currentUser) return;
		const db = firebaseService.getDatabaseInstance();
		if (!db) return;

		const basePath = `${this._config.sessionPath ?? 'presence'}/${this._currentUser.uid}/sessions`;
		const snap = await get(ref(db, basePath));
		if (!snap.exists()) { this._sessions = []; return; }

		let sessions = Object.values(snap.val() as Record<string, SessionData>);

		if (this._config.sessionTTL) {
			const cutoff = new Date(Date.now() - this._config.sessionTTL).toISOString();
			const expired = sessions.filter((s) => s.lastSeen < cutoff);
			sessions = sessions.filter((s) => s.lastSeen >= cutoff);
			await Promise.all(
				expired.map((s) =>
					set(ref(db, `${basePath}/${s.id}`), null)
				)
			);
		}

		this._sessions = sessions;
	}

	// ── Helpers ──────────────────────────────────────────────────────────────

	getStats(): PresenceStats {
		const sessions = this._sessions;
		let totalMs = 0;
		const devices = new Set<string>();
		let lastActivity = 0;

		for (const s of sessions) {
			if (s.device?.id) devices.add(s.device.id);
			totalMs += new Date(s.lastSeen).getTime() - new Date(s.createdAt).getTime();
			if (s.lastActivity) lastActivity = Math.max(lastActivity, new Date(s.lastActivity).getTime());
		}

		return {
			totalSessions: sessions.length,
			onlineSessions: sessions.filter((s) => s.status === 'online').length,
			awaySessions: sessions.filter((s) => s.status === 'away').length,
			offlineSessions: sessions.filter((s) => s.status === 'offline').length,
			uniqueDevices: devices.size,
			averageSessionDuration: sessions.length > 0 ? totalMs / sessions.length : 0,
			lastActivity: lastActivity > 0 ? new Date(lastActivity).toISOString() : ''
		};
	}

	isOnline(): boolean { return this._sessions.some((s) => s.status === 'online'); }
	getSessionsByStatus(status: SessionData['status']): SessionData[] {
		return this._sessions.filter((s) => s.status === status);
	}

	async requestLocationConsent(): Promise<boolean> {
		if (!this._geo) throw new PresenceError(PresenceErrorCode.GEOLOCATION_UNAVAILABLE, 'Geolocation not configured.');
		return this._geo.requestConsent();
	}

	async refresh(): Promise<void> {
		if (!this._initialized) return;
		this._loading = true;
		try {
			await this._loadSessions();
			if (this._currentSession) await this.setPresence(this._status);
		} finally {
			this._loading = false;
		}
	}

	async dispose(): Promise<void> {
		if (this._currentSession) {
			try { await this.setPresence('offline'); } catch { /* best-effort */ }
		}
		this._geo?.dispose();
		this._connectedUnsub?.();
		this._connectedUnsub = null;
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', this._onVisibilityChange);
		}
		this._initialized = false;
		this._status = 'offline';
		this._error = null;
		this._currentSession = null;
		this._sessions = [];
	}
}

export const firekitPresence = FirekitPresence.getInstance();
