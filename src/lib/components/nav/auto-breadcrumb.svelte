<script lang="ts">
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';

	const path = $derived(page.url.pathname);
	const segments = $derived(path.split('/').filter(Boolean)); // split path and remove empty segments
	const breadcrumbs = $derived(
		segments.map((segment, index) => {
			// Construct the path up to this segment
			const href = '/' + segments.slice(0, index + 1).join('/');
			const isId = index === segments.length - 1 && segments[index - 1] === 'services';

			return {
				name: isId
					? segment
					: segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
				href,
				isId
			};
		})
	);
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		{#each breadcrumbs as breadcrumb, i}
			{#if i > 0}
				<Breadcrumb.Separator class="hidden md:block" />
			{/if}
			<Breadcrumb.Item>
				{#if i === breadcrumbs.length - 1}
					<Breadcrumb.Page>{breadcrumb.name}</Breadcrumb.Page>
				{:else}
					<Breadcrumb.Link href={breadcrumb.href} class="hidden md:block"
						>{breadcrumb.name}</Breadcrumb.Link
					>
				{/if}
			</Breadcrumb.Item>
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>
