import * as v from 'valibot';

export const MAX_LINE_QUANTITY = 9;

export const cartLineSchema = v.object({
	variantId: v.pipe(v.string(), v.minLength(1)),
	quantity: v.pipe(
		v.number(),
		v.integer(),
		v.minValue(1, 'La quantité minimale est 1.'),
		v.maxValue(MAX_LINE_QUANTITY, `La quantité maximale est ${MAX_LINE_QUANTITY}.`)
	),
	customization: v.optional(
		v.array(
			v.object({
				key: v.pipe(v.string(), v.minLength(1), v.maxLength(60)),
				value: v.pipe(v.string(), v.maxLength(200))
			})
		),
		[]
	)
});

export const checkoutSchema = v.object({
	addressId: v.pipe(v.string('Choisis une adresse de livraison.'), v.minLength(1)),
	lines: v.pipe(
		v.array(cartLineSchema),
		v.minLength(1, 'Ton panier est vide.'),
		v.maxLength(40, 'Ce panier contient trop de lignes.')
	)
});

export type CartLineInput = v.InferOutput<typeof cartLineSchema>;
export type CheckoutInput = v.InferOutput<typeof checkoutSchema>;
