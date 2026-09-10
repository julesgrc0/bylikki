import { invalid } from '@sveltejs/kit';
import { trackingSchema } from '#lib/client/validation/tracking';
import { findPublicOrder } from '#lib/server/database/tracking';
import { hashClientAddress } from '#lib/server/security/hash';
import { consumeRateLimit } from '#lib/server/security/rate-limit';
import { form, getRequestEvent } from '$app/server';

/**
 * Suivre sa commande sans se connecter. La limitation de debit est ici une
 * protection reelle et non un confort : sans elle, on pourrait balayer les
 * references en essayant des adresses. La reponse ne distingue jamais « cette
 * commande n'existe pas » de « cette adresse ne correspond pas ».
 */
export const trackOrder = form(trackingSchema, async ({ reference, email }, issue) => {
	const quota = await consumeRateLimit({
		bucket: 'order-tracking',
		subject: hashClientAddress(getRequestEvent()),
		limit: 20
	});

	if (!quota.allowed) {
		invalid(issue.reference('Trop de recherches. Reviens dans une heure.'));
	}

	const order = await findPublicOrder(reference, email);

	if (!order) {
		invalid(
			issue.reference('Aucune commande ne correspond à cette référence et à cette adresse e-mail.')
		);
	}

	return { order };
});
