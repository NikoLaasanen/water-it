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
const NIKO_EMAIL = 'niko@example.test';
const MUM = 'uid-mum';
const MUM_EMAIL = 'mum@example.test';
const STRANGER = 'uid-stranger';
const STRANGER_EMAIL = 'stranger@example.test';

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

/** Put an email on the invite allowlist, as the console would. */
async function invite(email: string) {
	await seed('allowlist/' + email.toLowerCase(), { invitedAt: 'fixture' });
}

/** Remove an invite, as revoking access in the console would. */
async function revoke(email: string) {
	await testEnv.withSecurityRulesDisabled(async (context) => {
		await deleteDoc(doc(context.firestore(), 'allowlist/' + email.toLowerCase()));
	});
}

/** A signed-in client carrying an email claim, as Google/password auth does. */
function as(uid: string, email: string): Firestore {
	return testEnv.authenticatedContext(uid, { email }).firestore();
}

describe('users/{uid}: an invited owner', () => {
	test('reads and writes their own settings document', async () => {
		await invite(NIKO_EMAIL);
		const db = as(NIKO, NIKO_EMAIL);
		await assertSucceeds(setDoc(doc(db, 'users/' + NIKO), { locale: 'fi' }));
		await assertSucceeds(getDoc(doc(db, 'users/' + NIKO)));
	});

	test('creates, reads and deletes their own plant', async () => {
		await invite(NIKO_EMAIL);
		const db = as(NIKO, NIKO_EMAIL);
		const plant = doc(db, 'users/' + NIKO + '/plants/pilea-1');
		await assertSucceeds(setDoc(plant, { name: 'Pilea', health: 'thriving' }));
		await assertSucceeds(getDoc(plant));
		await assertSucceeds(deleteDoc(plant));
	});

	test('lists their own plants and log', async () => {
		await invite(NIKO_EMAIL);
		const db = as(NIKO, NIKO_EMAIL);
		await assertSucceeds(getDocs(collection(db, 'users/' + NIKO + '/plants')));
		await assertSucceeds(getDocs(collection(db, 'users/' + NIKO + '/log')));
	});

	test('writes deeply nested documents under their own tree', async () => {
		await invite(NIKO_EMAIL);
		const db = as(NIKO, NIKO_EMAIL);
		await assertSucceeds(
			setDoc(doc(db, 'users/' + NIKO + '/plants/pilea-1/photos/p1'), { path: 'x.jpg' })
		);
	});

	test('is matched case-insensitively against the allowlist', async () => {
		// A provider can hand back a differently-cased address than the one
		// typed into the console, so the rules lower-case before the lookup.
		await invite('niko@example.test');
		const db = as(NIKO, 'Niko@Example.Test');
		await assertSucceeds(setDoc(doc(db, 'users/' + NIKO), { locale: 'en' }));
	});
});

describe('invite-only enforcement', () => {
	test('a signed-in but uninvited account cannot read its own tree', async () => {
		await seed('users/' + STRANGER, { locale: 'en' });
		await assertFails(getDoc(doc(as(STRANGER, STRANGER_EMAIL), 'users/' + STRANGER)));
	});

	test('a signed-in but uninvited account cannot write its own tree', async () => {
		await assertFails(
			setDoc(doc(as(STRANGER, STRANGER_EMAIL), 'users/' + STRANGER + '/plants/p1'), { name: 'X' })
		);
	});

	test('access is lost again if the invite is removed', async () => {
		await invite(STRANGER_EMAIL);
		await assertSucceeds(setDoc(doc(as(STRANGER, STRANGER_EMAIL), 'users/' + STRANGER), { a: 1 }));
		await revoke(STRANGER_EMAIL);
		await assertFails(setDoc(doc(as(STRANGER, STRANGER_EMAIL), 'users/' + STRANGER), { a: 2 }));
	});

	test('an account with no email claim is denied even if signed in', async () => {
		// This is the M4 plant-sitter case: anonymous auth carries no email, so
		// it can never reach anyone's `users/` tree.
		const db = testEnv.authenticatedContext('uid-anon').firestore();
		await assertFails(getDoc(doc(db, 'users/uid-anon')));
		await assertFails(setDoc(doc(db, 'users/uid-anon'), { a: 1 }));
	});

	test('nobody can read or enumerate the allowlist', async () => {
		await invite(NIKO_EMAIL);
		const db = as(NIKO, NIKO_EMAIL);
		await assertFails(getDoc(doc(db, 'allowlist/' + NIKO_EMAIL)));
		await assertFails(getDocs(collection(db, 'allowlist')));
	});

	test('an invited user cannot invite anyone else', async () => {
		await invite(NIKO_EMAIL);
		await assertFails(setDoc(doc(as(NIKO, NIKO_EMAIL), 'allowlist/friend@example.test'), {}));
	});
});

describe('users/{uid}: another invited user', () => {
	test('cannot read the owner settings document', async () => {
		await invite(NIKO_EMAIL);
		await invite(MUM_EMAIL);
		await seed('users/' + NIKO, { locale: 'fi' });
		await assertFails(getDoc(doc(as(MUM, MUM_EMAIL), 'users/' + NIKO)));
	});

	test('cannot read the owner plants', async () => {
		await invite(NIKO_EMAIL);
		await invite(MUM_EMAIL);
		await seed('users/' + NIKO + '/plants/pilea-1', { name: 'Pilea' });
		await assertFails(getDoc(doc(as(MUM, MUM_EMAIL), 'users/' + NIKO + '/plants/pilea-1')));
	});

	test('cannot list the owner plants', async () => {
		await invite(MUM_EMAIL);
		await seed('users/' + NIKO + '/plants/pilea-1', { name: 'Pilea' });
		await assertFails(getDocs(collection(as(MUM, MUM_EMAIL), 'users/' + NIKO + '/plants')));
	});

	test('cannot write into the owner tree', async () => {
		await invite(MUM_EMAIL);
		await assertFails(
			setDoc(doc(as(MUM, MUM_EMAIL), 'users/' + NIKO + '/plants/sneaky'), { name: 'Sneaky' })
		);
	});

	test('cannot delete the owner plant', async () => {
		await invite(MUM_EMAIL);
		await seed('users/' + NIKO + '/plants/pilea-1', { name: 'Pilea' });
		await assertFails(deleteDoc(doc(as(MUM, MUM_EMAIL), 'users/' + NIKO + '/plants/pilea-1')));
	});

	test('can still use their own tree', async () => {
		await invite(MUM_EMAIL);
		await assertSucceeds(
			setDoc(doc(as(MUM, MUM_EMAIL), 'users/' + MUM + '/plants/aloe-1'), { name: 'Aloe' })
		);
	});
});

describe('signed-out visitors', () => {
	test('cannot read a user document', async () => {
		await seed('users/' + NIKO, { locale: 'fi' });
		const db = testEnv.unauthenticatedContext().firestore();
		await assertFails(getDoc(doc(db, 'users/' + NIKO)));
	});

	test('cannot write a plant', async () => {
		const db = testEnv.unauthenticatedContext().firestore();
		await assertFails(setDoc(doc(db, 'users/' + NIKO + '/plants/pilea-1'), { name: 'Pilea' }));
	});
});

describe('collections with no rule yet', () => {
	// `shares/{token}` is designed in design.md §6 but deliberately not in
	// firestore.rules until M4, so it must be denied for everyone today.
	test('shares are denied even for an invited user', async () => {
		await invite(NIKO_EMAIL);
		await seed('shares/token-1', { ownerId: NIKO });
		await assertFails(getDoc(doc(as(NIKO, NIKO_EMAIL), 'shares/token-1')));
		await assertFails(setDoc(doc(as(NIKO, NIKO_EMAIL), 'shares/token-2'), { ownerId: NIKO }));
	});

	test('a top-level collection is denied', async () => {
		await invite(NIKO_EMAIL);
		await assertFails(getDocs(collection(as(NIKO, NIKO_EMAIL), 'plants')));
	});
});
