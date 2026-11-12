/**
 * Pure care logic for the Plants list.
 *
 * Everything here returns a *descriptor* rather than a finished string: the
 * caller turns it into text through Paraglide, so this module needs no locale
 * and can be tested on its own (CLAUDE.md keeps scheduling logic in plain TS
 * modules with Vitest tests).
 */
import { differenceInCalendarDays } from 'date-fns';
import type { Task, WateringStyle, WaterLevel } from '#lib/types/plant.js';

/**
 * How thirsty a plant looks on the Plants list.
 *
 * Derived rather than stored: the watering style already says this, and a
 * second stored field would be one more thing to keep in step with it.
 */
export function waterLevel(style: WateringStyle): WaterLevel {
	switch (style) {
		case 'sparse':
			return 'little';
		case 'soak-and-dry':
			return 'moderate';
		case 'keep-moist':
			return 'lots';
	}
}

/**
 * Reads a `YYYY-MM-DD` local calendar date (CLAUDE.md: due dates are never
 * timestamps) as local midnight.
 *
 * Built from the parts instead of `new Date(string)`, which reads a date-only
 * string as UTC midnight — that lands on the previous day for anyone east of
 * Greenwich, Helsinki included, and would show tomorrow's check as due today.
 */
export function parseLocalDate(date: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
	if (!match) return null;
	const [, y, m, d] = match.map(Number);
	const parsed = new Date(y, m - 1, d);
	// Rejects the likes of 2026-02-31, which would silently roll over to March.
	if (parsed.getMonth() !== m - 1 || parsed.getDate() !== d) return null;
	return parsed;
}

/** When a task is actually due, taking any snooze into account. */
export function effectiveDueDate(task: Pick<Task, 'nextDue' | 'snoozedUntil'>): Date | null {
	const due = parseLocalDate(task.nextDue);
	if (!due) return null;
	const snoozed = task.snoozedUntil ? parseLocalDate(task.snoozedUntil) : null;
	// A snooze only ever pushes a check later, never pulls it earlier.
	return snoozed && snoozed > due ? snoozed : due;
}

/**
 * What the row says after "Check:". The spec shows four forms — "Overdue",
 * "Today", a weekday for the days just ahead, and "In N days" beyond that.
 */
export type NextCheck =
	| { kind: 'overdue'; days: number }
	| { kind: 'today' }
	| { kind: 'weekday'; date: Date }
	| { kind: 'in-days'; days: number }
	| { kind: 'unscheduled' };

/**
 * A weekday name is only a useful shorthand while "Sat" can mean just one
 * Saturday. From a week out it is ambiguous, so the count of days takes over.
 */
const WEEKDAY_HORIZON_DAYS = 7;

export function nextCheck(
	task: Pick<Task, 'nextDue' | 'snoozedUntil'> | undefined,
	today: Date
): NextCheck {
	const due = task ? effectiveDueDate(task) : null;
	if (!due) return { kind: 'unscheduled' };

	const days = differenceInCalendarDays(due, today);
	if (days < 0) return { kind: 'overdue', days: -days };
	if (days === 0) return { kind: 'today' };
	if (days < WEEKDAY_HORIZON_DAYS) return { kind: 'weekday', date: due };
	return { kind: 'in-days', days };
}

/** Overdue is the one state the list calls out in colour as well as words. */
export function isOverdue(next: NextCheck): boolean {
	return next.kind === 'overdue';
}
