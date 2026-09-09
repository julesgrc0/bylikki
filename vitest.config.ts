import path from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit(), svelteTesting()],
	resolve: {
		alias: {
			'#lib': path.resolve('./src/lib'),
			$prisma: path.resolve('./generated/prisma')
		}
	},
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'app',
					environment: 'jsdom',
					include: ['src/**/*.test.ts'],
					exclude: [],
					setupFiles: ['src/vitest-setup.ts']
				}
			}
		]
	}
});
