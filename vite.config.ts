import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// SPA: every route is served from the fallback page. `200.html` rather than
			// `index.html` so it can never collide with a prerendered homepage; Firebase
			// Hosting rewrites `**` to it (see firebase.json).
			adapter: adapter({ fallback: '200.html' })
		}),

		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			// Pick the phone's language on first launch, then let a choice made in
			// Settings persist (design.md §9). No `url` strategy: locales are not in
			// the URL, so the app has one address per page in both languages.
			strategy: ['localStorage', 'preferredLanguage', 'baseLocale']
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'rules',
					environment: 'node',
					include: ['tests/rules/**/*.{test,spec}.ts'],
					// Rules tests talk to the Firestore emulator, so they need it
					// running: use `pnpm test:rules`, never a bare `vitest`.
					// `assertFails`/`assertSucceeds` throw instead of calling
					// `expect`, so the global assertion requirement can't apply here.
					expect: { requireAssertions: false },
					testTimeout: 15000,
					hookTimeout: 30000
				}
			}
		]
	}
});
