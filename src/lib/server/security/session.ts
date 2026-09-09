import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { SessionRevokedReason } from '$prisma/enums';
import { dev } from '$app/environment';
import {
	createSession,
	findActiveSession,
	revokeAllSessions,
	revokeSession,
	touchSession,
	type SessionRecord
} from '../database/auth';
import { generateSecretToken, hashClientAddress, hashSessionToken } from './hash';

export const SESSION_COOKIE = 'bylikki_session';

/** Duree de vie d'une session : 30 jours, prolonges a chaque visite. */
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
/** En deca de ce seuil, la session est prolongee lors d'une requete. */
const SESSION_RENEWAL_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000;

/**
 * Le user-agent complet est une donnee identifiante : on n'en garde qu'un
 * libelle court, suffisant pour que la personne reconnaisse son appareil.
 */
function toUserAgentLabel(userAgent: string | null) {
	if (!userAgent) {
		return null;
	}

	const platform = /\(([^;)]+)/.exec(userAgent)?.[1]?.trim() ?? 'Appareil inconnu';
	const browser =
		['Firefox', 'Edg', 'Chrome', 'Safari'].find((candidate) => userAgent.includes(candidate)) ??
		'Navigateur';

	return `${browser === 'Edg' ? 'Edge' : browser} · ${platform}`.slice(0, 80);
}

function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		expires: expiresAt
	});
}

export function clearSessionCookie(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function startSession(event: RequestEvent, userId: string) {
	const token = generateSecretToken();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	await createSession({
		userId,
		secretHash: hashSessionToken(token),
		expiresAt,
		ipHash: hashClientAddress(event),
		userAgentLabel: toUserAgentLabel(event.request.headers.get('user-agent'))
	});

	setSessionCookie(event.cookies, token, expiresAt);
}

export async function resolveSession(event: RequestEvent): Promise<SessionRecord | null> {
	const token = event.cookies.get(SESSION_COOKIE);

	if (!token) {
		return null;
	}

	const session = await findActiveSession(hashSessionToken(token));

	if (!session) {
		clearSessionCookie(event.cookies);
		return null;
	}

	if (session.expiresAt.getTime() - Date.now() < SESSION_RENEWAL_THRESHOLD_MS) {
		const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await touchSession(session.id, expiresAt);
		setSessionCookie(event.cookies, token, expiresAt);
	}

	return session;
}

export async function endSession(event: RequestEvent, reason: SessionRevokedReason) {
	const session = event.locals.session;

	if (session) {
		await revokeSession(session.id, reason);
	}

	clearSessionCookie(event.cookies);
}

export async function endAllSessions(
	event: RequestEvent,
	userId: string,
	reason: SessionRevokedReason
) {
	await revokeAllSessions(userId, reason);
	clearSessionCookie(event.cookies);
}
