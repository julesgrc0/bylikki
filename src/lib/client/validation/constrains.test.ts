import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { otpSchema, signInSchema } from './auth';
import { constrains, constrainsOf } from './constrains';
import { addressSchema } from './profile';
import { reviewSchema } from './review';

describe('constrains', () => {
	test('un champ simple est obligatoire', () => {
		expect(constrains(v.string())).toEqual({ required: true });
	});

	test('un champ optionnel ne l est pas', () => {
		expect(constrains(v.optional(v.string()))).toMatchObject({ required: false });
	});

	test('les longueurs deviennent minlength et maxlength', () => {
		const attrs = constrains(v.pipe(v.string(), v.minLength(2), v.maxLength(40)));

		expect(attrs).toMatchObject({ minlength: 2, maxlength: 40 });
	});

	test('une longueur fixe borne des deux cotes', () => {
		expect(constrains(v.pipe(v.string(), v.length(6)))).toMatchObject({
			minlength: 6,
			maxlength: 6
		});
	});

	test('les bornes numeriques deviennent min et max', () => {
		expect(constrains(v.pipe(v.number(), v.minValue(1), v.maxValue(5)))).toMatchObject({
			min: 1,
			max: 5
		});
	});

	test('une expression reguliere devient un pattern sans delimiteurs', () => {
		expect(constrains(v.pipe(v.string(), v.regex(/^\d{6}$/)))).toMatchObject({
			pattern: '^\\d{6}$'
		});
	});

	test('une union avec une branche vide rend le champ facultatif', () => {
		const schema = v.union([v.literal(''), v.pipe(v.string(), v.maxLength(30))]);

		expect(constrains(schema)).toMatchObject({ required: false, maxlength: 30 });
	});
});

describe('constrainsOf', () => {
	test('l e-mail de connexion est obligatoire et borne', () => {
		expect(constrainsOf(signInSchema, 'email')).toMatchObject({ required: true, maxlength: 320 });
	});

	test('le code a usage unique porte son motif a six chiffres', () => {
		expect(constrainsOf(otpSchema, 'code')).toMatchObject({ pattern: '^\\d{6}$' });
	});

	test('le complement d adresse reste facultatif', () => {
		expect(constrainsOf(addressSchema, 'line2')).toMatchObject({ required: false });
	});

	test('la note d un avis est bornee entre 1 et 5', () => {
		expect(constrainsOf(reviewSchema, 'rating')).toMatchObject({ min: 1, max: 5 });
	});
});
