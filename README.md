# svelte-firekit

A complete Firebase integration library for **Svelte 5** and **SvelteKit**. Built with Svelte 5 runes throughout, works in any Svelte 5 project — not just SvelteKit.

- Firebase v12 (modular SDK)
- Svelte 5 runes (`$state`, `$derived`) — fully reactive, no stores
- SSR-safe — all services degrade gracefully on the server
- Works without SvelteKit (`$app/*`, `$env/*` are never imported)

---

## Installation

```sh
npm install svelte-firekit firebase
```

---

## Setup

### 1. Initialize Firebase

Call `initFirekit` once before your app renders — in your root layout or entry point:

```ts
import { initFirekit } from 'svelte-firekit';

initFirekit({
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
  databaseURL: '...' // required for Realtime Database
});
```

### 2. Wrap your app

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { FirebaseApp } from 'svelte-firekit';
  import { firebaseConfig } from '$lib/firebase';
</script>

<FirebaseApp config={firebaseConfig}>
  {@render children()}
</FirebaseApp>
```

`FirebaseApp` initializes Firebase, sets up Svelte context for all services, and optionally enables App Check:

```svelte
<FirebaseApp {config} appCheckOptions={{ provider: new ReCaptchaEnterpriseProvider('SITE_KEY'), isTokenAutoRefreshEnabled: true }}>
  {@render children()}
</FirebaseApp>
```

---

## Authentication

```ts
import { firekitAuth, firekitUser } from 'svelte-firekit';
```

### Sign in

```ts
// Email / password
await firekitAuth.signInWithEmail('user@example.com', 'password');

// OAuth (popup)
await firekitAuth.signInWithGoogle();
await firekitAuth.signInWithGithub();
await firekitAuth.signInWithFacebook();
await firekitAuth.signInWithApple();
await firekitAuth.signInWithTwitter();
await firekitAuth.signInWithMicrosoft();

// OAuth (redirect — call getRedirectResult() on app load)
await firekitAuth.signInWithGoogleRedirect();
const result = await firekitAuth.getRedirectResult(); // null if no pending redirect

// SAML / OIDC
await firekitAuth.signInWithSAML('saml.my-provider');
await firekitAuth.signInWithOIDC('oidc.my-provider', ['email', 'profile']);

// Custom token (server-issued)
await firekitAuth.signInWithCustomToken(token);

// Anonymous
await firekitAuth.signInAnonymously();

// Phone
const { confirm } = await firekitAuth.signInWithPhoneNumber('+1234567890', 'recaptcha-container');
await confirm('123456');
```

### Registration & profile

```ts
await firekitAuth.registerWithEmail('user@example.com', 'password', 'Jane Doe');
await firekitAuth.updateUserProfile({ displayName: 'Jane', photoURL: 'https://...' });
await firekitAuth.updateEmail('new@example.com');
await firekitAuth.updatePassword('newPassword', 'currentPassword');
await firekitAuth.sendPasswordReset('user@example.com');
await firekitAuth.sendEmailVerification();
await firekitAuth.signOut();
await firekitAuth.deleteAccount('currentPassword');
```

### Multi-factor authentication (MFA)

```ts
// Enroll phone MFA
const verificationId = await firekitAuth.startPhoneMFAEnrollment('+1234567890', 'recaptcha-container');
await firekitAuth.completeMFAEnrollment(verificationId, '123456', 'My Phone');

// Check enrolled factors
const factors = firekitAuth.getMFAEnrolledFactors();

// Unenroll
await firekitAuth.unenrollMFA(factors[0]);

// Complete an MFA-required sign-in (catch the MultiFactorError first)
try {
  await firekitAuth.signInWithEmail(email, password);
} catch (err) {
  const resolver = firekitAuth.getMFAResolver(err);
  const verificationId = await firekitAuth.startMFASignIn(resolver, 0, 'recaptcha-container');
  const result = await firekitAuth.completeMFASignIn(resolver, verificationId, '123456');
}
```

### Reactive user state

```svelte
<script lang="ts">
  import { firekitUser } from 'svelte-firekit';
</script>

{#if firekitUser.loading}
  <p>Loading...</p>
{:else if firekitUser.isAuthenticated}
  <p>Welcome, {firekitUser.user?.displayName}</p>
{:else}
  <p>Not signed in</p>
{/if}
```

| Property | Type | Description |
|---|---|---|
| `user` | `UserProfile \| null` | Current user profile |
| `loading` | `boolean` | Auth state initializing |
| `isAuthenticated` | `boolean` | Signed in and not anonymous |
| `isAnonymous` | `boolean` | Anonymous session |
| `initialized` | `boolean` | First auth state received |

```ts
// Wait for auth to initialize (useful for SSR / load functions)
const user = await firekitUser.waitForAuth();
```

### Auth components

```svelte
<SignedIn>  <p>Only shown when signed in</p>  </SignedIn>
<SignedOut> <p>Only shown when signed out</p> </SignedOut>

<!-- Route guard with redirect callback -->
<AuthGuard requireAuth={true} onUnauthorized={() => goto('/login')}>
  <p>Protected content</p>
</AuthGuard>

<!-- Custom guard with async checks (e.g. role verification) -->
<CustomGuard
  verificationChecks={[
    async () => { const doc = await getDoc(...); return doc.data()?.role === 'admin'; }
  ]}
  onUnauthorized={() => goto('/403')}
>
  <p>Admin only</p>
</CustomGuard>
```

---

## Firestore

### Reactive document

```svelte
<script lang="ts">
  import { firekitDoc } from 'svelte-firekit';

  const post = firekitDoc<Post>('posts/post-id');
</script>

{#if post.loading}<p>Loading...</p>{/if}
{#if post.data}<h1>{post.data.title}</h1>{/if}
```

Using the `<Doc>` component:

```svelte
<Doc path="posts/post-id">
  {#snippet data(post)}
    <h1>{post.title}</h1>
  {/snippet}
  {#snippet loading()}<p>Loading...</p>{/snippet}
</Doc>
```

**Change path reactively:**

```ts
post.setPath('posts/other-id'); // tears down listener, re-subscribes
```

**One-time fetch:**

```ts
const post = firekitDocOnce<Post>('posts/post-id');
```

### Reactive collection

```svelte
<script lang="ts">
  import { firekitCollection } from 'svelte-firekit';
  import { where, orderBy } from 'firebase/firestore';

  const posts = firekitCollection<Post>('posts', [
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  ]);
</script>

{#each posts.data as post}
  <p>{post.title}</p>
{/each}
```

**Cursor-based pagination:**

```ts
await posts.setPagination(10);   // 10 per page, switches to one-time fetch
await posts.nextPage();          // next page (replaces data)
await posts.prevPage();          // previous page
await posts.loadMore();          // append next page (infinite scroll)
await posts.resetPagination();   // back to page 1

posts.currentPage  // number
posts.hasMore      // boolean
```

**Fluent query builder:**

```ts
import { FirekitQueryBuilder } from 'svelte-firekit';

const constraints = new FirekitQueryBuilder<Post>()
  .where('published', '==', true)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .build();
```

**Collection group:**

```ts
const allComments = firekitCollectionGroup<Comment>('comments');
```

### Document mutations

```ts
import { firekitMutations } from 'svelte-firekit';

await firekitMutations.add('posts', { title: 'Hello' });
await firekitMutations.set('posts/id', { title: 'Hello' });
await firekitMutations.update('posts/id', { title: 'Updated' });
await firekitMutations.delete('posts/id');

// Existence check
const exists = await firekitMutations.exists('posts/id');

// Field value helpers
await firekitMutations.update('posts/id', {
  views: firekitMutations.increment(1),
  tags: firekitMutations.arrayUnion('svelte'),
  draft: firekitMutations.deleteField(),
  updatedAt: firekitMutations.serverTimestamp()
});

// Batch (auto-chunked at 500)
await firekitMutations.batchOps([
  { type: 'set',    path: 'posts', id: 'a', data: { title: 'A' } },
  { type: 'update', path: 'posts/b', data: { views: 1 } },
  { type: 'delete', path: 'posts/c' }
]);

// Transaction
await firekitMutations.transaction(async (tx) => {
  const snap = await tx.get(ref);
  tx.update(ref, { count: snap.data().count + 1 });
});
```

### Timestamps and options

```ts
// Auto-adds createdAt/updatedAt
await firekitMutations.add('posts', data, { timestamps: true, userId: uid });

// Retry on failure
await firekitMutations.set('posts/id', data, {
  retry: { enabled: true, maxAttempts: 3, baseDelay: 200, strategy: 'exponential' }
});
```

### Bundles

```ts
import { loadFirestoreBundle, getNamedQuery } from 'svelte-firekit';
import { getDocs } from 'firebase/firestore';

const res = await fetch('/bundles/featured.bundle');
await loadFirestoreBundle(res.body!);

const q = await getNamedQuery<Post>('featured-posts');
if (q) {
  const snap = await getDocs(q);
}
```

---

## Realtime Database

```svelte
<script lang="ts">
  import { firekitNode, firekitNodeList } from 'svelte-firekit';

  const counter = firekitNode<number>('counters/visitors');
  const messages = firekitNodeList<Message>('chat/messages');
</script>

<p>Visitors: {counter.data}</p>

{#each messages.list as msg}
  <p>{msg.text}</p>
{/each}
```

```ts
await counter.set(42);
await counter.update({ count: 10 });
await messages.push({ text: 'Hello!', userId: uid });
await messages.remove();
const once = await messages.fetchOnce();
```

Using the `<Node>` component:

```svelte
<Node path="chat/messages">
  {#snippet data(messages)}<p>{messages}</p>{/snippet}
</Node>
```

---

## Firebase Storage

```svelte
<script lang="ts">
  import { firekitDownloadUrl, firekitUploadTask } from 'svelte-firekit';

  const avatar = firekitDownloadUrl('images/avatar.jpg');
  let file: File;
  $: upload = file ? firekitUploadTask('uploads/' + file.name, file) : null;
</script>

{#if avatar.url}<img src={avatar.url} alt="avatar" />{/if}

{#if upload}
  <progress value={upload.progress} max={100} />
  {#if upload.downloadURL}<img src={upload.downloadURL} />{/if}
{/if}
```

```ts
import { deleteFile, getFileMetadata, updateFileMetadata } from 'svelte-firekit';

await deleteFile('images/old.jpg');
const meta = await getFileMetadata('images/avatar.jpg');
await updateFileMetadata('images/avatar.jpg', {
  contentType: 'image/webp',
  customMetadata: { uploadedBy: uid }
});
```

List files:

```svelte
<script lang="ts">
  import { firekitStorageList } from 'svelte-firekit';
  const dir = firekitStorageList('uploads/2024');
</script>
{#each dir.items as item}<p>{item.name}</p>{/each}
```

Using the `<DownloadURL>` and `<UploadTask>` components:

```svelte
<DownloadURL path="images/avatar.jpg">
  {#snippet data(url)}<img src={url} />{/snippet}
</DownloadURL>

<UploadTask path="uploads/file.jpg" {file}>
  {#snippet data({ progress, downloadURL })}<progress value={progress} max={100} />{/snippet}
</UploadTask>
```

---

## Cloud Functions

```ts
import { firekitCallable, firekitCallableFromURL } from 'svelte-firekit';

const sendWelcome = firekitCallable<{ userId: string }, { sent: boolean }>('sendWelcomeEmail');
const result = await sendWelcome.call({ userId: 'abc' });
// sendWelcome.loading, sendWelcome.error, sendWelcome.result

const fn = firekitCallableFromURL<Input, Output>('https://region-project.cloudfunctions.net/fn');
```

---

## Firebase AI (Gemini)

```ts
import { firekitGenerate, firekitStream, firekitChat } from 'svelte-firekit';

// One-shot
const gen = firekitGenerate({ model: 'gemini-2.0-flash' });
await gen.generate('Summarize: ...');
// gen.text, gen.loading, gen.error

// Streaming
const stream = firekitStream({ model: 'gemini-2.0-flash' });
await stream.generate('Write a poem about Svelte.');
// stream.text updates token-by-token, stream.streaming

// Multi-turn chat
const chat = firekitChat({ model: 'gemini-2.0-flash' });
await chat.send('Hello!');
await chat.send('Tell me more.');
// chat.history, chat.pendingText, chat.streaming
```

Switch between Google AI and Vertex AI:

```ts
import { GoogleAIBackend, VertexAIBackend } from 'svelte-firekit';

const gen = firekitGenerate({ backend: 'vertexai', model: 'gemini-2.0-flash' });
```

Content helpers:

```ts
import { textPart, imagePart, imageUrlPart } from 'svelte-firekit';

await gen.generate([textPart('Describe this image:'), imagePart(base64)]);
```

---

## Remote Config

```ts
import { firekitRemoteConfig } from 'svelte-firekit';

const rc = firekitRemoteConfig({
  defaults: { welcomeMessage: 'Hello!', featureEnabled: false },
  minimumFetchIntervalMs: 3_600_000,
  realtime: true // subscribe to live config updates
});

await rc.fetchAndActivate();

const msg = rc.getString('welcomeMessage');
const flag = rc.getBoolean('featureEnabled');
const count = rc.getNumber('itemsPerPage', 10);
```

---

## Performance Monitoring

```ts
import { firekitPerformance } from 'svelte-firekit';

// Simple trace
const stop = await firekitPerformance.startTrace('load-dashboard');
// ... work ...
stop();

// Timed block
const duration = await firekitPerformance.measure('render-posts', async () => {
  await loadPosts();
});
```

---

## Analytics

```ts
import { firekitAnalytics } from 'svelte-firekit';

await firekitAnalytics.logEvent('purchase', { value: 9.99, currency: 'USD' });
await firekitAnalytics.setUserId('uid123');
await firekitAnalytics.setUserProperties({ plan: 'pro' });
await firekitAnalytics.logScreenView('Dashboard');
```

---

## Messaging (FCM)

```ts
import { firekitMessaging } from 'svelte-firekit';

const token = await firekitMessaging.requestPermission('YOUR_VAPID_KEY');
// firekitMessaging.token, firekitMessaging.permission, firekitMessaging.supported

// Listen for foreground messages
const unsub = await firekitMessaging.onMessage((payload) => {
  console.log(payload.notification?.title);
});
```

---

## In-App Messaging

```ts
import { firekitInAppMessaging } from 'svelte-firekit';

// Suppress during critical flows (e.g. checkout)
firekitInAppMessaging.suppress();
// ... complete checkout ...
firekitInAppMessaging.unsuppress();

// firekitInAppMessaging.suppressed  (reactive boolean)
// firekitInAppMessaging.supported
```

---

## Presence

```ts
import { firekitPresence } from 'svelte-firekit';

await firekitPresence.initialize(user, {
  sessionTTL: 30 * 60_000,
  trackDeviceInfo: true,
  geolocation: { enabled: true, type: 'browser', requireConsent: true }
});

await firekitPresence.setPresence('away');

const stats = firekitPresence.getStats();
// stats.onlineSessions, stats.totalSessions, stats.uniqueDevices

await firekitPresence.dispose();
```

---

## App Check

```svelte
<script>
  import { ReCaptchaEnterpriseProvider } from 'svelte-firekit';
</script>

<FirebaseApp
  {config}
  appCheckOptions={{
    provider: new ReCaptchaEnterpriseProvider('SITE_KEY'),
    isTokenAutoRefreshEnabled: true
  }}
>
  {@render children()}
</FirebaseApp>
```

---

## Context helpers

After `<FirebaseApp>`, you can retrieve any raw Firebase service instance from Svelte context:

```ts
import {
  getFirestoreContext,
  getAuthContext,
  getStorageContext,
  getRTDBContext,
  getFunctionsContext,
  getAppCheckContext
} from 'svelte-firekit';

// Inside a component:
const db = getFirestoreContext();
const auth = getAuthContext();
```

---

## SSR

All services return safe defaults on the server (`loading: false`, empty arrays, `null` data) — no Firebase network calls happen during SSR. The only exception is `firekitPresence`, which is browser-only and will throw if you call `initialize()` on the server.

```ts
// Safe in load functions / SSR — resolves immediately on server
const user = await firekitUser.waitForAuth();
const posts = firekitCollection<Post>('posts');
const data = await posts.waitForReady();
```

---

## API Reference

### Services

| Import | Description |
|---|---|
| `firekitAuth` | Auth operations (sign-in, register, MFA, SAML/OIDC, redirect) |
| `firekitUser` | Reactive current user state |
| `firekitMutations` | Firestore CRUD, batch, transactions |
| `firekitPresence` | User presence tracking via RTDB |
| `firekitRemoteConfig()` | Remote Config per-instance |
| `firekitPerformance` | Performance Monitoring traces |
| `firekitAnalytics` | Analytics event logging |
| `firekitMessaging` | Firebase Cloud Messaging |
| `firekitInAppMessaging` | In-App Messaging suppression control |
| `firekitAppCheck` | App Check initialization |

### Reactive classes

| Import | Description |
|---|---|
| `FirekitDoc` / `firekitDoc()` | Reactive Firestore document |
| `FirekitCollection` / `firekitCollection()` | Reactive Firestore collection with pagination |
| `FirekitCollectionGroup` / `firekitCollectionGroup()` | Collection group query |
| `FirekitNode` / `firekitNode()` | Reactive RTDB node |
| `FirekitNodeList` / `firekitNodeList()` | Reactive RTDB list |
| `FirekitDownloadUrl` / `firekitDownloadUrl()` | Reactive Storage download URL |
| `FirekitStorageList` / `firekitStorageList()` | Reactive Storage directory listing |
| `FirekitUploadTask` / `firekitUploadTask()` | Reactive resumable upload |
| `FirekitGenerate` / `firekitGenerate()` | One-shot AI generation |
| `FirekitStream` / `firekitStream()` | Streaming AI generation |
| `FirekitChat` / `firekitChat()` | Multi-turn AI chat session |
| `FirekitCallable` / `firekitCallable()` | Typed Cloud Function caller |
| `FirekitCallableFromURL` / `firekitCallableFromURL()` | Cloud Function by URL |

### Components

| Component | Description |
|---|---|
| `<FirebaseApp>` | Root provider, initializes Firebase |
| `<SignedIn>` | Render when authenticated |
| `<SignedOut>` | Render when not authenticated |
| `<AuthGuard>` | Redirect unauthenticated users |
| `<CustomGuard>` | Async role/permission guard |
| `<Doc>` | Reactive Firestore document |
| `<Collection>` | Reactive Firestore collection |
| `<Node>` | Reactive RTDB node |
| `<DownloadURL>` | Storage download URL |
| `<UploadTask>` | Resumable file upload |

---

## License

MIT © Giovani Rodriguez
