/**
 * Copies the generated iOS launch images from `design/icons/` into
 * `static/splash/` and writes their `<link rel="apple-touch-startup-image">`
 * tags into `src/app.html`, between the `splash:links` markers.
 *
 * The tags are written here rather than taken from the generator's log
 * because its logged file names don't match the files it writes. Each
 * image's media query comes from the generator's own device table.
 *
 * Run via `pnpm generate-splash`, after pwa-splash.config.ts.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { appleSplashScreenSizes } from '@vite-pwa/assets-generator/config';

const FROM = 'design/icons';
const TO = 'static/splash';
const HTML = 'src/app.html';
const START = '<!-- splash:links -->';
const END = '<!-- /splash:links -->';

const files = readdirSync(FROM).filter((name) => /^apple-splash-.*\.png$/.test(name));
if (files.length === 0) {
	console.error(`No apple-splash-*.png in ${FROM}. Run the generator first.`);
	process.exit(1);
}

rmSync(TO, { recursive: true, force: true });
mkdirSync(TO, { recursive: true });
for (const name of files) copyFileSync(join(FROM, name), join(TO, name));

// One tag per distinct screen (several devices share a size), both orientations.
const screens = new Map();
for (const { width, height, scaleFactor } of Object.values(appleSplashScreenSizes)) {
	screens.set(`${width}x${height}@${scaleFactor}`, { width, height, scaleFactor });
}
const links = [];
const media = (s, orientation) =>
	`screen and (device-width: ${s.width / s.scaleFactor}px) and (device-height: ${s.height / s.scaleFactor}px) and (-webkit-device-pixel-ratio: ${s.scaleFactor}) and (orientation: ${orientation})`;
for (const s of screens.values()) {
	const portrait = `apple-splash-portrait-${s.width}x${s.height}.png`;
	const landscape = `apple-splash-landscape-${s.height}x${s.width}.png`;
	for (const [file, orientation] of [
		[portrait, 'portrait'],
		[landscape, 'landscape']
	]) {
		if (!files.includes(file)) {
			console.error(`Missing ${file}`);
			process.exit(1);
		}
		links.push(
			`\t\t<link rel="apple-touch-startup-image" media="${media(s, orientation)}" href="/splash/${file}" />`
		);
	}
}

const html = readFileSync(HTML, 'utf8');
const a = html.indexOf(START),
	b = html.indexOf(END);
if (a < 0 || b < a) {
	console.error(`Markers ${START} … ${END} not found in ${HTML}`);
	process.exit(1);
}
writeFileSync(
	HTML,
	html.slice(0, a + START.length) + '\n' + links.join('\n') + '\n\t\t' + html.slice(b)
);
console.log(
	`Copied ${files.length} launch images to ${TO}; wrote ${links.length} link tags into ${HTML}.`
);
