import { error, invalid, redirect } from '@sveltejs/kit';
import { otpSchema, signInSchema } from '#lib/client/validation/auth';
import { getSessionUser } from '#lib/server/security/guard';
import {
	clearPendingEmail,
	readPendingEmail,
	sendOtpCode,
	verifyOtpCode
} from '#lib/server/security/otp';
import { endSession } from '#lib/server/security/session';
import { command, form, getRequestEvent } from '$app/server';

/**
 * La reponse est identique que le compte existe ou non : rien ne doit
 * permettre de deduire qu'une adresse est cliente de la boutique.
 */
export const requestOtp = form(signInSchema, async ({ email }, issue) => {
	const result = await sendOtpCode(getRequestEvent(), email);

	if (result.status === 'rate-limited') {
		invalid(
			issue.email(
				`Un code vient déjà de partir. Réessaie dans ${result.retryAfterSeconds} secondes.`
			)
		);
	}

	redirect(303, '/sign/otp');
});

export const verifyOtp = form(otpSchema, async ({ code }, issue) => {
	const event = getRequestEvent();
	const email = readPendingEmail(event.cookies);

	if (!email) {
		redirect(303, '/sign');
	}

	const result = await verifyOtpCode(event, email, code);

	switch (result.status) {
		case 'signed-in':
			redirect(303, '/profile');
			break;
		case 'expired':
			invalid(issue.code('Ce code a expiré. Demande-en un nouveau.'));
			break;
		case 'too-many-attempts':
			invalid(issue.code('Trop de tentatives. Demande un nouveau code.'));
			break;
		default:
			invalid(
				issue.code(
					`Ce code ne correspond pas. Il te reste ${result.attemptsLeft} tentative${
						result.attemptsLeft > 1 ? 's' : ''
					}.`
				)
			);
	}
});

export const resendOtp = command(async () => {
	const event = getRequestEvent();
	const email = readPendingEmail(event.cookies);

	if (!email) {
		error(400, 'Recommence en saisissant ton adresse e-mail.');
	}

	const result = await sendOtpCode(event, email);

	if (result.status === 'rate-limited') {
		return {
			sent: false,
			message: `Patiente encore ${result.retryAfterSeconds} secondes avant un nouvel envoi.`
		};
	}

	return { sent: true, message: 'Un nouveau code vient de partir.' };
});

export const cancelSignIn = command(async () => {
	clearPendingEmail(getRequestEvent().cookies);
	redirect(303, '/sign');
});

export const signOut = command(async () => {
	const event = getRequestEvent();

	if (getSessionUser()) {
		await endSession(event, 'USER_REQUEST');
	}

	redirect(303, '/');
});
