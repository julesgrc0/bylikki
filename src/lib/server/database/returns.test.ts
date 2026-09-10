import { describe, expect, test, vi } from 'vitest';

const findFirst = vi.fn();

vi.mock('./client', () => ({
	prisma: { order: { findFirst: (args: unknown) => findFirst(args) } }
}));

const { findReturnableOrder, isPersonalised } = await import('./returns');

const NOW = new Date('2026-03-20T12:00:00Z');

function order(overrides: Record<string, unknown> = {}) {
	return {
		id: 'commande-1',
		reference: 'BY-26ABC123',
		status: 'DELIVERED',
		deliveredAt: new Date('2026-03-15T12:00:00Z'),
		items: [
			{
				id: 'ligne-1',
				productName: 'Collier',
				variantLabel: '42 cm',
				quantity: 1,
				totalCents: 2600,
				customization: null,
				customDesignId: null
			}
		],
		returns: [],
		...overrides
	};
}

describe('isPersonalised', () => {
	test('une piece ordinaire ne l est pas', () => {
		expect(isPersonalised({ customization: null, customDesignId: null })).toBe(false);
	});

	test('une personnalisation renseignee la rend personnalisee', () => {
		expect(
			isPersonalised({ customization: [{ key: 'gravure', value: 'Emma' }], customDesignId: null })
		).toBe(true);
	});

	test('une creation de l atelier est personnalisee', () => {
		expect(isPersonalised({ customization: null, customDesignId: 'creation-1' })).toBe(true);
	});

	test('une personnalisation vide ne compte pas', () => {
		expect(isPersonalised({ customization: [], customDesignId: null })).toBe(false);
	});
});

describe('findReturnableOrder', () => {
	test('une commande inconnue ne renvoie rien', async () => {
		findFirst.mockResolvedValue(null);

		expect(await findReturnableOrder('utilisateur-1', 'BY-26ZZZZZZ', NOW)).toBeNull();
	});

	test('dans le delai de quatorze jours, le retour est ouvert', async () => {
		findFirst.mockResolvedValue(order());
		const found = await findReturnableOrder('utilisateur-1', 'BY-26ABC123', NOW);

		expect(found?.withinWindow).toBe(true);
	});

	test('le dernier jour du delai compte encore', async () => {
		findFirst.mockResolvedValue(order({ deliveredAt: new Date('2026-03-06T13:00:00Z') }));
		const found = await findReturnableOrder('utilisateur-1', 'BY-26ABC123', NOW);

		expect(found?.withinWindow).toBe(true);
	});

	test('passe le delai, le retour est ferme', async () => {
		findFirst.mockResolvedValue(order({ deliveredAt: new Date('2026-03-01T12:00:00Z') }));
		const found = await findReturnableOrder('utilisateur-1', 'BY-26ABC123', NOW);

		expect(found?.withinWindow).toBe(false);
	});

	test('une commande jamais livree n ouvre aucun delai', async () => {
		findFirst.mockResolvedValue(order({ status: 'SHIPPED', deliveredAt: null }));
		const found = await findReturnableOrder('utilisateur-1', 'BY-26ABC123', NOW);

		expect(found?.withinWindow).toBe(false);
		expect(found?.deadline).toBeNull();
	});

	test('une demande deja ouverte est signalee', async () => {
		findFirst.mockResolvedValue(order({ returns: [{ id: 'retour-1', status: 'REQUESTED' }] }));
		const found = await findReturnableOrder('utilisateur-1', 'BY-26ABC123', NOW);

		expect(found?.hasOpenRequest).toBe(true);
	});

	test('chaque ligne indique si elle est personnalisee', async () => {
		findFirst.mockResolvedValue(
			order({
				items: [
					{
						id: 'ligne-1',
						productName: 'Création',
						variantLabel: '8 éléments',
						quantity: 1,
						totalCents: 1400,
						customization: null,
						customDesignId: 'creation-1'
					}
				]
			})
		);
		const found = await findReturnableOrder('utilisateur-1', 'BY-26ABC123', NOW);

		expect(found?.items[0].personalised).toBe(true);
	});
});
