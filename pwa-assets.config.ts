import { defineConfig } from '@vite-pwa/assets-generator/config';

/**
 * Icon generation from `design/icons/app-icon.png`. Run via `pnpm generate-pwa-assets`,
 * and also run automatically at build time by the `pwaAssets` option in
 * `vite.config.ts`.
 *
 * This is the `minimal-2023` preset with two deliberate overrides. The preset's
 * defaults are `padding: 0.3` and a **white** background, which would frame our
 * green icon in white — very visible as an Apple touch icon. The source image is
 * already a full-bleed square with its artwork inside the maskable safe zone, so
 * padding is 0 and the background is the same green as the artwork.
 */
export default defineConfig({
	headLinkOptions: { preset: '2023' },
	preset: {
		transparent: {
			sizes: [64, 192, 512],
			favicons: [[48, 'favicon.ico']],
			padding: 0
		},
		maskable: {
			sizes: [512],
			padding: 0,
			resizeOptions: { background: '#316C4D' }
		},
		apple: {
			sizes: [180],
			padding: 0,
			resizeOptions: { background: '#316C4D' }
		}
	},
	images: ['design/icons/app-icon.png']
});
