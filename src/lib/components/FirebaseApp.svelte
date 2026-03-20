<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { FirebaseOptions } from 'firebase/app';
	import type { AppCheckOptions } from 'firebase/app-check';
	import { initFirekit, isFirekitConfigured } from '../config.js';
	import { firebaseService } from '../firebase.js';
	import { firekitAppCheck } from '../services/app-check.svelte.js';
	import { firekitAnalytics } from '../services/analytics.js';
	import { firekitMessaging } from '../services/messaging.svelte.js';
	import { firekitUser } from '../services/user.svelte.js';

	/**
	 * Root provider component. Initializes Firebase (and optionally App Check) and
	 * makes all service instances available via Svelte context.
	 *
	 * `config` is optional if you called `initFirekit()` programmatically first.
	 * `appCheckOptions` should be provided if you want App Check to secure all requests.
	 * App Check is initialized **before** any other Firebase service call to ensure
	 * all subsequent requests are attested.
	 *
	 * @example
	 * <FirebaseApp config={{ apiKey: '...', ... }}>
	 *   <App />
	 * </FirebaseApp>
	 *
	 * @example With App Check (reCAPTCHA Enterprise)
	 * ```svelte
	 * <script>
	 *   import { ReCaptchaEnterpriseProvider } from 'svelte-firekit';
	 * <\/script>
	 * <FirebaseApp
	 *   {config}
	 *   appCheckOptions={{ provider: new ReCaptchaEnterpriseProvider('SITE_KEY'), isTokenAutoRefreshEnabled: true }}
	 * >
	 *   {@render children()}
	 * </FirebaseApp>
	 * ```
	 */
	let {
		children,
		config,
		appCheckOptions
	}: {
		children: Snippet;
		config?: FirebaseOptions;
		/** Pass to enable App Check. Initialize before any other Firebase service. */
		appCheckOptions?: AppCheckOptions;
	} = $props();

	const isBrowser = typeof window !== 'undefined';

	if (config && !isFirekitConfigured()) {
		initFirekit(config);
	}

	if (isBrowser) {
		// App Check must be initialized BEFORE other services make network calls
		if (appCheckOptions && !firekitAppCheck.initialized) {
			firekitAppCheck.initialize(appCheckOptions);
		}

		const app = firebaseService.getFirebaseApp();
		const auth = firebaseService.getAuthInstance();
		const firestore = firebaseService.getDbInstance();
		const storage = firebaseService.getStorageInstance();
		const rtdb = firebaseService.getDatabaseInstance();
		const functions = firebaseService.getFunctionsInstance();

		setContext('firebase/app', app);
		setContext('firebase/auth', auth);
		setContext('firebase/firestore', firestore);
		setContext('firebase/storage', storage);
		setContext('firebase/rtdb', rtdb);
		setContext('firebase/functions', functions);
		setContext('firebase/app-check', firekitAppCheck.initialized ? firebaseService.appCheck : null);
		setContext('firebase/analytics', firekitAnalytics);
		setContext('firebase/messaging', firekitMessaging);

		// Now that Firebase is configured, start the auth state listener.
		firekitUser.initialize();
	}
</script>

{@render children()}
