import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Confort de navigation : le controle d'acces reel est fait par chaque remote
 * function derriere `requireAdmin()`. Ici on evite simplement d'afficher une
 * coquille vide a qui n'a rien a y faire.
 */
export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/sign');
	}

	if (locals.user.role !== 'ADMIN') {
		error(403, "Cet espace est reserve a l'administration de la boutique.");
	}

	return { admin: { email: locals.user.email } };
};
