import { countRecentOtps, findLastOtpSentAt } from '../database/auth';

export const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_PER_EMAIL_PER_HOUR = 5;
const OTP_MAX_PER_IP_PER_HOUR = 20;
const ONE_HOUR_MS = 60 * 60 * 1000;

export type RateLimitVerdict = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * Limitation de debit adossee a la table EmailOTP : pas de dependance
 * supplementaire, et la contrainte survit au redemarrage du serveur.
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
