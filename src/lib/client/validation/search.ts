import * as v from 'valibot';

export const productSorts = [
	'pertinence',
	'nouveautes',
	'prix-croissant',
	'prix-decroissant',
	'avis'
] as const;

export type ProductSort = (typeof productSorts)[number];

export const sortLabels: Record<ProductSort, string> = {
	pertinence: 'Pertinence',
	nouveautes: 'Nouveautés',
	'prix-croissant': 'Prix croissant',
	'prix-decroissant': 'Prix décroissant',
	avis: 'Mieux notés'
};

const positiveCents = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(10_000_000));

export const searchFiltersSchema = v.object({
	query: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120)), ''),
	categories: v.optional(v.array(v.pipe(v.string(), v.maxLength(80))), []),
	/** Facettes selectionnees, au format `cleAttribut:valeur` */
	attributes: v.optional(v.array(v.pipe(v.string(), v.maxLength(160))), []),
	priceMinCents: v.optional(v.nullable(positiveCents), null),
	priceMaxCents: v.optional(v.nullable(positiveCents), null),
	inStockOnly: v.optional(v.boolean(), false),
	sort: v.optional(v.picklist(productSorts), 'pertinence'),
	page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(500)), 1)
});

export type SearchFilters = v.InferOutput<typeof searchFiltersSchema>;

export const suggestionSchema = v.pipe(v.string(), v.trim(), v.maxLength(120));

export const emptyFilters: SearchFilters = {
	query: '',
	categories: [],
	attributes: [],
	priceMinCents: null,
	priceMaxCents: null,
	inStockOnly: false,
	sort: 'pertinence',
	page: 1
};
