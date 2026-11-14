import { createAppleSplashScreens, defineConfig } from '@vite-pwa/assets-generator/config';

/**
 * iOS launch images ("apple-touch-startup-image"): the still frame iOS shows
 * while the installed app starts. Run via `pnpm generate-splash`, which then
 * copies them into `static/splash/` and writes their link tags into
 * `src/app.html` (scripts/copy-splash.mjs).
 *
 * Kept apart from pwa-assets.config.ts on purpose: that config also runs
 * inside the Vite build (`pwaAssets` in vite.config.ts), and these 40 images
 * must not be emitted there and precached by the service worker.
 *
 * The image is design/icons/logo.svg (the logo traced from app-icon.png,
 * on a green square) centred on the same green. It is scaled to (1 − PADDING) of the
 * screen's shorter side; the animated splash in app.html draws the logo at
 * exactly that size, so the hand-over from launch image to animation is
 * invisible. Change SPLASH_PADDING in both places together.
 *
 * One version for light and dark: the icon is green in both.
 */
export const SPLASH_PADDING = 0.35;
export const SPLASH_GREEN = '#316C4D';

export default defineConfig({
	preset: {
		transparent: { sizes: [], favicons: [] },
		maskable: { sizes: [] },
		apple: { sizes: [] },
		appleSplashScreens: createAppleSplashScreens({
			padding: SPLASH_PADDING,
			resizeOptions: { background: SPLASH_GREEN, fit: 'contain' },
			linkMediaOptions: { log: false, addMediaScreen: true, basePath: '/splash/', xhtml: false },
			png: { compressionLevel: 9, quality: 60 }
		})
	},
	images: ['design/icons/logo.svg']
});
