import { MAX_BEADS, MIN_BEADS } from '#lib/client/validation/atelier';
import { generateSecretToken } from '../security/hash';
import { renderDesignPreview } from '../utils/design-preview';
import { prisma } from './client';

export function listComponents() {
	return prisma.component.findMany({
		where: { available: true },
		orderBy: [{ kind: 'asc' }, { position: 'asc' }],
		select: {
			key: true,
			label: true,
			kind: true,
			hexColor: true,
			sizeMm: true,
			priceCents: true,
			stock: true
		}
	});
}

export type DesignIssue = { message: string };

export type PricedDesign = {
	priceCents: number;
	lengthMm: number;
	previewSvg: string;
	issues: DesignIssue[];
	components: { key: string; label: string; hexColor: string; priceCents: number }[];
	clasp: { key: string; label: string; hexColor: string; priceCents: number } | null;
};

/**
 * Seule source de verite du prix d'une creation : le client n'envoie que des
 * cles de composants, tout le reste est relu en base. Le stock est verifie
 * pour chaque exemplaire utilise, une perle posee trois fois demandant trois
 * perles en reserve.
 */
export async function priceDesign(slots: string[], claspKey: string | null): Promise<PricedDesign> {
	const issues: DesignIssue[] = [];
	const keys = [...new Set([...slots, ...(claspKey ? [claspKey] : [])])];

	const catalogue = await prisma.component.findMany({
		where: { key: { in: keys }, available: true },
		select: {
			key: true,
			label: true,
			kind: true,
			hexColor: true,
			sizeMm: true,
			priceCents: true,
			stock: true
		}
	});

	const byKey = new Map(catalogue.map((component) => [component.key, component]));

	if (slots.length < MIN_BEADS) {
		issues.push({ message: `Il faut au moins ${MIN_BEADS} éléments sur le fil.` });
	}

	if (slots.length > MAX_BEADS) {
		issues.push({ message: `Pas plus de ${MAX_BEADS} éléments sur le fil.` });
	}

	/** Combien de fois chaque composant est utilise, pour verifier le stock. */
	const usage = new Map<string, number>();

	for (const key of slots) {
		usage.set(key, (usage.get(key) ?? 0) + 1);
	}

	if (claspKey) {
		usage.set(claspKey, (usage.get(claspKey) ?? 0) + 1);
	}

	for (const [key, count] of usage) {
		const component = byKey.get(key);

		if (!component) {
			issues.push({ message: 'Un des éléments choisis n’est plus disponible.' });
			continue;
		}

		if (component.stock < count) {
			issues.push({
				message:
					component.stock === 0
						? `« ${component.label} » est épuisé.`
						: `Il ne reste que ${component.stock} « ${component.label} ».`
			});
		}
	}

	const chosen = slots
		.map((key) => byKey.get(key))
		.filter((component): component is NonNullable<typeof component> => Boolean(component));
	const clasp = claspKey ? (byKey.get(claspKey) ?? null) : null;

	const priceCents =
		chosen.reduce((total, component) => total + component.priceCents, 0) + (clasp?.priceCents ?? 0);
	const lengthMm = chosen.reduce((total, component) => total + component.sizeMm, 0);

	return {
		priceCents,
		lengthMm,
		previewSvg: renderDesignPreview(
			chosen.map((component) => ({ hexColor: component.hexColor, sizeMm: component.sizeMm })),
			clasp?.hexColor ?? null
		),
		issues,
		components: chosen.map((component) => ({
			key: component.key,
			label: component.label,
			hexColor: component.hexColor,
			priceCents: component.priceCents
		})),
		clasp: clasp
			? {
					key: clasp.key,
					label: clasp.label,
					hexColor: clasp.hexColor,
					priceCents: clasp.priceCents
				}
			: null
	};
}

export async function saveDesign(input: {
	userId: string | null;
	slots: string[];
	claspKey: string | null;
	priced: PricedDesign;
}) {
	return prisma.customDesign.create({
		data: {
			userId: input.userId,
			shareToken: generateSecretToken(9).slice(0, 12),
			slots: { beads: input.slots, clasp: input.claspKey },
			previewSvg: input.priced.previewSvg,
			priceCents: input.priced.priceCents,
			lengthMm: input.priced.lengthMm
		},
		select: { id: true, shareToken: true, priceCents: true, previewSvg: true, lengthMm: true }
	});
}

export function findDesignByToken(shareToken: string) {
	return prisma.customDesign.findUnique({
		where: { shareToken },
		select: {
			id: true,
			shareToken: true,
			slots: true,
			previewSvg: true,
			priceCents: true,
			lengthMm: true,
			createdAt: true
		}
	});
}

export function findDesignById(id: string) {
	return prisma.customDesign.findUnique({
		where: { id },
		select: { id: true, shareToken: true, previewSvg: true, priceCents: true, lengthMm: true }
	});
}

/** Etat minimal d'une creation pour la rechiffrer au panier. */
export function findDesignForCart(id: string) {
	return prisma.customDesign.findUnique({ where: { id }, select: { id: true, slots: true } });
}
