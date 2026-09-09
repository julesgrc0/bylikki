import { error } from '@sveltejs/kit';
import { cartLineSchema, checkoutSchema } from '#lib/client/validation/cart';
import { priceCartLines } from '#lib/server/database/cart';
import {
	attachStripeSession,
	cancelUserOrder,
	computeShippingCents,
	createPendingOrder,
	findOrderMailContext,
	findUserOrder,
	listUserOrders
} from '#lib/server/database/order';
import { getSetting } from '#lib/server/database/settings';
import { findAddress } from '#lib/server/database/user';
import { requireUser } from '#lib/server/security/guard';
import { consumeRateLimit } from '#lib/server/security/rate-limit';
import { buildCancellationMail, sendMailQuietly } from '#lib/server/utils/mailer';
import { createCheckoutSession, isStripeConfigured } from '#lib/server/utils/stripe';
import { orderReferenceSchema } from '#lib/server/validation/order';
import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';

const cartSchema = v.pipe(v.array(cartLineSchema), v.maxLength(40));

/** Panier revalide cote serveur : prix, stock et personnalisations. */
export const getCartDetails = query(cartSchema, async (lines) => {
	const cart = await priceCartLines(lines);
	const shippingCents = await computeShippingCents(cart.subtotalCents);

	return {
		lines: cart.lines,
		issues: cart.issues,
		subtotalCents: cart.subtotalCents,
		shippingCents,
		totalCents: cart.subtotalCents + shippingCents,
		currency: cart.currency
	};
});

export const getMyOrders = query(async () => {
	const user = requireUser();

	return listUserOrders(user.id);
});

export const getMyOrder = query(orderReferenceSchema, async (reference) => {
	const user = requireUser();
	const order = await findUserOrder(user.id, reference);

	if (!order) {
		error(404, 'Cette commande est introuvable.');
	}

	return order;
});

/**
 * Cree la commande en attente de paiement puis delegue l'encaissement a
 * Stripe Checkout : aucune donnee bancaire ne transite par le site.
 */
export const startCheckout = command(checkoutSchema, async ({ addressId, lines }) => {
	const user = requireUser();

	/** Chaque tentative cree une commande et une session Stripe : on borne. */
	const quota = await consumeRateLimit({ bucket: 'checkout', subject: user.id, limit: 20 });

	if (!quota.allowed) {
		error(429, 'Trop de tentatives de paiement. Reviens dans une heure.');
	}

	/** Mode vacances : la boutique reste consultable, l'encaissement est suspendu. */
	const vacation = await getSetting('vacation');

	if (vacation.enabled) {
		error(503, vacation.message);
	}

	if (!isStripeConfigured()) {
		error(503, "Le paiement en ligne n'est pas disponible pour le moment.");
	}

	const address = await findAddress(user.id, addressId);

	if (!address) {
		error(400, 'Choisis une adresse de livraison valide.');
	}

	const cart = await priceCartLines(lines);

	if (cart.issues.length > 0) {
		return { status: 'invalid' as const, issues: cart.issues };
	}

	if (cart.lines.length === 0) {
		error(400, 'Ton panier est vide.');
	}

	const order = await createPendingOrder({
		userId: user.id,
		contactEmail: user.email,
		address: {
			fullName: address.fullName,
			line1: address.line1,
			line2: address.line2,
			postalCode: address.postalCode,
			city: address.city,
			country: address.country
		},
		lines: cart.lines,
		currency: cart.currency
	});

	const origin = getRequestEvent().url.origin;
	const session = await createCheckoutSession({
		reference: order.reference,
		currency: order.currency,
		customerEmail: user.email,
		shippingCents: order.shippingCents,
		lines: cart.lines.map((line) => ({
			name: line.productName,
			description: [line.variantLabel, ...line.customization.map((entry) => entry.value)]
				.filter(Boolean)
				.join(' · '),
			unitPriceCents: line.unitPriceCents,
			quantity: line.quantity
		})),
		successUrl: `${origin}/profile?commande=${order.reference}`,
		cancelUrl: `${origin}/profile?paiement=annule`
	});

	if (!session.url) {
		error(502, "Le paiement n'a pas pu être initialisé.");
	}

	await attachStripeSession(order.id, session.id);

	return { status: 'redirect' as const, url: session.url, reference: order.reference };
});

export const cancelMyOrder = command(orderReferenceSchema, async (reference) => {
	const user = requireUser();
	const cancelled = await cancelUserOrder(user.id, reference);

	if (cancelled.count === 0) {
		error(409, 'Cette commande ne peut plus être annulée depuis le site.');
	}

	const order = await findOrderMailContext(reference);

	if (order) {
		await sendMailQuietly({
			to: order.contactEmail,
			...buildCancellationMail({
				reference: order.reference,
				totalCents: order.totalCents,
				currency: order.currency,
				origin: getRequestEvent().url.origin
			})
		});
	}

	await getMyOrders().refresh();

	return { cancelled: true };
});
