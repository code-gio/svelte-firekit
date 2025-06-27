import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';

/**
 * Updates user data in Firestore with comprehensive profile information
 * @param {Firestore} firestore Firestore instance
 * @param {User} user Firebase user object
 * @returns {Promise<void>} Promise that resolves when update completes
 */
export async function updateUserInFirestore(firestore: Firestore, user: User): Promise<void> {
	try {
		const userRef = doc(firestore, 'users', user.uid);
		const userData = {
			uid: user.uid,
			email: user.email,
			emailVerified: user.emailVerified,
			displayName: user.displayName,
			photoURL: user.photoURL,
			phoneNumber: user.phoneNumber,
			isAnonymous: user.isAnonymous,
			providerId: user.providerId,
			providerData: user.providerData,
			metadata: {
				creationTime: user.metadata.creationTime,
				lastSignInTime: user.metadata.lastSignInTime
			},
			lastUpdated: serverTimestamp()
		};
		await setDoc(userRef, userData, { merge: true });
	} catch (error) {
		console.error('Failed to update user in Firestore:', error);
		// Don't throw here to avoid blocking auth operations
	}
}
