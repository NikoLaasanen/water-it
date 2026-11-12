import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { withPwa } from '@vite-pwa/sveltekit';

// SPA: every route is served from this fallback page. `200.html` rather than
// `index.html` so it can never collide with a prerendered homepage; Firebase
// Hosting rewrites `**` to it (see firebase.json).
const SPA_FALLBACK = '200.html';

// Light-theme background from docs/screens.md. The manifest can hold only one
// theme/background colour, so it carries the light one; the per-theme
// `theme-color` metas live in src/app.html (design.md 9.1).
const LIGHT_BG = '#F3F5F1';

export default defineConfig({
	plugins: [
		tailwindcss(),

		// `withPwa` *wraps* SvelteKit's Vite plugin instead of sitting next to it.
		// In SvelteKit 3 there is no svelte.config.js and the adapter is a plugin
		// option, so the PWA plugin has to be given those options to read the
		// adapter's fallback. @vite-pwa/sveltekit v2 exports only `withPwa` for
		// this reason — there is no separate `SvelteKitPWA` plugin any more.
		...withPwa(
			{
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				adapter: adapter({ fallback: SPA_FALLBACK })
			},
			{
				// CLAUDE.md: "new version available, tap to reload" — never reload on
				// its own, which could discard a half-finished log entry.
				registerType: 'prompt',
				// ReloadPrompt.svelte registers the worker itself via
				// `useRegisterSW`. The plugin can't inject its own script tag into
				// app.html anyway (it disables the index-html hooks for SvelteKit), so
				// leaving this on would only emit an unused registerSW.js.
				injectRegister: false,
				manifest: {
					id: '/',
					name: 'Water.it',
					short_name: 'Water.it',
					start_url: '/',
					scope: '/',
					display: 'standalone',
					orientation: 'portrait',
					theme_color: LIGHT_BG,
					background_color: LIGHT_BG
					// No `description`: the manifest is static and single-locale, so any
					// prose here would be user-facing text that can't go through
					// Paraglide. The name is identical in English and Finnish.
				},
				// Icons come from pwa-assets.config.ts, generated from
				// static/app-icon.svg, and are written into the manifest for us.
				pwaAssets: {
					config: true,
					overrideManifestIcons: true,
					// We emit two `theme-color` metas by hand, one per colour scheme.
					// Letting the plugin inject its own single one would duplicate them.
					injectThemeColor: false
				},
				// Renamed from `workbox` in @vite-pwa/sveltekit v2; the old key still
				// works but warns.
				generateSW: {
					globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2,webmanifest}'],
					// Firebase's redirect sign-in navigates to `/__/auth/handler` on
					// *this* origin, and `spa: true` below registers a NavigationRoute
					// that answers every navigation with the cached 200.html shell.
					// Without this denylist the worker swallows the handler: the app
					// shell boots in its place, `getRedirectResult()` finds no pending
					// credential and the route guard returns to /signin — so tapping
					// "Sign in with Google" appears to do nothing at all. `/__/*` is
					// Firebase Hosting's reserved namespace (auth handler, iframe,
					// init.json), none of which we could usefully serve from cache.
					navigateFallbackDenylist: [/^\/__\//],
					// The plugin always appends `prerendered/**/*.{html,json}` to these
					// patterns, but this app prerenders nothing (`ssr = false`
					// everywhere), so that directory never exists and a strict glob
					// fails the build. The SPA shell is precached by the `spa` +
					// `adapterFallback` options below instead, which inject the
					// fallback entry directly, so nothing is actually left uncached.
					globStrict: false
				},
				kit: {
					// Together these put the SPA fallback in the precache manifest, so
					// the installed app opens offline on any route.
					adapterFallback: SPA_FALLBACK,
					spa: true,
					includeVersionFile: true
				},
				// No service worker in `vite dev`: it caches aggressively and would
				// fight both HMR and the Firebase emulators. Verify the real thing
				// with `pnpm build && pnpm preview`, or on a deployed URL.
				devOptions: { enabled: false }
			}
		),

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
