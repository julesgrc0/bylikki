import * as v from 'valibot';

const optionalText = (max: number, message: string) =>
	v.optional(v.pipe(v.string(), v.trim(), v.maxLength(max, message)), '');

export const profileSchema = v.object({
	displayName: optionalText(60, 'Ce nom est trop long.'),
	phone: v.optional(
		v.pipe(
			v.string(),
			v.trim(),
			v.check(
				(value) => value === '' || /^[+0-9 ().-]{6,20}$/.test(value),
				'Ce numéro de téléphone est invalide.'
			)
		),
		''
	)
});

export const addressSchema = v.object({
	addressId: v.optional(v.string(), ''),
	label: optionalText(40, 'Ce libellé est trop long.'),
	fullName: v.pipe(
		v.string('Le nom du destinataire est obligatoire.'),
		v.trim(),
		v.minLength(2, 'Le nom du destinataire est obligatoire.'),
		v.maxLength(80, 'Ce nom est trop long.')
	),
	line1: v.pipe(
		v.string("L'adresse est obligatoire."),
		v.trim(),
		v.minLength(4, "L'adresse est obligatoire."),
		v.maxLength(120, 'Cette adresse est trop longue.')
	),
	line2: optionalText(120, 'Ce complément est trop long.'),
	postalCode: v.pipe(
		v.string('Le code postal est obligatoire.'),
		v.trim(),
		v.regex(/^[0-9A-Za-z -]{3,10}$/, 'Ce code postal est invalide.')
	),
	city: v.pipe(
		v.string('La ville est obligatoire.'),
		v.trim(),
		v.minLength(2, 'La ville est obligatoire.'),
		v.maxLength(80, 'Ce nom de ville est trop long.')
	),
	country: v.optional(v.picklist(['FR', 'BE', 'CH', 'LU'], 'Ce pays n’est pas desservi.'), 'FR'),
	isDefault: v.optional(v.boolean(), false)
});

export const consentSchema = v.object({
	type: v.picklist(['NEWSLETTER', 'RESTOCK_ALERT', 'REVIEW_REMINDER']),
	granted: v.optional(v.boolean(), false)
});

export type ProfileInput = v.InferOutput<typeof profileSchema>;
export type AddressInput = v.InferOutput<typeof addressSchema>;
export type ConsentInput = v.InferOutput<typeof consentSchema>;
