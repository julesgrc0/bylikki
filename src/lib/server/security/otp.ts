import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
	consumeOtp,
	createEmailOtp,
	findPendingOtp,
	incrementOtpAttempts,
	invalidatePendingOtps
} from '../database/auth';
import { createVerifiedUser, findUserByEmail, markUserSignedIn } from '../database/user';
import { buildOtpMail, sendMail } from '../utils/mailer';
import { generateNumericCode, hashIpAddress, hashOtpCode, safeEqual, sha256Hex } from './hash';
import { checkOtpRateLimit } from './rate-limit';
import { startSession } from './session';

export const OTP_CODE_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const PENDING_EMAIL_COOKIE = 'bylikki_otp_email';
const PENDING_EMAIL_TTL_SECONDS = OTP_TTL_MINUTES * 60;

function signPendingEmail(email: string) {
	return sha256Hex(`pending-email:${email}`).slice(0, 32);
}

/**
 * L'e-mail en attente transite par un cookie signe plutot que par l'URL :
 * il n'apparait ni dans l'historique, ni dans les journaux, ni dans le referer.
 */
export function setPendingEmail(cookies: Cookies, email: string) {
	cookies.set(PENDING_EMAIL_COOKIE, `${email}.${signPendingEmail(email)}`, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: PENDING_EMAIL_TTL_SECONDS
	});
}

export function readPendingEmail(cookies: Cookies) {
	const raw = cookies.get(PENDING_EMAIL_COOKIE);

	if (!raw) {
		return null;
	}

	const separator = raw.lastIndexOf('.');

	if (separator <= 0) {
		return null;
	}

	const email = raw.slice(0, separator);
	const signature = raw.slice(separator + 1);

	return safeEqual(signature, signPendingEmail(email)) ? email : null;
}

export function clearPendingEmail(cookies: Cookies) {
	cookies.delete(PENDING_EMAIL_COOKIE, { path: '/' });
}

export type OtpRequestResult =
	{ status: 'sent' } | { status: 'rate-limited'; retryAfterSeconds: number };

export async function sendOtpCode(event: RequestEvent, email: string): Promise<OtpRequestResult> {
	const ipHash = hashIpAddress(event.request.headers.get('x-forwarded-for'));
	const verdict = await checkOtpRateLimit(email, ipHash);

	if (!verdict.allowed) {
		return { status: 'rate-limited', retryAfterSeconds: verdict.retryAfterSeconds };
	}

	const code = generateNumericCode(OTP_CODE_LENGTH);

	await invalidatePendingOtps(email);
	await createEmailOtp({
		email,
		codeHash: hashOtpCode(email, code),
		expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
		ipHash
	});

	await sendMail({ to: email, ...buildOtpMail(code, OTP_TTL_MINUTES) });
	setPendingEmail(event.cookies, email);

	return { status: 'sent' };
}

export type OtpVerificationResult =
	| { status: 'signed-in'; isNewAccount: boolean }
	| { status: 'expired' }
	| { status: 'invalid'; attemptsLeft: number }
	| { status: 'too-many-attempts' };

export async function verifyOtpCode(
	event: RequestEvent,
	email: string,
	code: string
): Promise<OtpVerificationResult> {
	const pending = await findPendingOtp(email);

	if (!pending) {
		return { status: 'expired' };
	}

	if (pending.attempts >= OTP_MAX_ATTEMPTS) {
		await consumeOtp(pending.id);
		return { status: 'too-many-attempts' };
	}

	if (!safeEqual(pending.codeHash, hashOtpCode(email, code))) {
		const { attempts } = await incrementOtpAttempts(pending.id);

		if (attempts >= OTP_MAX_ATTEMPTS) {
			await consumeOtp(pending.id);
			return { status: 'too-many-attempts' };
		}

		return { status: 'invalid', attemptsLeft: OTP_MAX_ATTEMPTS - attempts };
	}

	const consumed = await consumeOtp(pending.id);

	if (consumed.count === 0) {
		return { status: 'expired' };
	}

	const existing = await findUserByEmail(email);
	const user = existing ?? (await createVerifiedUser(email));

	if (existing) {
		await markUserSignedIn(user.id);
	}

	await startSession(event, user.id);
	clearPendingEmail(event.cookies);

	return { status: 'signed-in', isNewAccount: existing === null };
}
