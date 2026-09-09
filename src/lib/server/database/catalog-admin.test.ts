import { describe, expect, test, vi } from 'vitest';

vi.mock('./client', () => ({ prisma: {} }));

const { isBackInStock } = await import('./catalog-admin');

describe('isBackInStock', () => {
	test('un stock epuise qui repasse au positif est un reassort', () => {
		expect(isBackInStock({ stock: 0, available: true }, { stock: 5, available: true })).toBe(true);
	});

	test('une variante remise en vente avec du stock est un reassort', () => {
		expect(isBackInStock({ stock: 3, available: false }, { stock: 3, available: true })).toBe(true);
	});

	test('une variante qui n existait pas compte comme indisponible', () => {
		expect(isBackInStock(null, { stock: 2, available: true })).toBe(true);
	});

	test('un stock deja positif qui augmente n est pas un reassort', () => {
		expect(isBackInStock({ stock: 2, available: true }, { stock: 9, available: true })).toBe(false);
	});

	test('un stock qui reste a zero n est pas un reassort', () => {
		expect(isBackInStock({ stock: 0, available: true }, { stock: 0, available: true })).toBe(false);
	});

	test('du stock sur une variante retiree de la vente n alerte personne', () => {
		expect(isBackInStock({ stock: 0, available: true }, { stock: 5, available: false })).toBe(
			false
		);
	});

	test('un stock negatif compte comme epuise', () => {
		expect(isBackInStock({ stock: -1, available: true }, { stock: 1, available: true })).toBe(true);
	});
});
