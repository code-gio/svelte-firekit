<script lang="ts">
	import DocRenderer from '$lib/components/docs/doc-renderer.svelte';
	import type { PageData } from './$types.js';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();
	let title = $derived(data.metadata.title);
	let description = $derived(data.metadata.description);
	let slug = $derived(data.metadata.slug);
	let url = $derived(`https://svelte-firekit.com${$page.url.pathname}`);
</script>

<svelte:head>
	<title>{title} - Svelte FireKit</title>
	<meta name="description" content={description} />
	<meta name="keywords" content="svelte, firebase, firestore, authentication, sveltekit, {slug}" />
	
	<!-- Canonical URL -->
	<link rel="canonical" href={url} />
	
	<!-- Open Graph -->
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Svelte FireKit" />
	<meta property="og:image" content="https://svelte-firekit.com/logo.svg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Svelte FireKit - {title}" />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://svelte-firekit.com/logo.svg" />
	<meta name="twitter:creator" content="@code_gio" />
	
	<!-- Article structured data -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "TechArticle",
			"headline": "{title}",
			"description": "{description}",
			"url": "{url}",
			"dateModified": "{data.metadata.lastModified || new Date().toISOString()}",
			"author": {
				"@type": "Person",
				"name": "Giovanni Rodriguez",
				"url": "https://github.com/code-gio"
			},
			"publisher": {
				"@type": "Organization",
				"name": "Svelte FireKit",
				"logo": {
					"@type": "ImageObject",
					"url": "https://svelte-firekit.com/logo.svg"
				}
			},
			"mainEntityOfPage": {
				"@type": "WebPage",
				"@id": "{url}"
			}
		}
	</script>
</svelte:head>

<DocRenderer {title} {description} {data} />
