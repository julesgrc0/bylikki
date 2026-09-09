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
import { requireAdmin } from '#lib/server/security/guard';
import { runRetentionPurge } from '#lib/server/utils/retention';
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
import { command, query } from '$app/server';

/**
 * Points d'entree reserves au role ADMIN. Il n'y a pas encore d'interface
 * d'administration : ces fonctions constituent l'API de gestion du catalogue.
 */

export const getCategories = query(async () => {
	requireAdmin();

	return listCategories();
});

export const createProduct = command(productSchema, async (input) => {
	requireAdmin();

	return createProductRecord(input);
});

export const updateProduct = command(updateProductSchema, async ({ productId, product }) => {
	requireAdmin();

	return updateProductRecord(productId, product);
});

export const publishProduct = command(productStatusSchema, async ({ productId, status }) => {
	requireAdmin();

	return setProductStatus(productId, status);
});

export const upsertVariant = command(variantUpsertSchema, async ({ productId, variant }) => {
	requireAdmin();

	return saveVariant(productId, variant);
});

export const deleteVariant = command(v.pipe(v.string(), v.minLength(1)), async (variantId) => {
	requireAdmin();

	return deleteVariantRecord(variantId);
});

export const upsertCustomization = command(customizationSchema, async ({ productId, option }) => {
	requireAdmin();

	return saveCustomization(productId, option);
});

export const upsertAttribute = command(attributeSchema, async (input) => {
	requireAdmin();

	return saveAttribute(input);
});

export const upsertCategory = command(categorySchema, async (input) => {
	requireAdmin();

	return saveCategory(input);
});

export const setOrderStatus = command(
	orderStatusUpdateSchema,
	async ({ reference, status, trackingNumber }) => {
		requireAdmin();

		return updateOrderStatus(reference, status, trackingNumber);
	}
);

/**
 * Politique de conservation : purge des identifiants expires et des comptes
 * dont la suppression a ete demandee. Destine a une tache planifiee.
 */
export const purgeExpiredData = command(async () => {
	requireAdmin();

	return runRetentionPurge();
});

export const setReviewStatus = command(reviewModerationSchema, async ({ reviewId, status }) => {
	requireAdmin();

	return moderateReview(reviewId, status);
});
