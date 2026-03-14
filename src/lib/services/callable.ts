import {
	httpsCallable,
	httpsCallableFromURL,
	type Functions,
	type HttpsCallableOptions,
	type HttpsCallableResult
} from 'firebase/functions';
import { firebaseService } from '../firebase.js';

function getFunctions(): Functions {
	const fn = firebaseService.getFunctionsInstance();
	if (!fn) throw new Error('Firebase Functions is not initialized.');
	return fn;
}

/**
 * A typed callable Cloud Function wrapper with reactive loading/error state.
 *
 * Wraps `httpsCallable` and tracks in-flight state so you can bind it
 * directly to a UI without managing state yourself.
 *
 * @example
 * ```ts
 * import { firekitCallable } from 'svelte-firekit';
 *
 * const sendWelcomeEmail = firekitCallable<{ userId: string }, { sent: boolean }>('sendWelcomeEmail');
 * const result = await sendWelcomeEmail.call({ userId: 'abc' });
 * ```
 */
export class FirekitCallable<TData = unknown, TResult = unknown> {
	protected _loading = $state(false);
	protected _error = $state<Error | null>(null);
	protected _result = $state<TResult | null>(null);

	readonly called = $derived(this._result !== null || this._error !== null);

	protected _name: string;
	protected _options: HttpsCallableOptions | undefined;

	constructor(name: string, options?: HttpsCallableOptions) {
		this._name = name;
		this._options = options;
	}

	get loading(): boolean { return this._loading; }
	get error(): Error | null { return this._error; }
	get result(): TResult | null { return this._result; }

	/**
	 * Calls the Cloud Function with the given data.
	 * Returns the result data, or null on error.
	 */
	async call(data?: TData): Promise<TResult | null> {
		if (!this._name) {
			throw new Error('Cannot call a Cloud Function with an empty name. Use FirekitCallableFromURL instead.');
		}
		this._loading = true;
		this._error = null;
		try {
			const fn = getFunctions();
			const callable = httpsCallable<TData, TResult>(fn, this._name, this._options);
			const res: HttpsCallableResult<TResult> = await callable(data as TData);
			this._result = res.data;
			return res.data;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			return null;
		} finally {
			this._loading = false;
		}
	}

	/** Resets result and error state. */
	reset(): void {
		this._result = null;
		this._error = null;
	}
}

/**
 * A typed callable Cloud Function wrapper that calls a function by URL
 * (useful for non-default regions or emulator overrides).
 */
export class FirekitCallableFromURL<TData = unknown, TResult = unknown>
	extends FirekitCallable<TData, TResult> {

	private _url: string;

	constructor(url: string, options?: HttpsCallableOptions) {
		super('', options);
		this._url = url;
	}

	override async call(data?: TData): Promise<TResult | null> {
		this._loading = true;
		this._error = null;
		try {
			const fn = getFunctions();
			const callable = httpsCallableFromURL<TData, TResult>(fn, this._url, this._options);
			const res = await callable(data as TData);
			this._result = res.data;
			return res.data;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			return null;
		} finally {
			this._loading = false;
		}
	}
}

// ── Factory functions ─────────────────────────────────────────────────────────

/**
 * Creates a typed callable Cloud Function wrapper.
 *
 * @example
 * ```ts
 * const calculateShipping = firekitCallable<{ cartId: string }, { cost: number }>('calculateShipping');
 * const result = await calculateShipping.call({ cartId: 'abc' });
 * ```
 */
export function firekitCallable<TData = unknown, TResult = unknown>(
	name: string,
	options?: HttpsCallableOptions
): FirekitCallable<TData, TResult> {
	return new FirekitCallable<TData, TResult>(name, options);
}

/**
 * Creates a typed callable Cloud Function wrapper using a direct URL.
 */
export function firekitCallableFromURL<TData = unknown, TResult = unknown>(
	url: string,
	options?: HttpsCallableOptions
): FirekitCallableFromURL<TData, TResult> {
	return new FirekitCallableFromURL<TData, TResult>(url, options);
}
