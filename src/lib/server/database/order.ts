import { generateOrderReference } from '../utils/reference';
import { prisma } from './client';

export const SHIPPING_FLAT_CENTS = 490;
export const FREE_SHIPPING_THRESHOLD_CENTS = 6000;

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

export function computeShippingCents(subtotalCents: number) {
	return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
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
	const shippingCents = computeShippingCents(subtotalCents);

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

/**
 * Confirmation de paiement : idempotente, car Stripe peut rejouer un webhook.
 * Le stock n'est decremente qu'au premier passage.
 */
export async function markOrderPaid(stripeSessionId: string, paymentIntentId: string | null) {
	return prisma.$transaction(async (transaction) => {
		const order = await transaction.order.findUnique({
			where: { stripeSessionId },
			select: {
				id: true,
				paymentStatus: true,
				items: { select: { variantId: true, quantity: true } }
			}
		});

		if (!order || order.paymentStatus === 'PAID') {
			return null;
		}

		for (const item of order.items) {
			if (item.variantId) {
				await transaction.productVariant.update({
					where: { id: item.variantId },
					data: { stock: { decrement: item.quantity } }
				});
			}
		}

		return transaction.order.update({
			where: { id: order.id },
			data: {
				status: 'PAID',
				paymentStatus: 'PAID',
				paidAt: new Date(),
				stripePaymentIntentId: paymentIntentId
			},
			select: { id: true, reference: true }
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

	return prisma.order.update({
		where: { reference },
		data: {
			status,
			trackingNumber,
			shippedAt: status === 'SHIPPED' ? now : undefined,
			deliveredAt: status === 'DELIVERED' ? now : undefined,
			cancelledAt: status === 'CANCELLED' ? now : undefined,
			refundedAt: status === 'REFUNDED' ? now : undefined,
			paymentStatus: status === 'REFUNDED' ? 'REFUNDED' : undefined
		},
		select: { reference: true, status: true, trackingNumber: true }
	});
}
