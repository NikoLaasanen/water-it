/**
 * Fertilise and repot reminders (screens.md "Fertilise and repot reminders").
 *
 * The next date is worked out, not stored: from the plant's care profile and
 * the last time it was done (`lastDone` on a small task document, written
 * when Fertilised or Repotted is logged). Never done? Then it counts from the
 * day the plant was added. Editing the care profile, a season change or
 * dormancy therefore take effect at once, with nothing to migrate or keep in
 * sync.
 *
 * - **Fertilise:** last time + the profile's interval. "Growing season only"
 *   moves a date that lands outside the growing months to the first day of
 *   the next growing month (so no winter reminders), unless the plant is
 *   under a grow light. Dormant plants get none (the form says dormancy
 *   "pauses fertilizing").
 * - **Repot:** last time + the profile's months, then into spring (the first
 *   two growing months, April–May by default), since repotting is a spring
 *   job — a date outside it moves forward to the next spring, never earlier.
 *
 * Plain TS, tested on its own.
 */
import { addDays, addMonths, differenceInCalendarDays } from 'date-fns';
import { effectiveDueDate, parseLocalDate } from './care.js';
import { DEFAULT_GROWING_MONTHS, toLocalDateString } from './schedule.js';
import type { CareProfile, LogEntry, Plant, Task } from '#lib/types/plant.js';

export type ReminderKind = 'fertilize' | 'repot';
export const REMINDER_KINDS: readonly ReminderKind[] = ['fertilize', 'repot'];

/** The log entry that completes each reminder. */
export const DONE_KIND = { fertilize: 'fertilized', repot: 'repotted' } as const;

/** How far "Later" moves a reminder. */
export const LATER_DAYS: Record<ReminderKind, number> = { fertilize: 7, repot: 14 };

/** What is stored for a reminder: only what the owner did. */
export type StoredReminder = {
	id: string;
	plantId: string;
	kind: ReminderKind;
	/** `YYYY-MM-DD`: the last time it was done. */
	lastDone?: string;
	/** `YYYY-MM-DD`: "Later" until this day. */
	snoozedUntil?: string;
};

export function reminderId(kind: ReminderKind, plantId: string): string {
	return `${kind}-${plantId}`;
}

/** The first day of the next month that is (or `date`'s, if it is) in `months`. */
function intoMonths(date: Date, months: readonly number[]): Date {
	if (months.includes(date.getMonth() + 1)) return date;
	for (let step = 1; step <= 12; step++) {
		const next = new Date(date.getFullYear(), date.getMonth() + step, 1);
		if (months.includes(next.getMonth() + 1)) return next;
	}
	return date;
}

export function fertilizeDue(
	care: Pick<CareProfile, 'fertilize'>,
	plant: Pick<Plant, 'dormant' | 'underGrowLight'>,
	since: Date,
	growingMonths: readonly number[] = DEFAULT_GROWING_MONTHS
): Date | null {
	if (!care.fertilize || plant.dormant) return null;
	const due = addDays(since, care.fertilize.intervalDays);
	return care.fertilize.growingOnly && !plant.underGrowLight ? intoMonths(due, growingMonths) : due;
}

export function repotDue(
	care: Pick<CareProfile, 'repotIntervalMonths'>,
	since: Date,
	growingMonths: readonly number[] = DEFAULT_GROWING_MONTHS
): Date | null {
	if (typeof care.repotIntervalMonths !== 'number') return null;
	const spring = growingMonths.slice(0, 2);
	return intoMonths(addMonths(since, care.repotIntervalMonths), spring);
}

/**
 * Every plant's reminders as tasks with a worked-out `nextDue`, so Coming up
 * can list them beside the water checks. `careOf` resolves a plant's profile.
 */
export function reminderTasks(
	plants: readonly Plant[],
	stored: readonly StoredReminder[],
	careOf: (plant: Plant) => CareProfile,
	growingMonths: readonly number[] = DEFAULT_GROWING_MONTHS
): Task[] {
	const tasks: Task[] = [];
	for (const plant of plants) {
		const care = careOf(plant);
		const added = plant.createdAt?.toDate?.() ?? new Date();
		for (const kind of REMINDER_KINDS) {
			const saved = stored.find((s) => s.plantId === plant.id && s.kind === kind);
			const since = (saved?.lastDone && parseLocalDate(saved.lastDone)) || added;
			const due =
				kind === 'fertilize'
					? fertilizeDue(care, plant, since, growingMonths)
					: repotDue(care, since, growingMonths);
			if (!due) continue;
			tasks.push({
				id: reminderId(kind, plant.id),
				plantId: plant.id,
				kind,
				nextDue: toLocalDateString(due),
				snoozedUntil: saved?.snoozedUntil,
				lastDone: saved?.lastDone
			});
		}
	}
	return tasks;
}

/** A log entry that completed a reminder (it carries the before-state for Undo). */
export type ReminderDone = LogEntry & {
	kind: (typeof DONE_KIND)[ReminderKind];
	reminder: NonNullable<LogEntry['reminder']>;
};

export function isReminderDone(entry: LogEntry): entry is ReminderDone {
	return (entry.kind === 'fertilized' || entry.kind === 'repotted') && entry.reminder !== undefined;
}

export function kindOfDone(entry: Pick<LogEntry, 'kind'>): ReminderKind | null {
	return entry.kind === 'fertilized' ? 'fertilize' : entry.kind === 'repotted' ? 'repot' : null;
}

export type ReminderCard =
	| { state: 'open'; plant: Plant; kind: ReminderKind; task: Task; overdueDays: number }
	| {
			state: 'done';
			plant: Plant;
			kind: ReminderKind;
			entry: ReminderDone;
			/** The next one, now that this one is done. */
			next: Date | null;
			canUndo: boolean;
	  };

/**
 * Undo is offered while the reminder still reflects this entry: nothing has
 * been logged for it since (its `lastDone` is this entry's day).
 */
export function canUndoDone(entry: ReminderDone, stored: StoredReminder | undefined): boolean {
	return stored?.lastDone === toLocalDateString(entry.at.toDate());
}

/**
 * Today's reminder cards: the ones due today or earlier, and the ones done
 * today (from today's log), which stay with Undo for the rest of the day.
 * Most overdue first, then by name; fertilise before repot on the same day.
 */
export function reminderCards(
	plants: readonly Plant[],
	tasks: readonly Task[],
	stored: readonly StoredReminder[],
	todayEntries: readonly LogEntry[],
	today: Date,
	locale: string
): ReminderCard[] {
	const cards: { card: ReminderCard; due: Date }[] = [];
	const doneToday = new Map<string, ReminderDone>();
	for (const entry of todayEntries) {
		if (!isReminderDone(entry)) continue;
		const kind = kindOfDone(entry);
		if (!kind) continue;
		const key = reminderId(kind, entry.plantId);
		const seen = doneToday.get(key);
		if (!seen || entry.at.toMillis() > seen.at.toMillis()) doneToday.set(key, entry);
	}

	for (const task of tasks) {
		const kind = task.kind as ReminderKind;
		const plant = plants.find((p) => p.id === task.plantId);
		const due = effectiveDueDate(task);
		if (!plant || !due) continue;
		const done = doneToday.get(task.id);
		if (done) {
			cards.push({
				due: done.at.toDate(),
				card: {
					state: 'done',
					plant,
					kind,
					entry: done,
					next: due,
					canUndo: canUndoDone(
						done,
						stored.find((s) => s.id === task.id)
					)
				}
			});
			continue;
		}
		const overdueDays = differenceInCalendarDays(today, due);
		if (overdueDays >= 0)
			cards.push({ due, card: { state: 'open', plant, kind, task, overdueDays } });
	}

	return cards
		.sort(
			(a, b) =>
				a.due.getTime() - b.due.getTime() ||
				a.card.plant.name.localeCompare(b.card.plant.name, locale) ||
				REMINDER_KINDS.indexOf(a.card.kind) - REMINDER_KINDS.indexOf(b.card.kind)
		)
		.map(({ card }) => card);
}

/** How far ahead "Coming up" lists reminders: it is for the next days, not for April. */
export const SOON_DAYS = 14;

/** The reminders due within `days` from today (or overdue), for "Coming up". */
export function soonReminders(tasks: readonly Task[], today: Date, days = SOON_DAYS): Task[] {
	return tasks.filter((task) => {
		const due = effectiveDueDate(task);
		return due !== null && differenceInCalendarDays(due, today) <= days;
	});
}
