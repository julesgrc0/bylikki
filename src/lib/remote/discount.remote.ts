import { error } from '@sveltejs/kit';
import { discountSchema, loyaltyTierSchema } from '#lib/client/validation/discount';
import {
	deleteDiscount,
	deleteLoyaltyTier,
	listDiscounts,
	listLoyaltyTiers,
	saveDiscount,
	saveLoyaltyTier
} from '#lib/server/database/discount';
import { requireAdmin } from '#lib/server/security/guard';
import * as v from 'valibot';
import { command, query } from '$app/server';

const identifierSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(80));

export const getDiscounts = query(async () => {
	requireAdmin();

	return listDiscounts();
});

export const getLoyaltyTiers = query(async () => {
	requireAdmin();

	return listLoyaltyTiers();
});

export const upsertDiscount = command(discountSchema, async (input) => {
	requireAdmin();

	const { id, ...rest } = input;
	const saved = await saveDiscount({ ...rest, ...(id === '' ? {} : { id }) });
	await getDiscounts().refresh();

	return saved;
});

export const removeDiscount = command(identifierSchema, async (id) => {
	requireAdmin();

	const deleted = await deleteDiscount(id);

	if (deleted.count === 0) {
		error(409, 'Ce code a déjà servi : désactive-le plutôt que de le supprimer.');
	}

	await getDiscounts().refresh();

	return { deleted: true };
});

export const upsertLoyaltyTier = command(loyaltyTierSchema, async (input) => {
	requireAdmin();

	const { id, ...rest } = input;
	const saved = await saveLoyaltyTier({ ...rest, ...(id === '' ? {} : { id }) });
	await getLoyaltyTiers().refresh();

	return saved;
});

export const removeLoyaltyTier = command(identifierSchema, async (id) => {
	requireAdmin();

	await deleteLoyaltyTier(id);
	await getLoyaltyTiers().refresh();

	return { deleted: true };
});
