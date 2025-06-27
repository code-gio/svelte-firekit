/**
 * @fileoverview FirekitAuth - Complete Firebase Authentication Service for Svelte
 * @module FirekitAuth
 * @version 1.0.0
 */

import {
	EmailAuthProvider,
	PhoneAuthProvider,
	RecaptchaVerifier,
	signInWithEmailAndPassword,
	signInWithPopup,
	signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
	signInWithCredential,
	signInAnonymously as firebaseSignInAnonymously,
	createUserWithEmailAndPassword,
	signOut,
	sendPasswordResetEmail,
	confirmPasswordReset,
	sendEmailVerification,
	updateProfile,
	updateEmail,
	updatePassword,
	reauthenticateWithCredential,
	deleteUser,
	reload,
	getIdToken,
	onAuthStateChanged,
	type User
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseService } from '../firebase.js';
import {
	type UserProfile,
	type AuthState,
	type PasswordUpdateResult,
	type AccountDeletionResult,
	type PhoneVerificationResult,
	AuthErrorCode,
	FirekitAuthError
} from '../types/auth.js';
import {
	mapFirebaseUserToProfile,
	updateUserInFirestore,
	createGoogleProvider,
	createFacebookProvider,
	createAppleProvider,
	handleAuthError
} from '../utils/index.js';

/**
 * Comprehensive Firebase Authentication service for Svelte applications.
 * Provides a complete authentication solution with automatic Firestore integration,
 * error handling, and support for all major authentication methods.
 *
 * @class FirekitAuth
 * @example
 * ```typescript
 * import { firekitAuth } from 'svelte-firekit';
 *
 * // Sign in with Google
 * await firekitAuth.signInWithGoogle();
 *
 * // Register new user
 * await firekitAuth.registerWithEmail("user@example.com", "password123", "John Doe");
 *
 * // Listen to auth state changes
 * const unsubscribe = firekitAuth.onAuthStateChanged((user) => {
 *   console.log('User:', user);
 * });
 * ```
 */
class FirekitAuth {
	private static instance: FirekitAuth;
	private auth = firebaseService.getAuthInstance()!;
	private firestore = firebaseService.getDbInstance()!;
	private authState: AuthState = {
		user: null,
		loading: true,
		initialized: false
	};
	private stateListeners: Set<(state: AuthState) => void> = new Set();
	private recaptchaVerifiers: Map<string, RecaptchaVerifier> = new Map();

	private constructor() {
		if (!this.auth) {
			throw new Error('Firebase Auth instance not available');
		}
		if (!this.firestore) {
			throw new Error('Firestore instance not available');
		}
		this.initializeAuthStateListener();
	}

	/**
	 * Gets singleton instance of FirekitAuth
	 * @returns {FirekitAuth} The FirekitAuth instance
	 */
	static getInstance(): FirekitAuth {
		if (!FirekitAuth.instance) {
			FirekitAuth.instance = new FirekitAuth();
		}
		return FirekitAuth.instance;
	}

	/**
	 * Initializes the authentication state listener
	 * @private
	 */
	private initializeAuthStateListener(): void {
		onAuthStateChanged(
			this.auth,
			(user) => {
				this.authState = {
					user: user ? this.mapFirebaseUserToProfile(user) : null,
					loading: false,
					initialized: true
				};
				this.notifyStateListeners();
			},
			(error) => {
				console.error('Auth state change error:', error);
				this.authState = {
					user: null,
					loading: false,
					initialized: true
				};
				this.notifyStateListeners();
			}
		);
	}

	/**
	 * Notifies all state listeners of auth state changes
	 * @private
	 */
	private notifyStateListeners(): void {
		this.stateListeners.forEach((listener) => listener(this.authState));
	}

	/**
	 * Maps Firebase User to UserProfile interface
	 * @private
	 */
	private mapFirebaseUserToProfile(user: User): UserProfile {
		return mapFirebaseUserToProfile(user);
	}

	/**
	 * Updates user data in Firestore with comprehensive profile information
	 * @private
	 */
	private async updateUserInFirestore(user: User): Promise<void> {
		await updateUserInFirestore(this.firestore, user);
	}

	/**
	 * Handles Firebase authentication errors and throws FirekitAuthError
	 * @private
	 */
	private handleAuthError(error: any): never {
		handleAuthError(error);
	}

	/**
	 * Gets the current authentication state
	 * @returns {AuthState} Current authentication state
	 */
	getState(): AuthState {
		return { ...this.authState };
	}

	/**
	 * Gets the current authenticated user
	 * @returns {User | null} Current Firebase user or null
	 */
	getCurrentUser(): User | null {
		return this.auth.currentUser;
	}

	/**
	 * Gets the current user profile
	 * @returns {UserProfile | null} Current user profile or null
	 */
	getCurrentUserProfile(): UserProfile | null {
		return this.authState.user;
	}

	/**
	 * Waits for auth initialization to complete
	 * @returns {Promise<UserProfile | null>} Promise that resolves when auth is initialized
	 */
	async waitForAuth(): Promise<UserProfile | null> {
		return new Promise((resolve) => {
			if (this.authState.initialized) {
				resolve(this.authState.user);
				return;
			}

			const unsubscribe = this.onAuthStateChanged((state) => {
				if (state.initialized) {
					unsubscribe();
					resolve(state.user);
				}
			});
		});
	}

	/**
	 * Subscribes to authentication state changes
	 * @param {Function} callback Callback function to handle state changes
	 * @returns {Function} Unsubscribe function
	 */
	onAuthStateChanged(callback: (state: AuthState) => void): () => void {
		this.stateListeners.add(callback);

		// Immediately call with current state
		callback(this.authState);

		return () => {
			this.stateListeners.delete(callback);
		};
	}

	// ========================================
	// SIGN IN METHODS
	// ========================================

	/**
	 * Signs in user with email and password
	 * @param {string} email User's email address
	 * @param {string} password User's password
	 * @returns {Promise<UserProfile>} Promise resolving to user profile
	 * @throws {FirekitAuthError} If sign-in fails
	 *
	 * @example
	 * ```typescript
	 * try {
	 *   const user = await firekitAuth.signInWithEmail("user@example.com", "password123");
	 *   console.log("Signed in:", user.displayName);
	 * } catch (error) {
	 *   console.error("Sign-in failed:", error.message);
	 * }
	 * ```
	 */
	async signInWithEmail(email: string, password: string): Promise<UserProfile> {
		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
			await this.updateUserInFirestore(userCredential.user);

			return this.mapFirebaseUserToProfile(userCredential.user);
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	/**
	 * Signs in user with Google popup
	 * @returns {Promise<UserProfile>} Promise resolving to user profile
	 * @throws {FirekitAuthError} If sign-in fails
	 *
	 * @example
	 * ```typescript
	 * try {
	 *   const user = await firekitAuth.signInWithGoogle();
	 *   console.log("Signed in with Google:", user.email);
	 * } catch (error) {
	 *   if (error.code === 'auth/popup-closed-by-user') {
	 *     console.log("User cancelled sign-in");
	 *   }
	 * }
	 * ```
	 */
	async signInWithGoogle(): Promise<UserProfile> {
		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			const provider = createGoogleProvider();

			const result = await signInWithPopup(this.auth, provider);
			await this.updateUserInFirestore(result.user);

			return this.mapFirebaseUserToProfile(result.user);
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	/**
	 * Signs in user with Facebook popup
	 * @returns {Promise<UserProfile>} Promise resolving to user profile
	 * @throws {FirekitAuthError} If sign-in fails
	 */
	async signInWithFacebook(): Promise<UserProfile> {
		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			const provider = createFacebookProvider();

			const result = await signInWithPopup(this.auth, provider);
			await this.updateUserInFirestore(result.user);

			return this.mapFirebaseUserToProfile(result.user);
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	/**
	 * Signs in user with Apple popup
	 * @returns {Promise<UserProfile>} Promise resolving to user profile
	 * @throws {FirekitAuthError} If sign-in fails
	 */
	async signInWithApple(): Promise<UserProfile> {
		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			const provider = createAppleProvider();

			const result = await signInWithPopup(this.auth, provider);
			await this.updateUserInFirestore(result.user);

			return this.mapFirebaseUserToProfile(result.user);
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	/**
	 * Signs in user anonymously
	 * @returns {Promise<UserProfile>} Promise resolving to user profile
	 * @throws {FirekitAuthError} If sign-in fails
	 *
	 * @example
	 * ```typescript
	 * const user = await firekitAuth.signInAnonymously();
	 * console.log("Anonymous user:", user.uid);
	 * ```
	 */
	async signInAnonymously(): Promise<UserProfile> {
		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			const result = await firebaseSignInAnonymously(this.auth);
			await this.updateUserInFirestore(result.user);

			return this.mapFirebaseUserToProfile(result.user);
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	/**
	 * Initiates phone number sign-in process
	 * @param {string} phoneNumber Phone number in international format
	 * @param {string} recaptchaContainerId ID of the reCAPTCHA container element
	 * @returns {Promise<PhoneVerificationResult>} Promise resolving to verification result
	 * @throws {FirekitAuthError} If verification initiation fails
	 *
	 * @example
	 * ```typescript
	 * const verification = await firekitAuth.signInWithPhoneNumber("+1234567890", "recaptcha-container");
	 * const user = await verification.confirm("123456");
	 * ```
	 */
	async signInWithPhoneNumber(
		phoneNumber: string,
		recaptchaContainerId: string
	): Promise<PhoneVerificationResult> {
		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			// Clean up existing verifier if any
			const existingVerifier = this.recaptchaVerifiers.get(recaptchaContainerId);
			if (existingVerifier) {
				existingVerifier.clear();
				this.recaptchaVerifiers.delete(recaptchaContainerId);
			}

			const recaptchaVerifier = new RecaptchaVerifier(this.auth, recaptchaContainerId, {
				size: 'normal',
				callback: () => {
					console.log('reCAPTCHA solved');
				},
				'expired-callback': () => {
					console.log('reCAPTCHA expired');
				}
			});

			this.recaptchaVerifiers.set(recaptchaContainerId, recaptchaVerifier);

			const confirmationResult = await firebaseSignInWithPhoneNumber(
				this.auth,
				phoneNumber,
				recaptchaVerifier
			);

			return {
				verificationId: confirmationResult.verificationId,
				confirm: async (code: string) => {
					try {
						const result = await confirmationResult.confirm(code);
						await this.updateUserInFirestore(result.user);
						return this.mapFirebaseUserToProfile(result.user);
					} catch (error: any) {
						this.handleAuthError(error);
					} finally {
						// Clean up verifier after use
						recaptchaVerifier.clear();
						this.recaptchaVerifiers.delete(recaptchaContainerId);
					}
				}
			};
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	// ========================================
	// REGISTRATION METHODS
	// ========================================

	/**
	 * Registers new user with email and password
	 * @param {string} email User's email address
	 * @param {string} password User's password
	 * @param {string} [displayName] User's display name
	 * @param {boolean} [sendVerification=true] Whether to send email verification
	 * @returns {Promise<UserProfile>} Promise resolving to user profile
	 * @throws {FirekitAuthError} If registration fails
	 *
	 * @example
	 * ```typescript
	 * const user = await firekitAuth.registerWithEmail(
	 *   "user@example.com",
	 *   "password123",
	 *   "John Doe"
	 * );
	 * console.log("Registered:", user.displayName);
	 * ```
	 */
	async registerWithEmail(
		email: string,
		password: string,
		displayName?: string,
		sendVerification: boolean = true
	): Promise<UserProfile> {
		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
			const user = userCredential.user;

			// Update profile if displayName provided
			if (displayName) {
				await updateProfile(user, { displayName });
			}

			// Send email verification
			if (sendVerification) {
				await sendEmailVerification(user);
			}

			await this.updateUserInFirestore(user);

			return this.mapFirebaseUserToProfile(user);
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	// ========================================
	// PASSWORD METHODS
	// ========================================

	/**
	 * Sends password reset email
	 * @param {string} email User's email address
	 * @returns {Promise<void>} Promise that resolves when email is sent
	 * @throws {FirekitAuthError} If sending fails
	 *
	 * @example
	 * ```typescript
	 * await firekitAuth.sendPasswordReset("user@example.com");
	 * console.log("Password reset email sent");
	 * ```
	 */
	async sendPasswordReset(email: string): Promise<void> {
		try {
			await sendPasswordResetEmail(this.auth, email);
		} catch (error: any) {
			this.handleAuthError(error);
		}
	}

	/**
	 * Confirms password reset with code
	 * @param {string} code Password reset code from email
	 * @param {string} newPassword New password
	 * @returns {Promise<void>} Promise that resolves when password is reset
	 * @throws {FirekitAuthError} If reset fails
	 */
	async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
		try {
			await confirmPasswordReset(this.auth, code, newPassword);
		} catch (error: any) {
			this.handleAuthError(error);
		}
	}

	/**
	 * Updates user password with reauthentication
	 * @param {string} newPassword New password
	 * @param {string} currentPassword Current password for reauthentication
	 * @returns {Promise<PasswordUpdateResult>} Promise resolving to update result
	 *
	 * @example
	 * ```typescript
	 * const result = await firekitAuth.updatePassword("newPassword123", "oldPassword123");
	 * if (result.success) {
	 *   console.log("Password updated successfully");
	 * } else {
	 *   console.error("Update failed:", result.message);
	 * }
	 * ```
	 */
	async updatePassword(
		newPassword: string,
		currentPassword: string
	): Promise<PasswordUpdateResult> {
		if (!this.auth.currentUser) {
			return {
				success: false,
				message: 'No authenticated user found.',
				code: 'auth/no-current-user'
			};
		}

		try {
			await this.reauthenticateUser(currentPassword);
			await updatePassword(this.auth.currentUser, newPassword);

			return {
				success: true,
				message: 'Password successfully updated.'
			};
		} catch (error: any) {
			const code = error.code as AuthErrorCode;

			if (code === AuthErrorCode.WRONG_PASSWORD) {
				return {
					success: false,
					code,
					message: 'Current password is incorrect.'
				};
			}

			return {
				success: false,
				code: code || 'unknown_error',
				message: error.message || 'Failed to update password.'
			};
		}
	}

	// ========================================
	// PROFILE METHODS
	// ========================================

	/**
	 * Updates user profile
	 * @param {Object} profile Profile update data
	 * @param {string} [profile.displayName] New display name
	 * @param {string} [profile.photoURL] New photo URL
	 * @returns {Promise<void>} Promise that resolves when profile is updated
	 * @throws {FirekitAuthError} If update fails
	 *
	 * @example
	 * ```typescript
	 * await firekitAuth.updateUserProfile({
	 *   displayName: "John Smith",
	 *   photoURL: "https://example.com/photo.jpg"
	 * });
	 * ```
	 */
	async updateUserProfile(profile: { displayName?: string; photoURL?: string }): Promise<void> {
		if (!this.auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}

		try {
			await updateProfile(this.auth.currentUser, profile);
			await this.updateUserInFirestore(this.auth.currentUser);
		} catch (error: any) {
			this.handleAuthError(error);
		}
	}

	/**
	 * Updates user email address
	 * @param {string} newEmail New email address
	 * @returns {Promise<void>} Promise that resolves when email is updated
	 * @throws {FirekitAuthError} If update fails
	 *
	 * @example
	 * ```typescript
	 * await firekitAuth.updateEmail("newemail@example.com");
	 * ```
	 */
	async updateEmail(newEmail: string): Promise<void> {
		if (!this.auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}

		try {
			await updateEmail(this.auth.currentUser, newEmail);
			await this.updateUserInFirestore(this.auth.currentUser);
		} catch (error: any) {
			this.handleAuthError(error);
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
	 * await firekitAuth.sendEmailVerification();
	 * console.log("Verification email sent");
	 * ```
	 */
	async sendEmailVerification(): Promise<void> {
		if (!this.auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}

		try {
			await sendEmailVerification(this.auth.currentUser);
		} catch (error: any) {
			this.handleAuthError(error);
		}
	}

	/**
	 * Reloads current user to get updated email verification status
	 * @returns {Promise<void>} Promise that resolves when user is reloaded
	 * @throws {FirekitAuthError} If reload fails
	 */
	async reloadUser(): Promise<void> {
		if (!this.auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}

		try {
			await reload(this.auth.currentUser);
			await this.updateUserInFirestore(this.auth.currentUser);
		} catch (error: any) {
			this.handleAuthError(error);
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
	 * const token = await firekitAuth.getIdToken();
	 * // Use token for authenticated API calls
	 * ```
	 */
	async getIdToken(forceRefresh: boolean = false): Promise<string> {
		if (!this.auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}

		try {
			return await getIdToken(this.auth.currentUser, forceRefresh);
		} catch (error: any) {
			this.handleAuthError(error);
		}
	}

	// ========================================
	// ACCOUNT MANAGEMENT
	// ========================================

	/**
	 * Reauthenticates current user with email/password
	 * @param {string} currentPassword Current password
	 * @returns {Promise<void>} Promise that resolves when reauthentication succeeds
	 * @throws {FirekitAuthError} If reauthentication fails
	 * @private
	 */
	private async reauthenticateUser(currentPassword: string): Promise<void> {
		if (!this.auth.currentUser || !this.auth.currentUser.email) {
			throw new FirekitAuthError(
				'auth/no-current-user',
				'No authenticated user or email unavailable.'
			);
		}

		try {
			const credential = EmailAuthProvider.credential(this.auth.currentUser.email, currentPassword);
			await reauthenticateWithCredential(this.auth.currentUser, credential);
		} catch (error: any) {
			throw new FirekitAuthError(
				error.code || 'auth/reauthentication-failed',
				`Reauthentication failed: ${error.message || 'Unknown error occurred.'}`
			);
		}
	}

	/**
	 * Deletes user account and associated data
	 * @param {string} [currentPassword] Current password for reauthentication (required for email/password accounts)
	 * @returns {Promise<AccountDeletionResult>} Promise resolving to deletion result
	 *
	 * @example
	 * ```typescript
	 * const result = await firekitAuth.deleteAccount("currentPassword123");
	 * if (result.success) {
	 *   console.log("Account deleted successfully");
	 * }
	 * ```
	 */
	async deleteAccount(currentPassword?: string): Promise<AccountDeletionResult> {
		if (!this.auth.currentUser) {
			return {
				success: false,
				message: 'No authenticated user found.'
			};
		}

		try {
			const user = this.auth.currentUser;

			// Reauthenticate if password provided (required for email/password accounts)
			if (currentPassword) {
				await this.reauthenticateUser(currentPassword);
			}

			// Delete user data from Firestore first
			try {
				const userRef = doc(this.firestore, 'users', user.uid);
				await setDoc(userRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
			} catch (firestoreError) {
				console.error('Failed to mark user as deleted in Firestore:', firestoreError);
			}

			// Delete the Firebase Auth account
			await deleteUser(user);

			return {
				success: true,
				message: 'Account successfully deleted.'
			};
		} catch (error: any) {
			const code = error.code as AuthErrorCode;

			if (code === AuthErrorCode.REQUIRES_RECENT_LOGIN) {
				return {
					success: false,
					message: 'Please sign in again before deleting your account.'
				};
			}

			return {
				success: false,
				message: error.message || 'Failed to delete account.'
			};
		}
	}

	// ========================================
	// SIGN OUT
	// ========================================

	/**
	 * Signs out current user
	 * @returns {Promise<void>} Promise that resolves when sign-out completes
	 * @throws {FirekitAuthError} If sign-out fails
	 *
	 * @example
	 * ```typescript
	 * await firekitAuth.signOut();
	 * console.log("User signed out");
	 * ```
	 */
	async signOut(): Promise<void> {
		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			// Clear all reCAPTCHA verifiers
			this.recaptchaVerifiers.forEach((verifier) => verifier.clear());
			this.recaptchaVerifiers.clear();

			await signOut(this.auth);
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	// ========================================
	// UTILITY METHODS
	// ========================================

	/**
	 * Checks if user is authenticated
	 * @returns {boolean} True if user is authenticated
	 */
	isAuthenticated(): boolean {
		return !!this.authState.user && !this.authState.user.isAnonymous;
	}

	/**
	 * Checks if user is anonymous
	 * @returns {boolean} True if user is anonymous
	 */
	isAnonymous(): boolean {
		return !!this.authState.user?.isAnonymous;
	}

	/**
	 * Checks if user's email is verified
	 * @returns {boolean} True if email is verified
	 */
	isEmailVerified(): boolean {
		return !!this.authState.user?.emailVerified;
	}

	/**
	 * Gets user's primary email address
	 * @returns {string | null} User's email or null
	 */
	getUserEmail(): string | null {
		return this.authState.user?.email || null;
	}

	/**
	 * Gets user's display name
	 * @returns {string | null} User's display name or null
	 */
	getUserDisplayName(): string | null {
		return this.authState.user?.displayName || null;
	}

	/**
	 * Gets user's photo URL
	 * @returns {string | null} User's photo URL or null
	 */
	getUserPhotoURL(): string | null {
		return this.authState.user?.photoURL || null;
	}

	/**
	 * Gets user's UID
	 * @returns {string | null} User's UID or null
	 */
	getUserId(): string | null {
		return this.authState.user?.uid || null;
	}

	/**
	 * Cleans up all resources
	 * @returns {Promise<void>} Promise that resolves when cleanup is complete
	 */
	async cleanup(): Promise<void> {
		// Clear all listeners
		this.stateListeners.clear();

		// Clear all reCAPTCHA verifiers
		this.recaptchaVerifiers.forEach((verifier) => verifier.clear());
		this.recaptchaVerifiers.clear();

		// Reset state
		this.authState = {
			user: null,
			loading: false,
			initialized: false
		};
	}
}

/**
 * Pre-initialized singleton instance of FirekitAuth.
 * This is the main export that should be used throughout your application.
 *
 * @example
 * ```typescript
 * import { firekitAuth } from 'svelte-firekit';
 *
 * // Sign in with email
 * await firekitAuth.signInWithEmail("user@example.com", "password");
 *
 * // Listen to auth state
 * const unsubscribe = firekitAuth.onAuthStateChanged((state) => {
 *   if (state.user) {
 *     console.log("User is signed in:", state.user.email);
 *   } else {
 *     console.log("User is signed out");
 *   }
 * });
 *
 * // Clean up listener
 * unsubscribe();
 * ```
 */
export const firekitAuth = FirekitAuth.getInstance();
