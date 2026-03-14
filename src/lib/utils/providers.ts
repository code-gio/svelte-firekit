import {
	GoogleAuthProvider,
	FacebookAuthProvider,
	OAuthProvider,
	GithubAuthProvider,
	TwitterAuthProvider
} from 'firebase/auth';

export function createGoogleProvider(): GoogleAuthProvider {
	const provider = new GoogleAuthProvider();
	provider.addScope('email');
	provider.addScope('profile');
	return provider;
}

export function createFacebookProvider(): FacebookAuthProvider {
	const provider = new FacebookAuthProvider();
	provider.addScope('email');
	return provider;
}

export function createAppleProvider(): OAuthProvider {
	const provider = new OAuthProvider('apple.com');
	provider.addScope('email');
	provider.addScope('name');
	return provider;
}

export function createGithubProvider(): GithubAuthProvider {
	const provider = new GithubAuthProvider();
	provider.addScope('user:email');
	return provider;
}

export function createTwitterProvider(): TwitterAuthProvider {
	return new TwitterAuthProvider();
}

export function createMicrosoftProvider(): OAuthProvider {
	const provider = new OAuthProvider('microsoft.com');
	provider.addScope('user.read');
	return provider;
}
