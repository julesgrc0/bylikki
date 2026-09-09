import { error, json, type RequestHandler } from '@sveltejs/kit';
import {
	markOrderPaid,
	markOrderPaymentFailed,
	markOrderRefunded,
	type PaidOrder
} from '#lib/server/database/order';
import {
	buildOrderConfirmationMail,
	buildRefundMail,
	buildStockAlertMail,
	sendMailQuietly
} from '#lib/server/utils/mailer';
import { constructWebhookEvent } from '#lib/server/utils/stripe';
import { env } from '$env/dynamic/private';

/** Un webhook n'a pas de page d'origine : l'adresse publique vient de la configuration. */
function publicOrigin(requestOrigin: string) {
	return env.PUBLIC_ORIGIN ?? requestOrigin;
}

async function announcePaidOrder(order: PaidOrder, origin: string) {
	await sendMailQuietly({
		to: order.contactEmail,
		...buildOrderConfirmationMail({
			reference: order.reference,
			totalCents: order.totalCents,
			currency: order.currency,
			invoiceNumber: order.invoiceNumber,
			origin
		})
	});

	if (order.shortages.length > 0 && env.ADMIN_ALERT_EMAIL) {
		await sendMailQuietly({
			to: env.ADMIN_ALERT_EMAIL,
			...buildStockAlertMail({
				reference: order.reference,
				shortages: order.shortages,
				origin
			})
		});
	}
}

/**
 * Seul endpoint HTTP du site : Stripe ne peut pas appeler une remote function.
 * La signature est verifiee sur le corps brut, et le traitement est idempotent.
 * Les envois d'e-mails ne peuvent pas faire echouer la reponse : Stripe
 * rejouerait alors tout le traitement.
 */
export const POST: RequestHandler = async ({ request, url }) => {
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

	const origin = publicOrigin(url.origin);

	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object;

			if (session.payment_status === 'paid') {
				const order = await markOrderPaid(
					session.id,
					typeof session.payment_intent === 'string' ? session.payment_intent : null
				);

				if (order) {
					await announcePaidOrder(order, origin);
				}
			}
			break;
		}
		case 'checkout.session.async_payment_succeeded': {
			const session = event.data.object;
			const order = await markOrderPaid(
				session.id,
				typeof session.payment_intent === 'string' ? session.payment_intent : null
			);

			if (order) {
				await announcePaidOrder(order, origin);
			}
			break;
		}
		case 'checkout.session.async_payment_failed':
		case 'checkout.session.expired': {
			await markOrderPaymentFailed(event.data.object.id);
			break;
		}
		case 'charge.refunded': {
			const charge = event.data.object;
			const paymentIntentId =
				typeof charge.payment_intent === 'string' ? charge.payment_intent : null;

			if (paymentIntentId) {
				const order = await markOrderRefunded(paymentIntentId);

				if (order) {
					await sendMailQuietly({
						to: order.contactEmail,
						...buildRefundMail({
							reference: order.reference,
							totalCents: order.totalCents,
							currency: order.currency,
							origin
						})
					});
				}
			}
			break;
		}
	}

	return json({ received: true });
};
