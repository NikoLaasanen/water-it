/**
 * Firebase web app configuration for `water-it-95171`.
 *
 * These values are **not secrets** — they ship in every client bundle by
 * design, and the browser sends them with every request. What protects the
 * data is Firebase Auth plus `firestore.rules`, not the obscurity of the API
 * key. So they are committed rather than injected as `VITE_*` env vars: one
 * fewer thing to configure in CI, on a new laptop and in preview builds.
 *
 * Read from the CLI with:
 *   pnpm exec firebase apps:sdkconfig web --project water-it-95171
 *
 * `authDomain` is deliberately the default `*.firebaseapp.com` and not the
 * `*.web.app` twin. `signInWithRedirect` loads a cross-origin iframe on
 * `authDomain`, and Safari partitions third-party storage — so the app must be
 * served from the same origin as `authDomain` for redirect sign-in to work on
 * iOS. Serving from `water-it-95171.firebaseapp.com` makes that true for free.
 * If the app ever moves to a custom domain, `authDomain` has to move with it
 * (and the new `https://<domain>/__/auth/handler` must be added to the OAuth
 * client's authorized redirect URIs). See docs/open-decisions.md.
 */
export const firebaseConfig = {
	apiKey: 'AIzaSyBpXE7xOLO_gkgPY11GBxQrof46aOkk4c0',
	authDomain: 'water-it-95171.firebaseapp.com',
	projectId: 'water-it-95171',
	storageBucket: 'water-it-95171.firebasestorage.app',
	messagingSenderId: '90338748434',
	appId: '1:90338748434:web:1492c3d40f9aa58f7090cb'
} as const;

/** Emulator ports. Must stay in sync with `firebase.json`. */
export const emulatorPorts = {
	auth: 9099,
	firestore: 8080
} as const;

/**
 * The project the emulators run as — see the `emulators` script in
 * package.json and the seed scripts, which must all agree.
 *
 * In dev the client has to use this instead of `firebaseConfig.projectId`.
 * The Firestore emulator serves *any* project id, each as its own isolated
 * database, and ignores `singleProjectMode` (it logs "Ignoring unsupported
 * arg: single_project_mode_error"). So a client asking for `water-it-95171`
 * gets a second, empty database, with **no rules loaded and therefore open
 * access** — reads return nothing and writes are never checked, with no error
 * to notice. The `demo-` prefix is what keeps the emulators offline and
 * unauthenticated, so the client moves rather than the emulators.
 */
export const emulatorProjectId = 'demo-water-it';
