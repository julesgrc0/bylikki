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
	title: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(90, 'Ce titre est trop long.')), ''),
	body: v.pipe(
		v.string('Écris quelques mots sur la pièce.'),
		v.trim(),
		v.minLength(REVIEW_MIN_LENGTH, 'Quelques mots de plus et ton avis sera parfait.'),
		v.maxLength(REVIEW_MAX_LENGTH, 'Cet avis est trop long.')
	)
});

export type ReviewInput = v.InferOutput<typeof reviewSchema>;
