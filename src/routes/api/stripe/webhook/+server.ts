import { error, json, type RequestHandler } from '@sveltejs/kit';
import { markOrderPaid, markOrderPaymentFailed } from '#lib/server/database/order';
import { constructWebhookEvent } from '#lib/server/utils/stripe';

/**
 * Seul endpoint HTTP du site : Stripe ne peut pas appeler une remote function.
 * La signature est verifiee sur le corps brut, et le traitement est idempotent.
 */
export const POST: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		error(400, 'Signature Stripe manquante.');
	}

	const payload = await request.text();

	let event;

	try {
		event = await constructWebhookEvent(payload, signature);
	} catch {
		error(400, 'Signature Stripe invalide.');
	}

	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object;

			if (session.payment_status === 'paid') {
				await markOrderPaid(
					session.id,
					typeof session.payment_intent === 'string' ? session.payment_intent : null
				);
			}
			break;
		}
		case 'checkout.session.async_payment_succeeded': {
			const session = event.data.object;
			await markOrderPaid(
				session.id,
				typeof session.payment_intent === 'string' ? session.payment_intent : null
			);
			break;
		}
		case 'checkout.session.async_payment_failed':
		case 'checkout.session.expired': {
			await markOrderPaymentFailed(event.data.object.id);
			break;
		}
	}

	return json({ received: true });
};
