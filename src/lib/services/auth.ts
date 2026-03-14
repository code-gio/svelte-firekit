import {
	EmailAuthProvider,
	PhoneAuthProvider,
	RecaptchaVerifier,
	SAMLAuthProvider,
	OAuthProvider,
	signInWithEmailAndPassword,
	signInWithPopup,
	signInWithRedirect,
	getRedirectResult,
	signInWithCustomToken as firebaseSignInWithCustomToken,
	signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
	signInWithCredential,
	signInAnonymously as firebaseSignInAnonymously,
	createUserWithEmailAndPassword,
	signOut as firebaseSignOut,
	sendPasswordResetEmail,
	confirmPasswordReset as firebaseConfirmPasswordReset,
	sendEmailVerification,
	updateProfile,
	updateEmail,
	updatePassword,
	reauthenticateWithCredential,
	deleteUser,
	reload,
	getIdToken,
	getAdditionalUserInfo,
	multiFactor,
	PhoneMultiFactorGenerator,
	getMultiFactorResolver,
	type User,
	type MultiFactorError,
	type MultiFactorResolver,
	type MultiFactorInfo
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseService } from '../firebase.js';
import {
	type UserProfile,
	type SignInResult,
	type RegistrationResult,
	type OAuthSignInResult,
	type PhoneVerificationResult,
	type PasswordUpdateResult,
	type AccountDeletionResult,
	AuthErrorCode,
	FirekitAuthError
} from '../types/auth.js';
import {
	mapFirebaseUserToProfile,
	updateUserInFirestore,
	createGoogleProvider,
	createFacebookProvider,
	createAppleProvider,
	createGithubProvider,
	createTwitterProvider,
	createMicrosoftProvider,
	handleAuthError
} from '../utils/index.js';

/**
 * Firebase Authentication service.
 * Handles all auth operations — sign in, register, sign out, profile updates.
 * Reactive state (loading, user, isAuthenticated) lives in `firekitUser`.
 *
 * @example
 * import { firekitAuth } from 'svelte-firekit';
 * await firekitAuth.signInWithGoogle();
 * await firekitAuth.registerWithEmail('user@example.com', 'password', 'Jane Doe');
 * await firekitAuth.signOut();
 */
class FirekitAuth {
	private static instance: FirekitAuth;
	private auth: ReturnType<typeof firebaseService.getAuthInstance> | null = null;
	private firestore: ReturnType<typeof firebaseService.getDbInstance> | null = null;
	private recaptchaVerifiers = new Map<string, RecaptchaVerifier>();

	private constructor() {
		if (typeof window !== 'undefined') {
			this.bootstrap();
		}
	}

	static getInstance(): FirekitAuth {
		if (!FirekitAuth.instance) {
			FirekitAuth.instance = new FirekitAuth();
		}
		return FirekitAuth.instance;
	}

	private bootstrap(): void {
		try {
			this.auth = firebaseService.getAuthInstance();
			try {
				this.firestore = firebaseService.getDbInstance();
			} catch {
				this.firestore = null;
			}
		} catch {
			// Firebase not yet configured — services will be accessed lazily
		}
	}

	private getAuth() {
		if (!this.auth) {
			this.auth = firebaseService.getAuthInstance();
		}
		if (!this.auth) {
			throw new FirekitAuthError('auth/not-initialized', 'Firebase Auth is not initialized.');
		}
		return this.auth;
	}

	private async syncToFirestore(user: User): Promise<void> {
		if (!this.firestore) return;
		await updateUserInFirestore(this.firestore, user);
	}

	private profile(user: User): UserProfile {
		return mapFirebaseUserToProfile(user);
	}

	// ─── Sign-in ────────────────────────────────────────────────────────────────

	async signInWithEmail(email: string, password: string): Promise<SignInResult> {
		try {
			const cred = await signInWithEmailAndPassword(this.getAuth(), email, password);
			await this.syncToFirestore(cred.user);
			const profile = this.profile(cred.user);
			const isNewUser = getAdditionalUserInfo(cred)?.isNewUser ?? false;
			return {
				success: true,
				user: profile,
				method: 'email',
				timestamp: new Date(),
				isNewUser,
				requiresEmailVerification: !profile.emailVerified
			};
		} catch (error) {
			handleAuthError(error);
		}
	}

	async signInWithGoogle(): Promise<OAuthSignInResult> {
		return this.signInWithOAuth('google', createGoogleProvider());
	}

	async signInWithFacebook(): Promise<OAuthSignInResult> {
		return this.signInWithOAuth('facebook', createFacebookProvider());
	}

	async signInWithApple(): Promise<OAuthSignInResult> {
		return this.signInWithOAuth('apple', createAppleProvider());
	}

	async signInWithGithub(): Promise<OAuthSignInResult> {
		return this.signInWithOAuth('github', createGithubProvider());
	}

	async signInWithTwitter(): Promise<OAuthSignInResult> {
		return this.signInWithOAuth('twitter', createTwitterProvider());
	}

	async signInWithMicrosoft(): Promise<OAuthSignInResult> {
		return this.signInWithOAuth('microsoft', createMicrosoftProvider());
	}

	private async signInWithOAuth(
		provider: OAuthSignInResult['provider'],
		providerInstance: Parameters<typeof signInWithPopup>[1]
	): Promise<OAuthSignInResult> {
		try {
			const result = await signInWithPopup(this.getAuth(), providerInstance);
			await this.syncToFirestore(result.user);
			const profile = this.profile(result.user);
			const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
			return {
				success: true,
				user: profile,
				method: provider,
				timestamp: new Date(),
				isNewUser,
				provider
			};
		} catch (error) {
			handleAuthError(error);
		}
	}

	async signInAnonymously(): Promise<SignInResult> {
		try {
			const result = await firebaseSignInAnonymously(this.getAuth());
			await this.syncToFirestore(result.user);
			const profile = this.profile(result.user);
			const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
			return {
				success: true,
				user: profile,
				method: 'anonymous',
				timestamp: new Date(),
				isNewUser
			};
		} catch (error) {
			handleAuthError(error);
		}
	}

	async signInWithPhoneNumber(
		phoneNumber: string,
		recaptchaContainerId: string
	): Promise<PhoneVerificationResult> {
		const auth = this.getAuth();

		try {
			// Reuse or create the reCAPTCHA verifier for this container
			const existing = this.recaptchaVerifiers.get(recaptchaContainerId);
			if (existing) {
				existing.clear();
				this.recaptchaVerifiers.delete(recaptchaContainerId);
			}

			const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'normal' });
			this.recaptchaVerifiers.set(recaptchaContainerId, verifier);

			const confirmation = await firebaseSignInWithPhoneNumber(auth, phoneNumber, verifier);

			return {
				verificationId: confirmation.verificationId,
				confirm: async (code: string): Promise<SignInResult> => {
					try {
						const cred = await confirmation.confirm(code);
						await this.syncToFirestore(cred.user);
						const profile = this.profile(cred.user);
						const isNewUser = getAdditionalUserInfo(cred)?.isNewUser ?? false;
						return {
							success: true,
							user: profile,
							method: 'phone',
							timestamp: new Date(),
							isNewUser
						};
					} catch (error) {
						handleAuthError(error);
					} finally {
						verifier.clear();
						this.recaptchaVerifiers.delete(recaptchaContainerId);
					}
				}
			};
		} catch (error) {
			handleAuthError(error);
		}
	}

	// ─── Registration ────────────────────────────────────────────────────────────

	async registerWithEmail(
		email: string,
		password: string,
		displayName?: string,
		sendVerification = true
	): Promise<RegistrationResult> {
		try {
			const cred = await createUserWithEmailAndPassword(this.getAuth(), email, password);
			const { user } = cred;

			if (displayName) await updateProfile(user, { displayName });
			if (sendVerification) await sendEmailVerification(user);

			await this.syncToFirestore(user);
			const profile = this.profile(user);

			return {
				success: true,
				user: profile,
				method: 'email',
				timestamp: new Date(),
				emailVerificationSent: sendVerification,
				requiresEmailVerification: !profile.emailVerified
			};
		} catch (error) {
			handleAuthError(error);
		}
	}

	// ─── Sign-out ────────────────────────────────────────────────────────────────

	async signOut(): Promise<void> {
		try {
			this.recaptchaVerifiers.forEach((v) => v.clear());
			this.recaptchaVerifiers.clear();
			await firebaseSignOut(this.getAuth());
		} catch (error) {
			handleAuthError(error);
		}
	}

	// ─── Password ────────────────────────────────────────────────────────────────

	async sendPasswordReset(email: string): Promise<void> {
		try {
			await sendPasswordResetEmail(this.getAuth(), email);
		} catch (error) {
			handleAuthError(error);
		}
	}

	async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
		try {
			await firebaseConfirmPasswordReset(this.getAuth(), code, newPassword);
		} catch (error) {
			handleAuthError(error);
		}
	}

	async updatePassword(
		newPassword: string,
		currentPassword: string
	): Promise<PasswordUpdateResult> {
		const auth = this.getAuth();
		if (!auth.currentUser) {
			return { success: false, message: 'No authenticated user found.', code: 'auth/no-current-user' };
		}

		try {
			await this.reauthenticate(currentPassword);
			await updatePassword(auth.currentUser, newPassword);
			return { success: true, message: 'Password successfully updated.' };
		} catch (error) {
			const err = error as { code?: string; message?: string };
			const code = err.code as AuthErrorCode;
			return {
				success: false,
				code: code || 'unknown',
				message:
					code === AuthErrorCode.WRONG_PASSWORD
						? 'Current password is incorrect.'
						: (err.message ?? 'Failed to update password.')
			};
		}
	}

	// ─── Profile ─────────────────────────────────────────────────────────────────

	async updateUserProfile(profile: { displayName?: string; photoURL?: string }): Promise<void> {
		const auth = this.getAuth();
		if (!auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}
		try {
			await updateProfile(auth.currentUser, profile);
			await this.syncToFirestore(auth.currentUser);
		} catch (error) {
			handleAuthError(error);
		}
	}

	async updateEmail(newEmail: string): Promise<void> {
		const auth = this.getAuth();
		if (!auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}
		try {
			await updateEmail(auth.currentUser, newEmail);
			await this.syncToFirestore(auth.currentUser);
		} catch (error) {
			handleAuthError(error);
		}
	}

	async sendEmailVerification(): Promise<void> {
		const auth = this.getAuth();
		if (!auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}
		try {
			await sendEmailVerification(auth.currentUser);
		} catch (error) {
			handleAuthError(error);
		}
	}

	async reloadUser(): Promise<void> {
		const auth = this.getAuth();
		if (!auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}
		try {
			await reload(auth.currentUser);
			await this.syncToFirestore(auth.currentUser);
		} catch (error) {
			handleAuthError(error);
		}
	}

	async getIdToken(forceRefresh = false): Promise<string> {
		const auth = this.getAuth();
		if (!auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}
		try {
			return await getIdToken(auth.currentUser, forceRefresh);
		} catch (error) {
			handleAuthError(error);
		}
	}

	// ─── Account deletion ────────────────────────────────────────────────────────

	async deleteAccount(currentPassword?: string): Promise<AccountDeletionResult> {
		const auth = this.getAuth();
		if (!auth.currentUser) {
			return { success: false, message: 'No authenticated user found.' };
		}

		try {
			const user = auth.currentUser;

			if (currentPassword) await this.reauthenticate(currentPassword);

			// Soft-delete record in Firestore before removing auth
			if (this.firestore) {
				try {
					await setDoc(
						doc(this.firestore, 'users', user.uid),
						{ deleted: true, deletedAt: serverTimestamp() },
						{ merge: true }
					);
				} catch {
					// Non-blocking
				}
			}

			await deleteUser(user);
			return { success: true, message: 'Account successfully deleted.' };
		} catch (error) {
			const err = error as { message?: string };
			return { success: false, message: err.message ?? 'Failed to delete account.' };
		}
	}

	// ─── Reauthentication ────────────────────────────────────────────────────────

	async reauthenticate(currentPassword: string): Promise<void> {
		const auth = this.getAuth();
		if (!auth.currentUser?.email) {
			throw new FirekitAuthError(
				'auth/no-current-user',
				'No authenticated user with email found.'
			);
		}
		try {
			const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
			await reauthenticateWithCredential(auth.currentUser, credential);
		} catch (error) {
			handleAuthError(error);
		}
	}

	// ─── Custom token ────────────────────────────────────────────────────────────

	async signInWithCustomToken(token: string): Promise<SignInResult> {
		try {
			const cred = await firebaseSignInWithCustomToken(this.getAuth(), token);
			await this.syncToFirestore(cred.user);
			const profile = this.profile(cred.user);
			const isNewUser = getAdditionalUserInfo(cred)?.isNewUser ?? false;
			return {
				success: true,
				user: profile,
				method: 'custom',
				timestamp: new Date(),
				isNewUser
			};
		} catch (error) {
			handleAuthError(error);
		}
	}

	// ─── SAML / OIDC ─────────────────────────────────────────────────────────────

	/** Signs in with a SAML provider (popup). */
	async signInWithSAML(providerId: string): Promise<OAuthSignInResult> {
		return this.signInWithOAuth('saml', new SAMLAuthProvider(providerId));
	}

	/** Signs in with a SAML provider (redirect). Pair with `getRedirectResult()` on load. */
	async signInWithSAMLRedirect(providerId: string): Promise<void> {
		await signInWithRedirect(this.getAuth(), new SAMLAuthProvider(providerId));
	}

	/**
	 * Signs in with a generic OIDC/OAuth2 provider (popup).
	 * @param providerId  Firebase provider ID, e.g. `'oidc.my-provider'`
	 * @param scopes      Additional OAuth scopes to request.
	 */
	async signInWithOIDC(providerId: string, scopes: string[] = []): Promise<OAuthSignInResult> {
		const provider = new OAuthProvider(providerId);
		scopes.forEach((s) => provider.addScope(s));
		return this.signInWithOAuth('oidc', provider);
	}

	/** Signs in with a generic OIDC/OAuth2 provider (redirect). Pair with `getRedirectResult()` on load. */
	async signInWithOIDCRedirect(providerId: string, scopes: string[] = []): Promise<void> {
		const provider = new OAuthProvider(providerId);
		scopes.forEach((s) => provider.addScope(s));
		await signInWithRedirect(this.getAuth(), provider);
	}

	// ─── Redirect sign-in ────────────────────────────────────────────────────────

	async signInWithGoogleRedirect(): Promise<void> {
		await signInWithRedirect(this.getAuth(), createGoogleProvider());
	}

	async signInWithFacebookRedirect(): Promise<void> {
		await signInWithRedirect(this.getAuth(), createFacebookProvider());
	}

	async signInWithAppleRedirect(): Promise<void> {
		await signInWithRedirect(this.getAuth(), createAppleProvider());
	}

	async signInWithGithubRedirect(): Promise<void> {
		await signInWithRedirect(this.getAuth(), createGithubProvider());
	}

	async signInWithTwitterRedirect(): Promise<void> {
		await signInWithRedirect(this.getAuth(), createTwitterProvider());
	}

	async signInWithMicrosoftRedirect(): Promise<void> {
		await signInWithRedirect(this.getAuth(), createMicrosoftProvider());
	}

	/**
	 * Completes a redirect sign-in flow.
	 * Call this once on app load to pick up the result of a `signInWith*Redirect()` call.
	 * Returns null if no redirect sign-in is pending.
	 */
	async getRedirectResult(): Promise<OAuthSignInResult | null> {
		// Firebase returns provider IDs in the form 'google.com', 'github.com', etc.
		// Map them to our OAuthProviderType format.
		const PROVIDER_ID_MAP: Record<string, OAuthSignInResult['provider']> = {
			'google.com': 'google',
			'facebook.com': 'facebook',
			'apple.com': 'apple',
			'microsoft.com': 'microsoft',
			'github.com': 'github',
			'twitter.com': 'twitter'
		};
		try {
			const result = await getRedirectResult(this.getAuth());
			if (!result) return null;
			await this.syncToFirestore(result.user);
			const profile = this.profile(result.user);
			const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
			const rawId = result.providerId ?? '';
			const provider: OAuthSignInResult['provider'] =
				PROVIDER_ID_MAP[rawId] ??
				(rawId.startsWith('saml.') ? 'saml' : rawId.startsWith('oidc.') ? 'oidc' : 'google');
			return {
				success: true,
				user: profile,
				method: provider,
				timestamp: new Date(),
				isNewUser,
				provider
			};
		} catch (error) {
			handleAuthError(error);
		}
	}

	// ─── Multi-factor authentication ─────────────────────────────────────────────

	/**
	 * Starts phone MFA enrollment for the currently signed-in user.
	 * Returns a `verificationId` to pass to `completeMFAEnrollment()`.
	 */
	async startPhoneMFAEnrollment(
		phoneNumber: string,
		recaptchaContainerId: string
	): Promise<string> {
		const auth = this.getAuth();
		if (!auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}
		const existing = this.recaptchaVerifiers.get(recaptchaContainerId);
		if (existing) {
			existing.clear();
			this.recaptchaVerifiers.delete(recaptchaContainerId);
		}
		const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
		this.recaptchaVerifiers.set(recaptchaContainerId, verifier);

		const mfaUser = multiFactor(auth.currentUser);
		const session = await mfaUser.getSession();
		const phoneProvider = new PhoneAuthProvider(auth);
		return phoneProvider.verifyPhoneNumber({ phoneNumber, session }, verifier);
	}

	/**
	 * Completes phone MFA enrollment using the SMS code.
	 */
	async completeMFAEnrollment(
		verificationId: string,
		code: string,
		displayName?: string
	): Promise<void> {
		const auth = this.getAuth();
		if (!auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}
		const credential = PhoneAuthProvider.credential(verificationId, code);
		const assertion = PhoneMultiFactorGenerator.assertion(credential);
		await multiFactor(auth.currentUser).enroll(assertion, displayName);
	}

	/** Returns all enrolled MFA factors for the currently signed-in user. */
	getMFAEnrolledFactors(): MultiFactorInfo[] {
		const auth = this.getAuth();
		if (!auth.currentUser) return [];
		return multiFactor(auth.currentUser).enrolledFactors;
	}

	/** Unenrolls a specific MFA factor by its UID or `MultiFactorInfo` object. */
	async unenrollMFA(factorUidOrInfo: string | MultiFactorInfo): Promise<void> {
		const auth = this.getAuth();
		if (!auth.currentUser) {
			throw new FirekitAuthError('auth/no-current-user', 'No authenticated user found.');
		}
		await multiFactor(auth.currentUser).unenroll(factorUidOrInfo);
	}

	/**
	 * Gets the `MultiFactorResolver` from a sign-in error that requires MFA.
	 * Catch this error from any `signIn*` method when MFA is required.
	 */
	getMFAResolver(error: MultiFactorError): MultiFactorResolver {
		return getMultiFactorResolver(this.getAuth(), error);
	}

	/**
	 * Sends an SMS code to complete an MFA sign-in challenge.
	 * Returns a `verificationId` to pass to `completeMFASignIn()`.
	 *
	 * @param resolver       From `getMFAResolver(error)`.
	 * @param factorIndex    Index into `resolver.hints` (default 0).
	 * @param recaptchaContainerId  DOM container ID for reCAPTCHA (required for phone MFA).
	 */
	async startMFASignIn(
		resolver: MultiFactorResolver,
		factorIndex = 0,
		recaptchaContainerId: string
	): Promise<string> {
		const auth = this.getAuth();
		const existing = this.recaptchaVerifiers.get(recaptchaContainerId);
		if (existing) {
			existing.clear();
			this.recaptchaVerifiers.delete(recaptchaContainerId);
		}
		const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
		this.recaptchaVerifiers.set(recaptchaContainerId, verifier);

		const hint = resolver.hints[factorIndex];
		const phoneProvider = new PhoneAuthProvider(auth);
		return phoneProvider.verifyPhoneNumber(
			{ multiFactorHint: hint, session: resolver.session },
			verifier
		);
	}

	/**
	 * Completes MFA sign-in using the SMS code.
	 */
	async completeMFASignIn(
		resolver: MultiFactorResolver,
		verificationId: string,
		code: string
	): Promise<SignInResult> {
		const credential = PhoneAuthProvider.credential(verificationId, code);
		const assertion = PhoneMultiFactorGenerator.assertion(credential);
		try {
			const cred = await resolver.resolveSignIn(assertion);
			await this.syncToFirestore(cred.user);
			const profile = this.profile(cred.user);
			return {
				success: true,
				user: profile,
				method: 'phone',
				timestamp: new Date(),
				isNewUser: false
			};
		} catch (error) {
			handleAuthError(error);
		}
	}

	// ─── Utility getters ─────────────────────────────────────────────────────────

	getCurrentUser(): User | null {
		return this.auth?.currentUser ?? null;
	}

	isAuthenticated(): boolean {
		return this.auth?.currentUser !== null && !this.auth?.currentUser?.isAnonymous;
	}

	isAnonymous(): boolean {
		return this.auth?.currentUser?.isAnonymous ?? false;
	}

	isEmailVerified(): boolean {
		return this.auth?.currentUser?.emailVerified ?? false;
	}

	async cleanup(): Promise<void> {
		this.recaptchaVerifiers.forEach((v) => v.clear());
		this.recaptchaVerifiers.clear();
	}
}

export const firekitAuth = FirekitAuth.getInstance();
