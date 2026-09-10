import { normalizeEmail } from '../utils/email';
import { prisma } from './client';

/**
 * Suivi public d'une commande. Deux secrets sont demandes ensemble — la
 * reference et l'adresse e-mail — et seul le strict necessaire au suivi est
 * renvoye : ni adresse de livraison, ni identifiant de paiement, ni facture.
 * Une reference seule ne suffit donc jamais a lire quoi que ce soit.
 */
export async function findPublicOrder(reference: string, rawEmail: string) {
	const order = await prisma.order.findUnique({
		where: { reference },
		select: {
			reference: true,
			contactEmail: true,
			status: true,
			paymentStatus: true,
			trackingNumber: true,
			createdAt: true,
			paidAt: true,
			shippedAt: true,
			deliveredAt: true,
			cancelledAt: true,
			shippingCity: true,
			items: {
				select: {
					id: true,
					productName: true,
					variantLabel: true,
					quantity: true
				}
			}
		}
	});

	if (!order || normalizeEmail(order.contactEmail) !== normalizeEmail(rawEmail)) {
		return null;
	}

	const { contactEmail, ...visible } = order;

	return visible;
}
