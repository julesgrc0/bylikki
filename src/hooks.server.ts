import type { Handle } from '@sveltejs/kit';
import { resolveSession } from '#lib/server/security/session';
import { dev } from '$app/environment';

/**
 * Resout la session a chaque requete et pose les en-tetes de securite communs.
 * `event.locals` est la seule source d'identite pour les remote functions.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const session = await resolveSession(event);

	event.locals.session = session ? { id: session.id, expiresAt: session.expiresAt } : null;
	event.locals.user = session
		? {
				id: session.user.id,
				email: session.user.email,
				role: session.user.role,
				displayName: session.user.displayName
			}
		: null;

	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

	if (!dev) {
		response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
	}

	return response;
};
