import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { reviewFiltersSchema, reviewReplySchema, reviewSchema, reviewSorts } from './review';

const base = {
	productSlug: 'collier',
	authorName: 'Emma',
	rating: 5,
	title: 'Superbe',
	body: 'Vraiment très joli.'
};

describe('notes par critere', () => {
	test('sont facultatives et valent zero par defaut', () => {
		const parsed = v.safeParse(reviewSchema, base);

		expect(parsed.success).toBe(true);
		expect(parsed.output).toMatchObject({ qualityRating: 0, accuracyRating: 0 });
	});

	test('acceptent une note de 1 a 5', () => {
		expect(v.safeParse(reviewSchema, { ...base, qualityRating: 4 }).success).toBe(true);
	});

	test('refusent une note au-dela de 5', () => {
		expect(v.safeParse(reviewSchema, { ...base, qualityRating: 6 }).success).toBe(false);
	});

	test('refusent une note negative', () => {
		expect(v.safeParse(reviewSchema, { ...base, accuracyRating: -1 }).success).toBe(false);
	});
});

describe('reviewFiltersSchema', () => {
	test('un slug seul suffit et donne le tri par defaut', () => {
		const parsed = v.safeParse(reviewFiltersSchema, { slug: 'collier' });

		expect(parsed.success).toBe(true);
		expect(parsed.output).toMatchObject({
			sort: 'utiles',
			rating: null,
			withPhotos: false,
			verifiedOnly: false
		});
	});

	test('accepte chacun des tris proposes', () => {
		for (const sort of reviewSorts) {
			expect(v.safeParse(reviewFiltersSchema, { slug: 'collier', sort }).success).toBe(true);
		}
	});

	test('refuse un tri inconnu', () => {
		expect(v.safeParse(reviewFiltersSchema, { slug: 'collier', sort: 'aleatoire' }).success).toBe(
			false
		);
	});

	test('refuse un filtre de note hors bornes', () => {
		expect(v.safeParse(reviewFiltersSchema, { slug: 'collier', rating: 0 }).success).toBe(false);
		expect(v.safeParse(reviewFiltersSchema, { slug: 'collier', rating: 6 }).success).toBe(false);
	});
});

describe('reviewReplySchema', () => {
	test('accepte une reponse vide, qui retire la reponse', () => {
		expect(v.safeParse(reviewReplySchema, { reviewId: 'r1', body: '' }).success).toBe(true);
	});

	test('refuse une reponse demesurement longue', () => {
		expect(v.safeParse(reviewReplySchema, { reviewId: 'r1', body: 'a'.repeat(1201) }).success).toBe(
			false
		);
	});
});
