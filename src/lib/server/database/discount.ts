import type { DiscountRule } from '#lib/client/utils/pricing';
import type { Prisma } from '$prisma/client';
import { prisma } from './client';

export type DiscountVerdict =
	| { status: 'ok'; discount: DiscountRule & { id: string } }
	| { status: 'unknown' }
	| { status: 'expired' }
	| { status: 'exhausted' }
	| { status: 'already-used' }
	| { status: 'minimum'; minSubtotalCents: number };

export function normalizeCode(code: string) {
	return code.trim().toUpperCase();
}

/**
 * Verifie un code sans rien reserver : appelee a chaque chiffrage du panier.
 * Les motifs de refus sont distincts, pour que la cliente sache quoi corriger.
 */
export async function checkDiscount(
	rawCode: string,
	userId: string | null,
	subtotalCents: number,
	now = new Date()
): Promise<DiscountVerdict> {
	const code = normalizeCode(rawCode);

	if (code === '') {
		return { status: 'unknown' };
	}

	const discount = await prisma.discount.findUnique({
		where: { code },
		select: {
			id: true,
			code: true,
			label: true,
			kind: true,
			value: true,
			active: true,
			startsAt: true,
			expiresAt: true,
			maxUses: true,
			usedCount: true,
			maxUsesPerUser: true,
			minSubtotalCents: true
		}
	});

	if (!discount || !discount.active) {
		return { status: 'unknown' };
	}

	if (discount.startsAt && discount.startsAt > now) {
		return { status: 'expired' };
	}

	if (discount.expiresAt && discount.expiresAt <= now) {
		return { status: 'expired' };
	}

	if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
		return { status: 'exhausted' };
	}

	if (userId && discount.maxUsesPerUser !== null) {
		const used = await prisma.discountRedemption.count({
			where: { discountId: discount.id, userId }
		});

		if (used >= discount.maxUsesPerUser) {
			return { status: 'already-used' };
		}
	}

	if (subtotalCents < discount.minSubtotalCents) {
		return { status: 'minimum', minSubtotalCents: discount.minSubtotalCents };
	}

	return {
		status: 'ok',
		discount: {
			id: discount.id,
			code: discount.code,
			label: discount.label,
			kind: discount.kind,
			value: discount.value,
			minSubtotalCents: discount.minSubtotalCents
		}
	};
}

/**
 * Reserve une utilisation. Le compteur est incremente par un `updateMany`
 * conditionnel : deux commandes simultanees ne peuvent pas depasser le quota,
 * meme sur des instances differentes. La reservation est relachee si le
 * paiement echoue, faute de quoi un panier abandonne consommerait le code.
 */
export async function reserveDiscount(
	transaction: Prisma.TransactionClient,
	discountId: string,
	maxUses: number | null
) {
	if (maxUses === null) {
		await transaction.discount.update({
			where: { id: discountId },
			data: { usedCount: { increment: 1 } }
		});

		return true;
	}

	const reserved = await transaction.discount.updateMany({
		where: { id: discountId, usedCount: { lt: maxUses } },
		data: { usedCount: { increment: 1 } }
	});

	return reserved.count > 0;
}

export function releaseDiscount(discountId: string) {
	return prisma.discount.updateMany({
		where: { id: discountId, usedCount: { gt: 0 } },
		data: { usedCount: { decrement: 1 } }
	});
}

export function findDiscountQuota(discountId: string) {
	return prisma.discount.findUnique({
		where: { id: discountId },
		select: { maxUses: true }
	});
}

/* --------------------------------------------------------------- fidelite */

export function listLoyaltyTiers() {
	return prisma.loyaltyTier.findMany({
		orderBy: { thresholdCents: 'asc' },
		select: {
			id: true,
			name: true,
			thresholdCents: true,
			discountPercent: true,
			freeShipping: true,
			color: true,
			position: true
		}
	});
}

export function saveLoyaltyTier(input: {
	id?: string;
	name: string;
	thresholdCents: number;
	discountPercent: number;
	freeShipping: boolean;
	color: string;
	position: number;
}) {
	const { id, ...data } = input;

	return id
		? prisma.loyaltyTier.update({ where: { id }, data, select: { id: true } })
		: prisma.loyaltyTier.create({ data, select: { id: true } });
}

export function deleteLoyaltyTier(id: string) {
	return prisma.loyaltyTier.deleteMany({ where: { id } });
}

/* ------------------------------------------------------- administration */

export function listDiscounts() {
	return prisma.discount.findMany({
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			code: true,
			label: true,
			kind: true,
			value: true,
			active: true,
			startsAt: true,
			expiresAt: true,
			maxUses: true,
			usedCount: true,
			maxUsesPerUser: true,
			minSubtotalCents: true,
			createdAt: true,
			_count: { select: { redemptions: true } }
		}
	});
}

export function saveDiscount(input: {
	id?: string;
	code: string;
	label: string;
	kind: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
	value: number;
	active: boolean;
	startsAt: Date | null;
	expiresAt: Date | null;
	maxUses: number | null;
	maxUsesPerUser: number | null;
	minSubtotalCents: number;
}) {
	const { id, code, ...rest } = input;
	const data = { ...rest, code: normalizeCode(code) };

	return id
		? prisma.discount.update({ where: { id }, data, select: { id: true } })
		: prisma.discount.create({ data, select: { id: true } });
}

export function deleteDiscount(id: string) {
	return prisma.discount.deleteMany({ where: { id, redemptions: { none: {} } } });
}
