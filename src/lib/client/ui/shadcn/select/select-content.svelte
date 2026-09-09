<script lang="ts">
	import { cn, type WithoutChild } from '#lib/client/utils/shadcn';
	import { Select as SelectPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		children,
		...restProps
	}: WithoutChild<SelectPrimitive.ContentProps> & {
		children?: import('svelte').Snippet;
	} = $props();
</script>

<SelectPrimitive.Portal>
	<SelectPrimitive.Content
		bind:ref
		data-slot="select-content"
		{sideOffset}
		class={cn(
			'data-[state=open]:animate-in data-[state=closed]:animate-out relative z-50 max-h-96 min-w-32 overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md',
			className
		)}
		{...restProps}
	>
		<SelectPrimitive.Viewport class="p-1">
			{@render children?.()}
		</SelectPrimitive.Viewport>
	</SelectPrimitive.Content>
</SelectPrimitive.Portal>
