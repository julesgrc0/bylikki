import * as v from 'valibot';

export const orderReferenceSchema = v.pipe(
	v.string(),
	v.trim(),
	v.regex(/^BY-[0-9A-Z]{8}$/, 'Cette référence de commande est invalide.')
);

export const orderStatusUpdateSchema = v.object({
	reference: orderReferenceSchema,
	status: v.picklist([
		'PENDING',
		'PAID',
		'PREPARING',
		'SHIPPED',
		'DELIVERED',
		'CANCELLED',
		'REFUNDED'
	]),
	trackingNumber: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(60))), null)
});

export const reviewModerationSchema = v.object({
	reviewId: v.pipe(v.string(), v.minLength(1)),
	status: v.picklist(['PUBLISHED', 'REJECTED'])
});
