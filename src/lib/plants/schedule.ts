/**
 * Scheduling: which watering interval applies today, and when a check falls.
 *
 * Plain TS with no locale or Firestore, so it is tested on its own (CLAUDE.md).
 * Due dates are local calendar dates, `YYYY-MM-DD`, never timestamps.
 *
 * The rule that runs through all of it: **the next check is counted from the
 * day something was logged** — for a new plant, the day it was added — never
 * from an old due date.
 */
import { addDays } from 'date-fns';
import type { CareProfile, Plant } from '#lib/types/plant.js';

/** design.md "Seasons": April–September unless Settings says otherwise. */
export const DEFAULT_GROWING_MONTHS: readonly number[] = [4, 5, 6, 7, 8, 9];

/** Whether `date` falls in the growing season. Months are 1–12. */
export function isGrowingSeason(
	date: Date,
	growingMonths: readonly number[] = DEFAULT_GROWING_MONTHS
): boolean {
	return growingMonths.includes(date.getMonth() + 1);
}

export type Season = 'growing' | 'resting';

/**
 * Which interval a plant is on today.
 *
 * - **Dormant** wins over everything: the owner has said it is resting.
 * - **Under a grow light** stays on the growing interval all year.
 * - Otherwise the calendar decides.
 */
export function currentSeason(
	plant: Pick<Plant, 'dormant' | 'underGrowLight'>,
	date: Date,
	growingMonths: readonly number[] = DEFAULT_GROWING_MONTHS
): Season {
	if (plant.dormant) return 'resting';
	if (plant.underGrowLight) return 'growing';
	return isGrowingSeason(date, growingMonths) ? 'growing' : 'resting';
}

export function currentIntervalDays(
	care: Pick<CareProfile, 'checkIntervalDays'>,
	plant: Pick<Plant, 'dormant' | 'underGrowLight'>,
	date: Date,
	growingMonths: readonly number[] = DEFAULT_GROWING_MONTHS
): number {
	return care.checkIntervalDays[currentSeason(plant, date, growingMonths)];
}

/**
 * A local date as `YYYY-MM-DD`, from its local parts. Not `toISOString()`,
 * which converts to UTC and lands on the previous day east of Greenwich —
 * Helsinki included — for anything logged before 02:00 or 03:00.
 */
export function toLocalDateString(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

/** The day of the next check: `days` after `from`, as a local calendar date. */
export function checkDateAfter(from: Date, days: number): string {
	return toLocalDateString(addDays(from, days));
}

/**
 * The next check after the plant's interval was edited.
 *
 * A stored due date is "last check + old interval", so moving it by the
 * difference gives "last check + new interval" — still counted from the last
 * action, as the scheduling rule says, without needing the log. It may land
 * in the past: shortening a long interval can make a plant overdue, which is
 * then simply true. Returns the date unchanged when the interval didn't change
 * or the stored date can't be read.
 */
export function rescheduleForNewInterval(
	nextDue: string,
	oldIntervalDays: number,
	newIntervalDays: number
): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nextDue);
	if (!match || oldIntervalDays === newIntervalDays) return nextDue;
	const [, y, m, d] = match.map(Number);
	return checkDateAfter(new Date(y, m - 1, d), newIntervalDays - oldIntervalDays);
}
