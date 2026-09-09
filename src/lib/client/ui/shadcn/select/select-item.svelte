<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn, type WithoutChildrenOrChild } from '#lib/client/utils/shadcn';
	import { Select as SelectPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children: childrenProp,
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ItemProps> & {
		children?: import('svelte').Snippet;
	} = $props();
</script>

<SelectPrimitive.Item
	bind:ref
	data-slot="select-item"
	{value}
	class={cn(
		"relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{#snippet children({ selected })}
		<span class="absolute right-2 flex size-3.5 items-center justify-center">
			{#if selected}
				<CheckIcon class="size-4" />
			{/if}
		</span>
		{#if childrenProp}
			{@render childrenProp()}
		{:else}
			{label || value}
		{/if}
	{/snippet}
</SelectPrimitive.Item>
