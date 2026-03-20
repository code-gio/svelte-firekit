// ─── Configuration ───────────────────────────────────────────────────────────
export { initFirekit, getFirekitConfig, isFirekitConfigured } from './config.js';

// ─── Context helpers ──────────────────────────────────────────────────────────
export {
	getFirebaseAppContext,
	getAuthContext,
	getFirestoreContext,
	getStorageContext,
	getRTDBContext,
	getFunctionsContext,
	getAppCheckContext,
	getAnalyticsContext,
	getMessagingContext
} from './context.js';

// ─── Firebase service singleton ──────────────────────────────────────────────
export { firebaseService } from './firebase.js';

// ─── Auth & User services ────────────────────────────────────────────────────
export { firekitAuth } from './services/auth.js';
export { firekitUser } from './services/user.svelte.js';
export type { ExtendedUserData } from './services/user.svelte.js';
export type { MFAEnrollmentResult, MFAChallengeResult } from './types/auth.js';

// ─── App Check ───────────────────────────────────────────────────────────────
export { firekitAppCheck } from './services/app-check.svelte.js';
export {
	ReCaptchaV3Provider,
	ReCaptchaEnterpriseProvider,
	CustomProvider
} from './services/app-check.svelte.js';
export type { AppCheckOptions, AppCheckTokenResult } from './services/app-check.svelte.js';

// ─── Firestore ────────────────────────────────────────────────────────────────
export {
	FirekitDoc,
	firekitDoc,
	firekitDocOnce,
	firekitDocWithMetadata,
	type FirekitDocOptions
} from './services/document.svelte.js';
export {
	FirekitCollection,
	FirekitCollectionGroup,
	FirekitQueryBuilder,
	firekitCollection,
	firekitCollectionOnce,
	firekitCollectionGroup,
	type FirekitCollectionOptions
} from './services/collection.svelte.js';
export {
	firekitMutations,
	type FirekitBatchOp,
	type FirekitBatchResult
} from './services/mutations.js';

// ─── Firebase AI ──────────────────────────────────────────────────────────────
export {
	FirekitGenerate,
	FirekitStream,
	FirekitChat,
	firekitGenerate,
	firekitStream,
	firekitChat,
	textPart,
	imagePart,
	imageUrlPart,
	GoogleAIBackend,
	VertexAIBackend,
	type FirekitAIOptions,
	type ChatMessage,
	type AIBackendType,
	type Part,
	type Content,
	type GenerationConfig,
	type SafetySetting
} from './services/ai.svelte.js';

// ─── Realtime Database ────────────────────────────────────────────────────────
export {
	FirekitNode,
	FirekitNodeList,
	firekitNode,
	firekitNodeList,
	rtdbServerTimestamp,
	rtdbIncrement
} from './services/realtime.svelte.js';

// ─── Storage ──────────────────────────────────────────────────────────────────
export {
	FirekitDownloadUrl,
	FirekitStorageList,
	FirekitUploadTask,
	firekitDownloadUrl,
	firekitStorageList,
	firekitUploadTask,
	deleteFile,
	getFileMetadata,
	updateFileMetadata,
	type UploadState,
	type SettableMetadata
} from './services/storage.svelte.js';

// ─── Cloud Functions ──────────────────────────────────────────────────────────
export {
	FirekitCallable,
	FirekitCallableFromURL,
	firekitCallable,
	firekitCallableFromURL
} from './services/callable.js';

// ─── Presence ─────────────────────────────────────────────────────────────────
export { firekitPresence } from './services/presence.svelte.js';

// ─── Remote Config ────────────────────────────────────────────────────────────
export {
	FirekitRemoteConfig,
	firekitRemoteConfig,
	type FirekitRemoteConfigOptions
} from './services/remote-config.svelte.js';

// ─── Performance ──────────────────────────────────────────────────────────────
export { firekitPerformance, type PerformanceTrace } from './services/performance.js';

// ─── Messaging ────────────────────────────────────────────────────────────────
export { firekitMessaging, type MessagePayload } from './services/messaging.svelte.js';

// ─── Analytics ────────────────────────────────────────────────────────────────
export { firekitAnalytics } from './services/analytics.js';

// ─── Network / Offline ───────────────────────────────────────────────────────
export { firekitNetwork } from './services/network.svelte.js';


// ─── Firestore bundles ────────────────────────────────────────────────────────
export { loadFirestoreBundle, getNamedQuery } from './services/bundles.js';

// ─── Components ──────────────────────────────────────────────────────────────
export { default as FirebaseApp } from './components/FirebaseApp.svelte';
export { default as SignedIn } from './components/SignedIn.svelte';
export { default as SignedOut } from './components/SignedOut.svelte';
export { default as AuthGuard } from './components/AuthGuard.svelte';
export { default as CustomGuard } from './components/CustomGuard.svelte';
export { default as Doc } from './components/Doc.svelte';
export { default as Collection } from './components/Collection.svelte';
export { default as Node } from './components/Node.svelte';
export { default as DownloadURL } from './components/DownloadURL.svelte';
export { default as UploadTask } from './components/UploadTask.svelte';
export { default as NetworkStatus } from './components/NetworkStatus.svelte';

// ─── Types ───────────────────────────────────────────────────────────────────
export * from './types/index.js';

// ─── Utilities ───────────────────────────────────────────────────────────────
export * from './utils/index.js';
