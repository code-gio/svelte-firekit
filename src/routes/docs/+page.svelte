<script lang="ts">
	import DocRenderer from '$lib/components/docs/doc-renderer.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let { title, description } = data.metadata;
	const url = 'https://svelte-firekit.com/docs';
</script>

<svelte:head>
	<title>{title} - Svelte FireKit</title>
	<meta name="description" content={description} />
	<meta name="keywords" content="svelte, firebase, firestore, authentication, sveltekit, documentation" />
	
	<!-- Canonical URL -->
	<link rel="canonical" href={url} />
	
	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Svelte FireKit" />
	<meta property="og:image" content="https://svelte-firekit.com/logo.svg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Svelte FireKit Documentation" />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://svelte-firekit.com/logo.svg" />
	<meta name="twitter:creator" content="@code_gio" />
</svelte:head>

<DocRenderer {title} {description} {data} />
