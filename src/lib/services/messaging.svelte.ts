import {
	getMessaging,
	getToken,
	deleteToken,
	onMessage,
	isSupported,
	type Messaging,
	type MessagePayload
} from 'firebase/messaging';
import { firebaseService } from '../firebase.js';

function getApp() {
	const app = firebaseService.getFirebaseApp();
	if (!app) throw new Error('Firebase app is not initialized.');
	return app;
}

/**
 * Reactive Firebase Cloud Messaging service.
 *
 * Handles FCM token registration, foreground message listening,
 * and notification permission requests.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitMessaging } from 'svelte-firekit';
 *   await firekitMessaging.requestPermission('YOUR_VAPID_KEY');
 * </script>
 * {#if firekitMessaging.token}
 *   FCM token: {firekitMessaging.token}
 * {/if}
 * {#if firekitMessaging.lastMessage}
 *   New: {firekitMessaging.lastMessage.notification?.title}
 * {/if}
 * ```
 */
class FirekitMessaging {
	private static instance: FirekitMessaging;

	private _token = $state<string | null>(null);
	private _loading = $state(false);
	private _error = $state<Error | null>(null);
	private _permission = $state<NotificationPermission>('default');
	private _lastMessage = $state<MessagePayload | null>(null);
	private _messages = $state<MessagePayload[]>([]);
	private _supported = $state(false);

	readonly hasToken = $derived(this._token !== null);
	readonly isGranted = $derived(this._permission === 'granted');

	private _messaging: Messaging | null = null;
	private _unsubscribeMessage: (() => void) | null = null;
	private _requesting = false;

	private constructor() {
		this._initPermissionState();
	}

	static getInstance(): FirekitMessaging {
		if (!FirekitMessaging.instance) {
			FirekitMessaging.instance = new FirekitMessaging();
		}
		return FirekitMessaging.instance;
	}

	get token(): string | null { return this._token; }
	get loading(): boolean { return this._loading; }
	get error(): Error | null { return this._error; }
	get permission(): NotificationPermission { return this._permission; }
	get lastMessage(): MessagePayload | null { return this._lastMessage; }
	get messages(): MessagePayload[] { return this._messages; }
	get supported(): boolean { return this._supported; }

	private _initPermissionState(): void {
		if (typeof window === 'undefined' || !('Notification' in window)) return;
		this._permission = Notification.permission;
	}

	private async _getMessaging(): Promise<Messaging | null> {
		if (this._messaging) return this._messaging;
		if (typeof window === 'undefined') return null;

		const supported = await isSupported();
		this._supported = supported;
		if (!supported) return null;

		const app = getApp();
		this._messaging = getMessaging(app);
		return this._messaging;
	}

	// ── Permission & token ────────────────────────────────────────────────────

	/**
	 * Requests notification permission, registers the FCM token,
	 * and starts listening for foreground messages.
	 *
	 * @param vapidKey - Your VAPID public key from the Firebase console.
	 * @param serviceWorkerRegistration - Optional custom service worker registration.
	 */
	async requestPermission(
		vapidKey: string,
		serviceWorkerRegistration?: ServiceWorkerRegistration
	): Promise<string | null> {
		if (this._requesting) return this._token;
		this._requesting = true;
		this._loading = true;
		this._error = null;

		try {
			const msg = await this._getMessaging();
			if (!msg) {
				this._error = new Error('Firebase Messaging is not supported in this browser.');
				return null;
			}

			const permission = await Notification.requestPermission();
			this._permission = permission;

			if (permission !== 'granted') return null;

			const tokenOptions: { vapidKey: string; serviceWorkerRegistration?: ServiceWorkerRegistration } =
				{ vapidKey };
			if (serviceWorkerRegistration) {
				tokenOptions.serviceWorkerRegistration = serviceWorkerRegistration;
			}

			this._token = await getToken(msg, tokenOptions);
			this._listenForMessages(msg);
			return this._token;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			return null;
		} finally {
			this._loading = false;
			this._requesting = false;
		}
	}

	/**
	 * Refreshes the FCM token.
	 * Call this after deleting or if your token may have rotated.
	 */
	async refreshToken(
		vapidKey: string,
		serviceWorkerRegistration?: ServiceWorkerRegistration
	): Promise<string | null> {
		this._loading = true;
		this._error = null;
		try {
			const msg = await this._getMessaging();
			if (!msg) return null;

			const tokenOptions: { vapidKey: string; serviceWorkerRegistration?: ServiceWorkerRegistration } =
				{ vapidKey };
			if (serviceWorkerRegistration) {
				tokenOptions.serviceWorkerRegistration = serviceWorkerRegistration;
			}

			this._token = await getToken(msg, tokenOptions);
			return this._token;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			return null;
		} finally {
			this._loading = false;
		}
	}

	/**
	 * Deletes the current FCM token and unregisters from push notifications.
	 */
	async deleteToken(): Promise<boolean> {
		const msg = await this._getMessaging();
		if (!msg) return false;
		try {
			const deleted = await deleteToken(msg);
			if (deleted) this._token = null;
			return deleted;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			return false;
		}
	}

	// ── Foreground messages ───────────────────────────────────────────────────

	private _listenForMessages(msg: Messaging): void {
		this._unsubscribeMessage?.();
		this._unsubscribeMessage = onMessage(msg, (payload) => {
			this._lastMessage = payload;
			this._messages = [...this._messages, payload];
		});
	}

	/**
	 * Registers a callback for foreground messages.
	 * Returns an unsubscribe function.
	 */
	async onMessage(handler: (payload: MessagePayload) => void): Promise<() => void> {
		const msg = await this._getMessaging();
		if (!msg) return () => {};
		return onMessage(msg, handler);
	}

	/** Clears the accumulated foreground message list. */
	clearMessages(): void {
		this._messages = [];
		this._lastMessage = null;
	}

	dispose(): void {
		this._unsubscribeMessage?.();
		this._unsubscribeMessage = null;
	}
}

export const firekitMessaging = FirekitMessaging.getInstance();
export type { MessagePayload };
