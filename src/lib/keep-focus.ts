/**
 * Keeps keyboard and VoiceOver focus in place when the buttons under the
 * finger swap out: tapping Watered replaces the button with the status badge
 * and Undo, and tapping Undo brings Watered back. Without this, the focused
 * button vanishes, focus falls back to the top of the page, and a VoiceOver
 * user loses their place in the list.
 *
 * Attach to the element that outlives the swap: the card list on Today, the
 * card itself on plant detail. On Today the card can even disappear for a
 * moment and come back as a new element (the schedule update and the log
 * entry arrive as two separate snapshots), so each card carries a
 * `data-focus-key` and focus returns to the card with the same key.
 *
 * Once the focused element is removed and nothing else took focus, focus
 * moves to the first visible `[data-refocus]` in that card (Undo once
 * answered, Watered / Done when open), else its first button or link, else
 * the card itself. It waits a few frames for the card to settle first.
 *
 * Use as `{@attach keepFocus}`.
 */
import type { Attachment } from 'svelte/attachments';

/** About a third of a second at 60 Hz. */
const MAX_FRAMES = 20;

function visible(el: Element): el is HTMLElement {
	return el instanceof HTMLElement && el.getClientRects().length > 0;
}

export const keepFocus: Attachment<HTMLElement> = (node) => {
	let last: Element | null = null;
	let key: string | undefined;

	const onFocusIn = (event: FocusEvent) => {
		last = event.target instanceof Element ? event.target : null;
		key = last?.closest<HTMLElement>('[data-focus-key]')?.dataset.focusKey;
	};

	const observer = new MutationObserver(() => {
		if (!last || last.isConnected) return;
		last = null;
		const wanted = key;
		requestAnimationFrame(() => refocus(wanted, 0));
	});

	function lost(): boolean {
		const active = document.activeElement;
		return node.isConnected && (!active || active === document.body);
	}

	function refocus(wanted: string | undefined, frame: number) {
		if (!lost()) return;
		const scope = wanted
			? [...node.querySelectorAll<HTMLElement>('[data-focus-key]')].find(
					(el) => el.dataset.focusKey === wanted
				)
			: node;
		const preferred = scope && [...scope.querySelectorAll('[data-refocus]')].find(visible);
		if (!preferred && frame < MAX_FRAMES) {
			requestAnimationFrame(() => refocus(wanted, frame + 1));
			return;
		}
		const target =
			preferred ??
			(scope && [...scope.querySelectorAll('button:not([disabled]), a[href]')].find(visible));
		if (target) {
			target.focus();
		} else {
			const fallback = scope ?? node;
			fallback.tabIndex = -1;
			fallback.focus();
		}
	}

	node.addEventListener('focusin', onFocusIn);
	observer.observe(node, { childList: true, subtree: true });
	return () => {
		node.removeEventListener('focusin', onFocusIn);
		observer.disconnect();
	};
};
