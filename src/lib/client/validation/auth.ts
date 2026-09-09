import * as v from 'valibot';

export const OTP_CODE_LENGTH = 6;

export const emailSchema = v.pipe(
	v.string("L'adresse e-mail est obligatoire."),
	v.trim(),
	v.toLowerCase(),
	v.email('Cette adresse e-mail ne ressemble pas à une adresse valide.'),
	v.maxLength(320, 'Cette adresse e-mail est trop longue.')
);

export const signInSchema = v.object({ email: emailSchema });

export const otpCodeSchema = v.pipe(
	v.string('Le code est obligatoire.'),
	v.trim(),
	v.regex(/^\d{6}$/, `Le code comporte ${OTP_CODE_LENGTH} chiffres.`)
);

export const otpSchema = v.object({ code: otpCodeSchema });

export type SignInInput = v.InferInput<typeof signInSchema>;
export type OtpInput = v.InferInput<typeof otpSchema>;
