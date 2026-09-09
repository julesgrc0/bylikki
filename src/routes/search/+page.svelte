<script lang="ts">
	import EmptyState from '#lib/client/ui/EmptyState.svelte';
	import Pagination from '#lib/client/ui/Pagination.svelte';
	import ProductGrid from '#lib/client/ui/ProductGrid.svelte';
	import SearchFilters from '#lib/client/ui/SearchFilters.svelte';
	import SeoHead from '#lib/client/ui/SeoHead.svelte';
	import {
		filtersFromSearchParams,
		searchParamsFromFilters
	} from '#lib/client/utils/search-params';
	import {
		productSorts,
		sortLabels,
		type SearchFilters as Filters
	} from '#lib/client/validation/search';
	import { getFacets, searchCatalogue } from '#lib/remote/product.remote';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const filters = $derived(filtersFromSearchParams(page.url.searchParams));
	/** Le rendu attend les donnees : la boutique part complete dans le HTML. */
	const results = $derived(await searchCatalogue(filters));
	const facets = $derived(await getFacets(filters));

	/**
	 * Les combinaisons de filtres creent une infinite d'URL equivalentes : seule
	 * la recherche par mot-cle reste indexable, le reste pointe vers la boutique.
	 */
	const isFiltered = $derived(
		filters.categories.length > 0 ||
			filters.attributes.length > 0 ||
			filters.priceMinCents !== null ||
			filters.priceMaxCents !== null ||
			filters.inStockOnly ||
			filters.sort !== 'pertinence' ||
			filters.page > 1
	);
	const canonical = $derived(
		`${page.url.origin}/search${filters.query ? `?query=${encodeURIComponent(filters.query)}` : ''}`
	);

	let panelOpen = $state(false);

	/** Toute modification de filtre passe par l'URL, jamais par un etat local. */
	async function apply(patch: Partial<Filters>) {
		const next = { ...filters, ...patch };
		const params = searchParamsFromFilters(next);
		const queryString = params.toString();

		await goto(resolve(queryString ? `/search?${queryString}` : '/search'), {
			keepFocus: true,
			noScroll: patch.page === undefined
		});
	}
</script>

<SeoHead
	title={filters.query ? `${filters.query} — recherche — BYLIKKI` : 'La boutique — BYLIKKI'}
	description="Cherche parmi les créations faites main de l’atelier Bylikki."
	{canonical}
	noindex={isFiltered}
/>

<div class="px-5 pt-8 pb-16 lg:px-[70px] lg:pt-12 lg:pb-20">
	<div class="mb-6 flex flex-col gap-2.5 lg:mb-9">
		<span class="font-hand text-[24px] text-pink lg:text-[27px]">tout est fait main ✦</span>
		<h1 class="m-0 text-[32px] leading-[1.04] font-semibold lg:text-[46px]">
			{filters.query ? `« ${filters.query} »` : 'La boutique'}
		</h1>
		<span class="text-[14.5px] text-ink/70">
			{results.total} création{results.total > 1 ? 's' : ''} trouvée{results.total > 1 ? 's' : ''}
		</span>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3">
		<button
			onclick={() => (panelOpen = !panelOpen)}
			class="cursor-pointer rounded-[40px] border-[1.5px] border-ink px-5 py-2.5 text-[14px] font-semibold lg:hidden"
			aria-expanded={panelOpen}
		>
			{panelOpen ? 'Masquer les filtres' : 'Filtrer et trier'}
		</button>

		<label class="ml-auto flex items-center gap-2.5 text-[14px]">
			<span class="text-ink/60">Trier par</span>
			<select
				value={filters.sort}
				onchange={(event) => apply({ sort: event.currentTarget.value as Filters['sort'], page: 1 })}
				class="cursor-pointer rounded-[40px] border-[1.5px] border-ink bg-paper px-4 py-2.5 text-[14px] font-semibold outline-none"
			>
				{#each productSorts as sort (sort)}
					<option value={sort}>{sortLabels[sort]}</option>
				{/each}
			</select>
		</label>
	</div>

	<div class="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
		<aside class="{panelOpen ? 'block' : 'hidden'} lg:sticky lg:top-28 lg:block">
			<SearchFilters {facets} {filters} onchange={apply} />
		</aside>

		<div class="flex flex-col gap-8">
			{#if results.items.length === 0}
				<EmptyState
					title="rien ne correspond ✦"
					description="Essaie avec moins de filtres, ou un mot plus simple : « collier », « trousse », « rose »."
				>
					<a
						href={resolve('/search')}
						class="rounded-[40px] bg-ink px-6 py-3.5 text-[15px] text-cream"
					>
						Voir toute la boutique →
					</a>
				</EmptyState>
			{:else}
				<ProductGrid products={results.items} />
				<Pagination
					page={results.page}
					pageCount={results.pageCount}
					onselect={(next) => apply({ page: next })}
				/>
			{/if}
		</div>
	</div>
</div>
