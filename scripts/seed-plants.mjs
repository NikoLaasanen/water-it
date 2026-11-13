/**
 * Seeds example plants into the **Firestore emulator**, for one signed-in
 * emulator user.
 *
 * The Plants list has nothing to show until plants exist, and the Add plant
 * screen is not built yet, so this stands in for it during development.
 *
 * Usage, with `pnpm emulators` running and after signing in once locally so
 * the account exists:
 *
 *   pnpm seed:plants                  # the only emulator user, or dev@example.test
 *   pnpm seed:plants you@example.com  # a specific one
 *
 * The plants are the five from docs/mockups/plants.dc.html, with the same
 * health and care values, so the built screen can be compared against the
 * mockup directly. Check dates are relative to today, which is what makes
 * "Overdue", "Today", a weekday and "In N days" all appear at once.
 *
 * Writes go in as the emulator's `owner` principal, which bypasses rules.
 */

import presets from '../src/lib/presets/presets.json' with { type: 'json' };

const PROJECT = 'demo-water-it';
const FIRESTORE = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
const OWNER = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

/** Local calendar date `YYYY-MM-DD`, N days from today (CLAUDE.md). */
function dayOffset(days) {
	const date = new Date();
	date.setDate(date.getDate() + days);
	// Built from local parts, not toISOString(), which would convert to UTC and
	// shift the date by one for anyone east of Greenwich.
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The five mockup plants. Care comes from each one's preset
 * (src/lib/presets/presets.json); a plant stores only `speciesId` and the
 * fields it changes (design.md §6, "Care overrides"). The Pilea overrides its
 * check test, which is what the mockup's "edited by you: check test" shows.
 */
const PLANTS = [
	{
		id: 'pilea',
		name: 'Pilea',
		health: 'thriving',
		location: 'Living room window',
		speciesId: 'pilea-peperomioides',
		pot: { material: 'terracotta', topLayer: 'pebbles', sizeCm: 14 },
		careOverrides: { dryDownTest: 'Skewer under the clay pebbles: dry 2–3 cm down' },
		sitterNote:
			'Left end of the living room window. Water slowly onto the pebbles until it drips into the saucer, then pour the saucer out.',
		dueIn: -2 // overdue
	},
	{
		id: 'dracaena',
		name: 'Dracaena',
		health: 'recovering',
		location: 'Bookshelf by the desk lamp',
		speciesId: 'dracaena-marginata',
		pot: { material: 'plastic', topLayer: 'soil', sizeCm: 19 },
		careOverrides: {},
		sitterNote: 'Only if the soil is dry a finger deep. It would rather be too dry than too wet.',
		dueIn: 0 // today
	},
	{
		id: 'tree-aloe',
		name: 'Tree aloe',
		health: 'thriving',
		location: 'Bedroom window',
		speciesId: 'aloidendron-barberae',
		pot: { material: 'terracotta', topLayer: 'gravel', sizeCm: 24 },
		careOverrides: {},
		sitterNote: 'Skip it. Two weeks without water is nothing to this one.',
		dueIn: 9 // "In 9 days"
	},
	{
		id: 'crassula',
		name: 'Crassula',
		health: 'okay',
		location: 'Bedroom window',
		speciesId: 'crassula-ovata',
		pot: { material: 'terracotta', topLayer: 'gravel', sizeCm: 12 },
		careOverrides: {},
		sitterNote: 'Needs nothing for two weeks. Water only if the leaves look wrinkled.',
		dueIn: 4 // a weekday name
	},
	{
		id: 'yucca',
		name: 'Yucca',
		health: 'struggling',
		location: 'TV stand',
		speciesId: 'yucca-gigantea',
		pot: { material: 'plastic', topLayer: 'soil', sizeCm: 22 },
		// Recovering from overwatering, so checked less often than the preset says.
		careOverrides: { checkIntervalDays: { growing: 21, resting: 35 } },
		sitterNote:
			'Recovering from being too wet, so leave it alone unless the soil is dry 5 cm down.',
		dueIn: 0 // today
	}
];

/**
 * Firestore REST tags every value with its type, including inside maps and
 * arrays — so encode generically rather than per field. Writing the plant as
 * a plain object below then keeps the data readable.
 */
function toValue(value) {
	if (value === null || value === undefined) return { nullValue: null };
	if (typeof value === 'string') return { stringValue: value };
	if (typeof value === 'boolean') return { booleanValue: value };
	if (typeof value === 'number') {
		// Integers must not go in as doubles: `checkIntervalDays.growing` is read
		// back with `typeof === 'number'` either way, but a 7 that comes back as
		// 7.0 reads as "every 7 days" only by luck of formatting.
		return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
	}
	if (value instanceof Date) return { timestampValue: value.toISOString() };
	if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
	return { mapValue: { fields: toFields(value) } };
}

function toFields(object) {
	return Object.fromEntries(
		Object.entries(object)
			// Skip absent values rather than storing nulls: the app treats a
			// missing care field as "nothing to say" and hides that row.
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => [key, toValue(value)])
	);
}

function plantFields(plant) {
	return toFields({
		name: plant.name,
		health: plant.health,
		location: plant.location,
		speciesId: plant.speciesId,
		createdAt: new Date(),
		pot: plant.pot,
		sitterNote: plant.sitterNote,
		careOverrides: plant.careOverrides
	});
}

async function emulatorUsers() {
	// `accounts:query`, not the `/emulator/v1/.../accounts` path: that one only
	// answers DELETE, for wiping every account, and returns 405 to a GET.
	const url = `http://${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:query`;

	let response;
	try {
		response = await fetch(url, { method: 'POST', headers: OWNER, body: '{}' });
	} catch (error) {
		console.error(`Could not reach the Auth emulator at ${AUTH}.`);
		console.error('Start it with `pnpm emulators` first.');
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}

	// Kept apart from the connection failure above: a reachable emulator
	// answering oddly is a different problem, and reporting both as "could not
	// reach" sends you looking in the wrong place.
	if (!response.ok) {
		console.error(`The Auth emulator answered ${response.status} for ${url}`);
		console.error(await response.text());
		process.exit(1);
	}

	const { userInfo = [] } = await response.json();
	return userInfo;
}

async function put(path, fields) {
	const url = `http://${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
	const response = await fetch(url, {
		method: 'PATCH',
		headers: OWNER,
		body: JSON.stringify({ fields })
	});
	if (!response.ok) {
		console.error(`Writing ${path} failed with ${response.status}: ${await response.text()}`);
		process.exit(1);
	}
}

const wanted = process.argv[2]?.trim().toLowerCase();
const users = await emulatorUsers();

if (users.length === 0) {
	console.error('No users in the Auth emulator yet.');
	console.error('Sign in once at http://127.0.0.1:5173 first, then run this again.');
	process.exit(1);
}

const user = wanted
	? users.find((candidate) => candidate.email?.toLowerCase() === wanted)
	: (users.find((candidate) => candidate.email?.toLowerCase() === 'dev@example.test') ??
		(users.length === 1 ? users[0] : undefined));

if (!user) {
	console.error(
		wanted
			? `No emulator user with the email ${wanted}.`
			: 'Several emulator users exist — name the one to seed.'
	);
	console.error(
		`Known: ${users.map((candidate) => candidate.email ?? candidate.localId).join(', ')}`
	);
	process.exit(1);
}

/** Deletes a document if it exists; a missing one is fine. */
async function remove(path) {
	const url = `http://${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
	const response = await fetch(url, { method: 'DELETE', headers: OWNER });
	if (!response.ok && response.status !== 404) {
		console.error(`Deleting ${path} failed with ${response.status}: ${await response.text()}`);
		process.exit(1);
	}
}

// Start the log over too: answers logged while testing Today would otherwise
// survive the reset checks and show those plants as already answered.
const logUrl = `http://${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/users/${user.localId}/log?pageSize=300`;
const logList = await (await fetch(logUrl, { headers: OWNER })).json();
for (const entry of logList.documents ?? []) {
	await remove(entry.name.split('/documents/')[1]);
}

for (const plant of PLANTS) {
	await put(`users/${user.localId}/plants/${plant.id}`, plantFields(plant));
	// Earlier seeds named the task `check-<plant>`; the app now uses
	// `check-water-<plant>` (checkTaskId in plant-writes.ts). Drop the old one so
	// a plant doesn't end up with two checks.
	await remove(`users/${user.localId}/tasks/check-${plant.id}`);
	await put(
		`users/${user.localId}/tasks/check-water-${plant.id}`,
		toFields({
			plantId: plant.id,
			kind: 'check-water',
			nextDue: dayOffset(plant.dueIn),
			// The plant's own interval if it overrides one, else its preset's.
			intervalDays: (
				plant.careOverrides.checkIntervalDays ??
				presets.find((preset) => preset.id === plant.speciesId).care.checkIntervalDays
			).growing
		})
	);
}

console.log(`Seeded ${PLANTS.length} plants for ${user.email ?? user.localId}.`);
console.log('Open / for Today, or /plants for the list. The care log was cleared.');
