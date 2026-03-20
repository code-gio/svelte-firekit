import {
	onAuthStateChanged,
	updateProfile,
	updateEmail,
	updatePassword,
	reload,
	sendEmailVerification,
	getIdToken,
	type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseService } from '../firebase.js';
import {
	type UserProfile,
	type UserProfileUpdateData,
	FirekitAuthError,
	AuthErrorCode
} from '../types/auth.js';
import { mapFirebaseUserToProfile, updateUserInFirestore, createAuthError, validateCurrentUser } from '../utils/index.js';

export interface ExtendedUserData extends UserProfile {
	preferences?: Record<string, unknown>;
	settings?: Record<string, unknown>;
	lastActive?: Date;
	createdAt?: Date;
	updatedAt?: Date;
	[key: string]: unknown;
}

/**
 * Reactive user store — the single source of truth for auth state.
 * Uses Svelte 5 `$state` / `$derived` runes so all getters are reactive
 * and can be read directly in components without subscriptions.
 *
 * @example
 * import { firekitUser } from 'svelte-firekit';
 *
 * // In a .svelte file — reactive, no subscription needed
 * {#if firekitUser.isAuthenticated}
 *   <p>Hello {firekitUser.displayName}</p>
 * {/if}
 */
class FirekitUserStore {
	private static instance: FirekitUserStore;
	private auth: ReturnType<typeof firebaseService.getAuthInstance> | null = null;
	private firestore: ReturnType<typeof firebaseService.getDbInstance> | null = null;

	// ── Reactive state ───────────────────────────────────────────────────────────

	private _user = $state<UserProfile | null>(null);
	private _loading = $state(true);
	private _initialized = $state(false);
	private _error = $state<Error | null>(null);

	// ── Derived ──────────────────────────────────────────────────────────────────

	private _isAuthenticated = $derived(this._user !== null && !this._user.isAnonymous);
	private _isAnonymous = $derived(this._user?.isAnonymous ?? false);
	private _isEmailVerified = $derived(this._user?.emailVerified ?? false);
	private _email = $derived(this._user?.email ?? null);
	private _displayName = $derived(this._user?.displayName ?? null);
	private _photoURL = $derived(this._user?.photoURL ?? null);
	private _uid = $derived(this._user?.uid ?? null);
	private _phoneNumber = $derived(this._user?.phoneNumber ?? null);

	private _listening = false;

	private constructor() {
		// Do NOT bootstrap here — Firebase config may not be set yet.
		// Auth listener is set up lazily via initialize() or ensureListening().
	}

	static getInstance(): FirekitUserStore {
		if (!FirekitUserStore.instance) {
			FirekitUserStore.instance = new FirekitUserStore();
		}
		return FirekitUserStore.instance;
	}

	/**
	 * Called by FirebaseApp after initFirekit() to start the auth listener.
	 * Safe to call multiple times — only the first call has an effect.
	 */
	initialize(): void {
		if (typeof window === 'undefined') return;
		this.ensureListening();
	}

	/**
	 * Ensures the onAuthStateChanged listener is registered.
	 * Called lazily from initialize() or from any public getter/method
	 * so the store self-heals if Firebase was configured after import.
	 */
	private ensureListening(): void {
		if (this._listening) return;

		try {
			this.auth = firebaseService.getAuthInstance();
			try {
				this.firestore = firebaseService.getDbInstance();
			} catch {
				this.firestore = null;
			}
			this._listening = true;
			this.listenToAuthState();
		} catch {
			// Firebase not yet configured — will retry on next access
		}
	}

	private listenToAuthState(): void {
		if (!this.auth) return;

		onAuthStateChanged(
			this.auth,
			(firebaseUser: FirebaseUser | null) => {
				this._user = firebaseUser ? mapFirebaseUserToProfile(firebaseUser) : null;
				this._loading = false;
				this._initialized = true;
				this._error = null;
			},
			(err: Error) => {
				this._error = err;
				this._loading = false;
				this._initialized = true;
			}
		);
	}

	private async syncToFirestore(user: FirebaseUser): Promise<void> {
		if (!this.firestore) return;
		await updateUserInFirestore(this.firestore, user);
	}

	private currentFirebaseUser(): FirebaseUser {
		return validateCurrentUser(this.auth!) as FirebaseUser;
	}

	// ── Public getters (reactive) ────────────────────────────────────────────────
	// Each getter calls ensureListening() so the auth listener is registered
	// on first access, even if initialize() hasn't been called yet.

	get user(): UserProfile | null { this.ensureListening(); return this._user; }
	get loading(): boolean { this.ensureListening(); return this._loading; }
	get initialized(): boolean { this.ensureListening(); return this._initialized; }
	get error(): Error | null { this.ensureListening(); return this._error; }
	get isAuthenticated(): boolean { this.ensureListening(); return this._isAuthenticated; }
	get isAnonymous(): boolean { this.ensureListening(); return this._isAnonymous; }
	get isEmailVerified(): boolean { this.ensureListening(); return this._isEmailVerified; }
	get email(): string | null { this.ensureListening(); return this._email; }
	get displayName(): string | null { this.ensureListening(); return this._displayName; }
	get photoURL(): string | null { this.ensureListening(); return this._photoURL; }
	get uid(): string | null { this.ensureListening(); return this._uid; }
	get phoneNumber(): string | null { this.ensureListening(); return this._phoneNumber; }

	// ── Profile updates ──────────────────────────────────────────────────────────

	async updateDisplayName(displayName: string): Promise<void> {
		const user = this.currentFirebaseUser();
		try {
			this._loading = true;
			await updateProfile(user, { displayName });
			await this.syncToFirestore(user);
			if (this._user) this._user = { ...this._user, displayName };
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			throw createAuthError(err, 'update display name');
		} finally {
			this._loading = false;
		}
	}

	async updatePhotoURL(photoURL: string): Promise<void> {
		const user = this.currentFirebaseUser();
		try {
			this._loading = true;
			await updateProfile(user, { photoURL });
			await this.syncToFirestore(user);
			if (this._user) this._user = { ...this._user, photoURL };
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			throw createAuthError(err, 'update photo URL');
		} finally {
			this._loading = false;
		}
	}

	async updateProfile(profileData: UserProfileUpdateData): Promise<void> {
		const user = this.currentFirebaseUser();
		try {
			this._loading = true;
			await updateProfile(user, profileData);
			await this.syncToFirestore(user);
			if (this._user) {
				this._user = {
					...this._user,
					displayName: profileData.displayName ?? this._user.displayName,
					photoURL: profileData.photoURL ?? this._user.photoURL
				};
			}
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			throw createAuthError(err, 'update profile');
		} finally {
			this._loading = false;
		}
	}

	async updateEmail(newEmail: string): Promise<void> {
		const user = this.currentFirebaseUser();
		try {
			this._loading = true;
			await updateEmail(user, newEmail);
			await this.syncToFirestore(user);
			if (this._user) this._user = { ...this._user, email: newEmail, emailVerified: false };
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			throw createAuthError(err, 'update email');
		} finally {
			this._loading = false;
		}
	}

	async updatePassword(newPassword: string): Promise<void> {
		const user = this.currentFirebaseUser();
		try {
			this._loading = true;
			await updatePassword(user, newPassword);
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			throw createAuthError(err, 'update password');
		} finally {
			this._loading = false;
		}
	}

	// ── Email verification ───────────────────────────────────────────────────────

	async sendEmailVerification(): Promise<void> {
		const user = this.currentFirebaseUser();
		try {
			await sendEmailVerification(user);
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			throw createAuthError(err, 'send email verification');
		}
	}

	async reloadUser(): Promise<void> {
		const user = this.currentFirebaseUser();
		try {
			this._loading = true;
			await reload(user);
			await this.syncToFirestore(user);
			this._user = mapFirebaseUserToProfile(user);
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			throw createAuthError(err, 'reload user');
		} finally {
			this._loading = false;
		}
	}

	// ── Token ────────────────────────────────────────────────────────────────────

	async getIdToken(forceRefresh = false): Promise<string> {
		const user = this.currentFirebaseUser();
		try {
			return await getIdToken(user, forceRefresh);
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			throw createAuthError(err, 'get ID token');
		}
	}

	// ── Extended Firestore data ──────────────────────────────────────────────────

	async getExtendedData(): Promise<ExtendedUserData | null> {
		if (!this._user?.uid || !this.firestore) return null;
		try {
			const snap = await getDoc(doc(this.firestore, 'users', this._user.uid));
			return snap.exists() ? (snap.data() as ExtendedUserData) : null;
		} catch {
			return null;
		}
	}

	async updateExtendedData(data: Partial<ExtendedUserData>): Promise<void> {
		if (!this._user?.uid) {
			throw new FirekitAuthError(AuthErrorCode.USER_NOT_FOUND, 'No authenticated user found.');
		}
		if (!this.firestore) {
			throw new Error('Firestore instance not available.');
		}
		try {
			await setDoc(
				doc(this.firestore, 'users', this._user.uid),
				{ ...data, updatedAt: serverTimestamp() },
				{ merge: true }
			);
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			throw createAuthError(err, 'update user data');
		}
	}

	// ── Utility ──────────────────────────────────────────────────────────────────

	/**
	 * Resolves once Firebase Auth has initialized (first `onAuthStateChanged` callback).
	 * Rejects after `timeoutMs` (default 10 000 ms) if auth never initializes.
	 * Safe to call server-side — will resolve immediately with null.
	 */
	waitForAuth(timeoutMs = 10_000): Promise<UserProfile | null> {
		if (typeof window === 'undefined') return Promise.resolve(null);

		this.ensureListening();

		if (this._initialized) return Promise.resolve(this._user);

		return new Promise<UserProfile | null>((resolve, reject) => {
			const timer = setTimeout(() => {
				stop();
				reject(new Error('waitForAuth timed out — Firebase Auth did not initialize.'));
			}, timeoutMs);

			const stop = $effect.root(() => {
				$effect(() => {
					if (this._initialized) {
						clearTimeout(timer);
						stop();
						resolve(this._user);
					}
				});
			});
		});
	}

	clearError(): void {
		this._error = null;
	}
}

export const firekitUser = FirekitUserStore.getInstance();
