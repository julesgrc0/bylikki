<script lang="ts">
	import { cart, ui } from '#lib/client/state/shop.svelte';
	import type { CustomizationSelection } from '#lib/client/types';
	import ChunkyButton from '#lib/client/ui/ChunkyButton.svelte';
	import CustomizationPicker from '#lib/client/ui/CustomizationPicker.svelte';
	import PhotoPlaceholder from '#lib/client/ui/PhotoPlaceholder.svelte';
	import ProductGrid from '#lib/client/ui/ProductGrid.svelte';
	import RatingStars from '#lib/client/ui/RatingStars.svelte';
	import ReviewForm from '#lib/client/ui/ReviewForm.svelte';
	import ReviewList from '#lib/client/ui/ReviewList.svelte';
	import VariantPicker from '#lib/client/ui/VariantPicker.svelte';
	import { formatPrice } from '#lib/client/utils/money';
	import { getProduct } from '#lib/remote/product.remote';
	import { getProductReviews } from '#lib/remote/review.remote';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { data } = $props();

	const slug = $derived(page.params.slug ?? '');
	/**
	 * Le rendu attend la fiche : le contenu part complet dans le HTML. Les deux
	 * requetes partent ensemble pour ne pas s'enchainer en cascade.
	 */
	const loaded = $derived(await Promise.all([getProduct(slug), getProductReviews(slug)]));
	const detail = $derived(loaded[0]);
	const feedback = $derived(loaded[1]);

	const product = $derived(detail.product);
	const variant = $derived(
		product.variants.find((candidate) => candidate.id === selectedVariantId) ?? product.variants[0]
	);
	const unitPriceCents = $derived(
		(variant?.priceCents ?? product.basePriceCents) + customizationDelta(product.customizations)
	);
	const missingRequired = $derived(
		product.customizations.some((option) => option.required && !selection[option.key])
	);

	let selectedVariantId = $state<string | undefined>(undefined);
	let selection = $state<CustomizationSelection>({});
	let quantity = $state(1);
	let imageIndex = $state(0);
	let addError = $state('');

	function customizationDelta(
		options: {
			key: string;
			kind: string;
			priceDeltaCents: number;
			choices: { value: string; priceDeltaCents: number }[];
		}[]
	) {
		return options.reduce((total, option) => {
			const value = selection[option.key];

			if (!value) {
				return total;
			}

			const choice = option.choices.find((candidate) => candidate.value === value);

			return total + option.priceDeltaCents + (choice?.priceDeltaCents ?? 0);
		}, 0);
	}
</script>

<svelte:head>
	<title>{data.name} — BYLIKKI</title>
	<meta name="description" content={data.summary ?? `${data.name}, piece faite main a Nantes.`} />
</svelte:head>

<div class="relative px-5 pt-6 pb-16 lg:px-[70px] lg:pt-9 lg:pb-20">
	<nav class="relative mb-5 text-[13px] text-ink/55 lg:mb-[22px]">
		<a href={resolve('/search')}>Boutique</a>
		{#each product.categories as category (category.slug)}
			→ <a href={resolve(`/search?category=${category.slug}`)}>{category.name}</a>
		{/each}
		→ <span class="text-ink">{product.name}</span>
	</nav>

	<div class="relative grid grid-cols-1 gap-6 lg:grid-cols-[96px_1fr_460px] lg:gap-[26px]">
		<!-- vignettes -->
		{#if product.images.length > 1}
			<div class="order-2 flex gap-3 lg:order-1 lg:flex-col">
				{#each product.images as image, index (image.url)}
					<button
						onclick={() => (imageIndex = index)}
						aria-label={`Voir la photo ${index + 1}`}
						class="h-[70px] w-[70px] cursor-pointer overflow-hidden rounded-[12px] border-[1.5px] lg:h-[110px] lg:w-full {imageIndex ===
						index
							? 'border-2 border-ink'
							: 'border-ink/20'}"
					>
						<img src={image.url} alt="" class="h-full w-full object-cover" />
					</button>
				{/each}
			</div>
		{:else}
			<div class="order-2 hidden lg:order-1 lg:block"></div>
		{/if}

		<!-- photo principale -->
		{#if product.images[imageIndex]}
			<img
				src={product.images[imageIndex].url}
				alt={product.images[imageIndex].alt || product.name}
				class="order-1 h-[320px] w-full rounded-[24px] border-2 border-ink object-cover lg:order-2 lg:h-[560px]"
			/>
		{:else}
			<PhotoPlaceholder
				label={product.name}
				tint="rgba(240,54,155,.14)"
				bg="#FFFCF7"
				radius="24px"
				stripe={9}
				class="order-1 h-[320px] border-2 border-ink lg:order-2 lg:h-[560px]"
			/>
		{/if}

		<!-- achat -->
		<div class="order-3 flex flex-col gap-[18px]">
			<div>
				{#if product.handmade}
					<span class="font-hand text-[22px] text-pink">pièce faite main ✦</span>
				{/if}
				<h1 class="mt-1 mb-0 text-[32px] leading-[1.02] font-semibold lg:text-[44px]">
					{product.name}
				</h1>
				<div class="mt-3 flex flex-wrap items-center gap-3.5">
					<span class="text-[26px] lg:text-[28px]">{formatPrice(unitPriceCents)}</span>
					{#if product.badge}
						<span
							class="rounded-[20px] border-[1.5px] border-ink bg-yellow-soft px-3 py-1 text-[13px]"
						>
							{product.badge}
						</span>
					{/if}
					{#if variant}
						<span class="text-[13.5px] text-ink/60">
							{variant.stock > 0 ? `${variant.stock} exemplaire(s)` : 'épuisé'}
						</span>
					{/if}
				</div>
				{#if product.reviewCount > 0}
					<div class="mt-2">
						<RatingStars rating={product.ratingAverage} count={product.reviewCount} />
					</div>
				{/if}
			</div>

			<p class="m-0 text-[15px] leading-[1.6] text-ink/80 lg:text-[16px]">
				{product.description}
			</p>

			<VariantPicker variants={product.variants} bind:selectedId={selectedVariantId} />

			<CustomizationPicker options={product.customizations} bind:selection />

			<div class="flex flex-col gap-3.5 sm:flex-row sm:items-center">
				<div
					class="flex items-center justify-between gap-[18px] rounded-[40px] border-[1.5px] border-ink px-5 py-3.5 text-[16px] sm:justify-start"
				>
					<button
						onclick={() => (quantity = Math.max(quantity - 1, 1))}
						class="cursor-pointer"
						aria-label="Moins"
					>
						−
					</button>
					<span>{quantity}</span>
					<button
						onclick={() => (quantity = Math.min(quantity + 1, 9))}
						class="cursor-pointer"
						aria-label="Plus"
					>
						+
					</button>
				</div>
				<ChunkyButton
					class="flex-1 shadow-[0_7px_0_var(--color-pink-deep)]"
					disabled={!variant || variant.stock <= 0}
					onclick={() => {
						if (!variant) {
							return;
						}

						if (missingRequired) {
							addError = 'Complète les options obligatoires avant d’ajouter au panier.';
							return;
						}

						addError = '';
						cart.add({
							variantId: variant.id,
							productSlug: product.slug,
							productName: product.name,
							variantLabel: variant.label,
							unitPriceCents,
							quantity,
							imageUrl: product.images[0]?.url ?? null,
							customization: product.customizations
								.filter((option) => selection[option.key])
								.map((option) => ({
									key: option.key,
									label: option.label,
									/* le panier affiche le libelle du choix, pas sa valeur technique */
									value:
										option.choices.find((choice) => choice.value === selection[option.key])
											?.label ?? selection[option.key]
								}))
						});
						ui.cartOpen = true;
					}}
				>
					Ajouter au panier — {formatPrice(unitPriceCents * quantity)}
				</ChunkyButton>
			</div>

			{#if addError}
				<span class="text-[13.5px] font-semibold text-pink-deep">{addError}</span>
			{/if}

			{#if product.attributeValues.length > 0}
				<ul
					class="m-0 flex list-none flex-wrap gap-2 border-t-[1.5px] border-ink/12 p-0 pt-4 text-[13.5px]"
				>
					{#each product.attributeValues as entry (entry.attributeValue.attribute.key + entry.attributeValue.value)}
						<li class="rounded-[20px] border-[1.5px] border-ink/25 px-3 py-1.5">
							{entry.attributeValue.attribute.label} : {entry.attributeValue.label}
						</li>
					{/each}
				</ul>
			{/if}

			<ul
				class="m-0 flex list-none flex-col gap-2 border-t-[1.5px] border-ink/12 p-0 pt-4 text-[14px] text-ink/70"
			>
				<li>✦ Expédition sous 3 jours ouvrés</li>
				<li>✦ Emballage fait main, réutilisable</li>
				<li>✦ Livraison offerte dès 60 €</li>
			</ul>
		</div>
	</div>

	{#if product.story}
		<section class="mt-12 rounded-[26px] bg-pink-pale px-6 py-8 lg:px-10 lg:py-10">
			<h2 class="mt-0 mb-3 text-[22px] font-semibold lg:text-[26px]">L’histoire de la pièce</h2>
			<p class="m-0 max-w-[70ch] text-[15px] leading-[1.65] text-ink/80">{product.story}</p>
		</section>
	{/if}

	<section class="mt-12 flex flex-col gap-6">
		<h2 class="m-0 text-[24px] font-semibold lg:text-[30px]">Les avis</h2>
		<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
			<ReviewList reviews={feedback.reviews} />
			{#if feedback.canReview}
				<ReviewForm productSlug={product.slug} />
			{:else}
				<p class="m-0 rounded-[20px] bg-yellow-soft px-5 py-4 text-[14.5px]">
					<a href={resolve('/sign')}>Connecte-toi</a> pour laisser un avis sur cette pièce.
				</p>
			{/if}
		</div>
	</section>

	{#if detail.related.length > 0}
		<section class="mt-12 flex flex-col gap-6">
			<h2 class="m-0 text-[24px] font-semibold lg:text-[30px]">Tu aimeras aussi</h2>
			<ProductGrid products={detail.related} compact />
		</section>
	{/if}
</div>
