import { prisma } from './client';

/**
 * Liste d'envies. Une piece unique peut disparaitre du catalogue : la lecture
 * ne retient donc que les produits encore en ligne, sans supprimer la ligne
 * pour autant, au cas ou la piece reviendrait.
 */
export function listWishlist(userId: string) {
	return prisma.wishlistItem.findMany({
		where: { userId, product: { status: 'PUBLISHED' } },
		orderBy: { createdAt: 'desc' },
		select: {
			createdAt: true,
			product: {
				select: {
					id: true,
					slug: true,
					name: true,
					summary: true,
					badge: true,
					basePriceCents: true,
					currency: true,
					ratingAverage: true,
					reviewCount: true,
					images: { select: { url: true, alt: true }, orderBy: { position: 'asc' }, take: 1 },
					variants: {
						where: { available: true },
						select: { priceCents: true, stock: true }
					}
				}
			}
		}
	});
}

export function listWishlistProductIds(userId: string) {
	return prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true } });
}

export async function addToWishlist(userId: string, productId: string) {
	await prisma.wishlistItem.upsert({
		where: { userId_productId: { userId, productId } },
		create: { userId, productId },
		update: {}
	});
}

export function removeFromWishlist(userId: string, productId: string) {
	return prisma.wishlistItem.deleteMany({ where: { userId, productId } });
}

/** Fusion du stockage local a la connexion : ce qui existe deja est ignore. */
export async function mergeWishlist(userId: string, productIds: string[]) {
	if (productIds.length === 0) {
		return 0;
	}

	const known = await prisma.product.findMany({
		where: { id: { in: productIds }, status: 'PUBLISHED' },
		select: { id: true }
	});

	const created = await prisma.wishlistItem.createMany({
		data: known.map((product) => ({ userId, productId: product.id })),
		skipDuplicates: true
	});

	return created.count;
}
