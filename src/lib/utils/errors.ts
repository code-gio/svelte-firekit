import { FirekitAuthError, AuthErrorCode } from '../types/auth.js';

/**
 * Creates a standardized FirekitAuthError with context
 * @param {any} error Original error object
 * @param {string} context Context of the operation that failed
 * @returns {FirekitAuthError} Standardized error object
 */
export function createAuthError(error: any, context: string): FirekitAuthError {
	const code = error.code as AuthErrorCode;
	return new FirekitAuthError(
		code || `${context}-failed`,
		`Failed to ${context}: ${error.message}`
	);
}

/**
 * Validates that a current user exists and returns the user
 * @param {any} auth Firebase auth instance
 * @returns {any} Current Firebase user
 * @throws {FirekitAuthError} If no authenticated user found
 */
export function validateCurrentUser(auth: any): any {
	const user = auth.currentUser;
	if (!user) {
		throw new FirekitAuthError(AuthErrorCode.USER_NOT_FOUND, 'No authenticated user found.');
	}
	return user;
}

/**
 * Handles Firebase authentication errors and throws FirekitAuthError with friendly message
 * @param {any} error Original Firebase error
 * @returns {never} Never returns, always throws
 */
export function handleAuthError(error: any): never {
	const code = error.code as AuthErrorCode;
	const firekitError = new FirekitAuthError(code, error.message, error);

	// Use the existing getFriendlyMessage method from FirekitAuthError
	throw new FirekitAuthError(code, firekitError.getFriendlyMessage(), error);
}
