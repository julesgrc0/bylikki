import { countEvent } from '#lib/server/database/metrics';
import { hashClientAddress } from '#lib/server/security/hash';
import { consumeRateLimit } from '#lib/server/security/rate-limit';
import { command, getRequestEvent } from '$app/server';

/**
 * L'ajout au panier se fait entierement dans le navigateur : sans ce signal,
 * l'entonnoir aurait un trou entre la fiche vue et le paiement lance. Rien
 * n'est transmis d'autre que le fait qu'un ajout a eu lieu — ni quoi, ni par
 * qui. La limitation de debit est une mesure anti-abus, adossee a l'empreinte
 * d'adresse deja utilisee ailleurs, et n'est jamais stockee avec le compteur.
 */
export const trackCartAdd = command(async () => {
	const quota = await consumeRateLimit({
		bucket: 'metric-cart-add',
		subject: hashClientAddress(getRequestEvent()),
		limit: 200
	});

	if (quota.allowed) {
		await countEvent('cart_add');
	}

	return { counted: quota.allowed };
});
