<script lang="ts">
	import BeadWorkshop from '#lib/client/ui/BeadWorkshop.svelte';
	import GetToKnowMe from '#lib/client/ui/GetToKnowMe.svelte';
	import HeroCarousel from '#lib/client/ui/HeroCarousel.svelte';
	import ProductGrid from '#lib/client/ui/ProductGrid.svelte';
	import ReviewsSection from '#lib/client/ui/ReviewsSection.svelte';
	import UniversesSection from '#lib/client/ui/UniversesSection.svelte';
	import { getFeaturedProducts } from '#lib/remote/product.remote';
	import { getLatestReviews } from '#lib/remote/review.remote';
	import { resolve } from '$app/paths';

	/** Les deux requetes partent ensemble : la page part complete dans le HTML. */
	const [featured, reviews] = await Promise.all([getFeaturedProducts(), getLatestReviews()]);
</script>

<svelte:head>
	<title>BYLIKKI — des créations faites pour te ressembler</title>
	<meta
		name="description"
		content="Bijoux et pièces cousues faites main à Nantes, en petites séries. Personnalise ton bijou perle par perle."
	/>
</svelte:head>

<HeroCarousel products={featured} />

<UniversesSection />

{#if featured.length > 0}
	<section class="bg-cream px-5 py-12 lg:px-[70px] lg:py-[74px]">
		<div class="mb-6 flex flex-wrap items-end justify-between gap-3 lg:mb-[34px]">
			<h2 class="m-0 text-[28px] font-semibold lg:text-[46px]">Les pièces du moment</h2>
			<a href={resolve('/search')} class="border-b-[1.5px] border-ink pb-0.5 text-[14px] text-ink">
				Voir toute la boutique →
			</a>
		</div>
		<ProductGrid products={featured} />
	</section>
{/if}

<BeadWorkshop />

<ReviewsSection {reviews} />

<GetToKnowMe />
