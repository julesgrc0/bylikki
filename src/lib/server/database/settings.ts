import {
	parseSetting,
	settingDefaults,
	type SettingKey,
	type SiteSettings
} from '#lib/client/validation/settings';
import { prisma } from './client';

/**
 * Les reglages sont lus a chaque rendu de page : un cache court evite un
 * aller-retour en base par requete, tout en garantissant qu'une modification
 * faite dans l'administration soit visible en quelques secondes, y compris
 * depuis une autre instance serverless.
 */
const CACHE_TTL_MS = 15_000;

let cache: { settings: SiteSettings; expiresAt: number } | null = null;

export async function getSiteSettings(): Promise<SiteSettings> {
	if (cache && cache.expiresAt > Date.now()) {
		return cache.settings;
	}

	const rows = await prisma.siteSetting.findMany({ select: { key: true, value: true } });
	const stored = new Map(rows.map((row) => [row.key, row.value]));
	const settings = Object.fromEntries(
		(Object.keys(settingDefaults) as SettingKey[]).map((key) => [
			key,
			stored.has(key) ? parseSetting(key, stored.get(key)) : settingDefaults[key]
		])
	) as SiteSettings;

	cache = { settings, expiresAt: Date.now() + CACHE_TTL_MS };

	return settings;
}

export async function getSetting<Key extends SettingKey>(key: Key): Promise<SiteSettings[Key]> {
	return (await getSiteSettings())[key];
}

export async function saveSetting<Key extends SettingKey>(key: Key, value: SiteSettings[Key]) {
	await prisma.siteSetting.upsert({
		where: { key },
		create: { key, value },
		update: { value }
	});

	cache = null;
}

/** Utilisee par les tests et apres une ecriture directe en base. */
export function clearSettingsCache() {
	cache = null;
}
