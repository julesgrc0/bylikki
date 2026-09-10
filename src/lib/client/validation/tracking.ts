import * as v from 'valibot';
import { emailSchema } from './auth';

export const trackingSchema = v.object({
	reference: v.pipe(
		v.string('Indique la référence de ta commande.'),
		v.trim(),
		v.toUpperCase(),
		/**
		 * Les deux casses sont acceptees : le schema normalise en majuscules,
		 * et l'attribut `pattern` derive pour le navigateur doit donc laisser
		 * passer une reference recopiee en minuscules.
		 */
		v.regex(
			/^[Bb][Yy]-[0-9A-Za-z]{8}$/,
			'Cette référence ne ressemble pas à une référence Bylikki.'
		)
	),
	email: emailSchema
});
