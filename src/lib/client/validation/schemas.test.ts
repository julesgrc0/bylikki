import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { emailSchema, otpCodeSchema } from './auth';
import { cartLineSchema, checkoutSchema, MAX_LINE_QUANTITY } from './cart';
import { addressSchema } from './profile';
import { REVIEW_MAX_LENGTH, reviewSchema } from './review';
import { searchFiltersSchema } from './search';

function accepts(schema: v.GenericSchema, input: unknown) {
	return v.safeParse(schema, input).success;
}

describe('emailSchema', () => {
	test('accepte une adresse ordinaire', () => {
		expect(accepts(emailSchema, 'emma@exemple.fr')).toBe(true);
	});

	test('refuse une adresse sans domaine', () => {
		expect(accepts(emailSchema, 'emma@')).toBe(false);
	});

	test('refuse une adresse demesurement longue', () => {
		expect(accepts(emailSchema, `${'a'.repeat(320)}@exemple.fr`)).toBe(false);
	});
});

describe('otpCodeSchema', () => {
	test('accepte six chiffres', () => {
		expect(accepts(otpCodeSchema, '482913')).toBe(true);
	});

	test('refuse cinq chiffres', () => {
		expect(accepts(otpCodeSchema, '48291')).toBe(false);
	});

	test('refuse un code contenant des lettres', () => {
		expect(accepts(otpCodeSchema, '48291a')).toBe(false);
	});
});

describe('cartLineSchema', () => {
	test('accepte une ligne minimale', () => {
		expect(accepts(cartLineSchema, { variantId: 'v1', quantity: 1 })).toBe(true);
	});

	test('refuse une quantite nulle', () => {
		expect(accepts(cartLineSchema, { variantId: 'v1', quantity: 0 })).toBe(false);
	});

	test('refuse une quantite au-dela du maximum', () => {
		expect(accepts(cartLineSchema, { variantId: 'v1', quantity: MAX_LINE_QUANTITY + 1 })).toBe(
			false
		);
	});

	test('refuse une quantite decimale', () => {
		expect(accepts(cartLineSchema, { variantId: 'v1', quantity: 1.5 })).toBe(false);
	});
});

describe('checkoutSchema', () => {
	test('refuse un panier vide', () => {
		expect(accepts(checkoutSchema, { addressId: 'a1', lines: [] })).toBe(false);
	});

	test('refuse un panier sans adresse', () => {
		expect(
			accepts(checkoutSchema, { addressId: '', lines: [{ variantId: 'v1', quantity: 1 }] })
		).toBe(false);
	});
});

describe('addressSchema', () => {
	const valide = {
		addressId: '',
		fullName: 'Emma Durand',
		label: '',
		line1: '3 rue des Lilas',
		line2: '',
		postalCode: '44000',
		city: 'Nantes',
		country: 'FR'
	};

	test('accepte une adresse complete', () => {
		expect(accepts(addressSchema, valide)).toBe(true);
	});

	test('refuse un nom vide', () => {
		expect(accepts(addressSchema, { ...valide, fullName: '' })).toBe(false);
	});

	test('accepte un complement d adresse absent', () => {
		expect(accepts(addressSchema, { ...valide, line2: '' })).toBe(true);
	});
});

describe('reviewSchema', () => {
	const valide = {
		productSlug: 'collier',
		authorName: 'Emma',
		rating: 5,
		title: 'Superbe',
		body: 'Vraiment très joli.'
	};

	test('accepte un avis complet', () => {
		expect(accepts(reviewSchema, valide)).toBe(true);
	});

	test('refuse une note hors bornes', () => {
		expect(accepts(reviewSchema, { ...valide, rating: 6 })).toBe(false);
	});

	test('refuse un prenom trop court', () => {
		expect(accepts(reviewSchema, { ...valide, authorName: 'E' })).toBe(false);
	});

	test('refuse un texte trop court', () => {
		expect(accepts(reviewSchema, { ...valide, body: 'bof' })).toBe(false);
	});

	test('refuse un texte trop long', () => {
		expect(accepts(reviewSchema, { ...valide, body: 'a'.repeat(REVIEW_MAX_LENGTH + 1) })).toBe(
			false
		);
	});
});

describe('searchFiltersSchema', () => {
	test('un objet vide donne les filtres par defaut', () => {
		const parsed = v.safeParse(searchFiltersSchema, {});

		expect(parsed.success).toBe(true);
		expect(parsed.output).toMatchObject({ query: '', page: 1, sort: 'pertinence' });
	});

	test('refuse un tri inconnu', () => {
		expect(accepts(searchFiltersSchema, { sort: 'aleatoire' })).toBe(false);
	});

	test('refuse une page nulle', () => {
		expect(accepts(searchFiltersSchema, { page: 0 })).toBe(false);
	});

	test('refuse un prix negatif', () => {
		expect(accepts(searchFiltersSchema, { priceMinCents: -1 })).toBe(false);
	});
});
