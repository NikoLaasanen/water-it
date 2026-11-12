/**
 * Fails the build if the generated service worker would swallow Firebase's
 * redirect sign-in handler.
 *
 * `spa: true` makes the PWA plugin register a `NavigationRoute` that answers
 * every navigation from the precached shell. Redirect sign-in navigates to
 * `/__/auth/handler` on our own origin, so without a denylist the worker
 * intercepts it: the app boots in the handler's place, `getRedirectResult()`
 * finds no pending credential, and the route guard returns to /signin. Tapping
 * "Sign in with Google" then appears to do nothing at all — no error in the
 * console, nothing in the network tab that looks wrong.
 *
 * No unit test can catch it and `vite dev` can't either (no worker there), so
 * it only bites in an installed app. Hence this check, on the build that
 * Firebase's predeploy hook runs, where a broken worker can't reach a device.
 *
 * See docs/design.md §7.4.
 */
import { readFile } from 'node:fs/promises';

const SW = 'build/sw.js';

// How the denylist regex is serialised into the (minified) worker. A plain
// substring, deliberately: a matcher with its own escaping could fail for
// reasons that have nothing to do with the worker.
const DENYLIST = 'denylist:[/^\\/__\\//]';

let source;
try {
	source = await readFile(SW, 'utf8');
} catch {
	console.error(`${SW} was not generated — did the PWA plugin run?`);
	process.exit(1);
}

if (!source.includes(DENYLIST)) {
	console.error(`${SW} does not let /__/* through to the network.`);
	console.error('Redirect sign-in would silently break in the installed app.');
	console.error('Expected to find this in the worker:');
	console.error(`  ${DENYLIST}`);
	console.error('Restore `navigateFallbackDenylist` in the generateSW options of');
	console.error('vite.config.ts. See docs/design.md §7.4.');
	process.exit(1);
}

console.log('Service worker lets /__/* through to the network.');
