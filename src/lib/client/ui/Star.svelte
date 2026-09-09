<script lang="ts">
	import { starPath } from '#lib/client/data/shapes';

	let {
		color = '#FFDE59',
		stroke = '#2E1B33',
		strokeWidth = 3,
		size = 44,
		class: klass = '',
		style = ''
	}: {
		color?: string;
		stroke?: string | false;
		strokeWidth?: number;
		size?: number;
		class?: string;
		style?: string;
	} = $props();
</script>

<svg
	viewBox="0 0 100 100"
	aria-hidden="true"
	class={klass}
	style="width:{size}px;height:{size}px;{style}"
>
	<path
		d={starPath}
		fill={color}
		stroke={stroke === false ? undefined : stroke}
		stroke-width={stroke === false ? undefined : strokeWidth}
	/>
</svg>
