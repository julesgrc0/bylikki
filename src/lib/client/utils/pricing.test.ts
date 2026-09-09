import { describe, expect, test } from 'vitest';
import {
	nextTierFor,
	priceWithDiscounts,
	tierFor,
	type DiscountRule,
	type LoyaltyBenefit
} from './pricing';

const percentage: DiscountRule = {
	code: 'BIENVENUE',
	label: '10 %',
	kind: 'PERCENTAGE',
	value: 10,
	minSubtotalCents: 0
};
const fixed: DiscountRule = { ...percentage, code: 'CINQ', kind: 'FIXED_AMOUNT', value: 500 };
const freeShipping: DiscountRule = { ...percentage, code: 'PORT', kind: 'FREE_SHIPPING', value: 0 };

const base = { subtotalCents: 5000, shippingCents: 490, loyalty: null, stacksWithCode: false };

describe('priceWithDiscounts, sans remise', () => {
	test('le total est le sous-total plus le port', () => {
		const result = priceWithDiscounts({ ...base, discount: null });

		expect(result).toMatchObject({ discountCents: 0, totalCents: 5490, appliedFrom: 'none' });
	});
});

describe('types de remise', () => {
	test('un pourcentage s applique au sous-total, pas au port', () => {
		const result = priceWithDiscounts({ ...base, discount: percentage });

		expect(result.discountCents).toBe(500);
		expect(result.shippingCents).toBe(490);
		expect(result.totalCents).toBe(4990);
	});

	test('un montant fixe retire des centimes', () => {
		expect(priceWithDiscounts({ ...base, discount: fixed }).totalCents).toBe(4990);
	});

	test('la livraison offerte ne touche que le port', () => {
		const result = priceWithDiscounts({ ...base, discount: freeShipping });

		expect(result.shippingCents).toBe(0);
		expect(result.totalCents).toBe(5000);
	});

	test('la livraison offerte sur un port deja nul ne retire rien', () => {
		const result = priceWithDiscounts({ ...base, shippingCents: 0, discount: freeShipping });

		expect(result.discountCents).toBe(0);
		expect(result.appliedFrom).toBe('none');
	});
});

describe('garde-fous', () => {
	test('un montant fixe superieur au panier ne rend pas le total negatif', () => {
		const result = priceWithDiscounts({
			...base,
			subtotalCents: 300,
			discount: { ...fixed, value: 9999 }
		});

		expect(result.totalCents).toBe(490);
		expect(result.discountCents).toBe(300);
	});

	test('un pourcentage de 100 laisse les frais de port a payer', () => {
		const result = priceWithDiscounts({ ...base, discount: { ...percentage, value: 100 } });

		expect(result.totalCents).toBe(490);
	});

	test('le minimum d achat non atteint annule la remise', () => {
		const result = priceWithDiscounts({
			...base,
			subtotalCents: 2000,
			discount: { ...percentage, minSubtotalCents: 5000 }
		});

		expect(result.discountCents).toBe(0);
		expect(result.appliedFrom).toBe('none');
	});

	test('le minimum atteint exactement applique la remise', () => {
		const result = priceWithDiscounts({
			...base,
			subtotalCents: 5000,
			discount: { ...percentage, minSubtotalCents: 5000 }
		});

		expect(result.discountCents).toBe(500);
	});
});

describe('cumul avec la fidelite', () => {
	const bronze: LoyaltyBenefit = { name: 'Bronze', discountPercent: 5, freeShipping: false };
	const or: LoyaltyBenefit = { name: 'Or', discountPercent: 15, freeShipping: true };

	test('sans cumul, la remise la plus avantageuse pour la cliente l emporte', () => {
		const result = priceWithDiscounts({ ...base, discount: percentage, loyalty: bronze });

		expect(result.discountCents).toBe(500);
		expect(result.appliedFrom).toBe('code');
	});

	test('sans cumul, un palier plus genereux prend le dessus sur le code', () => {
		const result = priceWithDiscounts({ ...base, discount: percentage, loyalty: or });

		expect(result.discountCents).toBe(750 + 490);
		expect(result.appliedFrom).toBe('loyalty');
	});

	test('avec cumul, les deux remises s additionnent', () => {
		const result = priceWithDiscounts({
			...base,
			discount: percentage,
			loyalty: bronze,
			stacksWithCode: true
		});

		expect(result.discountCents).toBe(500 + 250);
		expect(result.appliedFrom).toBe('both');
	});

	test('avec cumul, le port n est offert qu une fois', () => {
		const result = priceWithDiscounts({
			...base,
			discount: freeShipping,
			loyalty: or,
			stacksWithCode: true
		});

		expect(result.shippingCents).toBe(0);
		expect(result.discountCents).toBe(750 + 490);
	});

	test('le palier seul s applique sans code', () => {
		const result = priceWithDiscounts({ ...base, discount: null, loyalty: bronze });

		expect(result.discountCents).toBe(250);
		expect(result.appliedFrom).toBe('loyalty');
	});
});

describe('paliers', () => {
	const tiers = [
		{ name: 'Bronze', thresholdCents: 10000 },
		{ name: 'Argent', thresholdCents: 30000 },
		{ name: 'Or', thresholdCents: 60000 }
	];

	test('aucun palier sous le premier seuil', () => {
		expect(tierFor(tiers, 9999)).toBeNull();
	});

	test('le seuil atteint exactement fait basculer', () => {
		expect(tierFor(tiers, 10000)?.name).toBe('Bronze');
	});

	test('juste sous le seuil suivant, le palier ne change pas', () => {
		expect(tierFor(tiers, 29999)?.name).toBe('Bronze');
	});

	test('le palier le plus eleve franchi est retenu', () => {
		expect(tierFor(tiers, 120000)?.name).toBe('Or');
	});

	test('le palier suivant indique le montant restant', () => {
		expect(nextTierFor(tiers, 12000)).toMatchObject({ remainingCents: 18000 });
	});

	test('au dernier palier, il n y a plus de suivant', () => {
		expect(nextTierFor(tiers, 60000)).toBeNull();
	});
});
