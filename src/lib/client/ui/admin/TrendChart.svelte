<script lang="ts">
	type Point = { date: string; value: number };

	let {
		title,
		points,
		format,
		height = 120
	}: {
		title: string;
		points: Point[];
		format: (value: number) => string;
		height?: number;
	} = $props();

	/**
	 * Une seule serie par graphique : le CA et le nombre de commandes n'ont pas
	 * la meme echelle et ne doivent jamais partager un axe.
	 */
	const max = $derived(Math.max(...points.map((point) => point.value), 1));
	const barWidth = $derived(100 / Math.max(points.length, 1));

	let hovered = $state<number | null>(null);

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
	const formatDate = (iso: string) => dateFormatter.format(new Date(iso));
</script>

<figure class="m-0 flex flex-col gap-2">
	<figcaption class="text-xs font-medium text-muted-foreground">{title}</figcaption>

	<div class="relative">
		<svg
			viewBox="0 0 100 {height}"
			preserveAspectRatio="none"
			role="img"
			aria-label={title}
			class="w-full"
			style="height:{height}px"
			onmouseleave={() => (hovered = null)}
		>
			<!-- ligne de reference discrete au maximum -->
			<line x1="0" y1="0.5" x2="100" y2="0.5" class="stroke-border" stroke-width="1" />

			{#each points as point, index (point.date)}
				{@const barHeight = point.value === 0 ? 0 : Math.max((point.value / max) * (height - 6), 2)}
				{@const x = index * barWidth}
				<rect
					x={x + barWidth * 0.15}
					y={height - barHeight}
					width={barWidth * 0.7}
					height={barHeight}
					rx="1.2"
					class={hovered === index ? 'fill-primary' : 'fill-primary/70'}
				/>
				<rect
					{x}
					y="0"
					width={barWidth}
					{height}
					fill="transparent"
					onmouseenter={() => (hovered = index)}
					role="presentation"
				/>
			{/each}
		</svg>

		{#if hovered !== null}
			{@const point = points[hovered]}
			<div
				class="pointer-events-none absolute top-0 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
				style="left:{Math.min(Math.max(hovered * barWidth, 0), 78)}%"
			>
				<div class="font-medium">{format(point.value)}</div>
				<div class="text-muted-foreground">{formatDate(point.date)}</div>
			</div>
		{/if}
	</div>

	<div class="flex justify-between text-[11px] text-muted-foreground">
		<span>{points.length > 0 ? formatDate(points[0].date) : ''}</span>
		<span>{points.length > 0 ? formatDate(points[points.length - 1].date) : ''}</span>
	</div>

	<!-- equivalent textuel : les memes donnees, lisibles au lecteur d'ecran -->
	<table class="sr-only">
		<caption>{title}</caption>
		<thead>
			<tr><th scope="col">Date</th><th scope="col">Valeur</th></tr>
		</thead>
		<tbody>
			{#each points as point (point.date)}
				<tr><td>{formatDate(point.date)}</td><td>{format(point.value)}</td></tr>
			{/each}
		</tbody>
	</table>
</figure>
