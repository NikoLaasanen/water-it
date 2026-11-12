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

const PLANTS = [
	{
		id: 'pilea',
		name: 'Pilea',
		health: 'thriving',
		location: 'Living room shelf',
		speciesId: 'pilea-peperomioides',
		light: 'Bright indirect light; avoid hot direct sun',
		lightLevel: 'bright',
		wateringStyle: 'soak-and-dry',
		growing: 7,
		resting: 14,
		dueIn: -2 // overdue
	},
	{
		id: 'dracaena',
		name: 'Dracaena',
		health: 'recovering',
		location: 'Bedroom corner',
		speciesId: 'dracaena-marginata',
		light: 'Medium to bright indirect; tolerates less',
		lightLevel: 'medium',
		wateringStyle: 'soak-and-dry',
		growing: 10,
		resting: 21,
		dueIn: 0 // today
	},
	{
		id: 'tree-aloe',
		name: 'Tree aloe',
		health: 'thriving',
		location: 'South window',
		speciesId: 'tree-aloe',
		light: 'As much direct sun as it can get',
		lightLevel: 'bright',
		wateringStyle: 'sparse',
		growing: 14,
		resting: 28,
		dueIn: 9 // "In 9 days"
	},
	{
		id: 'crassula',
		name: 'Crassula',
		health: 'okay',
		location: 'Kitchen window',
		speciesId: 'crassula',
		light: 'Bright, some direct sun',
		lightLevel: 'bright',
		wateringStyle: 'sparse',
		growing: 14,
		resting: 30,
		dueIn: 4 // a weekday name
	},
	{
		id: 'yucca',
		name: 'Yucca',
		health: 'struggling',
		location: 'Hallway',
		speciesId: 'yucca-spineless',
		light: 'Bright; direct sun is fine',
		lightLevel: 'bright',
		wateringStyle: 'sparse',
		growing: 14,
		resting: 30,
		dueIn: 0 // today
	}
];

/** Firestore REST wants every value tagged with its type. */
const str = (value) => ({ stringValue: value });
const num = (value) => ({ integerValue: String(value) });

function plantFields(plant) {
	return {
		name: str(plant.name),
		health: str(plant.health),
		location: str(plant.location),
		speciesId: str(plant.speciesId),
		createdAt: { timestampValue: new Date().toISOString() },
		careProfile: {
			mapValue: {
				fields: {
					light: str(plant.light),
					lightLevel: str(plant.lightLevel),
					wateringStyle: str(plant.wateringStyle),
					checkIntervalDays: {
						mapValue: {
							fields: { growing: num(plant.growing), resting: num(plant.resting) }
						}
					}
				}
			}
		}
	};
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
	console.error('Sign in once at http://localhost:5173 first, then run this again.');
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

for (const plant of PLANTS) {
	await put(`users/${user.localId}/plants/${plant.id}`, plantFields(plant));
	await put(`users/${user.localId}/tasks/check-${plant.id}`, {
		plantId: str(plant.id),
		kind: str('check-water'),
		nextDue: str(dayOffset(plant.dueIn)),
		intervalDays: num(plant.growing)
	});
}

console.log(`Seeded ${PLANTS.length} plants for ${user.email ?? user.localId}.`);
console.log('Open /plants to see them.');
