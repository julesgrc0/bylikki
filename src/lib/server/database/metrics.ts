import { prisma } from './client';

/**
 * Mesure d'audience agregee : on compte des evenements, jamais des personnes.
 * Pas d'identifiant, pas de cookie, pas d'adresse IP — donc pas de bandeau de
 * consentement, et rien a exporter ni a effacer au titre du RGPD.
 */
export const METRIC_KEYS = [
	'product_view',
	'cart_add',
	'checkout_start',
	'order_paid',
	'search'
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

function startOfDay(date: Date) {
	const day = new Date(date);
	day.setUTCHours(0, 0, 0, 0);

	return day;
}

/**
 * Incrementation au fil de l'eau. Les erreurs sont avalees : une mesure n'a
 * jamais le droit de casser une page ou un paiement.
 */
export async function countEvent(key: MetricKey, amount = 1, now = new Date()) {
	try {
		const date = startOfDay(now);

		await prisma.dailyMetric.upsert({
			where: { date_key: { date, key } },
			create: { date, key, value: amount },
			update: { value: { increment: amount } }
		});
	} catch (cause) {
		console.error(`[mesure] increment impossible pour ${key}`, cause);
	}
}

/** Recherche sans resultat : le terme est conserve, jamais son auteur. */
export async function recordSearchMiss(rawTerm: string) {
	const term = rawTerm.trim().toLowerCase().slice(0, 120);

	if (term.length < 2) {
		return;
	}

	try {
		await prisma.searchMiss.upsert({
			where: { term },
			create: { term },
			update: { count: { increment: 1 } }
		});
	} catch (cause) {
		console.error('[mesure] recherche sans resultat non enregistree', cause);
	}
}

export type FunnelWindow = { days: number };

/**
 * Entonnoir : vue de fiche → ajout au panier → checkout lance → commande
 * payee, avec les taux de passage. C'est la lecture qui dit ou l'on perd les
 * clientes, sans avoir eu besoin de les suivre individuellement.
 */
export async function getFunnel(days = 30, now = new Date()) {
	const since = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

	const rows = await prisma.dailyMetric.groupBy({
		by: ['key'],
		where: { date: { gte: since } },
		_sum: { value: true }
	});

	const totals = new Map(rows.map((row) => [row.key, row._sum.value ?? 0]));
	const view = totals.get('product_view') ?? 0;
	const add = totals.get('cart_add') ?? 0;
	const checkout = totals.get('checkout_start') ?? 0;
	const paid = totals.get('order_paid') ?? 0;

	const share = (part: number, whole: number) =>
		whole === 0 ? null : Math.round((part / whole) * 1000) / 10;

	return {
		days,
		steps: [
			{ key: 'product_view', label: 'Fiches vues', value: view, rate: null },
			{ key: 'cart_add', label: 'Ajouts au panier', value: add, rate: share(add, view) },
			{
				key: 'checkout_start',
				label: 'Paiements lancés',
				value: checkout,
				rate: share(checkout, add)
			},
			{ key: 'order_paid', label: 'Commandes payées', value: paid, rate: share(paid, checkout) }
		],
		conversion: share(paid, view),
		searches: totals.get('search') ?? 0
	};
}

export function listSearchMisses(limit = 12) {
	return prisma.searchMiss.findMany({
		orderBy: [{ count: 'desc' }, { lastSeenAt: 'desc' }],
		take: limit,
		select: { term: true, count: true, lastSeenAt: true }
	});
}

/** Series journalieres, pour tracer l'entonnoir dans le temps. */
export async function getDailySeries(key: MetricKey, days = 30, now = new Date()) {
	const since = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
	const rows = await prisma.dailyMetric.findMany({
		where: { key, date: { gte: since } },
		orderBy: { date: 'asc' },
		select: { date: true, value: true }
	});

	const byDate = new Map(rows.map((row) => [row.date.toISOString().slice(0, 10), row.value]));

	/** Une entree par jour, y compris les jours sans evenement. */
	return Array.from({ length: days }, (_, offset) => {
		const day = new Date(since);
		day.setUTCDate(day.getUTCDate() + offset);
		const iso = day.toISOString().slice(0, 10);

		return { date: iso, value: byDate.get(iso) ?? 0 };
	});
}
