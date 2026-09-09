<script lang="ts">
	import { tornPaths, type TornVariant } from '#lib/client/data/shapes';

	let {
		variant = 'a' as TornVariant,
		color = '#F0369B',
		height = 24,
		flip = false,
		class: klass = ''
	}: {
		variant?: TornVariant;
		color?: string;
		height?: number;
		flip?: boolean;
		class?: string;
	} = $props();
</script>

<svg
	viewBox="0 0 1440 24"
	preserveAspectRatio="none"
	aria-hidden="true"
	class="block w-full {klass}"
	style="height:{height}px"
>
	<path
		d={tornPaths[variant]}
		fill={color}
		transform={flip ? 'scale(1,-1) translate(0,-24)' : undefined}
	/>
</svg>
