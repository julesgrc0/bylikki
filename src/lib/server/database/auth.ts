import type { SessionRevokedReason } from '$prisma/enums';
import { prisma } from './client';

export type SessionRecord = {
	id: string;
	userId: string;
	expiresAt: Date;
	createdAt: Date;
	lastSeenAt: Date;
	userAgentLabel: string | null;
	user: {
		id: string;
		email: string;
		role: 'USER' | 'ADMIN';
		displayName: string | null;
		emailVerifiedAt: Date | null;
		deletionRequestedAt: Date | null;
	};
};

const sessionWithUser = {
	id: true,
	userId: true,
	expiresAt: true,
	createdAt: true,
	lastSeenAt: true,
	userAgentLabel: true,
	user: {
		select: {
			id: true,
			email: true,
			role: true,
			displayName: true,
			emailVerifiedAt: true,
			deletionRequestedAt: true
		}
	}
} as const;

export function createSession(data: {
	userId: string;
	secretHash: string;
	expiresAt: Date;
	ipHash: string | null;
	userAgentLabel: string | null;
}) {
	return prisma.session.create({ data, select: { id: true } });
}

export function findActiveSession(secretHash: string): Promise<SessionRecord | null> {
	return prisma.session.findFirst({
		where: { secretHash, active: true, expiresAt: { gt: new Date() } },
		select: sessionWithUser
	});
}

export function touchSession(sessionId: string, expiresAt: Date) {
	return prisma.session.update({
		where: { id: sessionId },
		data: { expiresAt, lastSeenAt: new Date() },
		select: { id: true }
	});
}

export function revokeSession(sessionId: string, reason: SessionRevokedReason) {
	return prisma.session.updateMany({
		where: { id: sessionId, active: true },
		data: { active: false, revokedAt: new Date(), revokedReason: reason }
	});
}

export function revokeSessionForUser(
	sessionId: string,
	userId: string,
	reason: SessionRevokedReason
) {
	return prisma.session.updateMany({
		where: { id: sessionId, userId, active: true },
		data: { active: false, revokedAt: new Date(), revokedReason: reason }
	});
}

export function revokeAllSessions(userId: string, reason: SessionRevokedReason) {
	return prisma.session.updateMany({
		where: { userId, active: true },
		data: { active: false, revokedAt: new Date(), revokedReason: reason }
	});
}

export function listActiveSessions(userId: string) {
	return prisma.session.findMany({
		where: { userId, active: true, expiresAt: { gt: new Date() } },
		orderBy: { lastSeenAt: 'desc' },
		select: {
			id: true,
			createdAt: true,
			lastSeenAt: true,
			expiresAt: true,
			userAgentLabel: true
		}
	});
}

export function createEmailOtp(data: {
	email: string;
	codeHash: string;
	expiresAt: Date;
	ipHash: string | null;
}) {
	return prisma.emailOTP.create({ data, select: { id: true } });
}

export function findPendingOtp(email: string) {
	return prisma.emailOTP.findFirst({
		where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
		orderBy: { createdAt: 'desc' },
		select: { id: true, codeHash: true, attempts: true, createdAt: true }
	});
}

export function findLastOtpSentAt(email: string) {
	return prisma.emailOTP.findFirst({
		where: { email },
		orderBy: { createdAt: 'desc' },
		select: { createdAt: true }
	});
}

export function countRecentOtps(where: { email?: string; ipHash?: string }, since: Date) {
	return prisma.emailOTP.count({ where: { ...where, createdAt: { gte: since } } });
}

export function incrementOtpAttempts(otpId: string) {
	return prisma.emailOTP.update({
		where: { id: otpId },
		data: { attempts: { increment: 1 } },
		select: { attempts: true }
	});
}

export function consumeOtp(otpId: string) {
	return prisma.emailOTP.updateMany({
		where: { id: otpId, consumedAt: null },
		data: { consumedAt: new Date() }
	});
}

/** Un nouvel envoi rend caducs les codes precedents. */
export function invalidatePendingOtps(email: string) {
	return prisma.emailOTP.updateMany({
		where: { email, consumedAt: null },
		data: { consumedAt: new Date() }
	});
}

/** Purge de conservation : codes expires et sessions eteintes. */
export function purgeExpiredCredentials(now = new Date()) {
	return prisma.$transaction([
		prisma.emailOTP.deleteMany({ where: { expiresAt: { lt: now } } }),
		prisma.session.deleteMany({ where: { expiresAt: { lt: now } } })
	]);
}
