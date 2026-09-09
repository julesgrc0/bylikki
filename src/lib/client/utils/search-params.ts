import {
	emptyFilters,
	productSorts,
	type ProductSort,
	type SearchFilters
} from '#lib/client/validation/search';

function toCents(value: string | null) {
	if (!value) {
		return null;
	}

	const parsed = Number.parseFloat(value.replace(',', '.'));

	return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

/** L'etat de la recherche vit dans l'URL : partageable, rechargeable, historisable. */
export function filtersFromSearchParams(params: URLSearchParams): SearchFilters {
	const sort = params.get('sort');
	const page = Number.parseInt(params.get('page') ?? '1', 10);

	return {
		...emptyFilters,
		query: params.get('query')?.slice(0, 120) ?? '',
		categories: params.getAll('category'),
		attributes: params.getAll('attr'),
		priceMinCents: toCents(params.get('min')),
		priceMaxCents: toCents(params.get('max')),
		inStockOnly: params.get('stock') === '1',
		sort: productSorts.includes(sort as ProductSort) ? (sort as ProductSort) : 'pertinence',
		page: Number.isFinite(page) && page > 0 ? page : 1
	};
}

export function searchParamsFromFilters(filters: SearchFilters) {
	const params = new URLSearchParams();

	if (filters.query) {
		params.set('query', filters.query);
	}

	for (const category of filters.categories) {
		params.append('category', category);
	}

	for (const attribute of filters.attributes) {
		params.append('attr', attribute);
	}

	if (filters.priceMinCents !== null) {
		params.set('min', String(filters.priceMinCents / 100));
	}

	if (filters.priceMaxCents !== null) {
		params.set('max', String(filters.priceMaxCents / 100));
	}

	if (filters.inStockOnly) {
		params.set('stock', '1');
	}

	if (filters.sort !== 'pertinence') {
		params.set('sort', filters.sort);
	}

	if (filters.page > 1) {
		params.set('page', String(filters.page));
	}

	return params;
}
