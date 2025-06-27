/**
 * @fileoverview FirekitUser Store - Reactive user state management using Svelte 5 runes
 * @module FirekitUserStore
 * @version 1.0.0
 */

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
import {
	mapFirebaseUserToProfile,
	updateUserInFirestore,
	createAuthError,
	validateCurrentUser
} from '../utils/index.js';

/**
 * User store interface for type safety
 */
export interface UserStoreState {
	user: UserProfile | null;
	loading: boolean;
	initialized: boolean;
	error: Error | null;
}

/**
 * Extended user data stored in Firestore
 */
export interface ExtendedUserData extends UserProfile {
	preferences?: Record<string, any>;
	settings?: Record<string, any>;
	lastActive?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

/**
 * Reactive user store using Svelte 5 runes for state management.
 * Provides real-time authentication state and user profile management.
 *
 * @class FirekitUserStore
 * @example
 * ```typescript
 * import { firekitUser } from 'svelte-firekit';
 *
 * // Access reactive state
 * $: if (firekitUser.isAuthenticated) {
 *   console.log("User:", firekitUser.user);
 * }
 *
 * // Update profile
 * await firekitUser.updateDisplayName("John Doe");
 *
 * // Get extended user data
 * const userData = await firekitUser.getExtendedUserData();
 * ```
 */
class FirekitUserStore {
	private static instance: FirekitUserStore;
	private auth: ReturnType<typeof firebaseService.getAuthInstance> | null = null;
	private firestore: ReturnType<typeof firebaseService.getDbInstance> | null = null;
	private _servicesInitialized = false;

	// ========================================
	// REACTIVE STATE (Svelte 5 Runes)
	// ========================================

	/** Current user profile state */
	private _user = $state<UserProfile | null>(null);

	/** Loading state indicator */
	private _loading = $state<boolean>(true);

	/** Authentication initialization state */
	private _initialized = $state<boolean>(false);

	/** Current error state */
	private _error = $state<Error | null>(null);

	// ========================================
	// DERIVED STATE
	// ========================================

	/** Derived: Whether user is authenticated (not anonymous) */
	private _isAuthenticated = $derived(this._user !== null && !this._user.isAnonymous);

	/** Derived: Whether user is anonymous */
	private _isAnonymous = $derived(this._user?.isAnonymous ?? false);

	/** Derived: Whether user's email is verified */
	private _isEmailVerified = $derived(this._user?.emailVerified ?? false);

	/** Derived: User's primary email address */
	private _userEmail = $derived(this._user?.email ?? null);

	/** Derived: User's display name */
	private _userDisplayName = $derived(this._user?.displayName ?? null);

	/** Derived: User's photo URL */
	private _userPhotoURL = $derived(this._user?.photoURL ?? null);

	/** Derived: User's unique ID */
	private _userId = $derived(this._user?.uid ?? null);

	/** Derived: User's phone number */
	private _userPhoneNumber = $derived(this._user?.phoneNumber ?? null);

	private constructor() {
		if (typeof window !== 'undefined') {
			// Initialize Firebase services immediately like the old working code
			this.initializeServices();
		}
	}

	/**
	 * Gets singleton instance of FirekitUserStore
	 * @returns {FirekitUserStore} The FirekitUserStore instance
	 */
	static getInstance(): FirekitUserStore {
		if (!FirekitUserStore.instance) {
			FirekitUserStore.instance = new FirekitUserStore();
		}
		return FirekitUserStore.instance;
	}

	/**
	 * Initializes Firebase services and auth state listener
	 * @private
	 */
	private initializeServices(): void {
		if (this._servicesInitialized) return;

		try {
			this.auth = firebaseService.getAuthInstance();
			this.firestore = firebaseService.getDbInstance();
			this._servicesInitialized = true;
			this.initializeAuthStateListener();
		} catch (error) {
			console.error('Failed to initialize Firebase services:', error);
			this._error = error instanceof Error ? error : new Error(String(error));
			this._loading = false;
			this._initialized = true;
		}
	}

	/**
	 * Initializes the authentication state listener
	 * @private
	 */
	private initializeAuthStateListener(): void {
		if (!this.auth) {
			console.error('Auth instance not available');
			return;
		}

		onAuthStateChanged(
			this.auth,
			(firebaseUser) => {
				this._user = firebaseUser ? this.mapFirebaseUserToProfile(firebaseUser) : null;
				this._loading = false;
				this._initialized = true;
				this._error = null;
			},
			(error) => {
				console.error('Auth state change error:', error);
				this._error = error;
				this._loading = false;
				this._initialized = true;
			}
		);
	}

	/**
	 * Maps Firebase User to UserProfile interface
	 * @private
	 */
	private mapFirebaseUserToProfile(user: FirebaseUser): UserProfile {
		return mapFirebaseUserToProfile(user);
	}

	/**
	 * Updates user data in Firestore
	 * @private
	 */
	private async updateUserInFirestore(user: FirebaseUser): Promise<void> {
		if (!this.firestore) {
			throw new Error('Firestore instance not available');
		}
		await updateUserInFirestore(this.firestore, user);
	}

	// ========================================
	// PUBLIC GETTERS (Reactive State)
	// ========================================

	/** Current user profile */
	get user(): UserProfile | null {
		return this._user;
	}

	/** Current loading state */
	get loading(): boolean {
		return this._loading;
	}

	/** Whether auth has been initialized */
	get initialized(): boolean {
		return this._initialized;
	}

	/** Current error state */
	get error(): Error | null {
		return this._error;
	}

	/** Whether user is authenticated (not anonymous) */
	get isAuthenticated(): boolean {
		return this._isAuthenticated;
	}

	/** Whether user is anonymous */
	get isAnonymous(): boolean {
		return this._isAnonymous;
	}

	/** Whether user's email is verified */
	get isEmailVerified(): boolean {
		return this._isEmailVerified;
	}

	/** User's email address */
	get email(): string | null {
		return this._userEmail;
	}

	/** User's display name */
	get displayName(): string | null {
		return this._userDisplayName;
	}

	/** User's photo URL */
	get photoURL(): string | null {
		return this._userPhotoURL;
	}

	/** User's unique ID */
	get uid(): string | null {
		return this._userId;
	}

	/** User's phone number */
	get phoneNumber(): string | null {
		return this._userPhoneNumber;
	}

	// ========================================
	// PROFILE UPDATE METHODS
	// ========================================

	/**
	 * Updates user's display name
	 * @param {string} displayName New display name
	 * @returns {Promise<void>} Promise that resolves when update completes
	 * @throws {FirekitAuthError} If update fails
	 *
	 * @example
	 * ```typescript
	 * await firekitUser.updateDisplayName("John Doe");
	 * ```
	 */
	async updateDisplayName(displayName: string): Promise<void> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		const currentUser = validateCurrentUser(this.auth);

		try {
			this._loading = true;
			await updateProfile(currentUser, { displayName });
			await this.updateUserInFirestore(currentUser);

			// Update local state
			if (this._user) {
				this._user = { ...this._user, displayName };
			}
		} catch (error: any) {
			this._error = error;
			throw createAuthError(error, 'update display name');
		} finally {
			this._loading = false;
		}
	}

	/**
	 * Updates user's photo URL
	 * @param {string} photoURL New photo URL
	 * @returns {Promise<void>} Promise that resolves when update completes
	 * @throws {FirekitAuthError} If update fails
	 *
	 * @example
	 * ```typescript
	 * await firekitUser.updatePhotoURL("https://example.com/photo.jpg");
	 * ```
	 */
	async updatePhotoURL(photoURL: string): Promise<void> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		const currentUser = validateCurrentUser(this.auth);

		try {
			this._loading = true;
			await updateProfile(currentUser, { photoURL });
			await this.updateUserInFirestore(currentUser);

			// Update local state
			if (this._user) {
				this._user = { ...this._user, photoURL };
			}
		} catch (error: any) {
			this._error = error;
			throw createAuthError(error, 'update photo URL');
		} finally {
			this._loading = false;
		}
	}

	/**
	 * Updates user's profile data
	 * @param {UserProfileUpdateData} profileData Profile data to update
	 * @returns {Promise<void>} Promise that resolves when update completes
	 * @throws {FirekitAuthError} If update fails
	 *
	 * @example
	 * ```typescript
	 * await firekitUser.updateProfile({
	 *   displayName: "John Smith",
	 *   photoURL: "https://example.com/new-photo.jpg"
	 * });
	 * ```
	 */
	async updateProfile(profileData: UserProfileUpdateData): Promise<void> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		const currentUser = validateCurrentUser(this.auth);

		try {
			this._loading = true;
			await updateProfile(currentUser, profileData);
			await this.updateUserInFirestore(currentUser);

			// Update local state
			if (this._user) {
				this._user = {
					...this._user,
					displayName: profileData.displayName ?? this._user.displayName,
					photoURL: profileData.photoURL ?? this._user.photoURL
				};
			}
		} catch (error: any) {
			this._error = error;
			throw createAuthError(error, 'update profile');
		} finally {
			this._loading = false;
		}
	}

	/**
	 * Updates user's email address
	 * @param {string} newEmail New email address
	 * @returns {Promise<void>} Promise that resolves when update completes
	 * @throws {FirekitAuthError} If update fails
	 *
	 * @example
	 * ```typescript
	 * await firekitUser.updateEmail("newemail@example.com");
	 * ```
	 */
	async updateEmail(newEmail: string): Promise<void> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		const currentUser = validateCurrentUser(this.auth);

		try {
			this._loading = true;
			await updateEmail(currentUser, newEmail);
			await this.updateUserInFirestore(currentUser);

			// Update local state
			if (this._user) {
				this._user = { ...this._user, email: newEmail, emailVerified: false };
			}
		} catch (error: any) {
			this._error = error;
			throw createAuthError(error, 'update email');
		} finally {
			this._loading = false;
		}
	}

	/**
	 * Updates user's password
	 * @param {string} newPassword New password
	 * @returns {Promise<void>} Promise that resolves when update completes
	 * @throws {FirekitAuthError} If update fails
	 *
	 * @example
	 * ```typescript
	 * await firekitUser.updatePassword("newSecurePassword123");
	 * ```
	 */
	async updatePassword(newPassword: string): Promise<void> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		const currentUser = validateCurrentUser(this.auth);

		try {
			this._loading = true;
			await updatePassword(currentUser, newPassword);
		} catch (error: any) {
			this._error = error;
			throw createAuthError(error, 'update password');
		} finally {
			this._loading = false;
		}
	}

	// ========================================
	// EMAIL VERIFICATION METHODS
	// ========================================

	/**
	 * Sends email verification to current user
	 * @returns {Promise<void>} Promise that resolves when verification email is sent
	 * @throws {FirekitAuthError} If sending fails
	 *
	 * @example
	 * ```typescript
	 * await firekitUser.sendEmailVerification();
	 * ```
	 */
	async sendEmailVerification(): Promise<void> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		const currentUser = validateCurrentUser(this.auth);

		try {
			await sendEmailVerification(currentUser);
		} catch (error: any) {
			this._error = error;
			throw createAuthError(error, 'send email verification');
		}
	}

	/**
	 * Reloads user to get updated email verification status
	 * @returns {Promise<void>} Promise that resolves when user is reloaded
	 * @throws {FirekitAuthError} If reload fails
	 *
	 * @example
	 * ```typescript
	 * await firekitUser.reloadUser();
	 * ```
	 */
	async reloadUser(): Promise<void> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		const currentUser = validateCurrentUser(this.auth);

		try {
			this._loading = true;
			await reload(currentUser);
			await this.updateUserInFirestore(currentUser);

			// Update local state with reloaded data
			this._user = this.mapFirebaseUserToProfile(currentUser);
		} catch (error: any) {
			this._error = error;
			throw createAuthError(error, 'reload user');
		} finally {
			this._loading = false;
		}
	}

	// ========================================
	// TOKEN METHODS
	// ========================================

	/**
	 * Gets the current user's ID token
	 * @param {boolean} [forceRefresh=false] Whether to force token refresh
	 * @returns {Promise<string>} Promise resolving to ID token
	 * @throws {FirekitAuthError} If getting token fails
	 *
	 * @example
	 * ```typescript
	 * const token = await firekitUser.getIdToken();
	 * ```
	 */
	async getIdToken(forceRefresh: boolean = false): Promise<string> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		const currentUser = validateCurrentUser(this.auth);

		try {
			return await getIdToken(currentUser, forceRefresh);
		} catch (error: any) {
			this._error = error;
			throw createAuthError(error, 'get ID token');
		}
	}

	// ========================================
	// FIRESTORE EXTENDED DATA METHODS
	// ========================================

	/**
	 * Gets extended user data from Firestore
	 * @returns {Promise<ExtendedUserData | null>} Promise resolving to extended user data
	 *
	 * @example
	 * ```typescript
	 * const userData = await firekitUser.getExtendedUserData();
	 * console.log(userData?.preferences);
	 * ```
	 */
	async getExtendedUserData(): Promise<ExtendedUserData | null> {
		if (!this._user?.uid || !this.firestore) {
			return null;
		}

		try {
			const userRef = doc(this.firestore, 'users', this._user.uid);
			const userDoc = await getDoc(userRef);

			if (userDoc.exists()) {
				return userDoc.data() as ExtendedUserData;
			}

			return null;
		} catch (error: any) {
			console.error('Failed to get extended user data:', error);
			this._error = error;
			return null;
		}
	}

	/**
	 * Updates extended user data in Firestore
	 * @param {Partial<ExtendedUserData>} data Data to update
	 * @returns {Promise<void>} Promise that resolves when update completes
	 *
	 * @example
	 * ```typescript
	 * await firekitUser.updateExtendedUserData({
	 *   preferences: { theme: 'dark', language: 'en' },
	 *   settings: { notifications: true }
	 * });
	 * ```
	 */
	async updateExtendedUserData(data: Partial<ExtendedUserData>): Promise<void> {
		if (!this._user?.uid) {
			throw new FirekitAuthError(AuthErrorCode.USER_NOT_FOUND, 'No authenticated user found.');
		}
		if (!this.firestore) {
			throw new Error('Firestore instance not available');
		}

		try {
			const userRef = doc(this.firestore, 'users', this._user.uid);
			await setDoc(
				userRef,
				{
					...data,
					updatedAt: serverTimestamp()
				},
				{ merge: true }
			);
		} catch (error: any) {
			this._error = error;
			throw createAuthError(error, 'update user data');
		}
	}

	// ========================================
	// UTILITY METHODS
	// ========================================

	/**
	 * Waits for authentication to initialize
	 * @returns {Promise<UserProfile | null>} Promise that resolves when auth is initialized
	 *
	 * @example
	 * ```typescript
	 * const user = await firekitUser.waitForAuth();
	 * if (user) {
	 *   console.log("User is authenticated");
	 * }
	 * ```
	 */
	async waitForAuth(): Promise<UserProfile | null> {
		return new Promise((resolve) => {
			if (this._initialized) {
				resolve(this._user);
				return;
			}

			// Create a one-time watcher
			const checkInitialized = () => {
				if (this._initialized) {
					resolve(this._user);
				} else {
					// Check again in next tick
					setTimeout(checkInitialized, 10);
				}
			};

			checkInitialized();
		});
	}

	/**
	 * Clears any error state
	 */
	clearError(): void {
		this._error = null;
	}

	/**
	 * Manually sets loading state (use with caution)
	 * @param {boolean} loading Loading state
	 */
	setLoading(loading: boolean): void {
		this._loading = loading;
	}

	/**
	 * Resets the store to initial state
	 */
	reset(): void {
		this._user = null;
		this._loading = true;
		this._initialized = false;
		this._error = null;
		this._servicesInitialized = false;
		this.auth = null;
		this.firestore = null;
	}
}

/**
 * Pre-initialized singleton instance of FirekitUserStore.
 * Provides reactive user state management for Svelte applications.
 *
 * @example
 * ```typescript
 * import { firekitUser } from 'svelte-firekit';
 *
 * // In a Svelte component
 * $: if (firekitUser.isAuthenticated) {
 *   console.log("Welcome:", firekitUser.displayName);
 * }
 *
 * // Update profile
 * await firekitUser.updateDisplayName("John Doe");
 *
 * // Get extended data
 * const userData = await firekitUser.getExtendedUserData();
 * ```
 */
export const firekitUser = FirekitUserStore.getInstance();
