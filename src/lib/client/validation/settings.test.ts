import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import {
	announcementSettingsSchema,
	homeSettingsSchema,
	parseSetting,
	settingDefaults,
	shippingSettingsSchema,
	thresholdSettingsSchema
} from './settings';

describe('parseSetting', () => {
	test('une valeur absente retombe sur le defaut', () => {
		expect(parseSetting('shipping', undefined)).toEqual(settingDefaults.shipping);
	});

	test('une valeur illisible ne casse pas la boutique', () => {
		expect(parseSetting('shipping', 'nimporte quoi')).toEqual(settingDefaults.shipping);
	});

	test('une valeur partielle est rejetee au profit du defaut', () => {
		expect(parseSetting('shipping', { flatCents: 500 })).toEqual(settingDefaults.shipping);
	});

	test('une valeur valide est conservee telle quelle', () => {
		const shipping = { flatCents: 790, freeThresholdCents: 9000, countries: ['FR'] };

		expect(parseSetting('shipping', shipping)).toEqual(shipping);
	});

	test('un pays inconnu invalide la rubrique entiere', () => {
		expect(
			parseSetting('shipping', { flatCents: 500, freeThresholdCents: 0, countries: ['XX'] })
		).toEqual(settingDefaults.shipping);
	});
});

describe('shippingSettingsSchema', () => {
	test('refuse une liste de pays vide', () => {
		expect(
			v.safeParse(shippingSettingsSchema, {
				flatCents: 490,
				freeThresholdCents: 6000,
				countries: []
			}).success
		).toBe(false);
	});

	test('refuse un forfait negatif', () => {
		expect(
			v.safeParse(shippingSettingsSchema, {
				flatCents: -1,
				freeThresholdCents: 6000,
				countries: ['FR']
			}).success
		).toBe(false);
	});
});

describe('homeSettingsSchema', () => {
	test('refuse un carrousel vide', () => {
		expect(v.safeParse(homeSettingsSchema, { slides: [] }).success).toBe(false);
	});

	test('accepte les diapositives par defaut', () => {
		expect(v.safeParse(homeSettingsSchema, settingDefaults.home).success).toBe(true);
	});

	test('refuse une destination inconnue', () => {
		const slides = [
			{ kicker: '', title: 'Titre', desc: '', cta: 'Voir', target: { kind: 'externe' } }
		];

		expect(v.safeParse(homeSettingsSchema, { slides }).success).toBe(false);
	});
});

describe('announcementSettingsSchema', () => {
	test('refuse un message trop long', () => {
		expect(
			v.safeParse(announcementSettingsSchema, {
				enabled: true,
				text: 'a'.repeat(141),
				tone: 'pink',
				target: { kind: 'none' }
			}).success
		).toBe(false);
	});

	test('refuse une couleur hors palette', () => {
		expect(
			v.safeParse(announcementSettingsSchema, {
				enabled: true,
				text: 'Coucou',
				tone: 'orange',
				target: { kind: 'none' }
			}).success
		).toBe(false);
	});
});

describe('thresholdSettingsSchema', () => {
	test('accepte un seuil de stock a zero', () => {
		expect(v.safeParse(thresholdSettingsSchema, { lowStock: 0, preparationDays: 0 }).success).toBe(
			true
		);
	});

	test('refuse un delai de preparation negatif', () => {
		expect(v.safeParse(thresholdSettingsSchema, { lowStock: 3, preparationDays: -1 }).success).toBe(
			false
		);
	});
});
