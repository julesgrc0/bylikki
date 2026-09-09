import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Confort de navigation uniquement : le controle d'acces reel est fait par
 * chaque remote function appelee depuis cette page.
 */
export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, '/sign');
	}

	return {
		orderReference: url.searchParams.get('commande'),
		paymentCancelled: url.searchParams.get('paiement') === 'annule'
	};
};
