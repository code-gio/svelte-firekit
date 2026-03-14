import { FirekitAuthError, AuthErrorCode } from '../types/auth.js';

/**
 * Creates a standardized FirekitAuthError from a raw Firebase error.
 */
export function createAuthError(error: unknown, context: string): FirekitAuthError {
	const firebaseError = error as { code?: string; message?: string };
	const code = (firebaseError.code as AuthErrorCode) || (`${context}-failed` as AuthErrorCode);
	return new FirekitAuthError(
		code,
		`Failed to ${context}: ${firebaseError.message ?? 'unknown error'}`
	);
}

/**
 * Validates that a current user exists and returns it.
 * @throws {FirekitAuthError} If no authenticated user found.
 */
export function validateCurrentUser(auth: { currentUser: unknown }): NonNullable<unknown> {
	const user = auth.currentUser;
	if (!user) {
		throw new FirekitAuthError(AuthErrorCode.USER_NOT_FOUND, 'No authenticated user found.');
	}
	return user;
}

/**
 * Converts any Firebase auth error into a FirekitAuthError with a friendly message.
 * @throws {FirekitAuthError} Always throws.
 */
export function handleAuthError(error: unknown): never {
	const firebaseError = error as { code?: string; message?: string };
	const code = (firebaseError.code as AuthErrorCode) || AuthErrorCode.INTERNAL_ERROR;
	const firekitError = new FirekitAuthError(code, firebaseError.message ?? 'Unknown error', error);
	throw new FirekitAuthError(code, firekitError.getFriendlyMessage(), error);
}
