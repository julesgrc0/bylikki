import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

const DEV_FALLBACK_SECRET = 'bylikki-dev-secret-do-not-use-in-production';

function readSecret(name: 'AUTH_SECRET' | 'OTP_PEPPER') {
	const value = env[name];

	if (value) {
		return value;
	}

	if (!dev) {
		throw new Error(`${name} est absent : impossible de securiser les identifiants.`);
	}

	return `${DEV_FALLBACK_SECRET}:${name}`;
}

export function sha256Hex(input: string) {
	return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Empreinte authentifiee : sans la cle, une valeur ne peut pas etre forgee. */
export function hmacHex(scope: string, input: string) {
	return createHmac('sha256', readSecret('AUTH_SECRET')).update(`${scope}:${input}`).digest('hex');
}

/** Jeton opaque cryptographiquement sur, dont seule l'empreinte est stockee. */
export function generateSecretToken(byteLength = 32) {
	return randomBytes(byteLength).toString('base64url');
}

/** Code numerique a usage unique, tire uniformement. */
export function generateNumericCode(length: number) {
	let code = '';

	for (let index = 0; index < length; index += 1) {
		code += randomInt(0, 10).toString();
	}

	return code;
}

export function hashSessionToken(token: string) {
	return hmacHex('session', token);
}

export function hashOtpCode(email: string, code: string) {
	return sha256Hex(`${readSecret('OTP_PEPPER')}:otp:${email.toLowerCase()}:${code}`);
}

/**
 * Adresse de la cliente telle que l'adaptateur la resout. On ne lit jamais
 * `x-forwarded-for` directement : l'en-tete est fourni par le client et
 * permettrait de contourner toute limitation de debit en le faisant varier.
 */
export function hashClientAddress(event: RequestEvent) {
	try {
		return hmacHex('ip', event.getClientAddress());
	} catch {
		return null;
	}
}

/**
 * Lien de desinscription valable sans connexion : la signature authentifie
 * l'identifiant, personne ne peut donc desabonner quelqu'un d'autre. Aucun
 * jeton n'est stocke, le lien reste valable tant que la cle ne change pas.
 */
export function signUnsubscribe(userId: string) {
	return hmacHex('unsubscribe', userId);
}

export function verifyUnsubscribe(userId: string, signature: string) {
	return safeEqual(signUnsubscribe(userId), signature);
}

/** Comparaison a temps constant, pour ne pas fuiter d'information par la duree. */
export function safeEqual(left: string, right: string) {
	const leftBuffer = Buffer.from(left, 'utf8');
	const rightBuffer = Buffer.from(right, 'utf8');

	if (leftBuffer.length !== rightBuffer.length) {
		return false;
	}

	return timingSafeEqual(leftBuffer, rightBuffer);
}
