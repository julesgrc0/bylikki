import { error } from '@sveltejs/kit';
import { searchFiltersSchema, suggestionSchema } from '#lib/client/validation/search';
import { countEvent, recordSearchMiss } from '#lib/server/database/metrics';
import {
	findProductBySlug,
	getSearchFacets,
	listBoughtTogether,
	listFeaturedProducts,
	listRelatedProducts,
	searchProducts,
	suggestProducts
} from '#lib/server/database/product';
import * as v from 'valibot';
import { query } from '$app/server';

const slugSchema = v.pipe(v.string(), v.trim(), v.maxLength(120), v.minLength(1));

export const getFeaturedProducts = query(async () => listFeaturedProducts());

export const getProduct = query(slugSchema, async (slug) => {
	const product = await findProductBySlug(slug);

	if (!product) {
		error(404, "Cette création n'existe pas ou n'est plus en ligne.");
	}

	const [related, boughtTogether] = await Promise.all([
		listRelatedProducts(
			product.id,
			product.categories.map((category) => category.slug)
		),
		listBoughtTogether(product.id)
	]);

	/** Mesure agregee, sans identifiant : elle n'attend pas la reponse. */
	void countEvent('product_view');

	return { product, related, boughtTogether };
});

export const searchCatalogue = query(searchFiltersSchema, async (filters) => {
	const results = await searchProducts(filters);

	if (filters.query !== '') {
		void countEvent('search');

		/** Une recherche sans resultat dit ce qui manque au catalogue. */
		if (results.items.length === 0) {
			void recordSearchMiss(filters.query);
		}
	}

	return results;
});

export const getFacets = query(searchFiltersSchema, async (filters) => getSearchFacets(filters));

/** Suggestions de la barre de recherche : volontairement legeres et rapides. */
export const suggest = query(suggestionSchema, async (term) => {
	if (term.length < 2) {
		return [];
	}

	return suggestProducts(term);
});
