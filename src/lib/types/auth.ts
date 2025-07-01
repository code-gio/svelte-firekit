/**
 * @fileoverview Authentication types and interfaces for FirekitAuth
 * @module AuthTypes
 * @version 1.0.0
 */

/**
 * User profile interface with all Firebase user properties
 */
export interface UserProfile {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
	phoneNumber: string | null;
	emailVerified: boolean;
	isAnonymous: boolean;
	providerId: string;
	metadata: {
		creationTime?: string;
		lastSignInTime?: string;
	};
	providerData: Array<{
		providerId: string;
		uid: string;
		displayName: string | null;
		email: string | null;
		phoneNumber: string | null;
		photoURL: string | null;
	}>;
	customClaims?: Record<string, any>;
}

/**
 * Authentication state interface
 */
export interface AuthState {
	user: UserProfile | null;
	loading: boolean;
	initialized: boolean;
}

/**
 * Base authentication result interface
 */
export interface AuthResult {
	success: boolean;
	user: UserProfile;
	method: AuthMethodType;
	timestamp: Date;
	additionalData?: Record<string, any>;
}

/**
 * Sign-in result interface
 */
export interface SignInResult extends AuthResult {
	isNewUser: boolean;
	requiresEmailVerification?: boolean;
	requiresPhoneVerification?: boolean;
}

/**
 * Registration result interface
 */
export interface RegistrationResult extends AuthResult {
	emailVerificationSent: boolean;
	requiresEmailVerification: boolean;
}

/**
 * OAuth sign-in result interface
 */
export interface OAuthSignInResult extends SignInResult {
	provider: OAuthProviderType;
	accessToken?: string;
	refreshToken?: string;
}

/**
 * Phone verification result interface
 */
export interface PhoneVerificationResult {
	verificationId: string;
	confirm: (code: string) => Promise<SignInResult>;
}

/**
 * Password update result interface
 */
export interface PasswordUpdateResult {
	success: boolean;
	message: string;
	code?: string;
}

/**
 * Account deletion result interface
 */
export interface AccountDeletionResult {
	success: boolean;
	message: string;
}

/**
 * User registration data interface
 */
export interface UserRegistrationData {
	email: string;
	password: string;
	displayName?: string;
	photoURL?: string;
}

/**
 * User profile update data interface
 */
export interface UserProfileUpdateData {
	displayName?: string;
	photoURL?: string;
}

/**
 * Profile update result interface
 */
export interface ProfileUpdateResult {
	success: boolean;
	user: UserProfile;
	updatedFields: string[];
	message: string;
}

/**
 * Email verification result interface
 */
export interface EmailVerificationResult {
	success: boolean;
	message: string;
	emailSent: boolean;
}

/**
 * Password reset result interface
 */
export interface PasswordResetResult {
	success: boolean;
	message: string;
	emailSent: boolean;
}

/**
 * OAuth provider types
 */
export type OAuthProviderType =
	| 'google'
	| 'facebook'
	| 'apple'
	| 'microsoft'
	| 'github'
	| 'twitter';

/**
 * Authentication method types
 */
export type AuthMethodType =
	| 'email'
	| 'phone'
	| 'google'
	| 'facebook'
	| 'apple'
	| 'microsoft'
	| 'github'
	| 'twitter'
	| 'anonymous';

/**
 * Authentication event types
 */
export type AuthEventType =
	| 'signIn'
	| 'signOut'
	| 'signUp'
	| 'passwordReset'
	| 'emailVerification'
	| 'profileUpdate'
	| 'accountDeletion'
	| 'error';

/**
 * Authentication event data interface
 */
export interface AuthEventData {
	type: AuthEventType;
	user?: UserProfile | null;
	method?: AuthMethodType;
	error?: FirekitAuthError;
	timestamp: Date;
}

/**
 * Authentication configuration interface
 */
export interface AuthConfig {
	/** Enable automatic Firestore user data sync */
	enableFirestoreSync?: boolean;
	/** Custom Firestore collection path for users */
	usersCollectionPath?: string;
	/** Enable email verification on registration */
	requireEmailVerification?: boolean;
	/** Custom error message overrides */
	errorMessages?: Partial<Record<AuthErrorCode, string>>;
	/** Enable analytics tracking */
	enableAnalytics?: boolean;
}

/**
 * Authentication error codes enum
 */
export enum AuthErrorCode {
	EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
	INVALID_EMAIL = 'auth/invalid-email',
	USER_NOT_FOUND = 'auth/user-not-found',
	WRONG_PASSWORD = 'auth/wrong-password',
	WEAK_PASSWORD = 'auth/weak-password',
	TOO_MANY_REQUESTS = 'auth/too-many-requests',
	POPUP_CLOSED = 'auth/popup-closed-by-user',
	NETWORK_REQUEST_FAILED = 'auth/network-request-failed',
	USER_DISABLED = 'auth/user-disabled',
	OPERATION_NOT_ALLOWED = 'auth/operation-not-allowed',
	INVALID_VERIFICATION_CODE = 'auth/invalid-verification-code',
	INVALID_VERIFICATION_ID = 'auth/invalid-verification-id',
	REQUIRES_RECENT_LOGIN = 'auth/requires-recent-login',
	EXPIRED_ACTION_CODE = 'auth/expired-action-code',
	INVALID_ACTION_CODE = 'auth/invalid-action-code',
	MISSING_EMAIL = 'auth/missing-email',
	MISSING_PASSWORD = 'auth/missing-password',
	INVALID_PHONE_NUMBER = 'auth/invalid-phone-number',
	MISSING_PHONE_NUMBER = 'auth/missing-phone-number',
	QUOTA_EXCEEDED = 'auth/quota-exceeded',
	APP_NOT_AUTHORIZED = 'auth/app-not-authorized',
	KEYBOARD_NOT_SUPPORTED = 'auth/keychain-error',
	INTERNAL_ERROR = 'auth/internal-error'
}

/**
 * Custom authentication error class
 */
export class FirekitAuthError extends Error {
	constructor(
		public code: AuthErrorCode | string,
		message: string,
		public originalError?: any
	) {
		super(message);
		this.name = 'FirekitAuthError';
	}

	/**
	 * Get user-friendly error message
	 */
	getFriendlyMessage(): string {
		switch (this.code) {
			case AuthErrorCode.EMAIL_ALREADY_IN_USE:
				return 'An account with this email already exists.';
			case AuthErrorCode.INVALID_EMAIL:
				return 'Please enter a valid email address.';
			case AuthErrorCode.USER_NOT_FOUND:
				return 'No account found with this email address.';
			case AuthErrorCode.WRONG_PASSWORD:
				return 'Incorrect password. Please try again.';
			case AuthErrorCode.WEAK_PASSWORD:
				return 'Password should be at least 6 characters long.';
			case AuthErrorCode.TOO_MANY_REQUESTS:
				return 'Too many failed attempts. Please try again later.';
			case AuthErrorCode.POPUP_CLOSED:
				return 'Sign-in was cancelled. Please try again.';
			case AuthErrorCode.NETWORK_REQUEST_FAILED:
				return 'Network error. Please check your connection.';
			case AuthErrorCode.USER_DISABLED:
				return 'This account has been disabled.';
			case AuthErrorCode.REQUIRES_RECENT_LOGIN:
				return 'Please sign in again to complete this action.';
			case AuthErrorCode.EXPIRED_ACTION_CODE:
				return 'This action code has expired. Please request a new one.';
			case AuthErrorCode.INVALID_ACTION_CODE:
				return 'Invalid action code. Please check and try again.';
			case AuthErrorCode.MISSING_EMAIL:
				return 'Email address is required.';
			case AuthErrorCode.MISSING_PASSWORD:
				return 'Password is required.';
			case AuthErrorCode.INVALID_PHONE_NUMBER:
				return 'Please enter a valid phone number.';
			case AuthErrorCode.MISSING_PHONE_NUMBER:
				return 'Phone number is required.';
			case AuthErrorCode.QUOTA_EXCEEDED:
				return 'SMS quota exceeded. Please try again later.';
			case AuthErrorCode.APP_NOT_AUTHORIZED:
				return 'This app is not authorized to use Firebase Authentication.';
			case AuthErrorCode.INTERNAL_ERROR:
				return 'An internal error occurred. Please try again.';
			default:
				return this.message;
		}
	}

	/**
	 * Check if error is retryable
	 */
	isRetryable(): boolean {
		const retryableCodes = [
			AuthErrorCode.NETWORK_REQUEST_FAILED,
			AuthErrorCode.TOO_MANY_REQUESTS,
			AuthErrorCode.QUOTA_EXCEEDED,
			AuthErrorCode.INTERNAL_ERROR
		];
		return retryableCodes.includes(this.code as AuthErrorCode);
	}
}
