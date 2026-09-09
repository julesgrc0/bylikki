<script lang="ts">
	import type { ProductCardData } from '#lib/client/types';
	import { formatPriceRange } from '#lib/client/utils/money';
	import { resolve } from '$app/paths';
	import PhotoPlaceholder from './PhotoPlaceholder.svelte';

	let { product, compact = false }: { product: ProductCardData; compact?: boolean } = $props();

	const price = $derived(formatPriceRange(product.priceFromCents, product.priceToCents));
</script>

<a
	href={resolve('/[slug]', { slug: product.slug })}
	class="flex h-full w-full flex-col border-2 border-ink bg-paper transition-transform duration-200 hover:-translate-y-1 {compact
		? 'rounded-[22px] p-3 shadow-[10px_12px_0_rgba(46,27,51,.13)]'
		: 'rounded-[28px] p-4 shadow-[14px_16px_0_rgba(46,27,51,.13)]'}"
>
	<div class="relative flex-1">
		{#if product.image}
			<img
				src={product.image.url}
				alt={product.image.alt || product.name}
				loading="lazy"
				class="h-full w-full object-cover {compact ? 'rounded-[14px]' : 'rounded-[18px]'}"
			/>
		{:else}
			<PhotoPlaceholder
				label={product.name}
				tint="rgba(240,54,155,.13)"
				radius={compact ? '14px' : '18px'}
				class="h-full min-h-[150px]"
			/>
		{/if}

		{#if product.badge}
			<span
				class="absolute top-2.5 left-2.5 rounded-[20px] border-[1.5px] border-ink bg-yellow px-2.5 py-[3px] text-[9px] tracking-[0.1em] uppercase lg:top-3.5 lg:left-3.5 lg:px-3 lg:py-1 lg:text-[11px]"
			>
				{product.badge}
			</span>
		{/if}

		{#if !product.inStock}
			<span
				class="absolute right-2.5 bottom-2.5 rounded-[20px] border-[1.5px] border-ink bg-paper px-3 py-1 text-[11px] font-semibold"
			>
				Épuisé
			</span>
		{/if}
	</div>

	<div
		class="flex items-end justify-between gap-2 {compact
			? 'px-1 pt-2.5 pb-0.5'
			: 'px-1.5 pt-4 pb-1'}"
	>
		<div class="min-w-0">
			<div class="leading-[1.1] font-semibold {compact ? 'text-[15px]' : 'text-[23px]'}">
				{product.name}
			</div>
			{#if !compact && product.summary}
				<div class="mt-0.5 truncate text-[13px] text-ink/60">{product.summary}</div>
			{/if}
			{#if !compact && product.reviewCount > 0}
				<div class="mt-1 text-[12.5px] text-ink/55">
					<span class="text-pink">★</span>
					{product.ratingAverage.toFixed(1)} · {product.reviewCount} avis
				</div>
			{/if}
		</div>
		<div class="whitespace-nowrap {compact ? 'text-[15px]' : 'text-[22px]'}">{price}</div>
	</div>
</a>
