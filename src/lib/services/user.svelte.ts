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

	private constructor() {
		if (typeof window !== 'undefined') {
			this.bootstrap();
		}
	}

	static getInstance(): FirekitUserStore {
		if (!FirekitUserStore.instance) {
			FirekitUserStore.instance = new FirekitUserStore();
		}
		return FirekitUserStore.instance;
	}

	private bootstrap(): void {
		try {
			this.auth = firebaseService.getAuthInstance();
			try {
				this.firestore = firebaseService.getDbInstance();
			} catch {
				this.firestore = null;
			}
			this.listenToAuthState();
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			this._loading = false;
			this._initialized = true;
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

	get user(): UserProfile | null { return this._user; }
	get loading(): boolean { return this._loading; }
	get initialized(): boolean { return this._initialized; }
	get error(): Error | null { return this._error; }
	get isAuthenticated(): boolean { return this._isAuthenticated; }
	get isAnonymous(): boolean { return this._isAnonymous; }
	get isEmailVerified(): boolean { return this._isEmailVerified; }
	get email(): string | null { return this._email; }
	get displayName(): string | null { return this._displayName; }
	get photoURL(): string | null { return this._photoURL; }
	get uid(): string | null { return this._uid; }
	get phoneNumber(): string | null { return this._phoneNumber; }

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
	 * Safe to call server-side — will resolve immediately with null.
	 */
	waitForAuth(): Promise<UserProfile | null> {
		if (this._initialized) return Promise.resolve(this._user);

		// $effect.root creates a reactive scope outside of component initialization,
		// so this works safely whether called inside or outside a Svelte component.
		return new Promise<UserProfile | null>((resolve) => {
			const stop = $effect.root(() => {
				$effect(() => {
					if (this._initialized) {
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
