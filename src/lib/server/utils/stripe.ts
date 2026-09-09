import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

let client: Stripe | null = null;

export function getStripe() {
	if (!env.STRIPE_SECRET_KEY) {
		throw new Error('STRIPE_SECRET_KEY est absent : le paiement ne peut pas etre initialise.');
	}

	client ??= new Stripe(env.STRIPE_SECRET_KEY);

	return client;
}

export function isStripeConfigured() {
	return Boolean(env.STRIPE_SECRET_KEY);
}

type CheckoutInput = {
	reference: string;
	currency: string;
	customerEmail: string;
	shippingCents: number;
	lines: { name: string; description: string | null; unitPriceCents: number; quantity: number }[];
	successUrl: string;
	cancelUrl: string;
};

/**
 * Checkout heberge par Stripe : aucune donnee bancaire ne transite par
 * l'application, ce qui reduit d'autant la surface a securiser.
 */
export async function createCheckoutSession(input: CheckoutInput) {
	const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = input.lines.map((line) => ({
		quantity: line.quantity,
		price_data: {
			currency: input.currency.toLowerCase(),
			unit_amount: line.unitPriceCents,
			product_data: {
				name: line.name,
				...(line.description ? { description: line.description } : {})
			}
		}
	}));

	if (input.shippingCents > 0) {
		lineItems.push({
			quantity: 1,
			price_data: {
				currency: input.currency.toLowerCase(),
				unit_amount: input.shippingCents,
				product_data: { name: 'Livraison' }
			}
		});
	}

	return getStripe().checkout.sessions.create({
		mode: 'payment',
		line_items: lineItems,
		customer_email: input.customerEmail,
		client_reference_id: input.reference,
		metadata: { orderReference: input.reference },
		success_url: input.successUrl,
		cancel_url: input.cancelUrl
	});
}

export function constructWebhookEvent(payload: string, signature: string) {
	if (!env.STRIPE_WEBHOOK_SECRET) {
		throw new Error('STRIPE_WEBHOOK_SECRET est absent : le webhook ne peut pas etre verifie.');
	}

	return getStripe().webhooks.constructEventAsync(payload, signature, env.STRIPE_WEBHOOK_SECRET);
}
