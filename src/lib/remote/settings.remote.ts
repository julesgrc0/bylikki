import {
	announcementSettingsSchema,
	homeSettingsSchema,
	loyaltySettingsSchema,
	shippingSettingsSchema,
	thresholdSettingsSchema,
	vacationSettingsSchema
} from '#lib/client/validation/settings';
import { getSiteSettings, saveSetting } from '#lib/server/database/settings';
import { requireAdmin } from '#lib/server/security/guard';
import { command, query } from '$app/server';

/** Les reglages sont publics : ils decrivent la boutique, rien de personnel. */
export const getSettings = query(async () => getSiteSettings());

export const saveShipping = command(shippingSettingsSchema, async (value) => {
	requireAdmin();
	await saveSetting('shipping', value);
	await getSettings().refresh();

	return { saved: true };
});

export const saveAnnouncement = command(announcementSettingsSchema, async (value) => {
	requireAdmin();
	await saveSetting('announcement', value);
	await getSettings().refresh();

	return { saved: true };
});

export const saveVacation = command(vacationSettingsSchema, async (value) => {
	requireAdmin();
	await saveSetting('vacation', value);
	await getSettings().refresh();

	return { saved: true };
});

export const saveHome = command(homeSettingsSchema, async (value) => {
	requireAdmin();
	await saveSetting('home', value);
	await getSettings().refresh();

	return { saved: true };
});

export const saveThresholds = command(thresholdSettingsSchema, async (value) => {
	requireAdmin();
	await saveSetting('thresholds', value);
	await getSettings().refresh();

	return { saved: true };
});

export const saveLoyalty = command(loyaltySettingsSchema, async (value) => {
	requireAdmin();
	await saveSetting('loyalty', value);
	await getSettings().refresh();

	return { saved: true };
});
