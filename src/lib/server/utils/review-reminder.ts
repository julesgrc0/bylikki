import { prisma } from '../database/client';
import ReviewReminderEmail from '../emails/ReviewReminder.svelte';
import { renderEmail, sendMailQuietly } from './mailer';

/** Delai laisse a la cliente pour porter la piece avant qu'on lui demande son avis. */
export const REVIEW_REMINDER_DAYS = 10;

/**
 * Un seul rappel par commande, aux personnes qui l'ont accepte, et seulement
 * pour les pieces dont elles n'ont pas deja laisse d'avis.
 */
export async function sendReviewReminders(origin: string, now = new Date()) {
	const deadline = new Date(now.getTime() - REVIEW_REMINDER_DAYS * 24 * 60 * 60 * 1000);

	const orders = await prisma.order.findMany({
		where: {
			status: 'DELIVERED',
			deliveredAt: { lte: deadline },
			reviewReminderSentAt: null,
			user: { consents: { some: { type: 'REVIEW_REMINDER', granted: true } } }
		},
		take: 100,
		select: {
			id: true,
			contactEmail: true,
			userId: true,
			items: { select: { productId: true, productName: true, productSlug: true } }
		}
	});

	let sent = 0;

	for (const order of orders) {
		await prisma.order.update({
			where: { id: order.id },
			data: { reviewReminderSentAt: now },
			select: { id: true }
		});

		const item = order.items[0];

		if (!item || !order.userId || !item.productId) {
			continue;
		}

		const alreadyReviewed = await prisma.review.count({
			where: { productId: item.productId, userId: order.userId }
		});

		if (alreadyReviewed > 0) {
			continue;
		}

		await sendMailQuietly({
			to: order.contactEmail,
			subject: `Ton avis sur ${item.productName} — Bylikki`,
			...renderEmail(ReviewReminderEmail, {
				productName: item.productName,
				slug: item.productSlug,
				origin
			})
		});

		sent += 1;
	}

	return sent;
}
