import { resolve4, resolve6, resolveMx } from 'node:dns/promises';
import { DNS_TIMEOUT_MS } from './const';

/**
 * Forme canonique d'une adresse : c'est elle qui sert de cle en base, pour que
 * deux ecritures differentes de la meme adresse ne creent pas deux comptes.
 */
export function normalizeEmail(email: string) {
	return email.trim().toLowerCase().normalize('NFKC');
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error('DNS_TIMEOUT')), timeoutMs);
		})
	]);
}

/** Repli quand le domaine n'annonce pas de MX : un enregistrement A ou AAAA suffit. */
async function hasAddressRecord(domain: string) {
	const [ipv4, ipv6] = await Promise.allSettled([
		withTimeout(resolve4(domain), DNS_TIMEOUT_MS),
		withTimeout(resolve6(domain), DNS_TIMEOUT_MS)
	]);

	return (
		(ipv4.status === 'fulfilled' && ipv4.value.length > 0) ||
		(ipv6.status === 'fulfilled' && ipv6.value.length > 0)
	);
}

/**
 * Verifie que le domaine peut recevoir du courrier. En cas de panne DNS on
 * repond `true` : mieux vaut laisser passer une adresse douteuse que bloquer
 * une cliente legitime parce que le resolveur ne repond pas.
 */
export async function hasValidMx(email: string) {
	const at = email.lastIndexOf('@');

	if (at <= 0 || at === email.length - 1) {
		return false;
	}

	const domain = email.slice(at + 1);

	if (!domain.includes('.')) {
		return false;
	}

	try {
		const records = await withTimeout(resolveMx(domain), DNS_TIMEOUT_MS);

		if (records.length > 0) {
			return true;
		}

		return hasAddressRecord(domain);
	} catch (error) {
		const code = (error as NodeJS.ErrnoException).code;

		/** Le domaine a repondu : il n'a simplement pas de MX. */
		if (code === 'ENOTFOUND' || code === 'ENODATA') {
			return hasAddressRecord(domain);
		}

		/** Panne, lenteur ou coupure du resolveur : on ne penalise pas la cliente. */
		return true;
	}
}
