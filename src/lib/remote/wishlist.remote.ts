import {
	addToWishlist,
	listWishlist,
	listWishlistProductIds,
	mergeWishlist,
	removeFromWishlist
} from '#lib/server/database/wishlist';
import { getSessionUser, requireUser } from '#lib/server/security/guard';
import * as v from 'valibot';
import { command, query } from '$app/server';

const identifierSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(80));
const identifierListSchema = v.pipe(v.array(identifierSchema), v.maxLength(200));

export const getWishlist = query(async () => {
	const user = requireUser();

	return listWishlist(user.id);
});

/**
 * Identifiants seuls : la fiche produit et les cartes s'en servent pour
 * afficher le coeur rempli, sans charger toute la liste. Une visiteuse non
 * connectee recoit une liste vide plutot qu'une erreur.
 */
export const getWishlistIds = query(async () => {
	const user = getSessionUser();

	if (!user) {
		return [] as string[];
	}

	const items = await listWishlistProductIds(user.id);

	return items.map((item) => item.productId);
});

export const toggleWishlist = command(identifierSchema, async (productId) => {
	const user = requireUser();
	const current = await listWishlistProductIds(user.id);
	const alreadyThere = current.some((item) => item.productId === productId);

	if (alreadyThere) {
		await removeFromWishlist(user.id, productId);
	} else {
		await addToWishlist(user.id, productId);
	}

	await getWishlistIds().refresh();
	await getWishlist().refresh();

	return { saved: !alreadyThere };
});

/** Reprise du coeur pose avant connexion : le stockage local rejoint le compte. */
export const importWishlist = command(identifierListSchema, async (productIds) => {
	const user = requireUser();
	const imported = await mergeWishlist(user.id, productIds);

	await getWishlistIds().refresh();
	await getWishlist().refresh();

	return { imported };
});
