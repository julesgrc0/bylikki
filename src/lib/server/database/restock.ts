import { prisma } from './client';

/**
 * Alertes de retour en stock. Une seule ligne par personne et par variante, et
 * `notifiedAt` garantit qu'un reassort ne declenche qu'un envoi.
 */
export async function requestRestockAlert(userId: string, variantId: string) {
	await prisma.restockAlert.upsert({
		where: { userId_variantId: { userId, variantId } },
		create: { userId, variantId },
		update: { notifiedAt: null }
	});
}

export function cancelRestockAlert(userId: string, variantId: string) {
	return prisma.restockAlert.deleteMany({ where: { userId, variantId } });
}

export function listAlertedVariantIds(userId: string) {
	return prisma.restockAlert.findMany({
		where: { userId, notifiedAt: null },
		select: { variantId: true }
	});
}

/**
 * Destinataires en attente pour une variante redevenue disponible. Le
 * consentement est verifie ici : sans lui, aucune alerte ne part, meme si la
 * demande avait ete enregistree avant son retrait.
 */
export function listPendingAlerts(variantId: string) {
	return prisma.restockAlert.findMany({
		where: {
			variantId,
			notifiedAt: null,
			user: { consents: { some: { type: 'RESTOCK_ALERT', granted: true } } }
		},
		select: {
			id: true,
			user: { select: { email: true } },
			variant: {
				select: { label: true, product: { select: { name: true, slug: true } } }
			}
		}
	});
}

export function markAlertsNotified(ids: string[]) {
	return prisma.restockAlert.updateMany({
		where: { id: { in: ids } },
		data: { notifiedAt: new Date() }
	});
}
