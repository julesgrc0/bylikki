<script lang="ts">
	/** Placeholder photo hachuré — remplace-le par une <img> quand les visuels arrivent. */
	let {
		label = 'PHOTO',
		tint = 'rgba(240,54,155,.13)',
		bg = '#FFF9F2',
		radius = '18px',
		stripe = 8,
		class: klass = '',
		style = ''
	}: {
		label?: string;
		tint?: string;
		bg?: string;
		radius?: string;
		stripe?: number;
		class?: string;
		style?: string;
	} = $props();

	const hatch = $derived(
		`repeating-linear-gradient(135deg,${tint} 0 ${stripe}px,rgba(255,255,255,0) ${stripe}px ${stripe * 2}px),${bg}`
	);
</script>

<div
	class="flex items-center justify-center border-[1.5px] border-ink/15 p-2 text-center font-mono text-[11px] leading-relaxed whitespace-pre-line text-ink/55 sm:text-[12px] {klass}"
	style="background:{hatch};border-radius:{radius};{style}"
>
	{label}
</div>
