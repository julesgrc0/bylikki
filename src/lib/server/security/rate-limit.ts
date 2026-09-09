import { countRecentOtps, findLastOtpSentAt } from '../database/auth';
import { prisma } from '../database/client';

export const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_PER_EMAIL_PER_HOUR = 5;
const OTP_MAX_PER_IP_PER_HOUR = 20;
const ONE_HOUR_MS = 60 * 60 * 1000;

export type RateLimitVerdict = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * Limitation de debit adossee a la base : pas de dependance supplementaire, et
 * la contrainte survit au redemarrage comme au passage d'une instance a l'autre,
 * ce qu'un compteur en memoire ne ferait pas en execution serverless.
 */
export async function consumeRateLimit(options: {
	bucket: string;
	subject: string | null;
	limit: number;
	windowMs?: number;
}): Promise<RateLimitVerdict> {
	const { bucket, subject, limit, windowMs = ONE_HOUR_MS } = options;

	/** Sans sujet identifiable, on n'invente pas de limite. */
	if (!subject) {
		return { allowed: true };
	}

	const now = Date.now();
	const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

	const entry = await prisma.rateLimit.upsert({
		where: { bucket_subject_windowStart: { bucket, subject, windowStart } },
		create: { bucket, subject, windowStart, count: 1 },
		update: { count: { increment: 1 } },
		select: { count: true }
	});

	if (entry.count > limit) {
		const retryAfterSeconds = Math.ceil((windowStart.getTime() + windowMs - now) / 1000);

		return { allowed: false, retryAfterSeconds };
	}

	return { allowed: true };
}

/** Purge des fenetres passees, appelee avec le reste de la politique de conservation. */
export function purgeExpiredRateLimits(now = new Date()) {
	return prisma.rateLimit.deleteMany({
		where: { windowStart: { lt: new Date(now.getTime() - 24 * ONE_HOUR_MS) } }
	});
}

/**
 * L'envoi d'un code garde sa limitation propre, adossee a la table EmailOTP :
 * elle porte a la fois le delai entre deux envois et le quota horaire.
 */
export async function checkOtpRateLimit(email: string, ipHash: string | null) {
	const now = Date.now();
	const lastOtp = await findLastOtpSentAt(email);

	if (lastOtp) {
		const elapsed = now - lastOtp.createdAt.getTime();

		if (elapsed < OTP_COOLDOWN_MS) {
			return {
				allowed: false,
				retryAfterSeconds: Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000)
			} satisfies RateLimitVerdict;
		}
	}

	const since = new Date(now - ONE_HOUR_MS);
	const sentForEmail = await countRecentOtps({ email }, since);

	if (sentForEmail >= OTP_MAX_PER_EMAIL_PER_HOUR) {
		return { allowed: false, retryAfterSeconds: 3600 } satisfies RateLimitVerdict;
	}

	if (ipHash) {
		const sentForIp = await countRecentOtps({ ipHash }, since);

		if (sentForIp >= OTP_MAX_PER_IP_PER_HOUR) {
			return { allowed: false, retryAfterSeconds: 3600 } satisfies RateLimitVerdict;
		}
	}

	return { allowed: true } satisfies RateLimitVerdict;
}
