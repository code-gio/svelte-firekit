// User utilities
export { mapFirebaseUserToProfile } from './user.js';

// Firestore utilities
export { updateUserInFirestore } from './firestore.js';

// Error handling utilities
export { createAuthError, validateCurrentUser, handleAuthError } from './errors.js';

// Provider utilities
export { createGoogleProvider, createFacebookProvider, createAppleProvider } from './providers.js';
