import type { RequestHandler } from '@sveltejs/kit';
import { legalDocs } from '#lib/client/data/legal';
import { listSitemapEntries } from '#lib/server/database/product';

function escapeXml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

type SitemapUrl = { path: string; lastModified?: Date; changeFrequency: string; priority: string };

/**
 * Seules les pages publiques et indexables figurent ici : le compte, la
 * connexion, l'administration et les factures en sont exclus par nature.
 */
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const { products, categories } = await listSitemapEntries();

	const entries: SitemapUrl[] = [
		{ path: '/', changeFrequency: 'weekly', priority: '1.0' },
		{ path: '/search', changeFrequency: 'daily', priority: '0.8' },
		...categories.map((category) => ({
			path: `/search?category=${encodeURIComponent(category.slug)}`,
			lastModified: category.updatedAt,
			changeFrequency: 'weekly',
			priority: '0.7'
		})),
		...products.map((product) => ({
			path: `/${product.slug}`,
			lastModified: product.updatedAt,
			changeFrequency: 'weekly',
			priority: '0.9'
		})),
		...legalDocs.map((doc) => ({
			path: `/legal?doc=${doc.id}`,
			changeFrequency: 'yearly',
			priority: '0.2'
		}))
	];

	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...entries.map((entry) =>
			[
				'\t<url>',
				`\t\t<loc>${escapeXml(new URL(entry.path, url.origin).href)}</loc>`,
				entry.lastModified
					? `\t\t<lastmod>${entry.lastModified.toISOString().slice(0, 10)}</lastmod>`
					: '',
				`\t\t<changefreq>${entry.changeFrequency}</changefreq>`,
				`\t\t<priority>${entry.priority}</priority>`,
				'\t</url>'
			]
				.filter(Boolean)
				.join('\n')
		),
		'</urlset>'
	].join('\n');

	setHeaders({ 'cache-control': 'public, max-age=3600' });

	return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
