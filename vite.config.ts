import path from 'node:path';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	server: {
		port: 3000,
		strictPort: true
	},
	build: {
		assetsInlineLimit: (filePath) =>
			filePath.includes('/assets/cards/') || filePath.includes('\\assets\\cards\\')
				? false
				: undefined
	},
	plugins: [
		tailwindcss(),
		...(process.env.ANALYZE === 'true'
			? [visualizer({ filename: 'stats.html', gzipSize: true, brotliSize: true })]
			: []),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				experimental: { async: true }
			},
			adapter: adapter({ runtime: 'nodejs22.x' }),
			/**
			 * SvelteKit pose un nonce sur ses propres scripts. Les styles restent
			 * en `unsafe-inline` : la maquette s'appuie massivement sur l'attribut
			 * `style`, que la CSP ne sait pas distinguer d'un style injecte.
			 */
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
					'font-src': ['self', 'data:', 'https://fonts.gstatic.com'],
					'img-src': ['self', 'data:', 'https://*.public.blob.vercel-storage.com'],
					'connect-src': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['none'],
					'base-uri': ['self'],
					'object-src': ['none']
				}
			},
			experimental: {
				remoteFunctions: true,
				forkPreloads: true,
				handleRenderingErrors: true
			},
			alias: {
				'#lib': path.resolve('./src/lib'),
				'#lib/*': path.resolve('./src/lib/*'),
				$prisma: path.resolve('./generated/prisma'),
				'$prisma/*': path.resolve('./generated/prisma')
			},
			prerender: {
				handleHttpError: ({ path, message }) => {
					if (path === '/') {
						return;
					}
					throw new Error(message);
				}
			}
		})
	],
	resolve: {
		alias: {
			'#lib': path.resolve('./src/lib'),
			$prisma: path.resolve('./generated/prisma')
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
