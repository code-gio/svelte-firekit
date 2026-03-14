import {
	getInAppMessaging,
	setMessagesDisplaySuppressed,
	isSupported,
	type InAppMessaging
} from 'firebase/in-app-messaging';
import { firebaseService } from '../firebase.js';

function getApp() {
	const app = firebaseService.getFirebaseApp();
	if (!app) throw new Error('Firebase app is not initialized.');
	return app;
}

/**
 * Reactive Firebase In-App Messaging service.
 *
 * In-App Messaging displays contextual messages to users while they are actively
 * using your app. Messages are configured in the Firebase console and triggered
 * by Analytics events. This service lets you control whether messages are shown.
 *
 * @example
 * ```ts
 * import { firekitInAppMessaging } from 'svelte-firekit';
 *
 * // Suppress messages during a critical flow (e.g. checkout)
 * firekitInAppMessaging.suppress();
 *
 * // Re-enable after the flow completes
 * firekitInAppMessaging.unsuppress();
 * ```
 */
class FirekitInAppMessaging {
	private static instance: FirekitInAppMessaging;

	private _suppressed = $state(false);
	private _supported = $state(false);
	private _initialized = $state(false);

	private _iam: InAppMessaging | null = null;

	private constructor() {
		this._init();
	}

	static getInstance(): FirekitInAppMessaging {
		if (!FirekitInAppMessaging.instance) {
			FirekitInAppMessaging.instance = new FirekitInAppMessaging();
		}
		return FirekitInAppMessaging.instance;
	}

	get suppressed(): boolean { return this._suppressed; }
	get supported(): boolean { return this._supported; }
	get initialized(): boolean { return this._initialized; }

	private async _init(): Promise<void> {
		if (typeof window === 'undefined') return;
		try {
			const supported = await isSupported();
			this._supported = supported;
			if (!supported) return;

			this._iam = getInAppMessaging(getApp());
			// messagesDisplaySuppressed is a property on the InAppMessaging instance
			this._suppressed = this._iam.messagesDisplaySuppressed;
			this._initialized = true;
		} catch {
			// In-App Messaging is optional — failures are non-fatal
		}
	}

	/**
	 * Suppresses all In-App Messaging messages.
	 * Useful during critical flows such as checkout or sensitive forms.
	 */
	suppress(): void {
		if (!this._iam) return;
		setMessagesDisplaySuppressed(this._iam, true);
		this._suppressed = true;
	}

	/**
	 * Re-enables In-App Messaging after suppression.
	 */
	unsuppress(): void {
		if (!this._iam) return;
		setMessagesDisplaySuppressed(this._iam, false);
		this._suppressed = false;
	}

	/**
	 * Toggles suppression state.
	 */
	toggleSuppression(): void {
		this._suppressed ? this.unsuppress() : this.suppress();
	}
}

export const firekitInAppMessaging = FirekitInAppMessaging.getInstance();
