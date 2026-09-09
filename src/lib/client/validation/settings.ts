import * as v from 'valibot';

/**
 * Chaque rubrique de reglages est decrite par un schema et une valeur par
 * defaut. Le meme couple sert a valider la saisie dans l'administration et a
 * combler une cle absente en base : la boutique fonctionne donc avant meme
 * qu'un reglage ait ete enregistre.
 */

export const SHIPPING_COUNTRIES = [
	{ value: 'FR', label: 'France' },
	{ value: 'BE', label: 'Belgique' },
	{ value: 'CH', label: 'Suisse' },
	{ value: 'LU', label: 'Luxembourg' }
] as const;

export type CountryCode = (typeof SHIPPING_COUNTRIES)[number]['value'];

const countryCode = v.picklist(SHIPPING_COUNTRIES.map((country) => country.value));

const positiveCents = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100_000));

export const shippingSettingsSchema = v.object({
	flatCents: positiveCents,
	freeThresholdCents: positiveCents,
	countries: v.pipe(
		v.array(countryCode),
		v.minLength(1, 'Il faut au moins un pays desservi.'),
		v.maxLength(SHIPPING_COUNTRIES.length)
	)
});

export const vacationSettingsSchema = v.object({
	enabled: v.optional(v.boolean(), false),
	message: v.pipe(v.string(), v.trim(), v.maxLength(280, 'Ce message est trop long.'))
});

/**
 * Une destination est decrite, jamais une URL libre : l'administration ne peut
 * donc pas fabriquer de lien sortant, et les chemins restent construits par
 * `resolve()` cote composant.
 */
export const linkTargetSchema = v.variant('kind', [
	v.object({ kind: v.literal('category'), slug: v.pipe(v.string(), v.trim(), v.maxLength(80)) }),
	v.object({ kind: v.literal('search'), query: v.pipe(v.string(), v.trim(), v.maxLength(80)) }),
	v.object({ kind: v.literal('product'), slug: v.pipe(v.string(), v.trim(), v.maxLength(120)) }),
	v.object({ kind: v.literal('atelier') }),
	v.object({ kind: v.literal('none') })
]);

export type LinkTarget = v.InferOutput<typeof linkTargetSchema>;

export const announcementSettingsSchema = v.object({
	enabled: v.optional(v.boolean(), false),
	text: v.pipe(v.string(), v.trim(), v.maxLength(140, 'Ce message est trop long.')),
	target: linkTargetSchema,
	tone: v.picklist(['pink', 'yellow', 'blue', 'green'])
});

export const slideSchema = v.object({
	kicker: v.pipe(v.string(), v.trim(), v.maxLength(60)),
	title: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(80)),
	desc: v.pipe(v.string(), v.trim(), v.maxLength(220)),
	cta: v.pipe(v.string(), v.trim(), v.maxLength(40)),
	target: linkTargetSchema
});

export const homeSettingsSchema = v.object({
	slides: v.pipe(
		v.array(slideSchema),
		v.minLength(1, 'Il faut au moins une diapositive.'),
		v.maxLength(6, 'Six diapositives au maximum.')
	)
});

export const thresholdSettingsSchema = v.object({
	lowStock: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100)),
	preparationDays: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(60))
});

export const loyaltySettingsSchema = v.object({
	stacksWithCode: v.optional(v.boolean(), false)
});

export const settingsSchemas = {
	shipping: shippingSettingsSchema,
	announcement: announcementSettingsSchema,
	vacation: vacationSettingsSchema,
	home: homeSettingsSchema,
	thresholds: thresholdSettingsSchema,
	loyalty: loyaltySettingsSchema
} as const;

export type SettingKey = keyof typeof settingsSchemas;

export type SiteSettings = {
	[Key in SettingKey]: v.InferOutput<(typeof settingsSchemas)[Key]>;
};

export const settingDefaults: SiteSettings = {
	shipping: { flatCents: 490, freeThresholdCents: 6000, countries: ['FR', 'BE', 'CH', 'LU'] },
	announcement: { enabled: false, text: '', target: { kind: 'none' }, tone: 'pink' },
	vacation: {
		enabled: false,
		message:
			'L’atelier est en pause. Tu peux continuer à regarder les créations, les commandes rouvriront très vite.'
	},
	home: {
		slides: [
			{
				kicker: 'Découvrir la boutique',
				title: 'Les dernières créations',
				desc: 'Bijoux et pièces cousues, en petites séries. Ce qui part ne revient pas toujours.',
				cta: 'Visiter la boutique →',
				target: { kind: 'search', query: '' }
			},
			{
				kicker: 'Personnalisation',
				title: 'Personnalise ton bijou',
				desc: 'Choisis tes perles, assemble-les, et repars avec une pièce que personne d’autre n’a.',
				cta: 'Créer mon bijou →',
				target: { kind: 'atelier' }
			},
			{
				kicker: 'À la une',
				title: 'La collection Étoiles',
				desc: 'Six pièces autour d’un même motif : la petite étoile cousue ou enfilée à la main.',
				cta: 'Découvrir →',
				target: { kind: 'search', query: 'etoile' }
			},
			{
				kicker: 'Upcycling',
				title: 'Upcycling du moment',
				desc: 'Un sac né d’un jean chiné et de trois chutes de tissu. Un seul exemplaire.',
				cta: 'Découvrir la pièce →',
				target: { kind: 'category', slug: 'upcycling' }
			}
		]
	},
	thresholds: { lowStock: 3, preparationDays: 3 },
	loyalty: { stacksWithCode: false }
};

/** Une valeur illisible ou obsolete ne doit jamais casser la boutique. */
export function parseSetting<Key extends SettingKey>(key: Key, value: unknown): SiteSettings[Key] {
	const parsed = v.safeParse(settingsSchemas[key], value);

	return parsed.success ? (parsed.output as SiteSettings[Key]) : settingDefaults[key];
}
