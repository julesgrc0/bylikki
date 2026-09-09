<script lang="ts">
	type Step = { key: string; label: string; value: number; rate: number | null };

	let { steps, conversion }: { steps: Step[]; conversion: number | null } = $props();

	/**
	 * Etapes ordonnees : une seule teinte, du clair au fonce a mesure que
	 * l'entonnoir se resserre. Rampe validee pour l'ordinal (teinte unique,
	 * luminosite monotone, extremite claire a 2,16:1 sur le fond).
	 */
	const ramp = ['#f28fbf', '#ef62a5', '#e0348a', '#b01f6d'];

	const max = $derived(Math.max(...steps.map((step) => step.value), 1));
	const numberFormatter = new Intl.NumberFormat('fr-FR');

	let hovered = $state<number | null>(null);
</script>

<figure class="m-0 flex flex-col gap-3">
	<div class="flex flex-col gap-2.5" onmouseleave={() => (hovered = null)} role="presentation">
		{#each steps as step, index (step.key)}
			{@const share = Math.max((step.value / max) * 100, step.value === 0 ? 0 : 1.5)}
			<div class="flex flex-col gap-1" onmouseenter={() => (hovered = index)} role="presentation">
				<div class="flex items-baseline justify-between gap-3 text-xs">
					<span class="text-muted-foreground">{step.label}</span>
					<span class="flex items-baseline gap-2">
						<span class="font-medium tabular-nums">{numberFormatter.format(step.value)}</span>
						{#if step.rate !== null}
							<span class="text-muted-foreground tabular-nums">
								{step.rate.toString().replace('.', ',')} %
							</span>
						{/if}
					</span>
				</div>

				<div class="h-2.5 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full transition-[width] duration-300"
						style="width:{share}%;background:{ramp[index] ??
							ramp[ramp.length - 1]};opacity:{hovered === null || hovered === index ? 1 : 0.55}"
					></div>
				</div>
			</div>
		{/each}
	</div>

	<!-- equivalent textuel : les memes donnees, lisibles au lecteur d'ecran -->
	<table class="sr-only">
		<caption>Entonnoir de conversion</caption>
		<thead>
			<tr>
				<th scope="col">Étape</th><th scope="col">Nombre</th><th scope="col">Taux de passage</th>
			</tr>
		</thead>
		<tbody>
			{#each steps as step (step.key)}
				<tr>
					<td>{step.label}</td>
					<td>{numberFormatter.format(step.value)}</td>
					<td>{step.rate === null ? '—' : `${step.rate} %`}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<figcaption class="text-xs text-muted-foreground">
		{#if conversion === null}
			Pas encore assez de données pour un taux de conversion.
		{:else}
			Conversion d'ensemble : <span class="font-medium text-foreground">
				{conversion.toString().replace('.', ',')} %
			</span>
			des fiches vues aboutissent à une commande payée.
		{/if}
	</figcaption>
</figure>
