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
	getAdditionalUserInfo,
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
	type SignInResult,
	type RegistrationResult,
	type OAuthSignInResult,
	type ProfileUpdateResult,
	type EmailVerificationResult,
	type PasswordResetResult,
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
import { firekitPresence } from './presence.svelte.js';

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
	private auth: ReturnType<typeof firebaseService.getAuthInstance> | null = null;
	private firestore: ReturnType<typeof firebaseService.getDbInstance> | null = null;
	private _servicesInitialized = false;
	private authState: AuthState = {
		user: null,
		loading: true,
		initialized: false
	};
	private stateListeners: Set<(state: AuthState) => void> = new Set();
	private recaptchaVerifiers: Map<string, RecaptchaVerifier> = new Map();

	private constructor() {
		if (typeof window !== 'undefined') {
			// Initialize Firebase services immediately like the old working code
			this.initializeServices();
		}
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
	 * Initializes Firebase services and auth state listener
	 * @private
	 */
	private initializeServices(): void {
		if (this._servicesInitialized) return;

		try {
			this.auth = firebaseService.getAuthInstance();

			// Try to get Firestore instance, but don't fail if it's not available
			try {
				this.firestore = firebaseService.getDbInstance();
			} catch (firestoreError) {
				console.warn(
					'Firestore not available, continuing without Firestore integration:',
					firestoreError
				);
				this.firestore = null;
			}

			this._servicesInitialized = true;
			this.initializeAuthStateListener();
		} catch (error) {
			console.error('Failed to initialize Firebase services:', error);
			this.authState = {
				user: null,
				loading: false,
				initialized: true
			};
			this.notifyStateListeners();
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
		if (!this.firestore) {
			console.warn('Firestore not available, skipping user update in Firestore');
			return;
		}
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
		return this.auth?.currentUser ?? null;
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
	 * @returns {Promise<SignInResult>} Promise resolving to sign-in result
	 * @throws {FirekitAuthError} If sign-in fails
	 *
	 * @example
	 * ```typescript
	 * try {
	 *   const result = await firekitAuth.signInWithEmail("user@example.com", "password123");
	 *   console.log("Signed in:", result.user.displayName);
	 *   console.log("Is new user:", result.isNewUser);
	 * } catch (error) {
	 *   console.error("Sign-in failed:", error.message);
	 * }
	 * ```
	 */
	async signInWithEmail(email: string, password: string): Promise<SignInResult> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
			await this.updateUserInFirestore(userCredential.user);

			const userProfile = this.mapFirebaseUserToProfile(userCredential.user);
			const additionalUserInfo = getAdditionalUserInfo(userCredential);
			const isNewUser = additionalUserInfo?.isNewUser ?? false;

			return {
				success: true,
				user: userProfile,
				method: 'email',
				timestamp: new Date(),
				isNewUser,
				requiresEmailVerification: !userProfile.emailVerified
			};
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	/**
	 * Signs in user with Google popup
	 * @returns {Promise<OAuthSignInResult>} Promise resolving to OAuth sign-in result
	 * @throws {FirekitAuthError} If sign-in fails
	 *
	 * @example
	 * ```typescript
	 * try {
	 *   const result = await firekitAuth.signInWithGoogle();
	 *   console.log("Signed in with Google:", result.user.email);
	 *   console.log("Is new user:", result.isNewUser);
	 *   console.log("Access token:", result.accessToken);
	 * } catch (error) {
	 *   if (error.code === 'auth/popup-closed-by-user') {
	 *     console.log("User cancelled sign-in");
	 *   }
	 * }
	 * ```
	 */
	async signInWithGoogle(): Promise<OAuthSignInResult> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			const provider = createGoogleProvider();

			const result = await signInWithPopup(this.auth, provider);
			await this.updateUserInFirestore(result.user);

			const userProfile = this.mapFirebaseUserToProfile(result.user);
			const additionalUserInfo = getAdditionalUserInfo(result);
			const isNewUser = additionalUserInfo?.isNewUser ?? false;

			return {
				success: true,
				user: userProfile,
				method: 'google',
				timestamp: new Date(),
				isNewUser,
				provider: 'google'
			};
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	/**
	 * Signs in user with Facebook popup
	 * @returns {Promise<OAuthSignInResult>} Promise resolving to OAuth sign-in result
	 * @throws {FirekitAuthError} If sign-in fails
	 */
	async signInWithFacebook(): Promise<OAuthSignInResult> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			const provider = createFacebookProvider();

			const result = await signInWithPopup(this.auth, provider);
			await this.updateUserInFirestore(result.user);

			const userProfile = this.mapFirebaseUserToProfile(result.user);
			const additionalUserInfo = getAdditionalUserInfo(result);
			const isNewUser = additionalUserInfo?.isNewUser ?? false;

			return {
				success: true,
				user: userProfile,
				method: 'facebook',
				timestamp: new Date(),
				isNewUser,
				provider: 'facebook'
			};
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	/**
	 * Signs in user with Apple popup
	 * @returns {Promise<OAuthSignInResult>} Promise resolving to OAuth sign-in result
	 * @throws {FirekitAuthError} If sign-in fails
	 */
	async signInWithApple(): Promise<OAuthSignInResult> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			const provider = createAppleProvider();

			const result = await signInWithPopup(this.auth, provider);
			await this.updateUserInFirestore(result.user);

			const userProfile = this.mapFirebaseUserToProfile(result.user);
			const additionalUserInfo = getAdditionalUserInfo(result);
			const isNewUser = additionalUserInfo?.isNewUser ?? false;

			return {
				success: true,
				user: userProfile,
				method: 'apple',
				timestamp: new Date(),
				isNewUser,
				provider: 'apple'
			};
		} catch (error: any) {
			this.handleAuthError(error);
		} finally {
			this.authState.loading = false;
			this.notifyStateListeners();
		}
	}

	/**
	 * Signs in user anonymously
	 * @returns {Promise<SignInResult>} Promise resolving to sign-in result
	 * @throws {FirekitAuthError} If sign-in fails
	 *
	 * @example
	 * ```typescript
	 * const result = await firekitAuth.signInAnonymously();
	 * console.log("Anonymous user:", result.user.uid);
	 * console.log("Is new user:", result.isNewUser);
	 * ```
	 */
	async signInAnonymously(): Promise<SignInResult> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		try {
			this.authState.loading = true;
			this.notifyStateListeners();

			const result = await firebaseSignInAnonymously(this.auth);
			await this.updateUserInFirestore(result.user);

			const userProfile = this.mapFirebaseUserToProfile(result.user);
			const additionalUserInfo = getAdditionalUserInfo(result);
			const isNewUser = additionalUserInfo?.isNewUser ?? false;

			return {
				success: true,
				user: userProfile,
				method: 'anonymous',
				timestamp: new Date(),
				isNewUser
			};
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
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

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
				confirm: async (verificationCode: string): Promise<SignInResult> => {
					try {
						const userCredential = await confirmationResult.confirm(verificationCode);
						await this.updateUserInFirestore(userCredential.user);

						const userProfile = this.mapFirebaseUserToProfile(userCredential.user);
						const additionalUserInfo = getAdditionalUserInfo(userCredential);
						const isNewUser = additionalUserInfo?.isNewUser ?? false;

						return {
							success: true,
							user: userProfile,
							method: 'phone',
							timestamp: new Date(),
							isNewUser
						};
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
	 * @returns {Promise<RegistrationResult>} Promise resolving to registration result
	 * @throws {FirekitAuthError} If registration fails
	 *
	 * @example
	 * ```typescript
	 * const result = await firekitAuth.registerWithEmail(
	 *   "user@example.com",
	 *   "password123",
	 *   "John Doe"
	 * );
	 * console.log("Registered:", result.user.displayName);
	 * console.log("Email verification sent:", result.emailVerificationSent);
	 * ```
	 */
	async registerWithEmail(
		email: string,
		password: string,
		displayName?: string,
		sendVerification: boolean = true
	): Promise<RegistrationResult> {
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

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

			const userProfile = this.mapFirebaseUserToProfile(user);

			return {
				success: true,
				user: userProfile,
				method: 'email',
				timestamp: new Date(),
				emailVerificationSent: sendVerification,
				requiresEmailVerification: !userProfile.emailVerified
			};
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
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

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
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

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
		if (!this.auth?.currentUser) {
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
		if (!this.auth?.currentUser) {
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
		if (!this.auth?.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}

		try {
			await updateEmail(this.auth.currentUser, newEmail);
			await this.updateUserInFirestore(this.auth.currentUser);
		} catch (error: any) {
			this.handleAuthError(error);
		}
	}

	/**
	 * Sends email verification to current user
	 * @returns {Promise<void>} Promise that resolves when verification email is sent
	 * @throws {FirekitAuthError} If sending fails
	 *
	 * @example
	 * ```typescript
	 * await firekitAuth.sendEmailVerification();
	 * ```
	 */
	async sendEmailVerification(): Promise<void> {
		if (!this.auth?.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}

		try {
			await sendEmailVerification(this.auth.currentUser);
		} catch (error: any) {
			this.handleAuthError(error);
		}
	}

	/**
	 * Reloads user to get updated data
	 * @returns {Promise<void>} Promise that resolves when user is reloaded
	 * @throws {FirekitAuthError} If reload fails
	 *
	 * @example
	 * ```typescript
	 * await firekitAuth.reloadUser();
	 * ```
	 */
	async reloadUser(): Promise<void> {
		if (!this.auth?.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}

		try {
			await reload(this.auth.currentUser);
			await this.updateUserInFirestore(this.auth.currentUser);
		} catch (error: any) {
			this.handleAuthError(error);
		}
	}

	/**
	 * Gets the current user's ID token
	 * @param {boolean} [forceRefresh=false] Whether to force token refresh
	 * @returns {Promise<string>} Promise resolving to ID token
	 * @throws {FirekitAuthError} If getting token fails
	 *
	 * @example
	 * ```typescript
	 * const token = await firekitAuth.getIdToken();
	 * ```
	 */
	async getIdToken(forceRefresh: boolean = false): Promise<string> {
		if (!this.auth?.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}

		try {
			return await getIdToken(this.auth.currentUser, forceRefresh);
		} catch (error: any) {
			this.handleAuthError(error);
		}
	}

	/**
	 * Reauthenticates user with current password
	 * @private
	 */
	private async reauthenticateUser(currentPassword: string): Promise<void> {
		if (!this.auth?.currentUser || !this.auth.currentUser.email) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user with email found.');
		}

		try {
			const credential = EmailAuthProvider.credential(this.auth.currentUser.email, currentPassword);
			await reauthenticateWithCredential(this.auth.currentUser, credential);
		} catch (error: any) {
			this.handleAuthError(error);
		}
	}

	/**
	 * Deletes user account
	 * @param {string} [currentPassword] Current password for reauthentication
	 * @returns {Promise<AccountDeletionResult>} Promise resolving to deletion result
	 *
	 * @example
	 * ```typescript
	 * const result = await firekitAuth.deleteAccount("currentPassword123");
	 * if (result.success) {
	 *   console.log("Account deleted successfully");
	 * } else {
	 *   console.error("Deletion failed:", result.message);
	 * }
	 * ```
	 */
	async deleteAccount(currentPassword?: string): Promise<AccountDeletionResult> {
		if (!this.auth?.currentUser) {
			return {
				success: false,
				message: 'No authenticated user found.'
			};
		}

		try {
			const user = this.auth.currentUser;

			// Reauthenticate if password provided
			if (currentPassword) {
				await this.reauthenticateUser(currentPassword);
			}

			// Delete user data from Firestore first (if available)
			if (this.firestore) {
				try {
					const userRef = doc(this.firestore, 'users', user.uid);
					await setDoc(userRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
				} catch (firestoreError) {
					console.warn('Failed to update Firestore before account deletion:', firestoreError);
				}
			}

			// Delete the user account
			await deleteUser(user);

			return {
				success: true,
				message: 'Account successfully deleted.'
			};
		} catch (error: any) {
			return {
				success: false,
				message: error.message || 'Failed to delete account.'
			};
		}
	}

	/**
	 * Signs out the current user
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
		if (!this.auth) {
			throw new Error('Auth instance not available');
		}

		try {
			// Set presence offline before signing out
			try {
				if (firekitPresence.initialized) {
					await firekitPresence.setPresence('offline');
				}
			} catch (presenceError) {
				console.warn('Failed to set presence offline during sign out:', presenceError);
			}

			// Clear reCAPTCHA verifiers
			this.recaptchaVerifiers.forEach((verifier) => verifier.clear());
			this.recaptchaVerifiers.clear();

			await signOut(this.auth);
		} catch (error: any) {
			this.handleAuthError(error);
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
		return this.authState.user !== null && !this.authState.user.isAnonymous;
	}

	/**
	 * Checks if user is anonymous
	 * @returns {boolean} True if user is anonymous
	 */
	isAnonymous(): boolean {
		return this.authState.user?.isAnonymous ?? false;
	}

	/**
	 * Checks if user's email is verified
	 * @returns {boolean} True if email is verified
	 */
	isEmailVerified(): boolean {
		return this.authState.user?.emailVerified ?? false;
	}

	/**
	 * Gets user's email address
	 * @returns {string | null} User's email or null
	 */
	getUserEmail(): string | null {
		return this.authState.user?.email ?? null;
	}

	/**
	 * Gets user's display name
	 * @returns {string | null} User's display name or null
	 */
	getUserDisplayName(): string | null {
		return this.authState.user?.displayName ?? null;
	}

	/**
	 * Gets user's photo URL
	 * @returns {string | null} User's photo URL or null
	 */
	getUserPhotoURL(): string | null {
		return this.authState.user?.photoURL ?? null;
	}

	/**
	 * Gets user's unique ID
	 * @returns {string | null} User's UID or null
	 */
	getUserId(): string | null {
		return this.authState.user?.uid ?? null;
	}

	/**
	 * Cleans up resources and listeners
	 * @returns {Promise<void>} Promise that resolves when cleanup completes
	 */
	async cleanup(): Promise<void> {
		// Clear reCAPTCHA verifiers
		this.recaptchaVerifiers.forEach((verifier) => verifier.clear());
		this.recaptchaVerifiers.clear();

		// Clear state listeners
		this.stateListeners.clear();
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
