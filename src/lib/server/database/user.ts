import type { ConsentType } from '$prisma/enums';
import { prisma } from './client';

export const userProfileSelect = {
	id: true,
	email: true,
	role: true,
	displayName: true,
	phone: true,
	avatarUrl: true,
	createdAt: true,
	emailVerifiedAt: true,
	deletionRequestedAt: true
} as const;

export const addressSelect = {
	id: true,
	label: true,
	fullName: true,
	line1: true,
	line2: true,
	postalCode: true,
	city: true,
	country: true,
	isDefault: true
} as const;

export type UserProfile = Awaited<ReturnType<typeof findUserById>>;
export type UserAddress = Awaited<ReturnType<typeof listAddresses>>[number];

export function findUserByEmail(email: string) {
	return prisma.user.findUnique({ where: { email }, select: userProfileSelect });
}

export function findUserById(userId: string) {
	return prisma.user.findUnique({ where: { id: userId }, select: userProfileSelect });
}

/**
 * Le compte n'est cree qu'apres verification du code : l'e-mail est donc
 * verifie par construction.
 */
export function createVerifiedUser(email: string) {
	return prisma.user.create({
		data: { email, emailVerifiedAt: new Date(), lastSeenAt: new Date() },
		select: userProfileSelect
	});
}

export function markUserSignedIn(userId: string) {
	return prisma.user.update({
		where: { id: userId },
		data: { lastSeenAt: new Date(), emailVerifiedAt: new Date(), deletionRequestedAt: null },
		select: { id: true }
	});
}

export function updateUserProfile(
	userId: string,
	data: { displayName: string | null; phone: string | null }
) {
	return prisma.user.update({ where: { id: userId }, data, select: userProfileSelect });
}

export function updateUserAvatar(userId: string, avatarUrl: string | null) {
	return prisma.user.update({
		where: { id: userId },
		data: { avatarUrl },
		select: { id: true, avatarUrl: true }
	});
}

export function listAddresses(userId: string) {
	return prisma.address.findMany({
		where: { userId },
		orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
		select: addressSelect
	});
}

export function findAddress(userId: string, addressId: string) {
	return prisma.address.findFirst({ where: { id: addressId, userId }, select: addressSelect });
}

export function findDefaultAddress(userId: string) {
	return prisma.address.findFirst({
		where: { userId },
		orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
		select: addressSelect
	});
}

type AddressInput = {
	label: string | null;
	fullName: string;
	line1: string;
	line2: string | null;
	postalCode: string;
	city: string;
	country: string;
	isDefault: boolean;
};

export async function saveAddress(userId: string, addressId: string | null, input: AddressInput) {
	return prisma.$transaction(async (transaction) => {
		if (input.isDefault) {
			await transaction.address.updateMany({ where: { userId }, data: { isDefault: false } });
		}

		if (addressId) {
			const updated = await transaction.address.updateMany({
				where: { id: addressId, userId },
				data: input
			});

			if (updated.count === 0) {
				return null;
			}

			return transaction.address.findUnique({ where: { id: addressId }, select: addressSelect });
		}

		const count = await transaction.address.count({ where: { userId } });

		return transaction.address.create({
			data: { ...input, isDefault: input.isDefault || count === 0, userId },
			select: addressSelect
		});
	});
}

export function deleteAddress(userId: string, addressId: string) {
	return prisma.address.deleteMany({ where: { id: addressId, userId } });
}

export function listConsents(userId: string) {
	return prisma.userConsent.findMany({
		where: { userId },
		select: { type: true, granted: true, updatedAt: true }
	});
}

export function setConsent(userId: string, type: ConsentType, granted: boolean) {
	return prisma.userConsent.upsert({
		where: { userId_type: { userId, type } },
		create: { userId, type, granted },
		update: { granted },
		select: { type: true, granted: true }
	});
}

export function requestAccountDeletion(userId: string) {
	return prisma.user.update({
		where: { id: userId },
		data: { deletionRequestedAt: new Date() },
		select: { id: true, deletionRequestedAt: true }
	});
}

export function cancelAccountDeletion(userId: string) {
	return prisma.user.update({
		where: { id: userId },
		data: { deletionRequestedAt: null },
		select: { id: true, deletionRequestedAt: true }
	});
}

/** Comptes dont le delai d'annulation de suppression est ecoule. */
export function listAccountsToPurge(deadline: Date) {
	return prisma.user.findMany({
		where: { deletionRequestedAt: { lte: deadline } },
		select: { id: true }
	});
}

/**
 * Effacement definitif : le compte disparait, les commandes restent pour la
 * conservation legale des factures mais sont detachees de toute identite.
 */
export async function purgeUserAccount(userId: string) {
	const media = await prisma.user.findUnique({
		where: { id: userId },
		select: { avatarUrl: true, reviews: { select: { photos: { select: { url: true } } } } }
	});

	await prisma.$transaction([
		prisma.review.updateMany({
			where: { userId },
			data: { userId: null, authorName: 'Cliente Bylikki' }
		}),
		prisma.order.updateMany({ where: { userId }, data: { userId: null } }),
		prisma.user.delete({ where: { id: userId } })
	]);

	return [
		media?.avatarUrl,
		...(media?.reviews.flatMap((review) => review.photos.map((photo) => photo.url)) ?? [])
	].filter((url): url is string => Boolean(url));
}

/** Portabilite : tout ce que le compte contient, dans un objet serialisable. */
export async function collectUserData(userId: string) {
	const [user, addresses, consents, orders, reviews, sessions] = await Promise.all([
		findUserById(userId),
		listAddresses(userId),
		listConsents(userId),
		prisma.order.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			select: {
				reference: true,
				status: true,
				paymentStatus: true,
				totalCents: true,
				currency: true,
				createdAt: true,
				items: {
					select: {
						productName: true,
						variantLabel: true,
						quantity: true,
						unitPriceCents: true,
						customization: true
					}
				}
			}
		}),
		prisma.review.findMany({
			where: { userId },
			select: {
				rating: true,
				title: true,
				body: true,
				status: true,
				createdAt: true,
				product: { select: { name: true, slug: true } }
			}
		}),
		prisma.session.findMany({
			where: { userId, active: true },
			select: { createdAt: true, lastSeenAt: true, userAgentLabel: true }
		})
	]);

	return {
		exportedAt: new Date().toISOString(),
		user,
		addresses,
		consents,
		orders,
		reviews,
		sessions
	};
}
