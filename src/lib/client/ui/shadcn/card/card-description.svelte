<script lang="ts">
	import { cn, type WithElementRef } from '#lib/client/utils/shadcn';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card-description"
	class={cn('text-sm text-muted-foreground', className)}
	{...restProps}
>
	{@render children?.()}
</div>
