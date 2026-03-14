import {
	getAI,
	getGenerativeModel,
	GoogleAIBackend,
	VertexAIBackend,
	type GenerativeModel,
	type Part,
	type Content,
	type GenerateContentRequest,
	type GenerationConfig,
	type SafetySetting,
	type ModelParams,
	type ChatSession,
	type AI
} from 'firebase/ai';
import { firebaseService } from '../firebase.js';

// ── Backend helpers ───────────────────────────────────────────────────────────

/** Available backend types for Firebase AI. */
export type AIBackendType = 'googleai' | 'vertexai';

function getAIInstance(backend: AIBackendType = 'googleai'): AI {
	const app = firebaseService.getFirebaseApp();
	if (!app) throw new Error('Firebase app is not initialized.');
	const backendInstance =
		backend === 'vertexai' ? new VertexAIBackend() : new GoogleAIBackend();
	return getAI(app, { backend: backendInstance });
}

// ── Content helpers ───────────────────────────────────────────────────────────

/** Builds a text Part. */
export function textPart(text: string): Part {
	return { text };
}

/** Builds an inline image Part from a base64 data URL or raw base64 string. */
export function imagePart(base64: string, mimeType = 'image/jpeg'): Part {
	const data = base64.startsWith('data:')
		? base64.split(',')[1]
		: base64;
	return { inlineData: { data, mimeType } };
}

/** Builds an image Part from a publicly accessible URL. */
export function imageUrlPart(url: string, mimeType = 'image/jpeg'): Part {
	return { fileData: { fileUri: url, mimeType } };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FirekitAIOptions {
	/** Firebase AI backend. Default: 'googleai' */
	backend?: AIBackendType;
	/** Gemini model name. Default: 'gemini-2.0-flash' */
	model?: string;
	generationConfig?: GenerationConfig;
	safetySettings?: SafetySetting[];
	systemInstruction?: string | Part | Content;
}

export interface ChatMessage {
	role: 'user' | 'model';
	parts: Part[];
	text: string;
}

// ── One-shot generation ───────────────────────────────────────────────────────

/**
 * Reactive one-shot AI generation.
 *
 * Calls `generateContent` and exposes reactive state. Re-call `generate()`
 * to produce new results.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitGenerate } from 'svelte-firekit';
 *   const gen = firekitGenerate({ model: 'gemini-2.0-flash' });
 *   gen.generate('Summarize the following: ...');
 * </script>
 * {#if gen.loading}<p>Thinking…</p>{/if}
 * {#if gen.text}<p>{gen.text}</p>{/if}
 * ```
 */
export class FirekitGenerate {
	private _text = $state<string | null>(null);
	private _loading = $state(false);
	private _error = $state<Error | null>(null);

	readonly hasResult = $derived(this._text !== null && !this._loading);

	private _model: GenerativeModel;

	constructor(options: FirekitAIOptions = {}) {
		const {
			backend = 'googleai',
			model = 'gemini-2.0-flash',
			generationConfig,
			safetySettings,
			systemInstruction
		} = options;

		const ai = getAIInstance(backend);
		const params: ModelParams = { model };
		if (generationConfig) params.generationConfig = generationConfig;
		if (safetySettings) params.safetySettings = safetySettings;
		if (systemInstruction) params.systemInstruction = systemInstruction;

		this._model = getGenerativeModel(ai, params);
	}

	get text(): string | null { return this._text; }
	get loading(): boolean { return this._loading; }
	get error(): Error | null { return this._error; }

	/**
	 * Generates a response for the given prompt (text or multi-part content).
	 * Returns the generated text, or null on error.
	 */
	async generate(prompt: string | Part | Part[] | GenerateContentRequest): Promise<string | null> {
		this._loading = true;
		this._error = null;
		try {
			const result = await this._model.generateContent(prompt as GenerateContentRequest);
			const text = result.response.text();
			this._text = text;
			return text;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			return null;
		} finally {
			this._loading = false;
		}
	}

	/** Resets result and error state. */
	reset(): void {
		this._text = null;
		this._error = null;
	}
}

// ── Streaming generation ──────────────────────────────────────────────────────

/**
 * Reactive streaming AI generation.
 *
 * Streams tokens into `text` as they arrive from the model.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitStream } from 'svelte-firekit';
 *   const gen = firekitStream({ model: 'gemini-2.0-flash' });
 *   gen.generate('Write a poem about Svelte.');
 * </script>
 * {#if gen.streaming}<span class="cursor">▍</span>{/if}
 * <p>{gen.text}</p>
 * ```
 */
export class FirekitStream {
	private _text = $state('');
	private _streaming = $state(false);
	private _loading = $state(false);
	private _error = $state<Error | null>(null);

	readonly done = $derived(!this._loading && !this._streaming);

	private _model: GenerativeModel;

	constructor(options: FirekitAIOptions = {}) {
		const {
			backend = 'googleai',
			model = 'gemini-2.0-flash',
			generationConfig,
			safetySettings,
			systemInstruction
		} = options;

		const ai = getAIInstance(backend);
		const params: ModelParams = { model };
		if (generationConfig) params.generationConfig = generationConfig;
		if (safetySettings) params.safetySettings = safetySettings;
		if (systemInstruction) params.systemInstruction = systemInstruction;

		this._model = getGenerativeModel(ai, params);
	}

	get text(): string { return this._text; }
	get streaming(): boolean { return this._streaming; }
	get loading(): boolean { return this._loading; }
	get error(): Error | null { return this._error; }

	/**
	 * Streams a response for the given prompt.
	 * Resolves with the full text once streaming completes.
	 */
	async generate(prompt: string | Part | Part[] | GenerateContentRequest): Promise<string> {
		this._text = '';
		this._loading = true;
		this._streaming = false;
		this._error = null;

		try {
			const stream = await this._model.generateContentStream(
				prompt as GenerateContentRequest
			);
			this._loading = false;
			this._streaming = true;

			for await (const chunk of stream.stream) {
				const chunkText = chunk.text();
				this._text += chunkText;
			}

			// Final aggregated response
			const final = await stream.response;
			this._text = final.text();
			return this._text;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			return '';
		} finally {
			this._streaming = false;
			this._loading = false;
		}
	}

	/** Resets accumulated text and error. */
	reset(): void {
		this._text = '';
		this._error = null;
	}
}

// ── Chat session ──────────────────────────────────────────────────────────────

/**
 * Reactive multi-turn chat session.
 *
 * Maintains conversation history and exposes reactive state for each
 * assistant turn (supports both streaming and non-streaming).
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { firekitChat } from 'svelte-firekit';
 *   const chat = firekitChat({ model: 'gemini-2.0-flash' });
 *   await chat.send('Hello!');
 * </script>
 * {#each chat.history as msg}
 *   <div class={msg.role}>{msg.text}</div>
 * {/each}
 * {#if chat.streaming}<span>▍</span>{/if}
 * ```
 */
export class FirekitChat {
	private _history = $state<ChatMessage[]>([]);
	private _pendingText = $state('');
	private _loading = $state(false);
	private _streaming = $state(false);
	private _error = $state<Error | null>(null);

	readonly lastMessage = $derived(
		this._history.length > 0 ? this._history[this._history.length - 1] : null
	);
	readonly isEmpty = $derived(this._history.length === 0);

	private _session: ChatSession;

	constructor(options: FirekitAIOptions = {}, initialHistory: Content[] = []) {
		const {
			backend = 'googleai',
			model = 'gemini-2.0-flash',
			generationConfig,
			safetySettings,
			systemInstruction
		} = options;

		const ai = getAIInstance(backend);
		const params: ModelParams = { model };
		if (generationConfig) params.generationConfig = generationConfig;
		if (safetySettings) params.safetySettings = safetySettings;
		if (systemInstruction) params.systemInstruction = systemInstruction;

		const genModel = getGenerativeModel(ai, params);
		this._session = genModel.startChat({ history: initialHistory });

		// Seed history from initialHistory
		for (const turn of initialHistory) {
			const text = turn.parts
				.map((p) => ('text' in p ? p.text : ''))
				.filter(Boolean)
				.join('');
			this._history.push({
				role: turn.role as 'user' | 'model',
				parts: turn.parts as Part[],
				text
			});
		}
	}

	get history(): ChatMessage[] { return this._history; }
	get pendingText(): string { return this._pendingText; }
	get loading(): boolean { return this._loading; }
	get streaming(): boolean { return this._streaming; }
	get error(): Error | null { return this._error; }

	/**
	 * Sends a message and returns the model's response text.
	 * Uses streaming by default for a responsive UI.
	 */
	async send(
		message: string | Part[],
		{ stream = true }: { stream?: boolean } = {}
	): Promise<string> {
		const parts: Part[] = typeof message === 'string' ? [{ text: message }] : message;
		const userText = parts.map((p) => ('text' in p ? p.text : '')).join('');

		this._history.push({ role: 'user', parts, text: userText });
		this._pendingText = '';
		this._loading = true;
		this._error = null;

		try {
			let responseText = '';

			if (stream) {
				const result = await this._session.sendMessageStream(parts);
				this._loading = false;
				this._streaming = true;

				for await (const chunk of result.stream) {
					const chunkText = chunk.text();
					this._pendingText += chunkText;
				}

				const final = await result.response;
				responseText = final.text();
			} else {
				const result = await this._session.sendMessage(parts);
				this._loading = false;
				responseText = result.response.text();
			}

			this._history.push({
				role: 'model',
				parts: [{ text: responseText }],
				text: responseText
			});
			this._pendingText = '';
			return responseText;
		} catch (err) {
			this._error = err instanceof Error ? err : new Error(String(err));
			this._pendingText = '';
			return '';
		} finally {
			this._loading = false;
			this._streaming = false;
		}
	}

	/** Clears the conversation history and starts a fresh session. */
	clear(): void {
		this._history = [];
		this._pendingText = '';
		this._error = null;
	}
}

// ── Factory functions ─────────────────────────────────────────────────────────

/**
 * Creates a reactive one-shot AI text generator.
 */
export function firekitGenerate(options?: FirekitAIOptions): FirekitGenerate {
	return new FirekitGenerate(options);
}

/**
 * Creates a reactive streaming AI text generator.
 */
export function firekitStream(options?: FirekitAIOptions): FirekitStream {
	return new FirekitStream(options);
}

/**
 * Creates a reactive multi-turn AI chat session.
 */
export function firekitChat(
	options?: FirekitAIOptions,
	initialHistory?: Content[]
): FirekitChat {
	return new FirekitChat(options, initialHistory);
}

// Re-export useful Firebase AI types consumers may need
export { GoogleAIBackend, VertexAIBackend };
export type { Part, Content, GenerationConfig, SafetySetting };
