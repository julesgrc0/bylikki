import * as v from 'valibot';

export const REVIEW_MIN_LENGTH = 10;
export const REVIEW_MAX_LENGTH = 1200;

export const reviewSchema = v.object({
	productSlug: v.pipe(v.string(), v.trim(), v.minLength(1)),
	authorName: v.pipe(
		v.string('Indique le prénom affiché à côté de ton avis.'),
		v.trim(),
		v.minLength(2, 'Ce prénom est trop court.'),
		v.maxLength(40, 'Ce prénom est trop long.')
	),
	rating: v.pipe(
		v.number('Choisis une note.'),
		v.integer('Choisis une note.'),
		v.minValue(1, 'La note va de 1 à 5 étoiles.'),
		v.maxValue(5, 'La note va de 1 à 5 étoiles.')
	),
	/**
	 * Notes par critere, facultatives : zero signifie « non renseigne ». Les
	 * formulaires distants ne transportent que des valeurs simples, d'ou ce
	 * choix plutot qu'un nullable.
	 */
	qualityRating: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(5)), 0),
	accuracyRating: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(5)), 0),
	title: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(90, 'Ce titre est trop long.')), ''),
	body: v.pipe(
		v.string('Écris quelques mots sur la pièce.'),
		v.trim(),
		v.minLength(REVIEW_MIN_LENGTH, 'Quelques mots de plus et ton avis sera parfait.'),
		v.maxLength(REVIEW_MAX_LENGTH, 'Cet avis est trop long.')
	)
});

export type ReviewInput = v.InferOutput<typeof reviewSchema>;

export const reviewSorts = ['utiles', 'recents', 'meilleurs', 'severes'] as const;

export type ReviewSort = (typeof reviewSorts)[number];

export const reviewSortLabels: Record<ReviewSort, string> = {
	utiles: 'Plus utiles',
	recents: 'Plus récents',
	meilleurs: 'Mieux notés',
	severes: 'Plus sévères'
};

export const reviewFiltersSchema = v.object({
	slug: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
	sort: v.optional(v.picklist(reviewSorts), 'utiles'),
	rating: v.optional(
		v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5))),
		null
	),
	withPhotos: v.optional(v.boolean(), false),
	verifiedOnly: v.optional(v.boolean(), false)
});

export type ReviewFiltersInput = v.InferOutput<typeof reviewFiltersSchema>;

export const reviewReplySchema = v.object({
	reviewId: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
	body: v.pipe(v.string(), v.trim(), v.maxLength(1200, 'Cette réponse est trop longue.'))
});
