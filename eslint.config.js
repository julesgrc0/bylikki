import path from 'node:path';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import * as importX from 'eslint-plugin-import-x';
import svelte from 'eslint-plugin-svelte';
import unusedImports from 'eslint-plugin-unused-imports';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import { configs, parser } from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{ ignores: ['engine/**'] },
	js.configs.recommended,
	...configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	importX.flatConfigs.recommended,
	importX.flatConfigs.typescript,
	{
		settings: {
			'import-x/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: './tsconfig.json'
				}
			}
		},
		rules: {
			'import-x/no-unused-modules': 'off',
			'import-x/no-named-as-default-member': 'off',
			'import-x/no-named-as-default': 'off',
			'import-x/no-duplicates': 'error',
			'import-x/no-unresolved': [
				'error',
				{
					ignore: ['^\\$app/', '^\\$env/', '^\\$service-worker$']
				}
			]
		}
	},
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			'svelte/no-navigation-without-resolve': 'error'
		}
	},
	{
		plugins: {
			'unused-imports': unusedImports
		},
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'unused-imports/no-unused-imports': 'error',
			'unused-imports/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_'
				}
			]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				parser: parser,
				projectService: true,
				extraFileExtensions: ['.svelte']
			}
		}
	},
	{
		/**
		 * Les gabarits d'e-mail ne naviguent pas dans l'application : leurs liens
		 * sont des URL absolues destinees a une boite de reception, ou `resolve()`
		 * n'a aucun sens.
		 */
		files: ['src/lib/server/emails/**/*.svelte'],
		rules: {
			'svelte/no-navigation-without-resolve': 'off'
		}
	}
);
