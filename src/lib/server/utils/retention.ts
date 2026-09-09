import { purgeExpiredCredentials } from '../database/auth';
import { listAccountsToPurge, purgeUserAccount } from '../database/user';
import { deleteImage } from './blob';

/** Delai d'annulation annonce a la personne avant l'effacement definitif. */
export const DELETION_GRACE_DAYS = 30;

/**
 * Politique de conservation : codes expires et sessions eteintes disparaissent,
 * et les comptes dont la suppression a ete demandee sont effaces une fois le
 * delai d'annulation ecoule, images comprises.
 */
export async function runRetentionPurge(now = new Date()) {
	const [otps, sessions] = await purgeExpiredCredentials(now);

	const deadline = new Date(now.getTime() - DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000);
	const accounts = await listAccountsToPurge(deadline);

	for (const account of accounts) {
		const images = await purgeUserAccount(account.id);
		await Promise.all(images.map(deleteImage));
	}

	return {
		otpsSupprimes: otps.count,
		sessionsSupprimees: sessions.count,
		comptesEffaces: accounts.length
	};
}
