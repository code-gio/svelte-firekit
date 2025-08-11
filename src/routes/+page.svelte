<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		IconBolt,
		IconShield,
		IconDatabase,
		IconUpload,
		IconUsers,
		IconCode,
		IconRocket,
		IconCheck,
		IconArrowRight,
		IconStar,
		IconBrandGithub,
		IconPackage,
		IconPlayerPlay,
		IconBook,
		IconSettings,
		IconGlobe,
		IconDeviceMobile,
		IconServer
	} from '@tabler/icons-svelte';

	// Example data for demonstration
	const features = [
		{
			icon: IconShield,
			title: 'Complete Authentication',
			description:
				'Email/password, Google, Facebook, Apple, phone, and anonymous auth with automatic Firestore integration.',
			badge: 'Auth'
		},
		{
			icon: IconDatabase,
			title: 'Real-time Firestore',
			description:
				'Reactive collections and documents with live updates, caching, and advanced querying.',
			badge: 'Firestore'
		},
		{
			icon: IconUpload,
			title: 'File Storage',
			description:
				'Upload/download files with progress tracking, image optimization, and security rules.',
			badge: 'Storage'
		},
		{
			icon: IconUsers,
			title: 'Presence System',
			description: 'User online/offline tracking with geolocation and real-time status updates.',
			badge: 'Presence'
		},
		{
			icon: IconGlobe,
			title: 'Analytics',
			description: 'Comprehensive event tracking and user behavior analytics integration.',
			badge: 'Analytics'
		},
		{
			icon: IconServer,
			title: 'SSR Compatible',
			description: 'Full server-side rendering support with hydration and SEO optimization.',
			badge: 'SSR'
		}
	];

	const quickStartSteps = [
		{
			step: 1,
			title: 'Install Dependencies',
			code: 'npm install svelte-firekit firebase',
			description: 'Install the library and Firebase SDK'
		},
		{
			step: 2,
			title: 'Configure Environment',
			code: `PUBLIC_FIREBASE_API_KEY=your_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
PUBLIC_FIREBASE_APP_ID=your_app_id`,
			description: 'Set up Firebase configuration variables'
		},
		{
			step: 3,
			title: 'Initialize Firebase',
			code: `<FirebaseApp>
  <!-- Your app content -->
  <SignedIn>
    {@render children(user)}
  </SignedIn>
</FirebaseApp>`,
			description: 'Wrap your app with the FirebaseApp component'
		},
		{
			step: 4,
			title: 'Start Building',
			code: `// Reactive user state
const user = $derived(firekitUser.user);
const isAuthenticated = $derived(firekitUser.isAuthenticated);

// Reactive collection
const posts = firekitCollection('posts');

// Use in components
<SignedIn>
  {@render children(user)}
</SignedIn>`,
			description: 'Use reactive stores and components'
		}
	];

	const mvpExamples = [
		{
			title: 'User Authentication',
			description: 'Complete auth system with multiple providers',
			code: `import { SignedIn, SignedOut, AuthGuard } from '$lib/components/firekit';

<AuthGuard requireAuth={true} redirectTo="/login">
  {#snippet children(user, auth, signOut)}
    <h1>Welcome, {user.displayName}!</h1>
    <button onclick={signOut}>Sign Out</button>
  {/snippet}
</AuthGuard>

<SignedIn>
  {#snippet children(user)}
    <div>Hello, {user.displayName}!</div>
  {/snippet}
</SignedIn>

<SignedOut>
  {#snippet children(auth)}
    <button onclick={() => signInWithGoogle()}>Sign In</button>
  {/snippet}
</SignedOut>`
		},
		{
			title: 'Real-time Data',
			description: 'Live data synchronization with Firestore',
			code: `import { Collection } from '$lib/components/firekit';
import { where } from 'firebase/firestore';

<Collection ref="posts">
  {#snippet children(data, ref, firestore, count)}
    <div>Total posts: {count}</div>
    {#each data as post}
      <article>
        <h3>{post.title}</h3>
        <p>{post.content}</p>
      </article>
    {/each}
  {/snippet}
</Collection>

<!-- With query constraints -->
<Collection ref="posts" queryConstraints={[where('published', '==', true)]}>
  {#snippet children(data, ref, firestore, count)}
    {#each data as post}
      <article>{post.title}</article>
    {/each}
  {/snippet}
</Collection>`
		},
		{
			title: 'File Upload',
			description: 'Drag & drop file upload with progress',
			code: `import { UploadTask } from '$lib/components/firekit';

let fileData: File;

<input type="file" onchange={(e) => fileData = e.target.files[0]} />

<UploadTask ref="uploads/{fileData?.name}" data={fileData}>
  {#snippet children(snapshot, uploadTask, progress, storage)}
    <div>Progress: {progress}%</div>
    {#if snapshot?.state === 'success'}
      <div>Upload complete!</div>
    {/if}
  {/snippet}
</UploadTask>`
		}
	];

	const stats = [
		{ label: 'Firebase Services', value: '6+', icon: IconDatabase },
		{ label: 'Auth Providers', value: '5+', icon: IconShield },
		{ label: 'UI Components', value: '12+', icon: IconCode },
		{ label: 'Type Safety', value: '100%', icon: IconCheck }
	];
</script>

<svelte:head>
	<title>Svelte FireKit - Complete Firebase Integration for Svelte 5</title>
	<meta
		name="description"
		content="A comprehensive Svelte 5 library for Firebase integration with reactive state management, authentication, Firestore, Storage, and more. Build MVPs faster with zero-config setup."
	/>
	<meta
		name="keywords"
		content="svelte, firebase, firestore, authentication, sveltekit, mvp, realtime, typescript"
	/>
	
	<!-- Canonical URL -->
	<link rel="canonical" href="https://svelte-firekit.com/" />
	
	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Svelte FireKit - Complete Firebase Integration for Svelte 5" />
	<meta property="og:description" content="A comprehensive Svelte 5 library for Firebase integration with reactive state management, authentication, Firestore, Storage, and more. Build MVPs faster with zero-config setup." />
	<meta property="og:url" content="https://svelte-firekit.com/" />
	<meta property="og:site_name" content="Svelte FireKit" />
	<meta property="og:image" content="https://svelte-firekit.com/logo.svg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Svelte FireKit - Complete Firebase Integration for Svelte 5" />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Svelte FireKit - Complete Firebase Integration for Svelte 5" />
	<meta name="twitter:description" content="A comprehensive Svelte 5 library for Firebase integration with reactive state management, authentication, Firestore, Storage, and more. Build MVPs faster with zero-config setup." />
	<meta name="twitter:image" content="https://svelte-firekit.com/logo.svg" />
	<meta name="twitter:creator" content="@code_gio" />
	
	<!-- Organization structured data -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			"name": "Svelte FireKit",
			"description": "A comprehensive Svelte 5 library for Firebase integration with reactive state management, authentication, Firestore, Storage, and more. Build MVPs faster with zero-config setup.",
			"url": "https://svelte-firekit.com/",
			"applicationCategory": "DeveloperApplication",
			"operatingSystem": "Any",
			"programmingLanguage": "TypeScript",
			"author": {
				"@type": "Person",
				"name": "Giovanni Rodriguez",
				"url": "https://github.com/code-gio"
			},
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "USD"
			},
			"codeRepository": "https://github.com/code-gio/svelte-firekit"
		}
	</script>
	
	<!-- Website structured data -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			"name": "Svelte FireKit",
			"url": "https://svelte-firekit.com/",
			"potentialAction": {
				"@type": "SearchAction",
				"target": {
					"@type": "EntryPoint",
					"urlTemplate": "https://svelte-firekit.com/docs?q={search_term_string}"
				},
				"query-input": "required name=search_term_string"
			}
		}
	</script>
</svelte:head>

<div class="min-h-screen">
	<!-- Hero Section -->
	<section class="relative overflow-hidden">
		<div class="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
			<div class="text-center">
				<div class="mb-6 flex items-center justify-center gap-2">
					<Badge variant="secondary" class="text-sm">
						<IconBolt class="mr-1 h-4 w-4" />
						Svelte 5 Ready
					</Badge>
					<Badge variant="outline" class="text-sm">
						<IconPackage class="mr-1 h-4 w-4" />
						v0.1.7
					</Badge>
				</div>

				<h1 class="mb-6 text-5xl font-bold text-slate-900 md:text-6xl dark:text-white">
					Svelte <span class="text-blue-600 dark:text-blue-400">FireKit</span>
				</h1>

				<p class="mx-auto mb-8 max-w-3xl text-xl text-slate-600 dark:text-slate-300">
					Complete Firebase integration for Svelte 5 applications. Build MVPs faster with reactive
					state management, zero-config setup, and comprehensive UI components.
				</p>

				<div class="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
					<Button size="lg" href="/docs">
						<IconPlayerPlay />
						Get Started
					</Button>

					<Button variant="outline" size="lg" href="https://github.com/code-gio/svelte-firekit">
						<IconBrandGithub />
						GitHub
					</Button>
				</div>

				<!-- Stats -->
				<div class="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
					{#each stats as stat}
						<div class="text-center">
							<div
								class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30"
							>
								<svelte:component
									this={stat.icon}
									class="h-6 w-6 text-blue-600 dark:text-blue-400"
								/>
							</div>
							<div class="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
							<div class="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="bg-white py-20 dark:bg-slate-900">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
					Everything You Need for Firebase
				</h2>
				<p class="mx-auto max-w-3xl text-xl text-slate-600 dark:text-slate-300">
					From authentication to real-time data, file storage to analytics - Svelte FireKit provides
					a complete solution for modern web applications.
				</p>
			</div>

			<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				{#each features as feature}
					<Card class="group border-0 shadow-md transition-all duration-300 hover:shadow-lg">
						<CardHeader>
							<div class="mb-4 flex items-center justify-between">
								<div
									class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-800/50"
								>
									<svelte:component
										this={feature.icon}
										class="h-6 w-6 text-blue-600 dark:text-blue-400"
									/>
								</div>
								<Badge variant="secondary">{feature.badge}</Badge>
							</div>
							<CardTitle class="text-xl">{feature.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<p class="text-slate-600 dark:text-slate-400">{feature.description}</p>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Quick Start Section -->
	<section class="rounded-lg bg-slate-50 py-20 dark:bg-slate-800">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
					Get Started in Minutes
				</h2>
				<p class="mx-auto max-w-3xl text-xl text-slate-600 dark:text-slate-300">
					Set up Svelte FireKit in your project and start building your MVP right away.
				</p>
			</div>

			<div>
				<h3 class="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Quick Setup Guide</h3>
				<div class="space-y-6">
					{#each quickStartSteps as step}
						<div class="flex gap-4">
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
							>
								{step.step}
							</div>
							<div class="flex-1">
								<h4 class="mb-2 font-semibold text-slate-900 dark:text-white">{step.title}</h4>
								<p class="mb-3 text-slate-600 dark:text-slate-400">{step.description}</p>
								<pre
									class="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100"><code
										>{step.code}</code
									></pre>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- MVP Examples Section -->
	<section class="bg-white py-20 dark:bg-slate-900">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
					Build MVPs Faster
				</h2>
				<p class="mx-auto max-w-3xl text-xl text-slate-600 dark:text-slate-300">
					Common patterns and components to accelerate your development process.
				</p>
			</div>

			<Tabs value="auth" class="w-full">
				<TabsList class="mb-8 grid w-full grid-cols-3">
					<TabsTrigger value="auth">Authentication</TabsTrigger>
					<TabsTrigger value="data">Real-time Data</TabsTrigger>
					<TabsTrigger value="storage">File Storage</TabsTrigger>
				</TabsList>

				{#each mvpExamples as example, index}
					<TabsContent value={['auth', 'data', 'storage'][index]} class="space-y-4">
						<Card class="border-0 shadow-lg">
							<CardHeader>
								<CardTitle>{example.title}</CardTitle>
								<CardDescription>{example.description}</CardDescription>
							</CardHeader>
							<CardContent>
								<pre
									class="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100"><code
										>{example.code}</code
									></pre>
							</CardContent>
						</Card>
					</TabsContent>
				{/each}
			</Tabs>
		</div>
	</section>
</div>
