import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { designSchema, MAX_BEADS, MIN_BEADS } from './atelier';

const slots = (count: number) => Array.from({ length: count }, () => 'perle-rose');

describe('designSchema', () => {
	test('accepte une creation de taille valide', () => {
		expect(v.safeParse(designSchema, { slots: slots(MIN_BEADS) }).success).toBe(true);
	});

	test('refuse une creation trop courte', () => {
		expect(v.safeParse(designSchema, { slots: slots(MIN_BEADS - 1) }).success).toBe(false);
	});

	test('refuse une creation trop longue', () => {
		expect(v.safeParse(designSchema, { slots: slots(MAX_BEADS + 1) }).success).toBe(false);
	});

	test('le fermoir est facultatif', () => {
		const parsed = v.safeParse(designSchema, { slots: slots(6) });

		expect(parsed.success).toBe(true);
		expect(parsed.output).toMatchObject({ claspKey: null });
	});

	test('accepte plusieurs fois la meme perle', () => {
		expect(v.safeParse(designSchema, { slots: slots(8), claspKey: 'fermoir-or' }).success).toBe(
			true
		);
	});

	test('refuse une cle vide', () => {
		expect(v.safeParse(designSchema, { slots: ['', '', '', ''] }).success).toBe(false);
	});
});
