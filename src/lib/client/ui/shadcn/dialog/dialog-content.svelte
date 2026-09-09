<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { cn, type WithoutChild } from '#lib/client/utils/shadcn';
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<DialogPrimitive.ContentProps> & {
		children?: import('svelte').Snippet;
	} = $props();
</script>

<DialogPrimitive.Portal>
	<DialogPrimitive.Overlay data-slot="dialog-overlay" class="fixed inset-0 z-50 bg-black/50" />
	<DialogPrimitive.Content
		bind:ref
		data-slot="dialog-content"
		class={cn(
			'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-lg',
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		<DialogPrimitive.Close
			class="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden"
		>
			<XIcon class="size-4" />
			<span class="sr-only">Fermer</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
