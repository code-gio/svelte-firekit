<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { IconBrandGithub } from '@tabler/icons-svelte';
	import DarkModeToggle from './dark-mode-toggle.svelte';
	import AutoBreadcrumb from './auto-breadcrumb.svelte';
</script>

<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<AutoBreadcrumb />
		<div class="ml-auto flex items-center gap-2">
			<Button
				href="https://github.com/code-gio/svelte-firekit"
				variant="ghost"
				size="sm"
				class="dark:text-foreground hidden sm:flex"
				target="_blank"
				rel="noopener noreferrer"
			>
				<IconBrandGithub class="!size-4" />
				View on GitHub
			</Button>
			<DarkModeToggle />
		</div>
	</div>
</header>
