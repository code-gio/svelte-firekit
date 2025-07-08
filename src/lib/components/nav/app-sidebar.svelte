<script lang="ts">
	import NavDocuments from './nav-components.svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import {
		IconBook,
		IconBug,
		IconFlame,
		IconLock,
		IconLockAccess,
		IconPackage,
		IconDatabase,
		IconFileText,
		IconUpload,
		IconDownload,
		IconAppWindow,
		IconList,
		IconLogin,
		IconLogout,
		IconUsers
	} from '@tabler/icons-svelte';

	const data = {
		navMain: [
			{
				title: 'Get Started',
				url: '/docs',
				icon: IconBook
			},
			{
				title: 'Installation',
				url: '/docs/installation',
				icon: IconPackage
			},
			{
				title: 'Collection Service',
				url: '/docs/collection',
				icon: IconDatabase
			},
			{
				title: 'Document Service',
				url: '/docs/document',
				icon: IconFileText
			},
			{
				title: 'User Service',
				url: '/docs/user',
				icon: IconUsers
			},
			{
				title: 'Auth Service',
				url: '/docs/auth',
				icon: IconLock
			},
			{
				title: 'Storage Service',
				url: '/docs/storage',
				icon: IconUpload
			},
			{
				title: 'Presence Service',
				url: '/docs/presence',
				icon: IconUsers
			},
			{
				title: 'Realtime Service',
				url: '/docs/realtime',
				icon: IconDatabase
			},
			{
				title: 'Mutations Service',
				url: '/docs/mutations',
				icon: IconDatabase
			},
			{
				title: 'Analytics Service',
				url: '/docs/analytics',
				icon: IconDatabase
			}
		],

		navSecondary: [
			{
				title: 'Issues',
				url: 'https://github.com/code-gio/svelte-firekit/issues',
				icon: IconBug
			}
		],
		components: [
			{
				name: 'Collection',
				url: '/docs/components/collection',
				icon: IconDatabase
			},
			{
				name: 'Document',
				url: '/docs/components/doc',
				icon: IconFileText
			},
			{
				name: 'Node',
				url: '/docs/components/node',
				icon: IconDatabase
			},
			{
				name: 'Upload Task',
				url: '/docs/components/upload-task',
				icon: IconUpload
			},
			{
				name: 'Storage List',
				url: '/docs/components/storage-list',
				icon: IconList
			},
			{
				name: 'Download URL',
				url: '/docs/components/download-url',
				icon: IconDownload
			},
			{
				name: 'Auth Guard',
				url: '/docs/components/auth-guard',
				icon: IconLock
			},
			{
				name: 'Custom Guard',
				url: '/docs/components/custom-guard',
				icon: IconLockAccess
			},
			{
				name: 'Signed In',
				url: '/docs/components/signed-in',
				icon: IconLogin
			},
			{
				name: 'Signed Out',
				url: '/docs/components/signed-out',
				icon: IconLogout
			},
			{
				name: 'Firebase App',
				url: '/docs/components/firebase-app',
				icon: IconAppWindow
			}
		]
	};

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<IconFlame class="!size-5" />
							<span class="text-base font-semibold">Svelte Firekit</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavDocuments items={data.components} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavSecondary items={data.navSecondary} />
	</Sidebar.Footer>
</Sidebar.Root>
