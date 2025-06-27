import type { User } from 'firebase/auth';
import type { UserProfile } from '../types/auth.js';

/**
 * Maps Firebase User to UserProfile interface
 * @param {User} user Firebase user object
 * @returns {UserProfile} Mapped user profile
 */
export function mapFirebaseUserToProfile(user: User): UserProfile {
	return {
		uid: user.uid,
		email: user.email,
		displayName: user.displayName,
		photoURL: user.photoURL,
		phoneNumber: user.phoneNumber,
		emailVerified: user.emailVerified,
		isAnonymous: user.isAnonymous,
		providerId: user.providerId,
		metadata: {
			creationTime: user.metadata.creationTime,
			lastSignInTime: user.metadata.lastSignInTime
		},
		providerData: user.providerData.map((provider) => ({
			providerId: provider.providerId,
			uid: provider.uid,
			displayName: provider.displayName,
			email: provider.email,
			phoneNumber: provider.phoneNumber,
			photoURL: provider.photoURL
		}))
	};
}
