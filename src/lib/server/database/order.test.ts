import { describe, expect, test, vi } from 'vitest';

vi.mock('./client', () => ({ prisma: {} }));

const { computeShippingCents, FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_FLAT_CENTS } =
	await import('./order');

describe('computeShippingCents', () => {
	test('un panier vide paie le forfait', () => {
		expect(computeShippingCents(0)).toBe(SHIPPING_FLAT_CENTS);
	});

	test('sous le seuil, la livraison est facturee', () => {
		expect(computeShippingCents(FREE_SHIPPING_THRESHOLD_CENTS - 1)).toBe(SHIPPING_FLAT_CENTS);
	});

	test('au seuil exact, la livraison est offerte', () => {
		expect(computeShippingCents(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(0);
	});

	test('au-dessus du seuil, la livraison reste offerte', () => {
		expect(computeShippingCents(FREE_SHIPPING_THRESHOLD_CENTS + 5000)).toBe(0);
	});
});
