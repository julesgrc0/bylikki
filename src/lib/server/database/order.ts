import { settingDefaults } from '#lib/client/validation/settings';
import type { Prisma } from '$prisma/client';
import { generateOrderReference } from '../utils/reference';
import { prisma } from './client';
import { getSetting } from './settings';

const INVOICE_COUNTER = 'invoice';

/** Valeurs de repli : les montants reels viennent des reglages de la boutique. */
export const SHIPPING_FLAT_CENTS = settingDefaults.shipping.flatCents;
export const FREE_SHIPPING_THRESHOLD_CENTS = settingDefaults.shipping.freeThresholdCents;

export type CheckoutLine = {
	variantId: string;
	quantity: number;
	customization: { key: string; label: string; value: string; priceDeltaCents: number }[];
};

export type ShippingAddressSnapshot = {
	fullName: string;
	line1: string;
	line2: string | null;
	postalCode: string;
	city: string;
	country: string;
};

const orderSelect = {
	id: true,
	reference: true,
	contactEmail: true,
	status: true,
	paymentStatus: true,
	subtotalCents: true,
	shippingCents: true,
	totalCents: true,
	currency: true,
	shippingFullName: true,
	shippingLine1: true,
	shippingLine2: true,
	shippingPostalCode: true,
	shippingCity: true,
	shippingCountry: true,
	trackingNumber: true,
	invoiceNumber: true,
	invoicedAt: true,
	needsAttention: true,
	attentionReason: true,
	createdAt: true,
	paidAt: true,
	shippedAt: true,
	deliveredAt: true,
	cancelledAt: true,
	items: {
		select: {
			id: true,
			productSlug: true,
			productName: true,
			variantLabel: true,
			unitPriceCents: true,
			quantity: true,
			totalCents: true,
			customization: true
		}
	}
} as const;

export type OrderSummary = Awaited<ReturnType<typeof listUserOrders>>[number];

/** Calcul pur, teste isolement : les montants sont fournis par l'appelant. */
export function shippingCentsFor(
	subtotalCents: number,
	shipping: { flatCents: number; freeThresholdCents: number }
) {
	return subtotalCents >= shipping.freeThresholdCents ? 0 : shipping.flatCents;
}

export async function computeShippingCents(subtotalCents: number) {
	return shippingCentsFor(subtotalCents, await getSetting('shipping'));
}

export type PricedLine = {
	variantId: string;
	productId: string;
	productSlug: string;
	productName: string;
	variantLabel: string;
	unitPriceCents: number;
	quantity: number;
	customization: CheckoutLine['customization'];
};

export async function createPendingOrder(input: {
	userId: string;
	contactEmail: string;
	address: ShippingAddressSnapshot;
	lines: PricedLine[];
	currency: string;
}) {
	const subtotalCents = input.lines.reduce(
		(total, line) => total + line.unitPriceCents * line.quantity,
		0
	);
	const shippingCents = await computeShippingCents(subtotalCents);

	return prisma.order.create({
		data: {
			reference: generateOrderReference(),
			userId: input.userId,
			contactEmail: input.contactEmail,
			subtotalCents,
			shippingCents,
			totalCents: subtotalCents + shippingCents,
			currency: input.currency,
			shippingFullName: input.address.fullName,
			shippingLine1: input.address.line1,
			shippingLine2: input.address.line2,
			shippingPostalCode: input.address.postalCode,
			shippingCity: input.address.city,
			shippingCountry: input.address.country,
			items: {
				create: input.lines.map((line) => ({
					productId: line.productId,
					variantId: line.variantId,
					productSlug: line.productSlug,
					productName: line.productName,
					variantLabel: line.variantLabel,
					unitPriceCents: line.unitPriceCents,
					quantity: line.quantity,
					totalCents: line.unitPriceCents * line.quantity,
					customization: line.customization.length > 0 ? line.customization : undefined
				}))
			}
		},
		select: orderSelect
	});
}

export function attachStripeSession(orderId: string, stripeSessionId: string) {
	return prisma.order.update({
		where: { id: orderId },
		data: { stripeSessionId },
		select: { id: true }
	});
}

/** Sequence de facturation : continue, sans trou, incrementee dans la transaction. */
async function nextInvoiceNumber(transaction: Prisma.TransactionClient) {
	const counter = await transaction.counter.upsert({
		where: { name: INVOICE_COUNTER },
		create: { name: INVOICE_COUNTER, value: 1 },
		update: { value: { increment: 1 } },
		select: { value: true }
	});

	return counter.value;
}

export type PaidOrder = {
	id: string;
	reference: string;
	contactEmail: string;
	invoiceNumber: number | null;
	totalCents: number;
	currency: string;
	shortages: { productName: string; variantLabel: string; missing: number }[];
};

/**
 * Confirmation de paiement : idempotente, car Stripe peut rejouer un webhook.
 * Le stock n'est decremente qu'au premier passage, et seulement s'il reste
 * disponible : sur une piece unique vendue deux fois, la commande est payee
 * mais signalee a l'administration plutot que de laisser un stock negatif.
 */
export async function markOrderPaid(
	stripeSessionId: string,
	paymentIntentId: string | null
): Promise<PaidOrder | null> {
	return prisma.$transaction(async (transaction) => {
		const order = await transaction.order.findUnique({
			where: { stripeSessionId },
			select: {
				id: true,
				paymentStatus: true,
				items: {
					select: {
						id: true,
						variantId: true,
						quantity: true,
						productName: true,
						variantLabel: true
					}
				}
			}
		});

		if (!order || order.paymentStatus === 'PAID') {
			return null;
		}

		const shortages: PaidOrder['shortages'] = [];

		for (const item of order.items) {
			if (!item.variantId) {
				continue;
			}

			const decremented = await transaction.productVariant.updateMany({
				where: { id: item.variantId, stock: { gte: item.quantity } },
				data: { stock: { decrement: item.quantity } }
			});

			if (decremented.count > 0) {
				await transaction.orderItem.update({
					where: { id: item.id },
					data: { stockTaken: item.quantity }
				});
				continue;
			}

			const variant = await transaction.productVariant.findUnique({
				where: { id: item.variantId },
				select: { stock: true }
			});
			const available = Math.max(0, variant?.stock ?? 0);

			await transaction.productVariant.update({
				where: { id: item.variantId },
				data: { stock: 0 }
			});
			await transaction.orderItem.update({
				where: { id: item.id },
				data: { stockTaken: available }
			});

			shortages.push({
				productName: item.productName,
				variantLabel: item.variantLabel,
				missing: item.quantity - available
			});
		}

		const invoiceNumber = await nextInvoiceNumber(transaction);
		const now = new Date();

		const updated = await transaction.order.update({
			where: { id: order.id },
			data: {
				status: 'PAID',
				paymentStatus: 'PAID',
				paidAt: now,
				stripePaymentIntentId: paymentIntentId,
				invoiceNumber,
				invoicedAt: now,
				needsAttention: shortages.length > 0,
				attentionReason:
					shortages.length > 0
						? `Stock insuffisant a la confirmation : ${shortages
								.map((entry) => `${entry.productName} (${entry.variantLabel}), -${entry.missing}`)
								.join(' ; ')}`
						: null
			},
			select: {
				id: true,
				reference: true,
				contactEmail: true,
				invoiceNumber: true,
				totalCents: true,
				currency: true
			}
		});

		return { ...updated, shortages };
	});
}

/**
 * Remboursement constate cote Stripe : le stock repart en rayon, symetriquement
 * au decrement de la confirmation. Idempotent, comme tout le traitement webhook.
 */
export async function markOrderRefunded(paymentIntentId: string) {
	return prisma.$transaction(async (transaction) => {
		const order = await transaction.order.findFirst({
			where: { stripePaymentIntentId: paymentIntentId },
			select: {
				id: true,
				paymentStatus: true,
				items: { select: { variantId: true, stockTaken: true } }
			}
		});

		if (!order || order.paymentStatus === 'REFUNDED') {
			return null;
		}

		for (const item of order.items) {
			if (item.variantId && item.stockTaken > 0) {
				await transaction.productVariant.updateMany({
					where: { id: item.variantId },
					data: { stock: { increment: item.stockTaken } }
				});
			}
		}

		return transaction.order.update({
			where: { id: order.id },
			data: {
				status: 'REFUNDED',
				paymentStatus: 'REFUNDED',
				refundedAt: new Date()
			},
			select: { id: true, reference: true, contactEmail: true, totalCents: true, currency: true }
		});
	});
}

export function markOrderPaymentFailed(stripeSessionId: string) {
	return prisma.order.updateMany({
		where: { stripeSessionId, paymentStatus: 'PENDING' },
		data: { paymentStatus: 'FAILED' }
	});
}

export function listUserOrders(userId: string) {
	return prisma.order.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' },
		select: orderSelect
	});
}

export function findUserOrder(userId: string, reference: string) {
	return prisma.order.findFirst({ where: { userId, reference }, select: orderSelect });
}

/** Une commande n'est annulable par la cliente que tant qu'elle n'est pas expediee. */
export function cancelUserOrder(userId: string, reference: string) {
	return prisma.order.updateMany({
		where: { userId, reference, status: { in: ['PENDING', 'PAID', 'PREPARING'] } },
		data: { status: 'CANCELLED', cancelledAt: new Date() }
	});
}

/** Contexte minimal d'une commande pour composer un e-mail transactionnel. */
export function findOrderMailContext(reference: string) {
	return prisma.order.findUnique({
		where: { reference },
		select: { reference: true, contactEmail: true, totalCents: true, currency: true }
	});
}

export function hasPurchasedProduct(userId: string, productId: string) {
	return prisma.order.count({
		where: {
			userId,
			status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] },
			items: { some: { productId } }
		}
	});
}

/** Mise a jour du suivi de commande, reservee a l'administration. */
export function updateOrderStatus(
	reference: string,
	status: 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED',
	trackingNumber: string | null
) {
	const now = new Date();

	/** Expedier ou cloturer une commande signalee vaut traitement du signalement. */
	const resolvesAttention =
		status === 'SHIPPED' || status === 'DELIVERED' || status === 'CANCELLED';

	return prisma.order.update({
		where: { reference },
		data: {
			status,
			trackingNumber,
			needsAttention: resolvesAttention ? false : undefined,
			attentionReason: resolvesAttention ? null : undefined,
			shippedAt: status === 'SHIPPED' ? now : undefined,
			deliveredAt: status === 'DELIVERED' ? now : undefined,
			cancelledAt: status === 'CANCELLED' ? now : undefined,
			refundedAt: status === 'REFUNDED' ? now : undefined,
			paymentStatus: status === 'REFUNDED' ? 'REFUNDED' : undefined
		},
		select: {
			reference: true,
			status: true,
			trackingNumber: true,
			contactEmail: true,
			totalCents: true,
			currency: true
		}
	});
}
