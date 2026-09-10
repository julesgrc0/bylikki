import { describe, expect, test, vi } from 'vitest';

const findUnique = vi.fn();

vi.mock('./client', () => ({
	prisma: { order: { findUnique: (args: unknown) => findUnique(args) } }
}));

const { findPublicOrder } = await import('./tracking');

const order = {
	reference: 'BY-26ABC123',
	contactEmail: 'Emma@Exemple.FR',
	status: 'SHIPPED',
	paymentStatus: 'PAID',
	trackingNumber: '6A1234',
	createdAt: new Date('2026-03-01'),
	paidAt: new Date('2026-03-01'),
	shippedAt: new Date('2026-03-03'),
	deliveredAt: null,
	cancelledAt: null,
	shippingCity: 'Nantes',
	items: []
};

describe('findPublicOrder', () => {
	test('une commande inconnue ne renvoie rien', async () => {
		findUnique.mockResolvedValue(null);

		expect(await findPublicOrder('BY-26ZZZZZZ', 'emma@exemple.fr')).toBeNull();
	});

	test('une adresse qui ne correspond pas ne renvoie rien', async () => {
		findUnique.mockResolvedValue(order);

		expect(await findPublicOrder('BY-26ABC123', 'quelquun@ailleurs.fr')).toBeNull();
	});

	test('la comparaison d adresse ignore la casse et les espaces', async () => {
		findUnique.mockResolvedValue(order);

		expect(await findPublicOrder('BY-26ABC123', '  emma@exemple.fr ')).not.toBeNull();
	});

	test('l adresse e-mail n est jamais renvoyee', async () => {
		findUnique.mockResolvedValue(order);
		const found = await findPublicOrder('BY-26ABC123', 'emma@exemple.fr');

		expect(found).not.toHaveProperty('contactEmail');
	});

	test('le suivi renvoie les etapes et le numero de suivi', async () => {
		findUnique.mockResolvedValue(order);
		const found = await findPublicOrder('BY-26ABC123', 'emma@exemple.fr');

		expect(found).toMatchObject({
			status: 'SHIPPED',
			trackingNumber: '6A1234',
			shippingCity: 'Nantes'
		});
	});
});
