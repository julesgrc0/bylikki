import { describe, expect, test, vi } from 'vitest';

vi.mock('./client', () => ({ prisma: {} }));

const { shippingCentsFor, FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_FLAT_CENTS } =
	await import('./order');

const bareme = {
	flatCents: SHIPPING_FLAT_CENTS,
	freeThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS
};

describe('shippingCentsFor', () => {
	test('un panier vide paie le forfait', () => {
		expect(shippingCentsFor(0, bareme)).toBe(SHIPPING_FLAT_CENTS);
	});

	test('sous le seuil, la livraison est facturee', () => {
		expect(shippingCentsFor(FREE_SHIPPING_THRESHOLD_CENTS - 1, bareme)).toBe(SHIPPING_FLAT_CENTS);
	});

	test('au seuil exact, la livraison est offerte', () => {
		expect(shippingCentsFor(FREE_SHIPPING_THRESHOLD_CENTS, bareme)).toBe(0);
	});

	test('au-dessus du seuil, la livraison reste offerte', () => {
		expect(shippingCentsFor(FREE_SHIPPING_THRESHOLD_CENTS + 5000, bareme)).toBe(0);
	});

	test('un bareme personnalise est respecte', () => {
		expect(shippingCentsFor(4000, { flatCents: 790, freeThresholdCents: 9000 })).toBe(790);
		expect(shippingCentsFor(9000, { flatCents: 790, freeThresholdCents: 9000 })).toBe(0);
	});

	test('un seuil a zero rend la livraison toujours offerte', () => {
		expect(shippingCentsFor(0, { flatCents: 490, freeThresholdCents: 0 })).toBe(0);
	});
});
