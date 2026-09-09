import { imageFileSchema } from '#lib/client/validation/media';
import * as v from 'valibot';

const pageSchema = v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(500)), 1);
const searchSchema = v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120)), '');

export const adminProductFiltersSchema = v.object({
	query: searchSchema,
	status: v.optional(v.picklist(['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED']), 'ALL'),
	page: pageSchema
});

export const adminOrderFiltersSchema = v.object({
	query: searchSchema,
	status: v.optional(
		v.picklist([
			'ALL',
			'PENDING',
			'PAID',
			'PREPARING',
			'SHIPPED',
			'DELIVERED',
			'CANCELLED',
			'REFUNDED'
		]),
		'ALL'
	),
	page: pageSchema
});

export const adminUserFiltersSchema = v.object({ query: searchSchema, page: pageSchema });

export const reviewStatusFilterSchema = v.optional(
	v.picklist(['PENDING', 'PUBLISHED', 'REJECTED']),
	'PENDING'
);

export const userRoleSchema = v.object({
	userId: v.pipe(v.string(), v.minLength(1), v.maxLength(64)),
	role: v.picklist(['USER', 'ADMIN'])
});

/** Ajout d'une photo produit : passe par un formulaire, seul moyen d'envoyer un fichier. */
export const productImageSchema = v.object({
	productId: v.pipe(v.string(), v.minLength(1), v.maxLength(64)),
	alt: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200)), ''),
	photo: imageFileSchema
});

export type AdminProductFilters = v.InferOutput<typeof adminProductFiltersSchema>;
export type AdminOrderFilters = v.InferOutput<typeof adminOrderFiltersSchema>;
export type AdminUserFilters = v.InferOutput<typeof adminUserFiltersSchema>;
