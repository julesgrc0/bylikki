import * as v from 'valibot';

const trimmed = (max: number) => v.pipe(v.string(), v.trim(), v.maxLength(max));
const requiredText = (max: number, message: string) =>
	v.pipe(v.string(message), v.trim(), v.minLength(1, message), v.maxLength(max));
const optionalText = (max: number) => v.optional(v.nullable(trimmed(max)), null);
const cents = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(10_000_000));
const position = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(9999)), 0);
const slug = v.pipe(v.string(), v.trim(), v.regex(/^[a-z0-9-]{2,120}$/, 'Slug invalide.'));

export const attributeRefSchema = v.object({
	attributeKey: v.pipe(v.string(), v.trim(), v.maxLength(60)),
	value: v.pipe(v.string(), v.trim(), v.maxLength(80))
});

export const variantSchema = v.object({
	sku: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(60)),
	label: requiredText(80, 'Le libellé de la variante est obligatoire.'),
	priceCents: cents,
	compareAtPriceCents: v.optional(v.nullable(cents), null),
	stock: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100_000)), 0),
	available: v.optional(v.boolean(), true),
	position,
	attributes: v.optional(v.array(attributeRefSchema), [])
});

export const productSchema = v.object({
	slug: v.optional(v.nullable(slug), null),
	name: requiredText(120, 'Le nom du produit est obligatoire.'),
	summary: optionalText(200),
	description: requiredText(6000, 'La description est obligatoire.'),
	story: optionalText(6000),
	badge: optionalText(40),
	basePriceCents: cents,
	handmade: v.optional(v.boolean(), true),
	featured: v.optional(v.boolean(), false),
	status: v.optional(v.picklist(['DRAFT', 'PUBLISHED', 'ARCHIVED']), 'DRAFT'),
	categorySlugs: v.optional(v.array(slug), []),
	attributes: v.optional(v.array(attributeRefSchema), []),
	images: v.optional(
		v.array(
			v.object({
				url: v.pipe(v.string(), v.trim(), v.maxLength(500)),
				alt: v.optional(trimmed(200), ''),
				position
			})
		),
		[]
	),
	variants: v.optional(v.array(variantSchema), [])
});

export const updateProductSchema = v.object({
	productId: v.pipe(v.string(), v.minLength(1)),
	product: productSchema
});

export const variantUpsertSchema = v.object({
	productId: v.pipe(v.string(), v.minLength(1)),
	variant: variantSchema
});

export const productStatusSchema = v.object({
	productId: v.pipe(v.string(), v.minLength(1)),
	status: v.picklist(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
});

export const customizationSchema = v.object({
	productId: v.pipe(v.string(), v.minLength(1)),
	option: v.object({
		key: v.pipe(v.string(), v.trim(), v.regex(/^[a-z0-9-]{2,40}$/, 'Clé invalide.')),
		label: requiredText(80, 'Le libellé est obligatoire.'),
		helpText: optionalText(200),
		kind: v.optional(v.picklist(['TEXT', 'SELECT', 'COLOR']), 'TEXT'),
		required: v.optional(v.boolean(), false),
		maxLength: v.optional(
			v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(500))),
			null
		),
		priceDeltaCents: v.optional(cents, 0),
		position,
		choices: v.optional(
			v.array(
				v.object({
					value: v.pipe(v.string(), v.trim(), v.maxLength(80)),
					label: requiredText(80, 'Le libellé du choix est obligatoire.'),
					hexColor: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/))), null),
					priceDeltaCents: v.optional(cents, 0)
				})
			),
			[]
		)
	})
});

export const attributeSchema = v.object({
	key: v.pipe(v.string(), v.trim(), v.regex(/^[a-z0-9-]{2,40}$/, 'Clé invalide.')),
	label: requiredText(80, 'Le libellé est obligatoire.'),
	kind: v.optional(v.picklist(['SELECT', 'COLOR', 'TEXT', 'NUMBER', 'BOOLEAN']), 'SELECT'),
	unit: optionalText(20),
	filterable: v.optional(v.boolean(), true),
	variantAxis: v.optional(v.boolean(), false),
	position,
	values: v.optional(
		v.array(
			v.object({
				value: v.pipe(v.string(), v.trim(), v.maxLength(80)),
				label: requiredText(80, 'Le libellé est obligatoire.'),
				hexColor: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/))), null)
			})
		),
		[]
	)
});

export const categorySchema = v.object({
	slug,
	name: requiredText(80, 'Le nom est obligatoire.'),
	description: optionalText(500),
	position,
	parentSlug: v.optional(v.nullable(slug), null)
});
