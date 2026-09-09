<script lang="ts">
	import { cn, type WithElementRef } from '#lib/client/utils/shadcn';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="skeleton"
	class={cn('animate-pulse rounded-md bg-accent', className)}
	{...restProps}
></div>
