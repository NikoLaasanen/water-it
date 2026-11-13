/**
 * "Today", kept current.
 *
 * An installed iOS app can sit open in the background for days, and Today is
 * the screen it reopens on. A date taken once at mount would go on showing
 * Tuesday's checks on Thursday. This moves on at local midnight, and on
 * returning to the app (timers don't run while iOS has it suspended).
 *
 * Module-level on purpose: the date is the same for every user and every
 * screen, and nothing about it outlives a sign-out.
 */
import { isSameDay, startOfDay, addDays } from 'date-fns';

class Clock {
	/** Some moment of the current local day: when it was last refreshed. */
	today = $state(new Date());

	/** Local midnight that started `today`, for "logged today" queries. */
	get startOfToday(): Date {
		return startOfDay(this.today);
	}

	#timer: ReturnType<typeof setTimeout> | undefined;

	start() {
		this.#refresh();
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') this.#refresh();
		});
		window.addEventListener('focus', () => this.#refresh());
	}

	#refresh() {
		const now = new Date();
		if (!isSameDay(now, this.today)) this.today = now;
		clearTimeout(this.#timer);
		// A second past midnight, so the new day has certainly begun.
		const wait = addDays(startOfDay(now), 1).getTime() - now.getTime() + 1000;
		this.#timer = setTimeout(() => this.#refresh(), wait);
	}
}

export const clock = new Clock();
// The app is an SPA, but tests import this module outside a browser.
if (typeof window !== 'undefined') clock.start();
