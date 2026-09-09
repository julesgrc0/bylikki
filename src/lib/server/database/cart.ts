import type { CartLineInput } from '#lib/client/validation/cart';
import type { PricedLine } from './order';
import { findCustomizationOptions, findVariantsForCheckout } from './product';

export type CartIssue = { variantId: string; message: string };

export type PricedCart = {
	lines: (PricedLine & { available: number })[];
	issues: CartIssue[];
	subtotalCents: number;
	currency: string;
};

/**
 * Seule source de verite des prix : ceux envoyes par le client sont ignores.
 * La disponibilite et les options de personnalisation sont revalidees ici.
 */
export async function priceCartLines(lines: CartLineInput[]): Promise<PricedCart> {
	const issues: CartIssue[] = [];

	if (lines.length === 0) {
		return { lines: [], issues, subtotalCents: 0, currency: 'EUR' };
	}

	const variants = await findVariantsForCheckout(lines.map((line) => line.variantId));
	const variantById = new Map(variants.map((variant) => [variant.id, variant]));
	const options = await findCustomizationOptions([
		...new Set(variants.map((variant) => variant.productId))
	]);

	const priced: (PricedLine & { available: number })[] = [];

	for (const line of lines) {
		const variant = variantById.get(line.variantId);

		if (!variant) {
			issues.push({
				variantId: line.variantId,
				message: "Cette pièce n'est plus disponible à la vente."
			});
			continue;
		}

		if (variant.stock < line.quantity) {
			issues.push({
				variantId: line.variantId,
				message:
					variant.stock === 0
						? `« ${variant.product.name} » est épuisé.`
						: `Il ne reste que ${variant.stock} exemplaire(s) de « ${variant.product.name} ».`
			});
			continue;
		}

		const productOptions = options.filter((option) => option.productId === variant.productId);
		const chosen = new Map(line.customization.map((entry) => [entry.key, entry.value]));
		let customizationDeltaCents = 0;
		const customization: PricedLine['customization'] = [];

		for (const option of productOptions) {
			const value = chosen.get(option.key)?.trim() ?? '';

			if (value === '') {
				if (option.required) {
					issues.push({
						variantId: line.variantId,
						message: `« ${option.label} » est obligatoire pour cette pièce.`
					});
				}
				continue;
			}

			if (option.kind === 'TEXT') {
				if (option.maxLength !== null && value.length > option.maxLength) {
					issues.push({
						variantId: line.variantId,
						message: `« ${option.label} » est limité à ${option.maxLength} caractères.`
					});
					continue;
				}

				customizationDeltaCents += option.priceDeltaCents;
				customization.push({
					key: option.key,
					label: option.label,
					value,
					priceDeltaCents: option.priceDeltaCents
				});
				continue;
			}

			const choice = option.choices.find((candidate) => candidate.value === value);

			if (!choice) {
				issues.push({
					variantId: line.variantId,
					message: `Ce choix de « ${option.label} » n'existe pas.`
				});
				continue;
			}

			const delta = option.priceDeltaCents + choice.priceDeltaCents;
			customizationDeltaCents += delta;
			customization.push({
				key: option.key,
				label: option.label,
				value: choice.label,
				priceDeltaCents: delta
			});
		}

		priced.push({
			variantId: variant.id,
			productId: variant.product.id,
			productSlug: variant.product.slug,
			productName: variant.product.name,
			variantLabel: variant.label,
			unitPriceCents: variant.priceCents + customizationDeltaCents,
			quantity: line.quantity,
			customization,
			available: variant.stock
		});
	}

	return {
		lines: priced,
		issues,
		subtotalCents: priced.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0),
		currency: variants[0]?.product.currency ?? 'EUR'
	};
}
