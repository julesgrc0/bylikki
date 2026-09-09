import { nextTierFor, tierFor } from '#lib/client/utils/pricing';
import { prisma } from '#lib/server/database/client';
import { listLoyaltyTiers } from '#lib/server/database/discount';
import { requireUser } from '#lib/server/security/guard';
import { query } from '$app/server';

/** Palier atteint, avantages associes, et ce qui reste pour le palier suivant. */
export const getMyLoyalty = query(async () => {
	const user = requireUser();

	const [tiers, account] = await Promise.all([
		listLoyaltyTiers(),
		prisma.user.findUniqueOrThrow({
			where: { id: user.id },
			select: { lifetimeSpentCents: true }
		})
	]);

	const spentCents = account.lifetimeSpentCents;

	return {
		spentCents,
		current: tierFor(tiers, spentCents),
		next: nextTierFor(tiers, spentCents),
		tiers
	};
});
