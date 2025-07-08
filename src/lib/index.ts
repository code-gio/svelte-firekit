// types
export * from './types/index.js';

// Firebase config
export { firebaseConfig } from './config.js';
export { firebaseService } from './firebase.js';

// auth services
export { firekitUser } from './services/user.svelte.js';
export { firekitAuth } from './services/auth.js';
export { firekitPresence } from './services/presence.svelte.js';

// analytics services
export { firekitAnalytics } from './services/analytics.js';

// document services
export { firekitDoc, firekitDocOnce, firekitDocWithMetadata } from './services/document.svelte.js';

// mutations services
export { firekitDocMutations } from './services/mutations.js';

// collection services
export {
	firekitCollection,
	firekitCollectionGroup,
	firekitCollectionOnce
} from './services/collection.svelte.js';

// realtime services
export { firekitRealtimeDB, firekitRealtimeList } from './services/realtime.svelte.js';

// storage services
export {
	firekitStorageList,
	firekitUploadTask,
	firekitDownloadUrl
} from './services/storage.svelte.js';

// Components
export { default as FirebaseApp } from './components/firekit/firebase-app.svelte';
export { default as AuthGuard } from './components/firekit/auth-guard.svelte';
export { default as CustomGuard } from './components/firekit/custom-guard.svelte';
export { default as SignedIn } from './components/firekit/signed-in.svelte';
export { default as SignedOut } from './components/firekit/signed-out.svelte';
export { default as Doc } from './components/firekit/Doc.svelte';
export { default as Collection } from './components/firekit/Collection.svelte';
export { default as Node } from './components/firekit/Node.svelte';
export { default as NodeList } from './components/firekit/node-list.svelte';
export { default as StorageList } from './components/firekit/storage-list.svelte';
export { default as DownloadURL } from './components/firekit/download-url.svelte';
export { default as UploadTask } from './components/firekit/upload-task.svelte';
