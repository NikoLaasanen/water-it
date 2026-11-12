/**
 * The app's single Firebase instance: app, Auth and Firestore.
 *
 * Browser-only. Every route sets `ssr = false` (see `src/routes/+layout.ts`),
 * so there is no server rendering pass that could touch these, and the
 * persistent Firestore cache needs IndexedDB in any case.
 *
 * In dev this always talks to the **emulators** (open-decisions.md §"Local dev
 * with emulators"). Start them with `pnpm emulators`. Pointing dev at the real
 * project needs an explicit, deliberate change here — not a stray env var.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import {
	connectFirestoreEmulator,
	initializeFirestore,
	persistentLocalCache,
	persistentMultipleTabManager,
	type Firestore
} from 'firebase/firestore';
import { emulatorPorts, emulatorProjectId, firebaseConfig } from './config';

const EMULATOR_HOST = '127.0.0.1';

/**
 * In dev, the project id has to be the emulators' own, or the client talks to
 * a different (empty, rule-less) database inside the same emulator — see
 * `emulatorProjectId`. Everything else is unchanged: the emulator ignores the
 * API key, and `authDomain` is unused because redirect sign-in goes to the
 * emulator's handler.
 */
const config = import.meta.env.DEV
	? { ...firebaseConfig, projectId: emulatorProjectId }
	: firebaseConfig;

/** `getApps()` guard so HMR in dev doesn't try to initialize twice. */
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);

export const auth: Auth = getAuth(app);

/**
 * `initializeFirestore` rather than `getFirestore`, because the cache can only
 * be configured at creation. Multi-tab persistence: the PWA and a Safari tab
 * can be open at once, and single-tab would leave the second one without a
 * cache (design.md §7.1).
 */
export const db: Firestore = initializeFirestore(app, {
	localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

if (import.meta.env.DEV) {
	// Both must be connected before any request is issued; this module is the
	// only place that creates these objects, so importing it is enough.
	connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${emulatorPorts.auth}`);
	connectFirestoreEmulator(db, EMULATOR_HOST, emulatorPorts.firestore);
}
