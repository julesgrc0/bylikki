import { describe, expect, test } from 'vitest';
import { renderDesignPreview } from './design-preview';

const bead = { hexColor: '#F0369B', sizeMm: 8 };

describe('renderDesignPreview', () => {
	test('une creation vide rend un SVG vide plutot que de lever', () => {
		expect(renderDesignPreview([], null)).toContain('<svg');
	});

	test('chaque composant donne un cercle', () => {
		const svg = renderDesignPreview([bead, bead, bead], null);

		expect(svg.match(/<circle/g)).toHaveLength(3);
	});

	test('le fermoir ajoute deux attaches', () => {
		const svg = renderDesignPreview([bead, bead], '#FFDE59');

		expect(svg.match(/<circle/g)).toHaveLength(4);
	});

	test('le cordon relie tous les composants', () => {
		const svg = renderDesignPreview([bead, bead, bead], null);
		const points = /points="([^"]+)"/.exec(svg)?.[1].split(' ');

		expect(points).toHaveLength(3);
	});

	test('une couleur inattendue retombe sur la couleur par defaut', () => {
		const svg = renderDesignPreview([{ hexColor: '"><script>alert(1)</script>', sizeMm: 8 }], null);

		expect(svg).not.toContain('script');
		expect(svg).toContain('fill="#F0369B"');
	});

	test('seul un hexadecimal complet est accepte', () => {
		expect(renderDesignPreview([{ hexColor: 'red', sizeMm: 8 }], null)).toContain('fill="#F0369B"');
		expect(renderDesignPreview([{ hexColor: '#abc', sizeMm: 8 }], null)).toContain(
			'fill="#F0369B"'
		);
		expect(renderDesignPreview([{ hexColor: '#6EC6EE', sizeMm: 8 }], null)).toContain(
			'fill="#6EC6EE"'
		);
	});

	test('le rayon reste borne, quelle que soit la taille annoncee', () => {
		const svg = renderDesignPreview([{ hexColor: '#000000', sizeMm: 900 }], null);

		expect(svg).toContain('r="16"');
	});
});
