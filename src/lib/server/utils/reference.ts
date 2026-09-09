import { createId } from '@paralleldrive/cuid2';

/**
 * Reference lisible affichee sur les commandes et les factures.
 * Le suffixe aleatoire evite de reveler le volume de commandes de la boutique.
 */
export function generateOrderReference(now = new Date()) {
	const year = now.getFullYear().toString().slice(-2);
	const suffix = createId().slice(0, 6).toUpperCase();

	return `BY-${year}${suffix}`;
}
