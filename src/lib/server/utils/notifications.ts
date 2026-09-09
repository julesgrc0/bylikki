import { listPendingAlerts, markAlertsNotified } from '../database/restock';
import RestockAlertEmail from '../emails/RestockAlert.svelte';
import { renderEmail, sendMailQuietly } from './mailer';

/**
 * Previens les personnes en attente d'un reassort. Appelee apres l'ecriture de
 * la variante, jamais dedans : un envoi lent ne doit pas retenir la
 * transaction, et un echec SMTP ne doit pas annuler la mise a jour du stock.
 */
export async function notifyRestock(variantId: string, origin: string) {
	const alerts = await listPendingAlerts(variantId);

	if (alerts.length === 0) {
		return 0;
	}

	/** Marque avant d'envoyer : mieux vaut une alerte perdue qu'une alerte repetee. */
	await markAlertsNotified(alerts.map((alert) => alert.id));

	for (const alert of alerts) {
		await sendMailQuietly({
			to: alert.user.email,
			subject: `${alert.variant.product.name} est de retour — Bylikki`,
			...renderEmail(RestockAlertEmail, {
				productName: alert.variant.product.name,
				variantLabel: alert.variant.label,
				slug: alert.variant.product.slug,
				origin
			})
		});
	}

	return alerts.length;
}
