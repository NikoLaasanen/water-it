import { readFileSync } from 'node:fs';
import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
	type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import {
	collection,
	doc,
	getDoc,
	getDocs,
	setDoc,
	deleteDoc,
	type Firestore
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, test } from 'vitest';

// These tests need the Firestore emulator. Run them through
// `pnpm test:rules`, which wraps vitest in `firebase emulators:exec` and
// exports the host/port this file discovers automatically.

let testEnv: RulesTestEnvironment;

const NIKO = 'uid-niko';
const MUM = 'uid-mum';

beforeAll(async () => {
	testEnv = await initializeTestEnvironment({
		projectId: 'demo-water-it',
		firestore: { rules: readFileSync('firestore.rules', 'utf8') }
	});
});

afterAll(async () => {
	await testEnv?.cleanup();
});

afterEach(async () => {
	await testEnv.clearFirestore();
});

/** Write a document bypassing the rules, to set up a fixture. */
async function seed(path: string, data: Record<string, unknown>) {
	await testEnv.withSecurityRulesDisabled(async (context) => {
		await setDoc(doc(context.firestore(), path), data);
	});
}

function as(uid: string): Firestore {
	return testEnv.authenticatedContext(uid).firestore();
}

describe('users/{uid}: the owner', () => {
	test('reads and writes their own settings document', async () => {
		const db = as(NIKO);
		await assertSucceeds(setDoc(doc(db, `users/${NIKO}`), { locale: 'fi' }));
		await assertSucceeds(getDoc(doc(db, `users/${NIKO}`)));
	});

	test('creates, reads and deletes their own plant', async () => {
		const db = as(NIKO);
		const plant = doc(db, `users/${NIKO}/plants/pilea-1`);
		await assertSucceeds(setDoc(plant, { name: 'Pilea', health: 'thriving' }));
		await assertSucceeds(getDoc(plant));
		await assertSucceeds(deleteDoc(plant));
	});

	test('lists their own plants and log', async () => {
		const db = as(NIKO);
		await assertSucceeds(getDocs(collection(db, `users/${NIKO}/plants`)));
		await assertSucceeds(getDocs(collection(db, `users/${NIKO}/log`)));
	});

	test('writes deeply nested documents under their own tree', async () => {
		const db = as(NIKO);
		await assertSucceeds(
			setDoc(doc(db, `users/${NIKO}/plants/pilea-1/photos/p1`), { path: 'x.jpg' })
		);
	});
});

describe('users/{uid}: another signed-in user', () => {
	test('cannot read the owner settings document', async () => {
		await seed(`users/${NIKO}`, { locale: 'fi' });
		await assertFails(getDoc(doc(as(MUM), `users/${NIKO}`)));
	});

	test('cannot read the owner plants', async () => {
		await seed(`users/${NIKO}/plants/pilea-1`, { name: 'Pilea' });
		await assertFails(getDoc(doc(as(MUM), `users/${NIKO}/plants/pilea-1`)));
	});

	test('cannot list the owner plants', async () => {
		await seed(`users/${NIKO}/plants/pilea-1`, { name: 'Pilea' });
		await assertFails(getDocs(collection(as(MUM), `users/${NIKO}/plants`)));
	});

	test('cannot write into the owner tree', async () => {
		await assertFails(setDoc(doc(as(MUM), `users/${NIKO}/plants/sneaky`), { name: 'Sneaky' }));
	});

	test('cannot delete the owner plant', async () => {
		await seed(`users/${NIKO}/plants/pilea-1`, { name: 'Pilea' });
		await assertFails(deleteDoc(doc(as(MUM), `users/${NIKO}/plants/pilea-1`)));
	});

	test('can still use their own tree', async () => {
		await assertSucceeds(setDoc(doc(as(MUM), `users/${MUM}/plants/aloe-1`), { name: 'Aloe' }));
	});
});

describe('signed-out visitors', () => {
	test('cannot read a user document', async () => {
		await seed(`users/${NIKO}`, { locale: 'fi' });
		const db = testEnv.unauthenticatedContext().firestore();
		await assertFails(getDoc(doc(db, `users/${NIKO}`)));
	});

	test('cannot write a plant', async () => {
		const db = testEnv.unauthenticatedContext().firestore();
		await assertFails(setDoc(doc(db, `users/${NIKO}/plants/pilea-1`), { name: 'Pilea' }));
	});
});

describe('collections with no rule yet', () => {
	// `shares/{token}` is designed in design.md §6 but deliberately not in
	// firestore.rules until M4, so it must be denied for everyone today.
	test('shares are denied even for a signed-in user', async () => {
		await seed('shares/token-1', { ownerId: NIKO });
		await assertFails(getDoc(doc(as(NIKO), 'shares/token-1')));
		await assertFails(setDoc(doc(as(NIKO), 'shares/token-2'), { ownerId: NIKO }));
	});

	test('a top-level collection is denied', async () => {
		await assertFails(getDocs(collection(as(NIKO), 'plants')));
	});
});
