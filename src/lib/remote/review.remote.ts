import { error, invalid } from '@sveltejs/kit';
import { reviewPhotosSchema } from '#lib/client/validation/media';
import { reviewFiltersSchema, reviewSchema } from '#lib/client/validation/review';
import { hasPurchasedProduct } from '#lib/server/database/order';
import { findProductIdBySlug } from '#lib/server/database/product';
import {
	deleteUserReview,
	detachReviewPhotos,
	findReviewIdForUser,
	findUserReview,
	getReviewBreakdown,
	listLatestPublishedReviews,
	listPublishedReviews,
	listVotedReviewIds,
	saveReview,
	toggleReviewVote
} from '#lib/server/database/review';
import { getSessionUser, requireUser } from '#lib/server/security/guard';
import { consumeRateLimit } from '#lib/server/security/rate-limit';
import { deleteImage, isBlobConfigured, uploadImage } from '#lib/server/utils/blob';
import * as v from 'valibot';
import { command, form, query } from '$app/server';

const slugSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120));
const identifierSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(64));

/** Le formulaire d'avis accepte en plus quelques photos de la piece recue. */
const reviewFormSchema = v.object({ ...reviewSchema.entries, photos: reviewPhotosSchema });

export const getLatestReviews = query(async () => listLatestPublishedReviews());

export const getProductReviews = query(reviewFiltersSchema, async (filters) => {
	const product = await findProductIdBySlug(filters.slug);

	if (!product) {
		error(404, "Cette création n'existe pas ou n'est plus en ligne.");
	}

	const user = getSessionUser();
	const [reviews, mine, breakdown, voted] = await Promise.all([
		listPublishedReviews(product.id, {
			sort: filters.sort,
			rating: filters.rating,
			withPhotos: filters.withPhotos,
			verifiedOnly: filters.verifiedOnly
		}),
		user ? findUserReview(user.id, product.id) : null,
		getReviewBreakdown(product.id),
		user ? listVotedReviewIds(user.id, product.id) : []
	]);

	return {
		reviews,
		mine,
		breakdown,
		votedReviewIds: voted.map((vote) => vote.reviewId),
		canReview: user !== null
	};
});

/** Un vote par personne et par avis, reversible. */
export const voteReviewHelpful = command(
	v.object({ reviewId: identifierSchema, filters: reviewFiltersSchema }),
	async ({ reviewId, filters }) => {
		const user = requireUser();
		const result = await toggleReviewVote(user.id, reviewId);

		await getProductReviews(filters).refresh();

		return result;
	}
);

/**
 * Un avis est publie apres moderation. L'achat n'est pas obligatoire pour
 * s'exprimer, mais il est signale par une pastille "achat verifie".
 */
export const submitReview = form(reviewFormSchema, async (input, issue) => {
	const user = requireUser();

	const quota = await consumeRateLimit({ bucket: 'review-submit', subject: user.id, limit: 10 });

	if (!quota.allowed) {
		invalid(issue.body('Tu as déposé beaucoup d’avis d’un coup : reviens dans une heure.'));
	}

	const product = await findProductIdBySlug(input.productSlug);

	if (!product) {
		invalid(issue.productSlug("Cette création n'existe plus."));
	}

	const photos = input.photos.filter((photo) => photo.size > 0);

	if (photos.length > 0 && !isBlobConfigured()) {
		invalid(issue.photos("L'envoi de photos est momentanément indisponible."));
	}

	/** Une nouvelle serie de photos remplace la precedente. */
	if (photos.length > 0) {
		const existing = await findReviewIdForUser(user.id, product.id);

		if (existing) {
			const removed = await detachReviewPhotos(existing.id);
			await Promise.all(removed.map(deleteImage));
		}
	}

	const uploaded: { url: string; width: number; height: number }[] = [];

	try {
		for (const photo of photos) {
			uploaded.push(await uploadImage('avis', photo, 'review'));
		}
	} catch {
		invalid(issue.photos("Ces photos n'ont pas pu être envoyées. Réessaie dans un instant."));
	}

	const purchases = await hasPurchasedProduct(user.id, product.id);

	await saveReview({
		productId: product.id,
		userId: user.id,
		authorName: input.authorName,
		rating: input.rating,
		/** Zero signifie « non renseigne » cote formulaire. */
		qualityRating: input.qualityRating === 0 ? null : input.qualityRating,
		accuracyRating: input.accuracyRating === 0 ? null : input.accuracyRating,
		title: input.title === '' ? null : input.title,
		body: input.body,
		verifiedPurchase: purchases > 0,
		photos: uploaded
	});

	await getProductReviews({
		slug: input.productSlug,
		sort: 'utiles',
		rating: null,
		withPhotos: false,
		verifiedOnly: false
	}).refresh();

	return { submitted: true };
});

export const deleteMyReview = command(
	v.object({ reviewId: identifierSchema, productSlug: slugSchema }),
	async ({ reviewId, productSlug }) => {
		const user = requireUser();
		const removedPhotos = await deleteUserReview(user.id, reviewId);

		if (removedPhotos === null) {
			error(404, 'Cet avis est introuvable.');
		}

		await Promise.all(removedPhotos.map(deleteImage));
		await getProductReviews({
			slug: productSlug,
			sort: 'utiles',
			rating: null,
			withPhotos: false,
			verifiedOnly: false
		}).refresh();

		return { deleted: true };
	}
);
