<script lang="ts">
	import ChunkyButton from '#lib/client/ui/ChunkyButton.svelte';
	import { formatPrice } from '#lib/client/utils/money';
	import { getSharedDesign } from '#lib/remote/atelier.remote';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const design = $derived(await getSharedDesign(page.params.token ?? ''));

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
</script>

<svelte:head>
	<title>Une création de l’atelier — BYLIKKI</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex max-w-[720px] flex-col gap-6 px-5 py-12 text-center lg:py-16">
	<span class="font-hand text-[24px] text-pink">une pièce unique ✦</span>
	<h1 class="m-0 text-[30px] font-semibold lg:text-[40px]">Cette création</h1>

	<div class="rounded-[24px] border-2 border-ink bg-cream p-6">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG construit par le serveur, sans donnee tierce -->
		{@html design.previewSvg}
	</div>

	<p class="m-0 text-[15.5px] text-ink/75">
		{Math.round(design.lengthMm / 10)} cm · {formatPrice(design.priceCents)} · composée le
		{dateFormatter.format(design.createdAt)}
	</p>

	<div class="flex justify-center">
		<ChunkyButton href={resolve('/atelier')}>Composer la mienne →</ChunkyButton>
	</div>
</div>
