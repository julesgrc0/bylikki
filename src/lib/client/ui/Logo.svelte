<script lang="ts">
	import { resolve } from '$app/paths';

	let { size = 'md', tone = 'pink' }: { size?: 'sm' | 'md' | 'lg'; tone?: 'pink' | 'blush' } =
		$props();

	const pad = {
		sm: 'px-2.5 py-1.5 text-[13px]',
		md: 'px-5 py-2 text-[20px]',
		lg: 'px-[30px] py-2.5 text-[26px]'
	};
	const label = $derived(size === 'sm' ? '[ LOGO — BYLIKKI ]' : '[ LOGO PLACEHOLDER — BYLIKKI ]');
</script>

<a
	href={resolve('/')}
	class="inline-block rounded-[14px] border-2 border-dashed font-semibold tracking-[0.02em] whitespace-nowrap
	{pad[size]}
	{tone === 'pink' ? 'border-pink bg-white text-ink' : 'border-pink-blush bg-transparent text-cream'}"
>
	{label}
</a>
