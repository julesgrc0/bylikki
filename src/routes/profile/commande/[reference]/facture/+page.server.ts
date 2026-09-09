import { error, redirect } from '@sveltejs/kit';
import { findUserOrder } from '#lib/server/database/order';
import { buildInvoice } from '#lib/server/utils/invoice';
import { orderReferenceSchema } from '#lib/server/validation/order';
import * as v from 'valibot';
import type { PageServerLoad } from './$types';

/**
 * La facture est un document nominatif : elle est chargee cote serveur, pour
 * la seule personne connectee proprietaire de la commande.
 */
export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(303, '/sign');
	}

	const reference = v.safeParse(orderReferenceSchema, params.reference);

	if (!reference.success) {
		error(404, 'Cette commande est introuvable.');
	}

	const order = await findUserOrder(locals.user.id, reference.output);

	if (!order) {
		error(404, 'Cette commande est introuvable.');
	}

	if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'REFUNDED') {
		error(409, "Cette commande n'a pas encore été payée : aucune facture n'a été émise.");
	}

	return { invoice: buildInvoice(order) };
};
