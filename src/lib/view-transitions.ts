/**
 * Page transitions (screens.md "Page transitions"), with the View Transitions
 * API (Safari 18+; elsewhere navigation is simply instant).
 *
 * - Between the tab destinations (Today, Plants, Settings): a quick crossfade.
 * - Going deeper (Plants → a plant → Edit / Add to log): the page slides in
 *   a little from the right; coming back, the reverse.
 * - Only the page content moves (`view-transition-name: page`). The tab bar
 *   or rail and the hills have names of their own, so they stay put.
 * - iPad landscape (`lg`) keeps the plant list beside plant detail, so the
 *   list and a plant crossfade there instead of sliding the list away.
 * - Nothing when only the query changes (plant detail's Care / Log tabs), and
 *   nothing under Reduce Motion.
 *
 * The direction is read off the paths, not the history, so a Cancel that goes
 * up a level slides back even when it navigates forward in history.
 */
import { onNavigate } from '$app/navigation';

export type TransitionKind = 'forward' | 'back' | 'fade';

/** The bottom-tab / rail destinations: moving between them is sideways. */
const TOP = new Set(['/', '/plants', '/settings', '/photos']);

function depth(path: string): number {
	return path.split('/').filter(Boolean).length;
}

function clean(path: string): string {
	return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/** Plant detail, not the Add flow. */
const DETAIL = /^\/plants\/(?!new$)[^/]+$/;

export function transitionKind(from: string, to: string, wide = false): TransitionKind | null {
	const a = clean(from);
	const b = clean(to);
	if (a === b) return null;
	if (TOP.has(a) && TOP.has(b)) return 'fade';
	if (wide && ((a === '/plants' && DETAIL.test(b)) || (b === '/plants' && DETAIL.test(a))))
		return 'fade';
	if (b.startsWith(a === '/' ? '/' : a + '/')) return 'forward';
	if (a.startsWith(b === '/' ? '/' : b + '/')) return 'back';
	const diff = depth(b) - depth(a);
	return diff > 0 ? 'forward' : diff < 0 ? 'back' : 'fade';
}

/** Call once, from the root layout's script. */
export function setupPageTransitions(): void {
	onNavigate((navigation) => {
		if (!document.startViewTransition || !navigation.from || !navigation.to) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const kind = transitionKind(
			navigation.from.url.pathname,
			navigation.to.url.pathname,
			matchMedia('(min-width: 1024px)').matches
		);
		if (!kind) return;

		const root = document.documentElement;
		root.dataset.transition = kind;
		return new Promise<void>((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
			void transition.finished.finally(() => {
				if (root.dataset.transition === kind) delete root.dataset.transition;
			});
		});
	});
}
