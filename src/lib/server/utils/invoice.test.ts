import { describe, expect, test } from 'vitest';
import { buildInvoice, formatInvoiceNumber, type InvoiceOrder } from './invoice';

function order(overrides: Partial<InvoiceOrder> = {}): InvoiceOrder {
	return {
		reference: 'BY-26ABC123',
		invoiceNumber: 42,
		invoicedAt: new Date('2026-03-14T10:00:00Z'),
		createdAt: new Date('2026-03-14T09:00:00Z'),
		contactEmail: 'emma@exemple.fr',
		subtotalCents: 5200,
		shippingCents: 490,
		discountCents: 0,
		discountLabel: null,
		discountCode: null,
		totalCents: 5690,
		currency: 'EUR',
		shippingFullName: 'Emma Durand',
		shippingLine1: '3 rue des Lilas',
		shippingLine2: null,
		shippingPostalCode: '44000',
		shippingCity: 'Nantes',
		shippingCountry: 'FR',
		items: [
			{
				id: 'ligne-1',
				productName: 'Collier',
				variantLabel: 'Doré · 45 cm',
				unitPriceCents: 2600,
				quantity: 2,
				totalCents: 5200
			}
		],
		...overrides
	};
}

describe('formatInvoiceNumber', () => {
	test('numerote sur six chiffres, prefixe par l annee d emission', () => {
		expect(formatInvoiceNumber(42, new Date('2026-03-14T10:00:00Z'))).toBe('BY-2026-000042');
	});

	test('ne tronque pas au-dela de six chiffres', () => {
		expect(formatInvoiceNumber(1234567, new Date('2026-03-14T10:00:00Z'))).toBe('BY-2026-1234567');
	});
});

describe('buildInvoice', () => {
	test('reprend la reference, le numero et les totaux', () => {
		const invoice = buildInvoice(order());

		expect(invoice.number).toBe('BY-2026-000042');
		expect(invoice.reference).toBe('BY-26ABC123');
		expect(invoice.subtotalCents).toBe(5200);
		expect(invoice.totalCents).toBe(5690);
	});

	test('sans numero attribue, la facture n en affiche aucun', () => {
		const invoice = buildInvoice(order({ invoiceNumber: null, invoicedAt: null }));

		expect(invoice.number).toBeNull();
	});

	test('l adresse omet les lignes vides', () => {
		const invoice = buildInvoice(order());

		expect(invoice.buyer.addressLines).toEqual(['3 rue des Lilas', '44000 Nantes', 'FR']);
	});

	test('le complement d adresse est conserve quand il existe', () => {
		const invoice = buildInvoice(order({ shippingLine2: 'Appartement 4' }));

		expect(invoice.buyer.addressLines).toContain('Appartement 4');
	});

	test('la designation joint le produit et la variante', () => {
		const invoice = buildInvoice(order());

		expect(invoice.lines[0].label).toBe('Collier — Doré · 45 cm');
	});

	test('la mention de TVA de la micro-entreprise est portee', () => {
		const invoice = buildInvoice(order());

		expect(invoice.seller.vatMention).toContain('293 B');
	});
});

describe('remise sur la facture', () => {
	test('une facture sans remise n en affiche pas', () => {
		expect(buildInvoice(order()).discountCents).toBe(0);
	});

	test('la remise apparait avec son libelle', () => {
		const invoice = buildInvoice(
			order({ discountCents: 500, discountLabel: 'Bienvenue', totalCents: 5190 })
		);

		expect(invoice.discountCents).toBe(500);
		expect(invoice.discountLabel).toBe('Bienvenue');
	});

	test('sans libelle, le code sert d etiquette', () => {
		const invoice = buildInvoice(
			order({ discountCents: 500, discountLabel: null, discountCode: 'BIENVENUE' })
		);

		expect(invoice.discountLabel).toBe('BIENVENUE');
	});
});
