import * as v from 'valibot';

export const MIN_BEADS = 4;
export const MAX_BEADS = 24;

export const componentKinds = ['BEAD', 'CLASP', 'CHARM', 'CORD'] as const;

export type ComponentKind = (typeof componentKinds)[number];

export const componentKindLabels: Record<ComponentKind, string> = {
	BEAD: 'Perles',
	CLASP: 'Fermoirs',
	CHARM: 'Breloques',
	CORD: 'Cordons'
};

const componentKey = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(60));

/**
 * Une creation est une suite ordonnee de cles de composants. Le client
 * n'envoie que des cles : ni prix, ni libelle, ni couleur — tout est relu en
 * base au moment du chiffrage.
 */
export const designSchema = v.object({
	slots: v.pipe(
		v.array(componentKey),
		v.minLength(MIN_BEADS, `Il faut au moins ${MIN_BEADS} éléments.`),
		v.maxLength(MAX_BEADS, `Pas plus de ${MAX_BEADS} éléments.`)
	),
	claspKey: v.optional(v.nullable(componentKey), null)
});

export type DesignInput = v.InferOutput<typeof designSchema>;

export const shareTokenSchema = v.pipe(v.string(), v.trim(), v.length(12));
