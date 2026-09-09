import { prisma } from './client';

export function listIssues() {
	return prisma.newsletterIssue.findMany({
		orderBy: { createdAt: 'desc' },
		take: 30,
		select: {
			id: true,
			subject: true,
			body: true,
			sentAt: true,
			recipientCount: true,
			createdAt: true
		}
	});
}

export function createIssue(input: { subject: string; body: string }) {
	return prisma.newsletterIssue.create({ data: input, select: { id: true } });
}

export function deleteIssue(id: string) {
	return prisma.newsletterIssue.deleteMany({ where: { id, sentAt: null } });
}

/** Destinataires : uniquement les comptes ayant accorde le consentement. */
export function listSubscribers() {
	return prisma.user.findMany({
		where: {
			deletionRequestedAt: null,
			consents: { some: { type: 'NEWSLETTER', granted: true } }
		},
		select: { id: true, email: true }
	});
}

export function findSendableIssue(id: string) {
	return prisma.newsletterIssue.findFirst({
		where: { id, sentAt: null },
		select: { id: true, subject: true, body: true }
	});
}

export function markIssueSent(id: string, recipientCount: number) {
	return prisma.newsletterIssue.update({
		where: { id },
		data: { sentAt: new Date(), recipientCount },
		select: { id: true }
	});
}

export function revokeNewsletterConsent(userId: string) {
	return prisma.userConsent.upsert({
		where: { userId_type: { userId, type: 'NEWSLETTER' } },
		create: { userId, type: 'NEWSLETTER', granted: false },
		update: { granted: false },
		select: { id: true }
	});
}
