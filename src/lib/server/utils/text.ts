/** Minuscules, sans accents ni ponctuation : base commune de la recherche. */
export function normalizeText(input: string) {
	return input
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

export function slugify(input: string) {
	return normalizeText(input).replace(/\s+/g, '-');
}

/**
 * Champ de recherche denormalise : concatene les elements textuels d'un produit
 * pour qu'un simple `contains` couvre nom, description et caracteristiques.
 */
export function buildSearchText(parts: (string | null | undefined)[]) {
	return normalizeText(parts.filter(Boolean).join(' '));
}
