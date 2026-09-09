<script lang="ts">
	import { cn, type WithElementRef } from '#lib/client/utils/shadcn';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		class: className,
		...restProps
	}: WithElementRef<Omit<HTMLInputAttributes, 'type'>> & { type?: InputType } = $props();

	const base =
		'border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive';
</script>

<input
	bind:this={ref}
	bind:value
	data-slot="input"
	class={cn(base, className)}
	{type}
	{...restProps}
/>
