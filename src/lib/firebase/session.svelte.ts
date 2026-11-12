/**
 * The signed-in session: who is here, and whether they're allowed in.
 *
 * A single instance (`session`) is shared by the whole app. Runes rather than
 * stores, per CLAUDE.md.
 *
 * Sign-in uses `signInWithRedirect`, never a popup: popups are unreliable in
 * an installed iOS web app (design.md §7.4). The redirect leaves the page
 * entirely and comes back, so `getRedirectResult()` has to run on every load
 * to finish the handshake and surface any error from it.
 */
import {
	GoogleAuthProvider,
	getRedirectResult,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signInWithRedirect,
	signOut,
	type User
} from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './client';

/** Key of the Paraglide message to show. Never a raw Firebase string. */
export type AuthErrorKey =
	| 'signin_error_invalid'
	| 'signin_error_too_many'
	| 'signin_error_network'
	| 'signin_error_unknown';

function toErrorKey(error: unknown): AuthErrorKey {
	const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
	switch (code) {
		case 'auth/invalid-credential':
		case 'auth/invalid-email':
		case 'auth/user-not-found':
		case 'auth/wrong-password':
			// Deliberately one message for all four: saying "no such user"
			// would let anyone test which addresses have accounts.
			return 'signin_error_invalid';
		case 'auth/too-many-requests':
			return 'signin_error_too_many';
		case 'auth/network-request-failed':
			return 'signin_error_network';
		default:
			return 'signin_error_unknown';
	}
}

class Session {
	/** The Firebase user, or null when signed out. */
	user = $state<User | null>(null);

	/**
	 * False until Firebase has restored any persisted session. Routing must
	 * wait for this, or a signed-in user is bounced to /signin on every cold
	 * start — which on an installed PWA is most launches.
	 */
	ready = $state(false);

	/** A sign-in attempt is in flight (or a redirect is being completed). */
	busy = $state(false);

	errorKey = $state<AuthErrorKey | null>(null);

	/**
	 * Whether this account is on the invite allowlist.
	 * `null` means not yet known — including when offline, where we must not
	 * lock out a legitimate user just because the probe couldn't run.
	 */
	invited = $state<boolean | null>(null);

	constructor() {
		// Completing the redirect must finish before `ready` flips, otherwise
		// the guard can redirect away mid-handshake.
		this.busy = true;
		getRedirectResult(auth)
			.catch((error: unknown) => {
				this.errorKey = toErrorKey(error);
			})
			.finally(() => {
				this.busy = false;
			});

		onAuthStateChanged(auth, (user) => {
			this.user = user;
			this.ready = true;
			this.invited = null;
			if (user) void this.verifyInvite();
		});
	}

	/**
	 * Invite-only is enforced in `firestore.rules`, so an uninvited account
	 * signs in fine and then sees permission errors on everything. Probing one
	 * document turns that into a clear message instead of a broken app.
	 *
	 * `getDocFromServer`, not `getDoc`: the persistent cache would answer from
	 * disk and tell us nothing about current access.
	 */
	async verifyInvite(): Promise<void> {
		const user = this.user;
		if (!user) return;
		try {
			await getDocFromServer(doc(db, 'users', user.uid));
			this.invited = true;
		} catch (error: unknown) {
			const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
			if (code === 'permission-denied') {
				this.invited = false;
			}
			// Anything else (typically 'unavailable' when offline) leaves it
			// unknown, and the app carries on with its cached data.
		}
	}

	async signInWithGoogle(): Promise<void> {
		this.busy = true;
		this.errorKey = null;
		try {
			// Navigates away; nothing after this runs on success.
			await signInWithRedirect(auth, new GoogleAuthProvider());
		} catch (error: unknown) {
			this.errorKey = toErrorKey(error);
			this.busy = false;
		}
	}

	async signInWithPassword(email: string, password: string): Promise<void> {
		this.busy = true;
		this.errorKey = null;
		try {
			await signInWithEmailAndPassword(auth, email.trim(), password);
		} catch (error: unknown) {
			this.errorKey = toErrorKey(error);
		} finally {
			this.busy = false;
		}
	}

	async signOut(): Promise<void> {
		this.errorKey = null;
		await signOut(auth);
		this.invited = null;
	}
}

export const session = new Session();
