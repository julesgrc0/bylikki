import { prisma } from './client';

const reviewSelect = {
	id: true,
	authorName: true,
	rating: true,
	title: true,
	body: true,
	verifiedPurchase: true,
	createdAt: true,
	publishedAt: true,
	photos: {
		select: { id: true, url: true, width: true, height: true },
		orderBy: { position: 'asc' }
	},
	user: { select: { avatarUrl: true } }
} as const;

export type ProductReview = Awaited<ReturnType<typeof listPublishedReviews>>[number];

export function listPublishedReviews(productId: string, limit = 20) {
	return prisma.review.findMany({
		where: { productId, status: 'PUBLISHED' },
		orderBy: { createdAt: 'desc' },
		take: limit,
		select: reviewSelect
	});
}

export function listLatestPublishedReviews(limit = 12) {
	return prisma.review.findMany({
		where: { status: 'PUBLISHED' },
		orderBy: { createdAt: 'desc' },
		take: limit,
		select: { ...reviewSelect, product: { select: { name: true, slug: true } } }
	});
}

export function findUserReview(userId: string, productId: string) {
	return prisma.review.findUnique({
		where: { productId_userId: { productId, userId } },
		select: { ...reviewSelect, status: true }
	});
}

export async function saveReview(input: {
	productId: string;
	userId: string;
	authorName: string;
	rating: number;
	title: string | null;
	body: string;
	verifiedPurchase: boolean;
	photos: { url: string; width: number; height: number }[];
}) {
	const { productId, userId, photos, ...data } = input;

	const review = await prisma.review.upsert({
		where: { productId_userId: { productId, userId } },
		create: { productId, userId, ...data },
		update: { ...data, status: 'PENDING', publishedAt: null },
		select: { id: true, status: true }
	});

	if (photos.length > 0) {
		await prisma.reviewPhoto.createMany({
			data: photos.map((photo, position) => ({ ...photo, position, reviewId: review.id }))
		});
	}

	await refreshProductRating(productId);

	return review;
}

/** Retire les photos d'un avis et renvoie leurs URL, a effacer du stockage. */
export async function detachReviewPhotos(reviewId: string) {
	const photos = await prisma.reviewPhoto.findMany({
		where: { reviewId },
		select: { url: true }
	});

	await prisma.reviewPhoto.deleteMany({ where: { reviewId } });

	return photos.map((photo) => photo.url);
}

export function findReviewIdForUser(userId: string, productId: string) {
	return prisma.review.findUnique({
		where: { productId_userId: { productId, userId } },
		select: { id: true }
	});
}

/** Renvoie les URL des photos supprimees, pour les effacer du stockage. */
export async function deleteUserReview(userId: string, reviewId: string) {
	const review = await prisma.review.findFirst({
		where: { id: reviewId, userId },
		select: { productId: true, photos: { select: { url: true } } }
	});

	if (!review) {
		return null;
	}

	await prisma.review.delete({ where: { id: reviewId } });
	await refreshProductRating(review.productId);

	return review.photos.map((photo) => photo.url);
}

/** La note moyenne est denormalisee sur le produit pour trier sans jointure. */
export async function refreshProductRating(productId: string) {
	const aggregate = await prisma.review.aggregate({
		where: { productId, status: 'PUBLISHED' },
		_avg: { rating: true },
		_count: { _all: true }
	});

	await prisma.product.update({
		where: { id: productId },
		data: {
			ratingAverage: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
			reviewCount: aggregate._count._all
		}
	});
}

export async function moderateReview(reviewId: string, status: 'PUBLISHED' | 'REJECTED') {
	const review = await prisma.review.update({
		where: { id: reviewId },
		data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : null },
		select: { id: true, productId: true, status: true }
	});

	await refreshProductRating(review.productId);

	return review;
}
