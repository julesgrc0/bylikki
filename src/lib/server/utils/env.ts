import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/**
 * Variables sans lesquelles le site fonctionnerait a moitie : la connexion
 * echouerait, les paiements ne seraient pas confirmes, ou les identifiants
 * seraient haches avec un secret de repli connu. Mieux vaut refuser de
 * demarrer que de decouvrir le probleme a la premiere commande.
 */
const REQUIRED_IN_PRODUCTION = [
	'AUTH_SECRET',
	'OTP_PEPPER',
	'PRISMA_DATABASE_URL',
	'STRIPE_SECRET_KEY',
	'STRIPE_WEBHOOK_SECRET',
	'SMTP_HOST',
	'BLOB_READ_WRITE_TOKEN',
	'PUBLIC_ORIGIN'
] as const;

/** Absentes, elles degradent une fonction sans empecher la boutique de tourner. */
const RECOMMENDED = ['CRON_SECRET', 'ADMIN_ALERT_EMAIL', 'SMTP_FROM'] as const;

export function checkEnvironment() {
	if (dev) {
		return;
	}

	const missing = REQUIRED_IN_PRODUCTION.filter((name) => !env[name]);

	if (missing.length > 0) {
		throw new Error(
			`Variables d'environnement manquantes : ${missing.join(', ')}. Voir docs/a-completer.md.`
		);
	}

	const incomplete = RECOMMENDED.filter((name) => !env[name]);

	if (incomplete.length > 0) {
		console.warn(`[env] variables recommandees absentes : ${incomplete.join(', ')}`);
	}
}
