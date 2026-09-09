import { redirect } from '@sveltejs/kit';
import { OTP_TTL_MINUTES, readPendingEmail } from '#lib/server/security/otp';
import type { PageServerLoad } from './$types';

/** Sans code en attente, la page n'a rien a afficher : retour a l'etape 1. */
export const load: PageServerLoad = ({ cookies }) => {
	const email = readPendingEmail(cookies);

	if (!email) {
		redirect(303, '/sign');
	}

	return { email, ttlMinutes: OTP_TTL_MINUTES };
};
