import { describe, expect, test } from 'vitest';
import { normalizeEmail } from './email';

describe('normalizeEmail', () => {
	test('supprime les espaces autour de l adresse', () => {
		expect(normalizeEmail('  emma@exemple.fr  ')).toBe('emma@exemple.fr');
	});

	test('passe en minuscules', () => {
		expect(normalizeEmail('Emma@Exemple.FR')).toBe('emma@exemple.fr');
	});

	test('normalise les formes unicode equivalentes', () => {
		expect(normalizeEmail('ｅmma@exemple.fr')).toBe('emma@exemple.fr');
	});

	test('une chaine vide reste vide', () => {
		expect(normalizeEmail('')).toBe('');
	});
});
