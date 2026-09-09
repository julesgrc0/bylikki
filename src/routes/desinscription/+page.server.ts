import { revokeNewsletterConsent } from '#lib/server/database/newsletter';
import { verifyUnsubscribe } from '#lib/server/security/hash';
import type { PageServerLoad } from './$types';

/**
 * Desinscription en un clic, sans connexion : la loi l'exige et l'attente des
 * lectrices aussi. La signature authentifie l'identifiant, personne ne peut
 * donc desabonner quelqu'un d'autre en devinant une URL.
 */
export const load: PageServerLoad = async ({ url }) => {
	const userId = url.searchParams.get('u') ?? '';
	const signature = url.searchParams.get('s') ?? '';

	if (!userId || !signature || !verifyUnsubscribe(userId, signature)) {
		return { status: 'invalid' as const };
	}

	await revokeNewsletterConsent(userId);

	return { status: 'done' as const };
};
