import { error, json, type RequestHandler } from '@sveltejs/kit';
import { safeEqual } from '#lib/server/security/hash';
import { runRetentionPurge } from '#lib/server/utils/retention';
import { env } from '$env/dynamic/private';

/**
 * Purge de conservation, appelee par une tache planifiee. Sans elle, les
 * comptes dont la suppression a ete demandee ne sont jamais effaces : la
 * promesse faite dans l'interface ne serait pas tenue.
 *
 * L'acces est protege par un secret partage compare a temps constant. Sans
 * secret configure la route refuse : mieux vaut une purge qui ne tourne pas
 * qu'un point d'entree ouvert. Vercel Cron appelle en GET et pose lui-meme
 * l'en-tete `Authorization` a partir de `CRON_SECRET` ; le POST est la pour
 * un declenchement manuel.
 */
const purge: RequestHandler = async ({ request }) => {
	const expected = env.CRON_SECRET;

	if (!expected) {
		error(503, "La tâche planifiée n'est pas configurée.");
	}

	const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';

	if (!safeEqual(provided, expected)) {
		error(401, 'Jeton invalide.');
	}

	return json(await runRetentionPurge());
};

export const GET = purge;
export const POST = purge;
