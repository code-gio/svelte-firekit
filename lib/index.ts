// types
export * from './types/index.js';

// Firebase config
export { firebaseConfig } from './config.js';
export { firebaseService } from './firebase.js';

// auth services
export { firekitUser } from './services/user.svelte.js';
export { firekitAuth } from './services/auth.js';
export { firekitPresence } from './services/presence.svelte.js';

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
export { default as FirebaseApp } from './components/firebase-app.svelte';
export { default as AuthGuard } from './components/auth-guard.svelte';
export { default as CustomGuard } from './components/custom-guard.svelte';
export { default as SignedIn } from './components/signed-in.svelte';
export { default as SignedOut } from './components/signed-out.svelte';
export { default as Doc } from './components/Ddoc.svelte';
export { default as Collection } from './components/Collection.svelte';
export { default as Node } from './components/Node.svelte';
export { default as NodeList } from './components/node-list.svelte';
export { default as StorageList } from './components/storage-list.svelte';
export { default as DownloadURL } from './components/download-url.svelte';
export { default as UploadTask } from './components/upload-task.svelte';
