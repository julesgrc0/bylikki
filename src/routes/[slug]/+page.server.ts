import { error } from '@sveltejs/kit';
import { findProductIdBySlug } from '#lib/server/database/product';
import type { PageServerLoad } from './$types';

/**
 * Metadonnees de la page rendues cote serveur : le titre et la description
 * doivent exister des le premier octet, y compris pour les moteurs de recherche.
 * Le contenu de la fiche, lui, passe par les remote functions.
 */
export const load: PageServerLoad = async ({ params }) => {
	const product = await findProductIdBySlug(params.slug);

	if (!product) {
		error(404, "Cette création n'existe pas ou n'est plus en ligne.");
	}

	return { name: product.name, summary: product.summary };
};
