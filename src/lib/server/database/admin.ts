import type { OrderStatus, ProductStatus, Role } from '$prisma/enums';
import { normalizeText } from '../utils/text';
import { prisma } from './client';

export const ADMIN_PAGE_SIZE = 25;
const LOW_STOCK_THRESHOLD = 3;
const TREND_DAYS = 30;

/** Fenetre glissante utilisee par les indicateurs et la courbe du tableau de bord. */
function startOfTrendWindow(now: Date) {
	const start = new Date(now);
	start.setHours(0, 0, 0, 0);
	start.setDate(start.getDate() - (TREND_DAYS - 1));

	return start;
}

const paidStatuses = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] satisfies OrderStatus[];

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

export async function getDashboardStats(now = new Date()) {
	const windowStart = startOfTrendWindow(now);

	const [revenue, ordersByStatus, recentOrders, productsByStatus, counters, lowStock] =
		await Promise.all([
			prisma.order.aggregate({
				where: { paymentStatus: 'PAID' },
				_sum: { totalCents: true },
				_count: { _all: true },
				_avg: { totalCents: true }
			}),
			prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
			prisma.order.findMany({
				where: { createdAt: { gte: windowStart } },
				select: { createdAt: true, totalCents: true, paymentStatus: true }
			}),
			prisma.product.groupBy({ by: ['status'], _count: { _all: true } }),
			prisma.$transaction([
				prisma.user.count(),
				prisma.user.count({ where: { createdAt: { gte: windowStart } } }),
				prisma.review.count({ where: { status: 'PENDING' } }),
				prisma.order.count({ where: { status: { in: ['PAID', 'PREPARING'] } } })
			]),
			prisma.productVariant.findMany({
				where: { available: true, stock: { lte: LOW_STOCK_THRESHOLD } },
				orderBy: { stock: 'asc' },
				take: 8,
				select: {
					id: true,
					label: true,
					stock: true,
					sku: true,
					product: { select: { name: true, slug: true, id: true } }
				}
			})
		]);

	const [totalAccounts, newAccounts, pendingReviews, ordersToPrepare] = counters;

	/** Une entree par jour, y compris les jours sans commande. */
	const days = new Map<string, { date: string; orders: number; revenueCents: number }>();

	for (let offset = 0; offset < TREND_DAYS; offset += 1) {
		const day = new Date(windowStart);
		day.setDate(day.getDate() + offset);
		const key = day.toISOString().slice(0, 10);
		days.set(key, { date: key, orders: 0, revenueCents: 0 });
	}

	for (const order of recentOrders) {
		const entry = days.get(order.createdAt.toISOString().slice(0, 10));

		if (!entry) {
			continue;
		}

		entry.orders += 1;

		if (order.paymentStatus === 'PAID') {
			entry.revenueCents += order.totalCents;
		}
	}

	const trend = [...days.values()];

	return {
		revenueCents: revenue._sum.totalCents ?? 0,
		paidOrders: revenue._count._all,
		averageBasketCents: Math.round(revenue._avg.totalCents ?? 0),
		ordersByStatus: Object.fromEntries(
			ordersByStatus.map((entry) => [entry.status, entry._count._all])
		) as Partial<Record<OrderStatus, number>>,
		productsByStatus: Object.fromEntries(
			productsByStatus.map((entry) => [entry.status, entry._count._all])
		) as Partial<Record<ProductStatus, number>>,
		totalAccounts,
		newAccounts,
		pendingReviews,
		ordersToPrepare,
		trend,
		trendRevenueCents: trend.reduce((total, day) => total + day.revenueCents, 0),
		trendOrders: trend.reduce((total, day) => total + day.orders, 0),
		lowStock
	};
}

export async function getTopProducts(limit = 6) {
	const grouped = await prisma.orderItem.groupBy({
		by: ['productSlug', 'productName'],
		where: { order: { status: { in: paidStatuses } } },
		_sum: { quantity: true, totalCents: true },
		orderBy: { _sum: { totalCents: 'desc' } },
		take: limit
	});

	return grouped.map((entry) => ({
		slug: entry.productSlug,
		name: entry.productName,
		quantity: entry._sum.quantity ?? 0,
		revenueCents: entry._sum.totalCents ?? 0
	}));
}

export type AdminProductRow = Awaited<ReturnType<typeof listAdminProducts>>['items'][number];

/** Contrairement au catalogue public, l'admin voit aussi brouillons et archives. */
export async function listAdminProducts(filters: {
	query: string;
	status: ProductStatus | 'ALL';
	page: number;
}) {
	const terms = normalizeText(filters.query).split(' ').filter(Boolean);
	const where = {
		AND: [
			...(filters.status === 'ALL' ? [] : [{ status: filters.status }]),
			...terms.map((term) => ({ searchText: { contains: term } }))
		]
	};

	const [total, items] = await Promise.all([
		prisma.product.count({ where }),
		prisma.product.findMany({
			where,
			orderBy: [{ updatedAt: 'desc' }],
			skip: (filters.page - 1) * ADMIN_PAGE_SIZE,
			take: ADMIN_PAGE_SIZE,
			select: {
				id: true,
				slug: true,
				name: true,
				status: true,
				featured: true,
				basePriceCents: true,
				reviewCount: true,
				ratingAverage: true,
				updatedAt: true,
				images: { select: { url: true }, take: 1, orderBy: { position: 'asc' } },
				variants: { select: { stock: true, available: true } },
				categories: { select: { slug: true, name: true } }
			}
		})
	]);

	return {
		items: items.map((product) => ({
			...product,
			stock: product.variants.reduce((total, variant) => total + variant.stock, 0),
			variantCount: product.variants.length
		})),
		total,
		page: filters.page,
		pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))
	};
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof findAdminProduct>>>;

export function findAdminProduct(productId: string) {
	return prisma.product.findUnique({
		where: { id: productId },
		select: {
			id: true,
			slug: true,
			name: true,
			summary: true,
			description: true,
			story: true,
			badge: true,
			status: true,
			basePriceCents: true,
			handmade: true,
			featured: true,
			categories: { select: { slug: true } },
			images: {
				select: { id: true, url: true, alt: true, position: true },
				orderBy: { position: 'asc' }
			},
			attributeValues: {
				select: {
					attributeValue: {
						select: { value: true, label: true, attribute: { select: { key: true, label: true } } }
					}
				}
			},
			variants: {
				orderBy: { position: 'asc' },
				select: {
					id: true,
					sku: true,
					label: true,
					priceCents: true,
					compareAtPriceCents: true,
					stock: true,
					available: true,
					position: true,
					attributeValues: {
						select: {
							attributeValue: {
								select: { value: true, attribute: { select: { key: true } } }
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

/** Renvoie les URL d'images a effacer du stockage apres suppression. */
export async function deleteProduct(productId: string) {
	const images = await prisma.productImage.findMany({
		where: { productId },
		select: { url: true }
	});

	await prisma.product.delete({ where: { id: productId } });

	return images.map((image) => image.url);
}

export function addProductImage(productId: string, image: { url: string; alt: string }) {
	return prisma.$transaction(async (transaction) => {
		const count = await transaction.productImage.count({ where: { productId } });

		return transaction.productImage.create({
			data: { ...image, productId, position: count },
			select: { id: true, url: true }
		});
	});
}

export async function deleteProductImage(imageId: string) {
	const image = await prisma.productImage.findUnique({
		where: { id: imageId },
		select: { url: true }
	});

	if (!image) {
		return null;
	}

	await prisma.productImage.delete({ where: { id: imageId } });

	return image.url;
}

export async function listAdminOrders(filters: {
	query: string;
	status: OrderStatus | 'ALL';
	page: number;
}) {
	const search = filters.query.trim();
	const where = {
		AND: [
			...(filters.status === 'ALL' ? [] : [{ status: filters.status }]),
			...(search
				? [
						{
							OR: [
								{ reference: { contains: search.toUpperCase() } },
								{ contactEmail: { contains: search.toLowerCase() } }
							]
						}
					]
				: [])
		]
	};

	const [total, items] = await Promise.all([
		prisma.order.count({ where }),
		prisma.order.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			skip: (filters.page - 1) * ADMIN_PAGE_SIZE,
			take: ADMIN_PAGE_SIZE,
			select: {
				reference: true,
				contactEmail: true,
				status: true,
				paymentStatus: true,
				totalCents: true,
				createdAt: true,
				trackingNumber: true,
				_count: { select: { items: true } }
			}
		})
	]);

	return {
		items,
		total,
		page: filters.page,
		pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))
	};
}

export type AdminOrder = NonNullable<Awaited<ReturnType<typeof findAdminOrder>>>;

export function findAdminOrder(reference: string) {
	return prisma.order.findUnique({
		where: { reference },
		select: {
			reference: true,
			contactEmail: true,
			status: true,
			paymentStatus: true,
			subtotalCents: true,
			shippingCents: true,
			totalCents: true,
			currency: true,
			shippingFullName: true,
			shippingLine1: true,
			shippingLine2: true,
			shippingPostalCode: true,
			shippingCity: true,
			shippingCountry: true,
			trackingNumber: true,
			stripePaymentIntentId: true,
			createdAt: true,
			paidAt: true,
			shippedAt: true,
			deliveredAt: true,
			cancelledAt: true,
			refundedAt: true,
			items: {
				select: {
					id: true,
					productName: true,
					productSlug: true,
					variantLabel: true,
					quantity: true,
					unitPriceCents: true,
					totalCents: true,
					customization: true
				}
			}
		}
	});
}

export async function listAdminUsers(filters: { query: string; page: number }) {
	const search = filters.query.trim().toLowerCase();
	const where = search ? { email: { contains: search } } : {};

	const [total, items] = await Promise.all([
		prisma.user.count({ where }),
		prisma.user.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			skip: (filters.page - 1) * ADMIN_PAGE_SIZE,
			take: ADMIN_PAGE_SIZE,
			select: {
				id: true,
				email: true,
				role: true,
				displayName: true,
				createdAt: true,
				lastSeenAt: true,
				deletionRequestedAt: true,
				_count: { select: { orders: true, reviews: true } }
			}
		})
	]);

	return {
		items,
		total,
		page: filters.page,
		pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))
	};
}

export function setUserRole(userId: string, role: Role) {
	return prisma.user.update({
		where: { id: userId },
		data: { role },
		select: { id: true, role: true }
	});
}

/** Le dernier compte administrateur ne doit pas pouvoir etre retrograde ni supprime. */
export function countAdmins() {
	return prisma.user.count({ where: { role: 'ADMIN' } });
}

export function findUserRole(userId: string) {
	return prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
}

export function listAdminReviews(status: 'PENDING' | 'PUBLISHED' | 'REJECTED') {
	return prisma.review.findMany({
		where: { status },
		orderBy: { createdAt: 'desc' },
		take: 100,
		select: {
			id: true,
			authorName: true,
			rating: true,
			title: true,
			body: true,
			status: true,
			verifiedPurchase: true,
			createdAt: true,
			photos: { select: { id: true, url: true } },
			product: { select: { name: true, slug: true } }
		}
	});
}

export function listAdminAttributes() {
	return prisma.attribute.findMany({
		orderBy: [{ position: 'asc' }, { label: 'asc' }],
		select: {
			id: true,
			key: true,
			label: true,
			kind: true,
			unit: true,
			filterable: true,
			variantAxis: true,
			position: true,
			values: {
				orderBy: [{ position: 'asc' }],
				select: { id: true, value: true, label: true, hexColor: true }
			}
		}
	});
}

export function listAdminCategories() {
	return prisma.category.findMany({
		orderBy: [{ position: 'asc' }, { name: 'asc' }],
		select: {
			id: true,
			slug: true,
			name: true,
			description: true,
			position: true,
			parent: { select: { slug: true } },
			_count: { select: { products: true } }
		}
	});
}

export function deleteCategory(slug: string) {
	return prisma.category.delete({ where: { slug }, select: { slug: true } });
}

export function deleteAttribute(key: string) {
	return prisma.attribute.delete({ where: { key }, select: { key: true } });
}
