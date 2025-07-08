import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, escapeSvelte } from 'mdsvex';
import { createHighlighter } from 'shiki';

let shikiHighlighterPromise;

const getShikiHighlighter = async () => {
	if (!shikiHighlighterPromise) {
		shikiHighlighterPromise = createHighlighter({
			themes: ['github-dark', 'github-light'],
			langs: ['javascript', 'typescript', 'svelte', 'html', 'css', 'bash', 'markdown', 'json', 'dotenv','text']
		});
	}
	return shikiHighlighterPromise;
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md', '.svx'],
	preprocess: [
		vitePreprocess({}),
		mdsvex({
			extensions: ['.md', '.svx'],
			highlight: {
				highlighter: async (code, lang = 'text') => {
					const highlighter = await getShikiHighlighter();

					// Generate both light and dark versions
					const darkHtml = highlighter.codeToHtml(code, {
						lang,
						theme: 'github-dark'
					});
					const lightHtml = highlighter.codeToHtml(code, {
						lang,
						theme: 'github-light'
					});

					const escapedDark = escapeSvelte(darkHtml);
					const escapedLight = escapeSvelte(lightHtml);

					return `
					<div class="border rounded-lg py-0 ">
						<div class="code-block-dark dark:block hidden">{@html \`${escapedDark}\`}</div>
						<div class="code-block-light dark:hidden block">{@html \`${escapedLight}\`}</div>
					</div>
					`;
				}
			}
		})
	],
	kit: {
		adapter: adapter()
	}
};

export default config;