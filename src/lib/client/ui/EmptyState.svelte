<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description = '',
		children
	}: { title: string; description?: string; children?: Snippet } = $props();
</script>

<div
	class="flex flex-col items-center gap-3 rounded-[26px] border-2 border-dashed border-ink/20 bg-yellow-soft px-6 py-12 text-center"
>
	<p class="m-0 font-hand text-[26px] lg:text-[30px]">{title}</p>
	{#if description}
		<p class="m-0 max-w-[46ch] text-[14.5px] leading-[1.55] text-ink/70">{description}</p>
	{/if}
	{#if children}
		<div class="mt-2">{@render children()}</div>
	{/if}
</div>
