import * as v from 'valibot';

/** Delai annonce dans les CGV : 14 jours apres reception. */
export const RETURN_WINDOW_DAYS = 14;

export const returnReasons = ['CHANGE_OF_MIND', 'DEFECT', 'WRONG_ITEM', 'SIZE'] as const;

export type ReturnReason = (typeof returnReasons)[number];

export const returnReasonLabels: Record<ReturnReason, string> = {
	CHANGE_OF_MIND: 'Je change d’avis',
	DEFECT: 'La pièce a un défaut',
	WRONG_ITEM: 'Ce n’est pas ce que j’avais commandé',
	SIZE: 'La taille ne convient pas'
};

export const returnStatusLabels: Record<string, string> = {
	REQUESTED: 'Demande envoyée',
	ACCEPTED: 'Retour accepté',
	REFUSED: 'Retour refusé',
	RECEIVED: 'Colis reçu',
	REFUNDED: 'Remboursé'
};

export const returnRequestSchema = v.object({
	reference: v.pipe(v.string(), v.trim(), v.maxLength(20)),
	reason: v.picklist(returnReasons),
	comment: v.optional(
		v.pipe(v.string(), v.trim(), v.maxLength(600, 'Ce message est trop long.')),
		''
	),
	orderItemIds: v.pipe(
		v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(80))),
		v.minLength(1, 'Choisis au moins une pièce à retourner.'),
		v.maxLength(40)
	)
});

export const returnDecisionSchema = v.object({
	returnId: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
	status: v.picklist(['ACCEPTED', 'REFUSED', 'RECEIVED', 'REFUNDED']),
	decisionNote: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(600)), '')
});
