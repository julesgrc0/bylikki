/**
 * Formes de donnees partagees entre le serveur et l'interface. Les definir ici
 * evite aux composants d'importer quoi que ce soit de `#lib/server`.
 */
export type ProductCardData = {
	id: string;
	slug: string;
	name: string;
	summary: string | null;
	badge: string | null;
	priceFromCents: number;
	priceToCents: number;
	currency: string;
	ratingAverage: number;
	reviewCount: number;
	image: { url: string; alt: string } | null;
	inStock: boolean;
};

export type AttributeValueData = {
	value: string;
	label: string;
	hexColor: string | null;
	attribute: { key: string; label: string; kind: string };
};

export type VariantData = {
	id: string;
	label: string;
	priceCents: number;
	compareAtPriceCents: number | null;
	stock: number;
	attributeValues: { attributeValue: AttributeValueData }[];
};

export type CustomizationChoiceData = {
	id: string;
	value: string;
	label: string;
	hexColor: string | null;
	priceDeltaCents: number;
};

export type CustomizationOptionData = {
	id: string;
	key: string;
	label: string;
	helpText: string | null;
	kind: string;
	required: boolean;
	maxLength: number | null;
	priceDeltaCents: number;
	choices: CustomizationChoiceData[];
};

/** Valeurs saisies pour les options de personnalisation, indexees par cle d'option. */
export type CustomizationSelection = Record<string, string>;
