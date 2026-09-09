import type { LayoutServerLoad } from './$types';

/** Seul l'etat de connexion descend dans la mise en page : rien de personnel. */
export const load: LayoutServerLoad = ({ locals }) => ({
	signedIn: locals.user !== null,
	isAdmin: locals.user?.role === 'ADMIN'
});
