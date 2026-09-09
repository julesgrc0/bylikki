import { error, invalid } from '@sveltejs/kit';
import {
	addProductImage,
	countAdmins,
	deleteAttribute,
	deleteCategory,
	deleteProductImage,
	deleteProduct as deleteProductRecord,
	findAdminOrder,
	findAdminProduct,
	findUserRole,
	getDashboardStats,
	getTopProducts,
	listAdminAttributes,
	listAdminCategories,
	listAdminOrders,
	listAdminProducts,
	listAdminReviews,
	listAdminUsers,
	setUserRole
} from '#lib/server/database/admin';
import {
	createProduct as createProductRecord,
	deleteVariant as deleteVariantRecord,
	listCategories,
	saveAttribute,
	saveCategory,
	saveCustomization,
	saveVariant,
	setProductStatus,
	updateProduct as updateProductRecord
} from '#lib/server/database/catalog-admin';
import { updateOrderStatus } from '#lib/server/database/order';
import { moderateReview } from '#lib/server/database/review';
import { purgeUserAccount } from '#lib/server/database/user';
import { requireAdmin } from '#lib/server/security/guard';
import { deleteImage, isBlobConfigured, uploadImage } from '#lib/server/utils/blob';
import { runRetentionPurge } from '#lib/server/utils/retention';
import {
	adminOrderFiltersSchema,
	adminProductFiltersSchema,
	adminUserFiltersSchema,
	productImageSchema,
	reviewStatusFilterSchema,
	userRoleSchema
} from '#lib/server/validation/admin';
import {
	attributeSchema,
	categorySchema,
	customizationSchema,
	productSchema,
	productStatusSchema,
	updateProductSchema,
	variantUpsertSchema
} from '#lib/server/validation/catalog';
import { orderStatusUpdateSchema, reviewModerationSchema } from '#lib/server/validation/order';
import * as v from 'valibot';
import { command, form, query } from '$app/server';

/**
 * Points d'entree reserves au role ADMIN. Chacun verifie les droits lui-meme :
 * la garde de la page /admin n'est qu'un confort de navigation.
 */

const identifierSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(64));

/* -------------------------------------------------------------- statistiques */

export const getStats = query(async () => {
	requireAdmin();

	const [stats, topProducts] = await Promise.all([getDashboardStats(), getTopProducts()]);

	return { ...stats, topProducts };
});

/* ------------------------------------------------------------------ produits */

export const getAdminProducts = query(adminProductFiltersSchema, async (filters) => {
	requireAdmin();

	return listAdminProducts(filters);
});

export const getAdminProduct = query(identifierSchema, async (productId) => {
	requireAdmin();

	const product = await findAdminProduct(productId);

	if (!product) {
		error(404, 'Ce produit est introuvable.');
	}

	return product;
});

export const getCategories = query(async () => {
	requireAdmin();

	return listCategories();
});

export const getCatalogueMeta = query(async () => {
	requireAdmin();

	const [categories, attributes] = await Promise.all([
		listAdminCategories(),
		listAdminAttributes()
	]);

	return { categories, attributes };
});

export const createProduct = command(productSchema, async (input) => {
	requireAdmin();

	const created = await createProductRecord(input);
	await getAdminProducts({ query: '', status: 'ALL', page: 1 }).refresh();

	return created;
});

export const updateProduct = command(updateProductSchema, async ({ productId, product }) => {
	requireAdmin();

	const updated = await updateProductRecord(productId, product);
	await getAdminProduct(productId).refresh();

	return updated;
});

export const publishProduct = command(productStatusSchema, async ({ productId, status }) => {
	requireAdmin();

	const updated = await setProductStatus(productId, status);
	await getAdminProduct(productId).refresh();

	return updated;
});

export const deleteProduct = command(identifierSchema, async (productId) => {
	requireAdmin();

	const images = await deleteProductRecord(productId);
	await Promise.all(images.map(deleteImage));

	return { deleted: true };
});

export const upsertVariant = command(variantUpsertSchema, async ({ productId, variant }) => {
	requireAdmin();

	const saved = await saveVariant(productId, variant);
	await getAdminProduct(productId).refresh();

	return saved;
});

export const deleteVariant = command(
	v.object({ productId: identifierSchema, variantId: identifierSchema }),
	async ({ productId, variantId }) => {
		requireAdmin();

		const deleted = await deleteVariantRecord(variantId);
		await getAdminProduct(productId).refresh();

		return deleted;
	}
);

export const upsertCustomization = command(customizationSchema, async ({ productId, option }) => {
	requireAdmin();

	const saved = await saveCustomization(productId, option);
	await getAdminProduct(productId).refresh();

	return saved;
});

/* -------------------------------------------------------------------- images */

export const addImage = form(productImageSchema, async ({ productId, alt, photo }, issue) => {
	requireAdmin();

	if (!isBlobConfigured()) {
		invalid(issue.photo("L'envoi de photos est momentanément indisponible."));
	}

	let uploaded;

	try {
		uploaded = await uploadImage('produits', photo, 'product');
	} catch {
		invalid(issue.photo("Cette photo n'a pas pu être envoyée. Réessaie dans un instant."));
	}

	await addProductImage(productId, { url: uploaded.url, alt });
	await getAdminProduct(productId).refresh();

	return { saved: true };
});

export const removeImage = command(
	v.object({ productId: identifierSchema, imageId: identifierSchema }),
	async ({ productId, imageId }) => {
		requireAdmin();

		const url = await deleteProductImage(imageId);

		if (!url) {
			error(404, 'Cette image est introuvable.');
		}

		await deleteImage(url);
		await getAdminProduct(productId).refresh();

		return { deleted: true };
	}
);

/* ----------------------------------------------------------------- commandes */

export const getAdminOrders = query(adminOrderFiltersSchema, async (filters) => {
	requireAdmin();

	return listAdminOrders(filters);
});

export const getAdminOrder = query(
	v.pipe(v.string(), v.trim(), v.maxLength(20)),
	async (reference) => {
		requireAdmin();

		const order = await findAdminOrder(reference);

		if (!order) {
			error(404, 'Cette commande est introuvable.');
		}

		return order;
	}
);

export const setOrderStatus = command(
	orderStatusUpdateSchema,
	async ({ reference, status, trackingNumber }) => {
		requireAdmin();

		const updated = await updateOrderStatus(reference, status, trackingNumber);
		await getAdminOrder(reference).refresh();

		return updated;
	}
);

/* ------------------------------------------------------------------- comptes */

export const getAdminUsers = query(adminUserFiltersSchema, async (filters) => {
	requireAdmin();

	return listAdminUsers(filters);
});

export const changeUserRole = command(userRoleSchema, async ({ userId, role }) => {
	const admin = requireAdmin();

	if (userId === admin.id && role !== 'ADMIN') {
		error(409, 'Retire ton propre rôle depuis un autre compte administrateur.');
	}

	const target = await findUserRole(userId);

	if (!target) {
		error(404, 'Ce compte est introuvable.');
	}

	/** La boutique doit toujours conserver au moins un compte administrateur. */
	if (target.role === 'ADMIN' && role !== 'ADMIN' && (await countAdmins()) <= 1) {
		error(409, "C'est le dernier compte administrateur : nomme quelqu'un d'autre avant.");
	}

	const updated = await setUserRole(userId, role);
	await getAdminUsers({ query: '', page: 1 }).refresh();

	return updated;
});

export const deleteUserAccount = command(identifierSchema, async (userId) => {
	const admin = requireAdmin();

	if (userId === admin.id) {
		error(409, 'Supprime ton propre compte depuis ton espace personnel.');
	}

	const target = await findUserRole(userId);

	if (!target) {
		error(404, 'Ce compte est introuvable.');
	}

	if (target.role === 'ADMIN' && (await countAdmins()) <= 1) {
		error(409, "C'est le dernier compte administrateur.");
	}

	const images = await purgeUserAccount(userId);
	await Promise.all(images.map(deleteImage));
	await getAdminUsers({ query: '', page: 1 }).refresh();

	return { deleted: true };
});

/* ---------------------------------------------------------------------- avis */

export const getAdminReviews = query(reviewStatusFilterSchema, async (status) => {
	requireAdmin();

	return listAdminReviews(status);
});

export const setReviewStatus = command(reviewModerationSchema, async ({ reviewId, status }) => {
	requireAdmin();

	const updated = await moderateReview(reviewId, status);
	await getAdminReviews('PENDING').refresh();

	return updated;
});

/* --------------------------------------------------------- catalogue et meta */

export const upsertAttribute = command(attributeSchema, async (input) => {
	requireAdmin();

	const saved = await saveAttribute(input);
	await getCatalogueMeta().refresh();

	return saved;
});

export const removeAttribute = command(
	v.pipe(v.string(), v.trim(), v.maxLength(40)),
	async (key) => {
		requireAdmin();

		const removed = await deleteAttribute(key);
		await getCatalogueMeta().refresh();

		return removed;
	}
);

export const upsertCategory = command(categorySchema, async (input) => {
	requireAdmin();

	const saved = await saveCategory(input);
	await getCatalogueMeta().refresh();

	return saved;
});

export const removeCategory = command(
	v.pipe(v.string(), v.trim(), v.maxLength(120)),
	async (slug) => {
		requireAdmin();

		const removed = await deleteCategory(slug);
		await getCatalogueMeta().refresh();

		return removed;
	}
);

/* --------------------------------------------------------------- maintenance */

/**
 * Politique de conservation : purge des identifiants expires et des comptes
 * dont la suppression a ete demandee. Destine a une tache planifiee.
 */
export const purgeExpiredData = command(async () => {
	requireAdmin();

	return runRetentionPurge();
});
