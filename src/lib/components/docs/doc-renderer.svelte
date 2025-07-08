<script lang="ts">
	import Separator from '../ui/separator/separator.svelte';
	import DocContent from './doc-content.svelte';
	import DocHeader from './doc-header.svelte';
	import TableOfContents from './table-of-contents.svelte';
	import MobileTableOfContents from './mobile-table-of-contents.svelte';

	let { title, description, data }: { title: string; description: string; data: any } = $props();
</script>

<div class="flex flex-col gap-6 sm:flex-row sm:justify-between">
	<div>
		<DocHeader {title} {description} />
		<DocContent {data} />
	</div>
	<div>
		<div class="sticky top-4 flex w-72 flex-col gap-4">
			<div class="hidden sm:block">
				<TableOfContents />
				<Separator />
			</div>
			<div class="block sm:hidden">
				<MobileTableOfContents />
			</div>
		</div>
	</div>
</div>
