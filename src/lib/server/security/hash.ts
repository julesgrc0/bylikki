import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
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
	return sha256Hex(`${readSecret('AUTH_SECRET')}:session:${token}`);
}

export function hashOtpCode(email: string, code: string) {
	return sha256Hex(`${readSecret('OTP_PEPPER')}:otp:${email.toLowerCase()}:${code}`);
}

/**
 * Les adresses IP ne sont jamais stockees en clair : seule une empreinte salee
 * est conservee, suffisante pour la limitation de debit et la detection d'abus.
 */
export function hashIpAddress(ipAddress: string | null) {
	if (!ipAddress) {
		return null;
	}

	return sha256Hex(`${readSecret('AUTH_SECRET')}:ip:${ipAddress}`);
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
