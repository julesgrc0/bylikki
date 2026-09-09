import type { AttributeKind, CustomizationKind, ProductStatus } from '$prisma/enums';
import { buildSearchText, slugify } from '../utils/text';
import { prisma } from './client';

export type AttributeValueRef = { attributeKey: string; value: string };

export type ProductVariantInput = {
	sku: string;
	label: string;
	priceCents: number;
	compareAtPriceCents: number | null;
	stock: number;
	available: boolean;
	position: number;
	attributes: AttributeValueRef[];
};

export type ProductInput = {
	slug: string | null;
	name: string;
	summary: string | null;
	description: string;
	story: string | null;
	badge: string | null;
	basePriceCents: number;
	handmade: boolean;
	featured: boolean;
	status: ProductStatus;
	categorySlugs: string[];
	attributes: AttributeValueRef[];
	images: { url: string; alt: string; position: number }[];
	variants: ProductVariantInput[];
};

/**
 * Les criteres sont designes par `cle:valeur` cote appelant : on les resout en
 * identifiants une seule fois, et une reference inconnue est signalee.
 */
async function resolveAttributeValueIds(refs: AttributeValueRef[]) {
	if (refs.length === 0) {
		return new Map<string, string>();
	}

	const values = await prisma.attributeValue.findMany({
		where: { OR: refs.map((ref) => ({ attribute: { key: ref.attributeKey }, value: ref.value })) },
		select: { id: true, value: true, attribute: { select: { key: true } } }
	});

	const resolved = new Map(
		values.map((entry) => [`${entry.attribute.key}:${entry.value}`, entry.id])
	);

	for (const ref of refs) {
		if (!resolved.has(`${ref.attributeKey}:${ref.value}`)) {
			throw new Error(`Critere inconnu : ${ref.attributeKey}:${ref.value}`);
		}
	}

	return resolved;
}

function searchTextFor(input: ProductInput) {
	return buildSearchText([
		input.name,
		input.summary,
		input.description,
		input.badge,
		...input.categorySlugs,
		...input.attributes.map((attribute) => attribute.value)
	]);
}

export async function createProduct(input: ProductInput) {
	const attributeIds = await resolveAttributeValueIds([
		...input.attributes,
		...input.variants.flatMap((variant) => variant.attributes)
	]);

	return prisma.product.create({
		data: {
			slug: input.slug ?? slugify(input.name),
			name: input.name,
			summary: input.summary,
			description: input.description,
			story: input.story,
			badge: input.badge,
			basePriceCents: input.basePriceCents,
			handmade: input.handmade,
			featured: input.featured,
			status: input.status,
			publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
			searchText: searchTextFor(input),
			categories: { connect: input.categorySlugs.map((slug) => ({ slug })) },
			images: { create: input.images },
			attributeValues: {
				create: input.attributes.map((attribute) => ({
					attributeValueId: attributeIds.get(`${attribute.attributeKey}:${attribute.value}`)!
				}))
			},
			variants: {
				create: input.variants.map((variant) => ({
					sku: variant.sku,
					label: variant.label,
					priceCents: variant.priceCents,
					compareAtPriceCents: variant.compareAtPriceCents,
					stock: variant.stock,
					available: variant.available,
					position: variant.position,
					attributeValues: {
						create: variant.attributes.map((attribute) => ({
							attributeValueId: attributeIds.get(`${attribute.attributeKey}:${attribute.value}`)!
						}))
					}
				}))
			}
		},
		select: { id: true, slug: true, status: true }
	});
}

export async function updateProduct(productId: string, input: ProductInput) {
	const attributeIds = await resolveAttributeValueIds(input.attributes);

	return prisma.$transaction(async (transaction) => {
		await transaction.productAttributeValue.deleteMany({ where: { productId } });
		await transaction.productImage.deleteMany({ where: { productId } });

		return transaction.product.update({
			where: { id: productId },
			data: {
				slug: input.slug ?? slugify(input.name),
				name: input.name,
				summary: input.summary,
				description: input.description,
				story: input.story,
				badge: input.badge,
				basePriceCents: input.basePriceCents,
				handmade: input.handmade,
				featured: input.featured,
				status: input.status,
				searchText: searchTextFor(input),
				categories: { set: input.categorySlugs.map((slug) => ({ slug })) },
				images: { create: input.images },
				attributeValues: {
					create: input.attributes.map((attribute) => ({
						attributeValueId: attributeIds.get(`${attribute.attributeKey}:${attribute.value}`)!
					}))
				}
			},
			select: { id: true, slug: true, status: true }
		});
	});
}

export function setProductStatus(productId: string, status: ProductStatus) {
	return prisma.product.update({
		where: { id: productId },
		data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : null },
		select: { id: true, slug: true, status: true }
	});
}

/**
 * Un reassort, c'est le passage d'indisponible a disponible : stock epuise ou
 * variante retiree de la vente, puis stock positif et variante remise en ligne.
 * Une variante qui n'existait pas encore compte comme indisponible.
 */
export function isBackInStock(
	previous: { stock: number; available: boolean } | null,
	next: { stock: number; available: boolean }
) {
	const wasUnavailable = !previous || previous.stock <= 0 || !previous.available;

	return wasUnavailable && next.stock > 0 && next.available;
}

export async function saveVariant(productId: string, input: ProductVariantInput) {
	const attributeIds = await resolveAttributeValueIds(input.attributes);
	/** Etat avant ecriture : c'est le passage de zero a positif qui declenche les alertes. */
	const previous = await prisma.productVariant.findUnique({
		where: { sku: input.sku },
		select: { id: true, stock: true, available: true }
	});
	const attributeValues = input.attributes.map((attribute) => ({
		attributeValueId: attributeIds.get(`${attribute.attributeKey}:${attribute.value}`)!
	}));

	const variant = await prisma.productVariant.upsert({
		where: { sku: input.sku },
		create: {
			productId,
			sku: input.sku,
			label: input.label,
			priceCents: input.priceCents,
			compareAtPriceCents: input.compareAtPriceCents,
			stock: input.stock,
			available: input.available,
			position: input.position,
			attributeValues: { create: attributeValues }
		},
		update: {
			label: input.label,
			priceCents: input.priceCents,
			compareAtPriceCents: input.compareAtPriceCents,
			stock: input.stock,
			available: input.available,
			position: input.position
		},
		select: { id: true, sku: true }
	});

	await prisma.variantAttributeValue.deleteMany({ where: { variantId: variant.id } });
	await prisma.variantAttributeValue.createMany({
		data: attributeValues.map((entry) => ({ ...entry, variantId: variant.id }))
	});

	return {
		...variant,
		restocked: isBackInStock(previous, { stock: input.stock, available: input.available })
	};
}

export function deleteVariant(variantId: string) {
	return prisma.productVariant.delete({ where: { id: variantId }, select: { id: true } });
}

export type CustomizationInput = {
	key: string;
	label: string;
	helpText: string | null;
	kind: CustomizationKind;
	required: boolean;
	maxLength: number | null;
	priceDeltaCents: number;
	position: number;
	choices: { value: string; label: string; hexColor: string | null; priceDeltaCents: number }[];
};

export async function saveCustomization(productId: string, input: CustomizationInput) {
	const { choices, ...option } = input;

	const saved = await prisma.customizationOption.upsert({
		where: { productId_key: { productId, key: input.key } },
		create: { ...option, productId },
		update: option,
		select: { id: true, key: true }
	});

	await prisma.customizationChoice.deleteMany({ where: { optionId: saved.id } });

	if (choices.length > 0) {
		await prisma.customizationChoice.createMany({
			data: choices.map((choice, index) => ({ ...choice, optionId: saved.id, position: index }))
		});
	}

	return saved;
}

export type AttributeInput = {
	key: string;
	label: string;
	kind: AttributeKind;
	unit: string | null;
	filterable: boolean;
	variantAxis: boolean;
	position: number;
	values: { value: string; label: string; hexColor: string | null }[];
};

export async function saveAttribute(input: AttributeInput) {
	const { values, ...attribute } = input;

	const saved = await prisma.attribute.upsert({
		where: { key: input.key },
		create: attribute,
		update: attribute,
		select: { id: true, key: true }
	});

	for (const [position, value] of values.entries()) {
		await prisma.attributeValue.upsert({
			where: { attributeId_value: { attributeId: saved.id, value: value.value } },
			create: { ...value, position, attributeId: saved.id },
			update: { label: value.label, hexColor: value.hexColor, position }
		});
	}

	return saved;
}

export function saveCategory(input: {
	slug: string;
	name: string;
	description: string | null;
	position: number;
	parentSlug: string | null;
}) {
	const { parentSlug, ...category } = input;

	return prisma.category.upsert({
		where: { slug: input.slug },
		create: {
			...category,
			parent: parentSlug ? { connect: { slug: parentSlug } } : undefined
		},
		update: {
			name: category.name,
			description: category.description,
			position: category.position,
			parent: parentSlug ? { connect: { slug: parentSlug } } : { disconnect: true }
		},
		select: { id: true, slug: true }
	});
}

export function listCategories() {
	return prisma.category.findMany({
		orderBy: [{ position: 'asc' }, { name: 'asc' }],
		select: { slug: true, name: true, parent: { select: { slug: true } } }
	});
}
