import { describe, expect, test } from 'vitest';
import { generateOrderReference } from './reference';

describe('generateOrderReference', () => {
	test('respecte le format attendu par la validation', () => {
		expect(generateOrderReference(new Date('2026-03-14T10:00:00Z'))).toMatch(/^BY-26[0-9A-Z]{6}$/);
	});

	test('porte les deux derniers chiffres de l annee', () => {
		expect(generateOrderReference(new Date('2031-01-02T10:00:00Z'))).toMatch(/^BY-31/);
	});

	test('deux appels ne donnent pas la meme reference', () => {
		const first = generateOrderReference();
		const second = generateOrderReference();

		expect(first).not.toBe(second);
	});
});
