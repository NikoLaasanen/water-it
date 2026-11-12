/**
 * Copies the generated PWA icons from `design/icons/` into `static/`.
 *
 * `pwa-assets-generator` always writes its output next to the source image and
 * has no output-directory option, and the source art must not live in
 * `static/`: it would be deployed and precached by the service worker, for no
 * reason (the originals are ~900 KB together, against a ~110 KB app).
 *
 * Run via `pnpm generate-pwa-assets`, which chains this after the generator.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const FROM = 'design/icons';
const TO = 'static';

const GENERATED = [
	'favicon.ico',
	'apple-touch-icon-180x180.png',
	'maskable-icon-512x512.png',
	'pwa-64x64.png',
	'pwa-192x192.png',
	'pwa-512x512.png'
];

mkdirSync(TO, { recursive: true });

let copied = 0;
const missing = [];
for (const name of GENERATED) {
	const src = join(FROM, name);
	if (!existsSync(src)) {
		missing.push(name);
		continue;
	}
	copyFileSync(src, join(TO, name));
	copied++;
}

if (missing.length > 0) {
	console.error(`Missing generated icons in ${FROM}: ${missing.join(', ')}`);
	console.error('Did pwa-assets-generator run? Check pwa-assets.config.ts.');
	process.exit(1);
}

console.log(`Copied ${copied} icons from ${FROM} to ${TO}`);
