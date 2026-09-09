import { getSetting } from '#lib/server/database/settings';
import type { PageServerLoad } from './$types';

/** Le carrousel est rendu des le premier octet : ses diapositives viennent des reglages. */
export const load: PageServerLoad = async () => ({ home: await getSetting('home') });
