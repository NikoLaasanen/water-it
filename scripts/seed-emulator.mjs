/**
 * Puts an email on the invite allowlist in the **Firestore emulator**.
 *
 * Invite-only is enforced in `firestore.rules` against `allowlist/{email}`
 * documents, and the emulator starts empty — so without this, signing in
 * locally lands on the "no invite" screen every time.
 *
 * Usage, with `pnpm emulators` already running in another terminal:
 *
 *   pnpm seed:dev                  # seeds dev@example.test
 *   pnpm seed:dev you@example.com  # seeds a specific address
 *
 * No real address is hard-coded here: production invites are created in the
 * Firebase console, and this file is committed.
 *
 * Writes go in as the emulator's `owner` principal, which bypasses rules —
 * the same thing the console does against production.
 */

const PROJECT = 'demo-water-it';
const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const email = (process.argv[2] ?? 'dev@example.test').trim().toLowerCase();

const url =
	`http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents/allowlist/` +
	encodeURIComponent(email);

const response = await fetch(url, {
	method: 'PATCH',
	headers: {
		'Content-Type': 'application/json',
		// The emulator accepts this fixed bearer token as full admin.
		Authorization: 'Bearer owner'
	},
	body: JSON.stringify({
		fields: {
			invitedAt: { timestampValue: new Date().toISOString() },
			note: { stringValue: 'seeded by scripts/seed-emulator.mjs' }
		}
	})
}).catch((error) => {
	console.error(`Could not reach the Firestore emulator at ${HOST}.`);
	console.error('Start it with `pnpm emulators` first.');
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});

if (!response.ok) {
	console.error(`Emulator returned ${response.status}: ${await response.text()}`);
	process.exit(1);
}

console.log(`Invited ${email} in the Firestore emulator.`);
console.log('Sign in with that address and the app will let you through.');
