import { error } from '@sveltejs/kit';
import { RETURN_WINDOW_DAYS, returnRequestSchema } from '#lib/client/validation/returns';
import {
	createReturnRequest,
	findReturnableOrder,
	listMyReturns
} from '#lib/server/database/returns';
import ReturnReceivedEmail from '#lib/server/emails/ReturnReceived.svelte';
import { requireUser } from '#lib/server/security/guard';
import { consumeRateLimit } from '#lib/server/security/rate-limit';
import { renderEmail, sendMailQuietly } from '#lib/server/utils/mailer';
import { orderReferenceSchema } from '#lib/server/validation/order';
import { command, getRequestEvent, query } from '$app/server';

export const getReturnableOrder = query(orderReferenceSchema, async (reference) => {
	const user = requireUser();
	const order = await findReturnableOrder(user.id, reference);

	if (!order) {
		error(404, 'Cette commande est introuvable.');
	}

	return order;
});

export const getMyReturns = query(async () => {
	const user = requireUser();

	return listMyReturns(user.id);
});

/**
 * Les regles annoncees dans les CGV sont appliquees ici, et pas seulement
 * affichees : commande livree, delai de quatorze jours, une seule demande
 * ouverte, et les pieces personnalisees exclues sauf defaut constate.
 */
export const requestReturn = command(
	returnRequestSchema,
	async ({ reference, reason, comment, orderItemIds }) => {
		const user = requireUser();

		const quota = await consumeRateLimit({ bucket: 'return-request', subject: user.id, limit: 10 });

		if (!quota.allowed) {
			error(429, 'Trop de demandes de retour. Reviens dans une heure.');
		}

		const order = await findReturnableOrder(user.id, reference);

		if (!order) {
			error(404, 'Cette commande est introuvable.');
		}

		if (order.status !== 'DELIVERED') {
			error(409, 'Un retour se demande une fois la commande livrée.');
		}

		if (!order.withinWindow) {
			error(409, `Le délai de ${RETURN_WINDOW_DAYS} jours après réception est dépassé.`);
		}

		if (order.hasOpenRequest) {
			error(409, 'Une demande de retour est déjà en cours pour cette commande.');
		}

		const chosen = order.items.filter((item) => orderItemIds.includes(item.id));

		if (chosen.length !== orderItemIds.length) {
			error(400, 'Une des pièces choisies n’appartient pas à cette commande.');
		}

		const personalised = chosen.filter((item) => item.personalised);

		if (personalised.length > 0 && reason !== 'DEFECT') {
			error(
				409,
				'Les pièces personnalisées ne peuvent être retournées qu’en cas de défaut. Décris-le nous et on regarde ça ensemble.'
			);
		}

		const created = await createReturnRequest({
			orderId: order.id,
			userId: user.id,
			reason,
			comment,
			items: chosen.map((item) => ({ orderItemId: item.id, quantity: item.quantity }))
		});

		await sendMailQuietly({
			to: user.email,
			subject: `Demande de retour reçue — ${order.reference}`,
			...renderEmail(ReturnReceivedEmail, {
				reference: order.reference,
				pieces: chosen.map((item) => `${item.productName} · ${item.variantLabel}`),
				origin: getRequestEvent().url.origin
			})
		});

		await getMyReturns().refresh();
		await getReturnableOrder(reference).refresh();

		return { status: 'requested' as const, id: created.id };
	}
);
