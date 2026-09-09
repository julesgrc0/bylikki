<script lang="ts">
	let {
		label,
		desc,
		checked = false,
		onchange
	}: { label: string; desc: string; checked?: boolean; onchange: () => void } = $props();
</script>

<button
	onclick={onchange}
	role="switch"
	aria-checked={checked}
	class="flex cursor-pointer items-center justify-between gap-[18px] rounded-[18px] border-[1.5px] border-ink/20 bg-paper px-[18px] py-4 text-left"
>
	<span class="flex min-w-0 flex-col gap-[3px]">
		<span class="text-[15px] font-semibold">{label}</span>
		<span class="text-[13px] text-ink/65">{desc}</span>
	</span>
	<span
		class="relative h-[30px] w-[52px] flex-none rounded-[20px] border-2 border-ink transition-colors duration-200"
		style="background:{checked ? '#7ED598' : '#FFF9F2'}"
	>
		<span
			class="absolute top-0.5 h-[22px] w-[22px] rounded-full border-2 border-ink bg-paper transition-[left] duration-200"
			style="left:{checked ? '24px' : '2px'}"
		></span>
	</span>
</button>
