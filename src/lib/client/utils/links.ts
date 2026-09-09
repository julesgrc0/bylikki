import type { LinkTarget } from '#lib/client/validation/settings';
import { resolve } from '$app/paths';

/**
 * Traduit une destination configuree en administration vers un chemin interne.
 * Les reglages ne portent jamais d'URL libre : impossible d'en faire un lien
 * sortant ou une redirection ouverte depuis le tableau de bord.
 */
export function targetHref(target: LinkTarget) {
	switch (target.kind) {
		case 'category':
			return resolve(`/search?category=${encodeURIComponent(target.slug)}`);
		case 'search':
			return target.query
				? resolve(`/search?query=${encodeURIComponent(target.query)}`)
				: resolve('/search');
		case 'product':
			return resolve('/[slug]', { slug: target.slug });
		case 'atelier':
			return resolve('/atelier');
		case 'none':
			return null;
	}
}
