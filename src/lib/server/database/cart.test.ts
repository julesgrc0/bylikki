import { beforeEach, describe, expect, test, vi } from 'vitest';

const findVariantsForCheckout = vi.fn();
const findCustomizationOptions = vi.fn();

vi.mock('./product', () => ({
	findVariantsForCheckout: (ids: string[]) => findVariantsForCheckout(ids),
	findCustomizationOptions: (ids: string[]) => findCustomizationOptions(ids)
}));

const { priceCartLines } = await import('./cart');

const collier = {
	id: 'variant-collier',
	label: 'Doré · 45 cm',
	priceCents: 2600,
	stock: 3,
	productId: 'produit-collier',
	product: { id: 'produit-collier', slug: 'collier', name: 'Collier', currency: 'EUR' }
};

function gravure(overrides: Record<string, unknown> = {}) {
	return {
		id: 'option-gravure',
		productId: 'produit-collier',
		key: 'gravure',
		label: 'Gravure',
		kind: 'TEXT',
		required: false,
		maxLength: 12,
		priceDeltaCents: 400,
		choices: [],
		...overrides
	};
}

beforeEach(() => {
	findVariantsForCheckout.mockReset().mockResolvedValue([collier]);
	findCustomizationOptions.mockReset().mockResolvedValue([]);
});

describe('priceCartLines', () => {
	test('un panier vide ne touche pas la base', async () => {
		const cart = await priceCartLines([]);

		expect(cart).toEqual({ lines: [], issues: [], subtotalCents: 0, currency: 'EUR' });
		expect(findVariantsForCheckout).not.toHaveBeenCalled();
	});

	test('le prix vient du serveur, jamais du client', async () => {
		const cart = await priceCartLines([
			{ variantId: 'variant-collier', quantity: 2, customization: [] }
		]);

		expect(cart.issues).toEqual([]);
		expect(cart.lines[0].unitPriceCents).toBe(2600);
		expect(cart.subtotalCents).toBe(5200);
	});

	test('une variante inconnue est signalee sans etre facturee', async () => {
		findVariantsForCheckout.mockResolvedValue([]);

		const cart = await priceCartLines([
			{ variantId: 'variant-disparue', quantity: 1, customization: [] }
		]);

		expect(cart.lines).toHaveLength(0);
		expect(cart.subtotalCents).toBe(0);
		expect(cart.issues[0].variantId).toBe('variant-disparue');
	});

	test('une quantite superieure au stock est refusee', async () => {
		const cart = await priceCartLines([
			{ variantId: 'variant-collier', quantity: 5, customization: [] }
		]);

		expect(cart.lines).toHaveLength(0);
		expect(cart.issues[0].message).toContain('3 exemplaire');
	});

	test('un stock nul donne un message d epuisement', async () => {
		findVariantsForCheckout.mockResolvedValue([{ ...collier, stock: 0 }]);

		const cart = await priceCartLines([
			{ variantId: 'variant-collier', quantity: 1, customization: [] }
		]);

		expect(cart.issues[0].message).toContain('épuisé');
	});

	test('une personnalisation texte ajoute son supplement', async () => {
		findCustomizationOptions.mockResolvedValue([gravure()]);

		const cart = await priceCartLines([
			{
				variantId: 'variant-collier',
				quantity: 1,
				customization: [{ key: 'gravure', value: 'Emma' }]
			}
		]);

		expect(cart.issues).toEqual([]);
		expect(cart.lines[0].unitPriceCents).toBe(3000);
		expect(cart.lines[0].customization).toEqual([
			{ key: 'gravure', label: 'Gravure', value: 'Emma', priceDeltaCents: 400 }
		]);
	});

	test('une gravure trop longue est refusee', async () => {
		findCustomizationOptions.mockResolvedValue([gravure()]);

		const cart = await priceCartLines([
			{
				variantId: 'variant-collier',
				quantity: 1,
				customization: [{ key: 'gravure', value: 'beaucoup trop de caracteres' }]
			}
		]);

		expect(cart.issues[0].message).toContain('12 caractères');
	});

	test('une option obligatoire non renseignee bloque la ligne', async () => {
		findCustomizationOptions.mockResolvedValue([gravure({ required: true })]);

		const cart = await priceCartLines([
			{ variantId: 'variant-collier', quantity: 1, customization: [] }
		]);

		expect(cart.issues[0].message).toContain('obligatoire');
	});

	test('un choix inexistant est refuse', async () => {
		findCustomizationOptions.mockResolvedValue([
			gravure({
				kind: 'SELECT',
				maxLength: null,
				priceDeltaCents: 0,
				choices: [{ value: 'or', label: 'Or', priceDeltaCents: 200 }]
			})
		]);

		const cart = await priceCartLines([
			{
				variantId: 'variant-collier',
				quantity: 1,
				customization: [{ key: 'gravure', value: 'platine' }]
			}
		]);

		expect(cart.issues[0].message).toContain("n'existe pas");
	});

	test('un choix valide cumule les deux supplements', async () => {
		findCustomizationOptions.mockResolvedValue([
			gravure({
				kind: 'SELECT',
				maxLength: null,
				priceDeltaCents: 100,
				choices: [{ value: 'or', label: 'Or', priceDeltaCents: 200 }]
			})
		]);

		const cart = await priceCartLines([
			{
				variantId: 'variant-collier',
				quantity: 1,
				customization: [{ key: 'gravure', value: 'or' }]
			}
		]);

		expect(cart.lines[0].unitPriceCents).toBe(2900);
	});

	test('une personnalisation d un autre produit est ignoree', async () => {
		findCustomizationOptions.mockResolvedValue([gravure({ productId: 'autre-produit' })]);

		const cart = await priceCartLines([
			{
				variantId: 'variant-collier',
				quantity: 1,
				customization: [{ key: 'gravure', value: 'Emma' }]
			}
		]);

		expect(cart.lines[0].unitPriceCents).toBe(2600);
	});
});
