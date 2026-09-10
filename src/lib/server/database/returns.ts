import { RETURN_WINDOW_DAYS } from '#lib/client/validation/returns';
import type { ReturnReason, ReturnStatus } from '$prisma/enums';
import { prisma } from './client';

const OPEN_STATUSES = ['REQUESTED', 'ACCEPTED', 'RECEIVED'] as const;

/**
 * Une piece personnalisee ou issue de l'atelier est exclue du droit de
 * retractation, sauf defaut constate : c'est ce que disent les CGV, et c'est
 * ce que la loi permet pour un bien confectionne selon les specifications de
 * l'acheteuse.
 */
export function isPersonalised(item: { customization: unknown; customDesignId: string | null }) {
	return (
		item.customDesignId !== null ||
		(Array.isArray(item.customization) && item.customization.length > 0)
	);
}

export type ReturnableOrder = NonNullable<Awaited<ReturnType<typeof findReturnableOrder>>>;

/** Commande retournable : livree, dans le delai, et sans demande deja ouverte. */
export async function findReturnableOrder(userId: string, reference: string, now = new Date()) {
	const order = await prisma.order.findFirst({
		where: { userId, reference },
		select: {
			id: true,
			reference: true,
			status: true,
			deliveredAt: true,
			items: {
				select: {
					id: true,
					productName: true,
					variantLabel: true,
					quantity: true,
					totalCents: true,
					customization: true,
					customDesignId: true
				}
			},
			returns: {
				where: { status: { in: [...OPEN_STATUSES] } },
				select: { id: true, status: true }
			}
		}
	});

	if (!order) {
		return null;
	}

	const deadline = order.deliveredAt
		? new Date(order.deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000)
		: null;

	return {
		...order,
		deadline,
		withinWindow: deadline !== null && deadline > now,
		hasOpenRequest: order.returns.length > 0,
		items: order.items.map((item) => ({ ...item, personalised: isPersonalised(item) }))
	};
}

export function listMyReturns(userId: string) {
	return prisma.returnRequest.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			status: true,
			reason: true,
			comment: true,
			decisionNote: true,
			createdAt: true,
			decidedAt: true,
			order: { select: { reference: true } },
			items: {
				select: {
					quantity: true,
					orderItem: { select: { productName: true, variantLabel: true } }
				}
			}
		}
	});
}

export function createReturnRequest(input: {
	orderId: string;
	userId: string;
	reason: ReturnReason;
	comment: string;
	items: { orderItemId: string; quantity: number }[];
}) {
	return prisma.returnRequest.create({
		data: {
			orderId: input.orderId,
			userId: input.userId,
			reason: input.reason,
			comment: input.comment === '' ? null : input.comment,
			items: { create: input.items }
		},
		select: { id: true, status: true }
	});
}

/* ---------------------------------------------------------- administration */

export function listReturnRequests(status: ReturnStatus | 'ALL') {
	return prisma.returnRequest.findMany({
		where: status === 'ALL' ? {} : { status },
		orderBy: { createdAt: 'desc' },
		take: 60,
		select: {
			id: true,
			status: true,
			reason: true,
			comment: true,
			decisionNote: true,
			createdAt: true,
			decidedAt: true,
			order: { select: { reference: true, contactEmail: true, totalCents: true, currency: true } },
			items: {
				select: {
					quantity: true,
					orderItem: { select: { productName: true, variantLabel: true, totalCents: true } }
				}
			}
		}
	});
}

const TIMESTAMP_FOR_STATUS = {
	ACCEPTED: 'decidedAt',
	REFUSED: 'decidedAt',
	RECEIVED: 'receivedAt',
	REFUNDED: 'refundedAt'
} as const;

export function decideReturn(
	returnId: string,
	status: keyof typeof TIMESTAMP_FOR_STATUS,
	decisionNote: string
) {
	return prisma.returnRequest.update({
		where: { id: returnId },
		data: {
			status,
			decisionNote: decisionNote === '' ? null : decisionNote,
			[TIMESTAMP_FOR_STATUS[status]]: new Date()
		},
		select: {
			id: true,
			status: true,
			decisionNote: true,
			order: { select: { reference: true, contactEmail: true } }
		}
	});
}
