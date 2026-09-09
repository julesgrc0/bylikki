import type { CartLineInput } from '#lib/client/validation/cart';
import { findDesignForCart, priceDesign } from './design';
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
/** Une ligne d'atelier porte l'identifiant de la creation, pas d'une variante. */
export const DESIGN_PREFIX = 'design:';

export function isDesignLine(variantId: string) {
	return variantId.startsWith(DESIGN_PREFIX);
}

export function designIdOf(variantId: string) {
	return variantId.slice(DESIGN_PREFIX.length);
}

export async function priceCartLines(lines: CartLineInput[]): Promise<PricedCart> {
	const issues: CartIssue[] = [];

	if (lines.length === 0) {
		return { lines: [], issues, subtotalCents: 0, currency: 'EUR' };
	}

	const designLines = lines.filter((line) => isDesignLine(line.variantId));
	const variantLines = lines.filter((line) => !isDesignLine(line.variantId));

	/**
	 * Les creations de l'atelier sont rechiffrees depuis leurs composants :
	 * le prix enregistre ne fait pas foi si un composant a change entre-temps.
	 */
	const pricedDesigns: (PricedLine & { available: number })[] = [];

	for (const line of designLines) {
		const design = await findDesignForCart(designIdOf(line.variantId));

		if (!design) {
			issues.push({
				variantId: line.variantId,
				message: "Cette création n'existe plus."
			});
			continue;
		}

		const slots = design.slots as { beads?: string[]; clasp?: string | null };
		const priced = await priceDesign(slots.beads ?? [], slots.clasp ?? null);

		if (priced.issues.length > 0) {
			issues.push({ variantId: line.variantId, message: priced.issues[0].message });
			continue;
		}

		pricedDesigns.push({
			variantId: line.variantId,
			productId: '',
			productSlug: 'atelier',
			productName: 'Création de l’atelier',
			variantLabel: `${(slots.beads ?? []).length} éléments · ${Math.round(priced.lengthMm / 10)} cm`,
			unitPriceCents: priced.priceCents,
			quantity: line.quantity,
			customization: [],
			available: line.quantity
		});
	}

	if (variantLines.length === 0) {
		const subtotalCents = pricedDesigns.reduce(
			(total, line) => total + line.unitPriceCents * line.quantity,
			0
		);

		return { lines: pricedDesigns, issues, subtotalCents, currency: 'EUR' };
	}

	const variants = await findVariantsForCheckout(variantLines.map((line) => line.variantId));
	const variantById = new Map(variants.map((variant) => [variant.id, variant]));
	const options = await findCustomizationOptions([
		...new Set(variants.map((variant) => variant.productId))
	]);

	const priced: (PricedLine & { available: number })[] = [];

	for (const line of variantLines) {
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

	const allLines = [...priced, ...pricedDesigns];

	return {
		lines: allLines,
		issues,
		subtotalCents: allLines.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0),
		currency: variants[0]?.product.currency ?? 'EUR'
	};
}
