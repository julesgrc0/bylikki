<script lang="ts">
	import type { ProductCardData } from '#lib/client/types';
	import ProductCard from './ProductCard.svelte';

	let { products, compact = false }: { products: ProductCardData[]; compact?: boolean } = $props();
</script>

<div
	class="grid grid-cols-2 gap-4 lg:gap-[26px] {compact
		? 'lg:grid-cols-4'
		: 'md:grid-cols-3 lg:grid-cols-4'}"
>
	{#each products as product (product.slug)}
		<ProductCard {product} {compact} />
	{/each}
</div>
