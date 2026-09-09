import * as v from 'valibot';

export const discountKinds = ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'] as const;

export const discountKindLabels: Record<(typeof discountKinds)[number], string> = {
	PERCENTAGE: 'Pourcentage',
	FIXED_AMOUNT: 'Montant fixe',
	FREE_SHIPPING: 'Livraison offerte'
};

const optionalDate = v.optional(v.nullable(v.date()), null);
const optionalCount = v.optional(
	v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(1_000_000))),
	null
);

export const discountSchema = v.object({
	id: v.optional(v.string(), ''),
	code: v.pipe(
		v.string('Donne un code.'),
		v.trim(),
		v.minLength(3, 'Ce code est trop court.'),
		v.maxLength(40, 'Ce code est trop long.'),
		v.regex(/^[A-Za-z0-9-]+$/, 'Lettres, chiffres et tirets uniquement.')
	),
	label: v.pipe(
		v.string('Donne un libellé, affiché à la cliente.'),
		v.trim(),
		v.minLength(2, 'Ce libellé est trop court.'),
		v.maxLength(60, 'Ce libellé est trop long.')
	),
	kind: v.picklist(discountKinds),
	value: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(1_000_000)),
	active: v.optional(v.boolean(), true),
	startsAt: optionalDate,
	expiresAt: optionalDate,
	maxUses: optionalCount,
	maxUsesPerUser: optionalCount,
	minSubtotalCents: v.optional(
		v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(1_000_000)),
		0
	)
});

export const loyaltyTierSchema = v.object({
	id: v.optional(v.string(), ''),
	name: v.pipe(
		v.string('Donne un nom à ce palier.'),
		v.trim(),
		v.minLength(2, 'Ce nom est trop court.'),
		v.maxLength(40, 'Ce nom est trop long.')
	),
	thresholdCents: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100_000_000)),
	discountPercent: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(80)),
	freeShipping: v.optional(v.boolean(), false),
	color: v.pipe(v.string(), v.trim(), v.regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide.')),
	position: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100)), 0)
});
