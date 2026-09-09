import { seller } from '#lib/client/data/seller';

const invoiceNumberFormatter = new Intl.NumberFormat('fr-FR', {
	minimumIntegerDigits: 6,
	useGrouping: false
});

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
	day: '2-digit',
	month: 'long',
	year: 'numeric'
});

/**
 * Numerotation continue et chronologique, exigee par l'administration fiscale.
 * L'annee vient de la date d'emission, la sequence du compteur applicatif.
 */
export function formatInvoiceNumber(invoiceNumber: number, invoicedAt: Date) {
	return `BY-${invoicedAt.getFullYear()}-${invoiceNumberFormatter.format(invoiceNumber)}`;
}

export type InvoiceOrder = {
	reference: string;
	invoiceNumber: number | null;
	invoicedAt: Date | null;
	createdAt: Date;
	contactEmail: string;
	subtotalCents: number;
	shippingCents: number;
	discountCents: number;
	discountLabel: string | null;
	discountCode: string | null;
	totalCents: number;
	currency: string;
	shippingFullName: string;
	shippingLine1: string;
	shippingLine2: string | null;
	shippingPostalCode: string;
	shippingCity: string;
	shippingCountry: string;
	items: {
		id: string;
		productName: string;
		variantLabel: string;
		unitPriceCents: number;
		quantity: number;
		totalCents: number;
	}[];
};

export type Invoice = ReturnType<typeof buildInvoice>;

export function buildInvoice(order: InvoiceOrder) {
	const issuedAt = order.invoicedAt ?? order.createdAt;

	return {
		seller,
		number:
			order.invoiceNumber === null
				? null
				: formatInvoiceNumber(order.invoiceNumber, order.invoicedAt ?? order.createdAt),
		reference: order.reference,
		issuedOn: dateFormatter.format(issuedAt),
		buyer: {
			fullName: order.shippingFullName,
			addressLines: [
				order.shippingLine1,
				order.shippingLine2,
				`${order.shippingPostalCode} ${order.shippingCity}`,
				order.shippingCountry
			].filter((line): line is string => Boolean(line)),
			email: order.contactEmail
		},
		lines: order.items.map((item) => ({
			id: item.id,
			label: [item.productName, item.variantLabel].filter(Boolean).join(' — '),
			unitPriceCents: item.unitPriceCents,
			quantity: item.quantity,
			totalCents: item.totalCents
		})),
		subtotalCents: order.subtotalCents,
		/** Une facture doit montrer les montants reellement payes, remise comprise. */
		discountCents: order.discountCents,
		discountLabel: order.discountLabel ?? order.discountCode,
		shippingCents: order.shippingCents,
		totalCents: order.totalCents,
		currency: order.currency
	};
}
