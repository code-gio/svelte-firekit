import { GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';

/**
 * Creates a configured Google Auth provider
 * @returns {GoogleAuthProvider} Configured Google provider
 */
export function createGoogleProvider(): GoogleAuthProvider {
	const provider = new GoogleAuthProvider();
	provider.addScope('email');
	provider.addScope('profile');
	return provider;
}

/**
 * Creates a configured Facebook Auth provider
 * @returns {FacebookAuthProvider} Configured Facebook provider
 */
export function createFacebookProvider(): FacebookAuthProvider {
	const provider = new FacebookAuthProvider();
	provider.addScope('email');
	return provider;
}

/**
 * Creates a configured Apple Auth provider
 * @returns {OAuthProvider} Configured Apple provider
 */
export function createAppleProvider(): OAuthProvider {
	const provider = new OAuthProvider('apple.com');
	provider.addScope('email');
	provider.addScope('name');
	return provider;
}
