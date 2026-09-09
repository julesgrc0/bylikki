const formatter = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	minimumFractionDigits: 2
});

/** Les montants circulent en centimes entiers : aucune erreur d'arrondi possible. */
export function formatPrice(cents: number) {
	return formatter.format(cents / 100);
}

export function formatPriceRange(minCents: number, maxCents: number) {
	return minCents === maxCents ? formatPrice(minCents) : `dès ${formatPrice(minCents)}`;
}
