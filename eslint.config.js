import { fileURLToPath } from 'node:url';
import { defineConfig, globalIgnores, includeIgnoreFile } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	globalIgnores(['src/worker-configuration.d.ts']),
	prettier,
	svelte.configs.prettier,
	{
		files: ['**/*.ts'],
		languageOptions: { parser: ts.parser }
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: { parserOptions: { parser: ts.parser } }
	}
);
