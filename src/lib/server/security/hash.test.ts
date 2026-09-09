import { describe, expect, test, vi } from 'vitest';

vi.mock('$app/environment', () => ({ dev: true }));
vi.mock('$env/dynamic/private', () => ({ env: { AUTH_SECRET: 'secret-de-test' } }));

const { generateNumericCode, generateSecretToken, hashSessionToken, hmacHex, safeEqual } =
	await import('./hash');

describe('hmacHex', () => {
	test('produit une empreinte stable pour une meme entree', () => {
		expect(hmacHex('session', 'jeton')).toBe(hmacHex('session', 'jeton'));
	});

	test('deux portees differentes ne donnent pas la meme empreinte', () => {
		expect(hmacHex('session', 'valeur')).not.toBe(hmacHex('pending-email', 'valeur'));
	});

	test('une entree modifiee change l empreinte', () => {
		expect(hmacHex('ip', '10.0.0.1')).not.toBe(hmacHex('ip', '10.0.0.2'));
	});

	test('l empreinte ne laisse pas transparaitre l entree', () => {
		expect(hashSessionToken('jeton-secret')).not.toContain('jeton-secret');
		expect(hashSessionToken('jeton-secret')).toMatch(/^[0-9a-f]{64}$/);
	});
});

describe('generateSecretToken', () => {
	test('deux jetons ne se repetent pas', () => {
		expect(generateSecretToken()).not.toBe(generateSecretToken());
	});

	test('le jeton est utilisable tel quel dans une URL', () => {
		expect(generateSecretToken()).toMatch(/^[A-Za-z0-9_-]+$/);
	});
});

describe('generateNumericCode', () => {
	test('respecte la longueur demandee', () => {
		expect(generateNumericCode(6)).toMatch(/^\d{6}$/);
	});
});

describe('safeEqual', () => {
	test('reconnait deux valeurs identiques', () => {
		expect(safeEqual('jeton', 'jeton')).toBe(true);
	});

	test('rejette une valeur alteree', () => {
		expect(safeEqual('jeton', 'jetom')).toBe(false);
	});

	test('rejette une valeur de longueur differente sans lever', () => {
		expect(safeEqual('jeton', 'jetons')).toBe(false);
	});
});
