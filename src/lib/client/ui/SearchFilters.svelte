<script lang="ts">
	import { formatPrice } from '#lib/client/utils/money';
	import type { SearchFilters } from '#lib/client/validation/search';
	import type { getFacets } from '#lib/remote/product.remote';

	type Facets = Awaited<ReturnType<typeof getFacets>>;

	let {
		facets,
		filters,
		onchange
	}: {
		facets: Facets;
		filters: SearchFilters;
		onchange: (patch: Partial<SearchFilters>) => void;
	} = $props();

	function toggle(list: string[], value: string) {
		return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
	}

	function toCents(value: string) {
		const parsed = Number.parseFloat(value.replace(',', '.'));

		return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
	}

	const activeCount = $derived(
		filters.categories.length +
			filters.attributes.length +
			(filters.inStockOnly ? 1 : 0) +
			(filters.priceMinCents !== null || filters.priceMaxCents !== null ? 1 : 0)
	);
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<h2 class="m-0 text-[20px] font-semibold">Filtrer</h2>
		{#if activeCount > 0}
			<button
				onclick={() =>
					onchange({
						categories: [],
						attributes: [],
						priceMinCents: null,
						priceMaxCents: null,
						inStockOnly: false,
						page: 1
					})}
				class="cursor-pointer border-b-[1.5px] border-ink/40 pb-px text-[13px] text-ink/75"
			>
				Tout effacer ({activeCount})
			</button>
		{/if}
	</div>

	{#if facets.categories.length > 0}
		<fieldset class="m-0 border-0 p-0">
			<legend class="mb-2.5 p-0 text-[12px] tracking-[0.14em] text-ink/55 uppercase">
				Univers
			</legend>
			<div class="flex flex-wrap gap-2">
				{#each facets.categories as category (category.slug)}
					<button
						onclick={() =>
							onchange({ categories: toggle(filters.categories, category.slug), page: 1 })}
						aria-pressed={filters.categories.includes(category.slug)}
						class="cursor-pointer rounded-[40px] border-[1.5px] border-ink px-4 py-2 text-[13.5px] font-semibold transition-colors {filters.categories.includes(
							category.slug
						)
							? 'bg-yellow'
							: 'hover:bg-yellow-soft'}"
					>
						{category.name} <span class="opacity-55">{category.count}</span>
					</button>
				{/each}
			</div>
		</fieldset>
	{/if}

	{#each facets.attributes as attribute (attribute.key)}
		<fieldset class="m-0 border-0 p-0">
			<legend class="mb-2.5 p-0 text-[12px] tracking-[0.14em] text-ink/55 uppercase">
				{attribute.label}
			</legend>
			<div class="flex flex-wrap gap-2">
				{#each attribute.values as option (option.value)}
					{@const token = `${attribute.key}:${option.value}`}
					{@const active = filters.attributes.includes(token)}
					<button
						onclick={() => onchange({ attributes: toggle(filters.attributes, token), page: 1 })}
						aria-pressed={active}
						title={`${option.label} (${option.count})`}
						class="flex cursor-pointer items-center gap-2 rounded-[40px] border-[1.5px] border-ink px-3.5 py-2 text-[13.5px] transition-colors {active
							? 'bg-pink text-white'
							: 'hover:bg-pink-pale'}"
					>
						{#if attribute.kind === 'COLOR' && option.hexColor}
							<span
								class="h-4 w-4 rounded-full border border-ink/40"
								style="background:{option.hexColor}"
							></span>
						{/if}
						<span>{option.label}{attribute.unit ? ` ${attribute.unit}` : ''}</span>
						<span class="opacity-60">{option.count}</span>
					</button>
				{/each}
			</div>
		</fieldset>
	{/each}

	<fieldset class="m-0 border-0 p-0">
		<legend class="mb-2.5 p-0 text-[12px] tracking-[0.14em] text-ink/55 uppercase">Prix</legend>
		<div class="flex items-center gap-2.5">
			<label class="flex-1">
				<span class="sr-only">Prix minimum</span>
				<input
					type="number"
					min="0"
					step="1"
					inputmode="decimal"
					placeholder={String(Math.floor(facets.priceMinCents / 100))}
					value={filters.priceMinCents === null ? '' : filters.priceMinCents / 100}
					onchange={(event) =>
						onchange({ priceMinCents: toCents(event.currentTarget.value), page: 1 })}
					class="w-full rounded-[16px] border-[1.5px] border-ink/25 bg-paper px-4 py-3 text-[15px] outline-none focus:border-pink"
				/>
			</label>
			<span class="text-ink/50">—</span>
			<label class="flex-1">
				<span class="sr-only">Prix maximum</span>
				<input
					type="number"
					min="0"
					step="1"
					inputmode="decimal"
					placeholder={String(Math.ceil(facets.priceMaxCents / 100))}
					value={filters.priceMaxCents === null ? '' : filters.priceMaxCents / 100}
					onchange={(event) =>
						onchange({ priceMaxCents: toCents(event.currentTarget.value), page: 1 })}
					class="w-full rounded-[16px] border-[1.5px] border-ink/25 bg-paper px-4 py-3 text-[15px] outline-none focus:border-pink"
				/>
			</label>
		</div>
		<p class="mt-2 mb-0 text-[12.5px] text-ink/55">
			Catalogue de {formatPrice(facets.priceMinCents)} à {formatPrice(facets.priceMaxCents)}
		</p>
	</fieldset>

	<label class="flex cursor-pointer items-center gap-3 text-[15px]">
		<input
			type="checkbox"
			checked={filters.inStockOnly}
			onchange={(event) => onchange({ inStockOnly: event.currentTarget.checked, page: 1 })}
			class="h-5 w-5 accent-pink"
		/>
		Disponible tout de suite
	</label>
</div>
