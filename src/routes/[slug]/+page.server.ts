import { error } from '@sveltejs/kit';
import { findProductIdBySlug } from '#lib/server/database/product';
import type { PageServerLoad } from './$types';

/**
 * Verifie l'existence de la fiche avant tout rendu : une piece retiree de la
 * vente doit repondre 404, et non une page vide. Le contenu et les
 * metadonnees viennent ensuite des remote functions, attendues au rendu.
 */
export const load: PageServerLoad = async ({ params }) => {
	const product = await findProductIdBySlug(params.slug);

	if (!product) {
		error(404, "Cette création n'existe pas ou n'est plus en ligne.");
	}

	return { slug: product.slug };
};
