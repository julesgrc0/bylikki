import type { ProductCardData } from '#lib/client/types';
import type { Prisma } from '$prisma/client';
import { normalizeText } from '../utils/text';
import { prisma } from './client';

export const PRODUCT_PAGE_SIZE = 12;

export type ProductSort =
	'pertinence' | 'nouveautes' | 'prix-croissant' | 'prix-decroissant' | 'avis';

export type ProductSearchFilters = {
	query: string;
	categories: string[];
	/** Facettes selectionnees, au format `cleAttribut:valeur` */
	attributes: string[];
	priceMinCents: number | null;
	priceMaxCents: number | null;
	inStockOnly: boolean;
	sort: ProductSort;
	page: number;
};

const productCardSelect = {
	id: true,
	slug: true,
	name: true,
	summary: true,
	badge: true,
	basePriceCents: true,
	currency: true,
	ratingAverage: true,
	reviewCount: true,
	images: { select: { url: true, alt: true }, orderBy: { position: 'asc' }, take: 1 },
	variants: { select: { priceCents: true, stock: true, available: true } }
} satisfies Prisma.ProductSelect;

type RawProductCard = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

function toProductCard(product: RawProductCard): ProductCardData {
	const sellable = product.variants.filter((variant) => variant.available);
	const prices = sellable.map((variant) => variant.priceCents);

	return {
		id: product.id,
		slug: product.slug,
		name: product.name,
		summary: product.summary,
		badge: product.badge,
		priceFromCents: prices.length > 0 ? Math.min(...prices) : product.basePriceCents,
		priceToCents: prices.length > 0 ? Math.max(...prices) : product.basePriceCents,
		currency: product.currency,
		ratingAverage: product.ratingAverage,
		reviewCount: product.reviewCount,
		image: product.images[0] ?? null,
		inStock: sellable.some((variant) => variant.stock > 0)
	};
}

/** Seuls les produits publies sont visibles depuis la boutique. */
const publishedOnly = { status: 'PUBLISHED' } satisfies Prisma.ProductWhereInput;

function buildTextFilter(query: string): Prisma.ProductWhereInput[] {
	const terms = normalizeText(query).split(' ').filter(Boolean);

	return terms.map((term) => ({ searchText: { contains: term } }));
}

/** Filtres hors facettes : sert aussi de base au calcul des compteurs. */
function buildBaseWhere(filters: ProductSearchFilters): Prisma.ProductWhereInput {
	const conditions: Prisma.ProductWhereInput[] = [publishedOnly, ...buildTextFilter(filters.query)];

	if (filters.categories.length > 0) {
		conditions.push({ categories: { some: { slug: { in: filters.categories } } } });
	}

	if (filters.priceMinCents !== null) {
		conditions.push({ basePriceCents: { gte: filters.priceMinCents } });
	}

	if (filters.priceMaxCents !== null) {
		conditions.push({ basePriceCents: { lte: filters.priceMaxCents } });
	}

	if (filters.inStockOnly) {
		conditions.push({ variants: { some: { available: true, stock: { gt: 0 } } } });
	}

	return { AND: conditions };
}

/**
 * Deux valeurs d'un meme critere s'additionnent (rose OU jaune), deux criteres
 * differents se cumulent (rose ET argent).
 */
function buildAttributeWhere(attributes: string[]): Prisma.ProductWhereInput[] {
	const byAttribute = new Map<string, string[]>();

	for (const entry of attributes) {
		const separator = entry.indexOf(':');

		if (separator <= 0) {
			continue;
		}

		const key = entry.slice(0, separator);
		const value = entry.slice(separator + 1);
		byAttribute.set(key, [...(byAttribute.get(key) ?? []), value]);
	}

	return [...byAttribute].map(([key, values]) => ({
		attributeValues: {
			some: { attributeValue: { attribute: { key }, value: { in: values } } }
		}
	}));
}

function buildOrderBy(sort: ProductSort): Prisma.ProductOrderByWithRelationInput[] {
	switch (sort) {
		case 'nouveautes':
			return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
		case 'prix-croissant':
			return [{ basePriceCents: 'asc' }, { name: 'asc' }];
		case 'prix-decroissant':
			return [{ basePriceCents: 'desc' }, { name: 'asc' }];
		case 'avis':
			return [{ ratingAverage: 'desc' }, { reviewCount: 'desc' }];
		default:
			return [{ featured: 'desc' }, { publishedAt: 'desc' }, { name: 'asc' }];
	}
}

export async function searchProducts(filters: ProductSearchFilters) {
	const where: Prisma.ProductWhereInput = {
		AND: [buildBaseWhere(filters), ...buildAttributeWhere(filters.attributes)]
	};

	const [total, products] = await Promise.all([
		prisma.product.count({ where }),
		prisma.product.findMany({
			where,
			orderBy: buildOrderBy(filters.sort),
			skip: (filters.page - 1) * PRODUCT_PAGE_SIZE,
			take: PRODUCT_PAGE_SIZE,
			select: productCardSelect
		})
	]);

	return {
		items: products.map(toProductCard),
		total,
		page: filters.page,
		pageSize: PRODUCT_PAGE_SIZE,
		pageCount: Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE))
	};
}

export type SearchFacets = Awaited<ReturnType<typeof getSearchFacets>>;

/**
 * Compteurs de facettes calcules sur les filtres hors facettes : une option
 * qui ne ramenerait aucun resultat s'affiche a zero plutot que de disparaitre.
 */
export async function getSearchFacets(filters: ProductSearchFilters) {
	const baseWhere = buildBaseWhere(filters);

	const [categories, attributes, valueCounts, priceBounds] = await Promise.all([
		prisma.category.findMany({
			orderBy: [{ position: 'asc' }, { name: 'asc' }],
			select: {
				slug: true,
				name: true,
				_count: { select: { products: { where: baseWhere } } }
			}
		}),
		prisma.attribute.findMany({
			where: { filterable: true },
			orderBy: [{ position: 'asc' }, { label: 'asc' }],
			select: {
				key: true,
				label: true,
				kind: true,
				unit: true,
				values: {
					orderBy: [{ position: 'asc' }, { label: 'asc' }],
					select: { id: true, value: true, label: true, hexColor: true }
				}
			}
		}),
		prisma.productAttributeValue.groupBy({
			by: ['attributeValueId'],
			where: { product: baseWhere },
			_count: { productId: true }
		}),
		prisma.product.aggregate({
			where: publishedOnly,
			_min: { basePriceCents: true },
			_max: { basePriceCents: true }
		})
	]);

	const countByValueId = new Map(
		valueCounts.map((entry) => [entry.attributeValueId, entry._count.productId])
	);

	return {
		categories: categories
			.filter((category) => category._count.products > 0)
			.map((category) => ({
				slug: category.slug,
				name: category.name,
				count: category._count.products
			})),
		attributes: attributes
			.map((attribute) => ({
				key: attribute.key,
				label: attribute.label,
				kind: attribute.kind,
				unit: attribute.unit,
				values: attribute.values
					.map((value) => ({
						value: value.value,
						label: value.label,
						hexColor: value.hexColor,
						count: countByValueId.get(value.id) ?? 0
					}))
					.filter((value) => value.count > 0)
			}))
			.filter((attribute) => attribute.values.length > 0),
		priceMinCents: priceBounds._min.basePriceCents ?? 0,
		priceMaxCents: priceBounds._max.basePriceCents ?? 0
	};
}

export async function suggestProducts(term: string, limit = 6) {
	const conditions = buildTextFilter(term);

	if (conditions.length === 0) {
		return [];
	}

	const products = await prisma.product.findMany({
		where: { AND: [publishedOnly, ...conditions] },
		orderBy: [{ featured: 'desc' }, { reviewCount: 'desc' }],
		take: limit,
		select: { slug: true, name: true, basePriceCents: true }
	});

	return products;
}

export async function listFeaturedProducts(limit = 4) {
	const products = await prisma.product.findMany({
		where: { ...publishedOnly, featured: true },
		orderBy: [{ publishedAt: 'desc' }],
		take: limit,
		select: productCardSelect
	});

	if (products.length > 0) {
		return products.map(toProductCard);
	}

	const fallback = await prisma.product.findMany({
		where: publishedOnly,
		orderBy: [{ publishedAt: 'desc' }],
		take: limit,
		select: productCardSelect
	});

	return fallback.map(toProductCard);
}

export async function listRelatedProducts(productId: string, categorySlugs: string[], limit = 4) {
	const products = await prisma.product.findMany({
		where: {
			...publishedOnly,
			id: { not: productId },
			...(categorySlugs.length > 0 ? { categories: { some: { slug: { in: categorySlugs } } } } : {})
		},
		orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
		take: limit,
		select: productCardSelect
	});

	return products.map(toProductCard);
}

/**
 * Pieces achetees en meme temps que celle-ci. La donnee existe deja dans les
 * commandes : il ne manquait que la lecture. On ne retient que les commandes
 * reellement payees, sinon un panier abandonne influencerait la suggestion.
 */
export async function listBoughtTogether(productId: string, limit = 4) {
	const orders = await prisma.orderItem.findMany({
		where: { productId, order: { paymentStatus: 'PAID' } },
		select: { orderId: true },
		take: 300
	});

	if (orders.length === 0) {
		return [];
	}

	const companions = await prisma.orderItem.groupBy({
		by: ['productId'],
		where: {
			orderId: { in: orders.map((entry) => entry.orderId) },
			productId: { not: null },
			NOT: { productId }
		},
		_sum: { quantity: true },
		orderBy: { _sum: { quantity: 'desc' } },
		take: limit
	});

	const ids = companions.map((entry) => entry.productId).filter((id): id is string => id !== null);

	if (ids.length === 0) {
		return [];
	}

	const products = await prisma.product.findMany({
		where: { id: { in: ids }, ...publishedOnly },
		select: productCardSelect
	});

	/** L'ordre de frequence prime sur l'ordre renvoye par la base. */
	const byId = new Map(products.map((product) => [product.id, product]));

	return ids
		.map((id) => byId.get(id))
		.filter((product): product is NonNullable<typeof product> => Boolean(product))
		.map(toProductCard);
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof findProductBySlug>>>;

export function findProductBySlug(slug: string) {
	return prisma.product.findFirst({
		where: { slug, ...publishedOnly },
		select: {
			id: true,
			slug: true,
			name: true,
			summary: true,
			description: true,
			story: true,
			badge: true,
			basePriceCents: true,
			currency: true,
			handmade: true,
			ratingAverage: true,
			reviewCount: true,
			categories: { select: { slug: true, name: true }, orderBy: { position: 'asc' } },
			images: { select: { url: true, alt: true }, orderBy: { position: 'asc' } },
			attributeValues: {
				select: {
					attributeValue: {
						select: {
							value: true,
							label: true,
							hexColor: true,
							attribute: { select: { key: true, label: true, unit: true, kind: true } }
						}
					}
				}
			},
			variants: {
				where: { available: true },
				orderBy: { position: 'asc' },
				select: {
					id: true,
					label: true,
					priceCents: true,
					compareAtPriceCents: true,
					stock: true,
					attributeValues: {
						select: {
							attributeValue: {
								select: {
									value: true,
									label: true,
									hexColor: true,
									attribute: { select: { key: true, label: true, kind: true } }
								}
							}
						}
					}
				}
			},
			customizations: {
				orderBy: { position: 'asc' },
				select: {
					id: true,
					key: true,
					label: true,
					helpText: true,
					kind: true,
					required: true,
					maxLength: true,
					priceDeltaCents: true,
					choices: {
						orderBy: { position: 'asc' },
						select: { id: true, value: true, label: true, hexColor: true, priceDeltaCents: true }
					}
				}
			}
		}
	});
}

/** Etat du catalogue utilise pour valider un panier cote serveur. */
export function findVariantsForCheckout(variantIds: string[]) {
	return prisma.productVariant.findMany({
		where: { id: { in: variantIds }, available: true, product: publishedOnly },
		select: {
			id: true,
			label: true,
			priceCents: true,
			stock: true,
			product: { select: { id: true, slug: true, name: true, currency: true } },
			productId: true
		}
	});
}

export function findCustomizationOptions(productIds: string[]) {
	return prisma.customizationOption.findMany({
		where: { productId: { in: productIds } },
		select: {
			id: true,
			productId: true,
			key: true,
			label: true,
			kind: true,
			required: true,
			maxLength: true,
			priceDeltaCents: true,
			choices: { select: { value: true, label: true, priceDeltaCents: true } }
		}
	});
}

export function findProductIdBySlug(slug: string) {
	return prisma.product.findFirst({
		where: { slug, ...publishedOnly },
		select: { id: true, name: true, slug: true, summary: true }
	});
}

/** Pages publiques indexables : produits en ligne et categories utilisees. */
export async function listSitemapEntries() {
	const [products, categories] = await Promise.all([
		prisma.product.findMany({
			where: publishedOnly,
			orderBy: { updatedAt: 'desc' },
			select: { slug: true, updatedAt: true }
		}),
		prisma.category.findMany({
			where: { products: { some: publishedOnly } },
			orderBy: { position: 'asc' },
			select: { slug: true, updatedAt: true }
		})
	]);

	return { products, categories };
}
