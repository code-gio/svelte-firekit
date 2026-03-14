import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';

/**
 * Upserts user profile data into the `users/{uid}` Firestore document.
 * Uses merge so existing fields not present in User are preserved.
 * Silently swallows errors so auth operations are never blocked by Firestore failures.
 */
export async function updateUserInFirestore(firestore: Firestore, user: User): Promise<void> {
	try {
		const userRef = doc(firestore, 'users', user.uid);
		await setDoc(
			userRef,
			{
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
			},
			{ merge: true }
		);
	} catch {
		// Intentionally silent — never block auth flows due to a Firestore write failure
	}
}
