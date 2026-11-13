/**
 * What the Today view shows (screens.md "Today"): one card per plant whose
 * water check is due, open or already answered today.
 *
 * Plain TS, tested on its own. The page feeds it the live plants, check tasks
 * and today's log, and renders the result.
 */
import { differenceInCalendarDays } from 'date-fns';
import { effectiveDueDate, parseLocalDate } from './care.js';
import type { CheckAction } from './schedule.js';
import type { LogEntry, Plant, Task } from '#lib/types/plant.js';

const CHECK_ACTIONS: readonly string[] = ['watered', 'checked-damp', 'skipped'];

/** A log entry that answered a water check, with what it did to the check. */
export type CheckAnswer = LogEntry & {
	kind: CheckAction;
	check: NonNullable<LogEntry['check']>;
};

export function isCheckAnswer(entry: LogEntry): entry is CheckAnswer {
	return CHECK_ACTIONS.includes(entry.kind) && entry.check !== undefined;
}

export type TodayCard =
	| { state: 'open'; plant: Plant; task: Task; overdueDays: number }
	| {
			state: 'answered';
			plant: Plant;
			task: Task;
			answer: CheckAnswer;
			/** Days from today to the next check. */
			nextInDays: number;
			/** The answer is still the latest thing that happened to the check. */
			canUndo: boolean;
	  };

/** Today's first and latest check answer per plant. */
function answersByPlant(
	entries: readonly LogEntry[]
): Map<string, { first: CheckAnswer; latest: CheckAnswer }> {
	const byPlant = new Map<string, { first: CheckAnswer; latest: CheckAnswer }>();
	for (const entry of entries) {
		if (!isCheckAnswer(entry)) continue;
		const seen = byPlant.get(entry.plantId);
		const ms = entry.at.toMillis();
		if (!seen) byPlant.set(entry.plantId, { first: entry, latest: entry });
		else {
			if (ms < seen.first.at.toMillis()) seen.first = entry;
			if (ms > seen.latest.at.toMillis()) seen.latest = entry;
		}
	}
	return byPlant;
}

/**
 * Undo puts the check back as it was before the answer, so it is only offered
 * while the answer is still what the check reflects: nothing (another answer,
 * an edit) has moved it since.
 */
export function canUndo(task: Task | undefined, answer: CheckAnswer): boolean {
	return task !== undefined && task.nextDue === answer.check.nextDue && !task.snoozedUntil;
}

/** A plant's latest check answer among `entries`, if any. */
export function latestAnswerFor(
	entries: readonly LogEntry[],
	plantId: string
): CheckAnswer | undefined {
	return answersByPlant(entries).get(plantId)?.latest;
}

/**
 * The cards, in order.
 *
 * - **Open:** the check is due today or earlier and nothing answered it today.
 * - **Answered:** it was answered today *and* was due when the day's first
 *   answer came, so watering a plant early from its own page doesn't put it
 *   on Today. The card shows the latest answer: "Still damp" in the morning
 *   and "Watered" in the evening is one card, now watered.
 *
 * Ordered by when each check was due (the answered ones by their old date),
 * most overdue first, then by name. So a card keeps its place when it is
 * answered, as the spec asks, instead of jumping to the end.
 *
 * `todayEntries` are today's log entries; anything older is ignored anyway.
 */
export function todayCards(
	plants: readonly Plant[],
	tasks: readonly Task[],
	todayEntries: readonly LogEntry[],
	today: Date,
	locale: string
): TodayCard[] {
	const answers = answersByPlant(todayEntries);
	const sortable: { card: TodayCard; due: Date }[] = [];

	for (const plant of plants) {
		const task = tasks.find((t) => t.plantId === plant.id);
		if (!task) continue;
		const answered = answers.get(plant.id);

		if (answered) {
			const { first, latest: answer } = answered;
			const before = first.check.before ? effectiveDueDate(first.check.before) : null;
			const next = parseLocalDate(answer.check.nextDue);
			if (before && next && differenceInCalendarDays(before, today) <= 0) {
				sortable.push({
					due: before,
					card: {
						state: 'answered',
						plant,
						task,
						answer,
						nextInDays: differenceInCalendarDays(next, today),
						canUndo: canUndo(task, answer)
					}
				});
				continue;
			}
		}

		const due = effectiveDueDate(task);
		if (!due) continue;
		const days = differenceInCalendarDays(today, due);
		if (days >= 0) {
			sortable.push({ due, card: { state: 'open', plant, task, overdueDays: days } });
		}
	}

	return sortable
		.sort(
			(a, b) =>
				a.due.getTime() - b.due.getTime() ||
				a.card.plant.name.localeCompare(b.card.plant.name, locale)
		)
		.map(({ card }) => card);
}

/**
 * The "Coming up" column on iPad (screens.md "Today"): the next checks after
 * today, soonest first. Only water checks exist so far; other task kinds join
 * the same list when they arrive.
 */
export function comingUp(
	plants: readonly Plant[],
	tasks: readonly Task[],
	today: Date,
	limit = 5
): { plant: Plant; task: Task; due: Date }[] {
	const rows: { plant: Plant; task: Task; due: Date }[] = [];
	for (const task of tasks) {
		const due = effectiveDueDate(task);
		const plant = plants.find((p) => p.id === task.plantId);
		if (due && plant && differenceInCalendarDays(due, today) > 0) rows.push({ plant, task, due });
	}
	return rows
		.sort((a, b) => a.due.getTime() - b.due.getTime() || a.plant.name.localeCompare(b.plant.name))
		.slice(0, limit);
}

/** A day said relative to today: "yesterday", "tomorrow", "on Saturday", "on 25 Nov". */
export type DayRef =
	| { kind: 'today' }
	| { kind: 'yesterday' }
	| { kind: 'tomorrow' }
	| { kind: 'weekday'; date: Date }
	| { kind: 'date'; date: Date };

/**
 * A weekday names one day only within six days either side; past that the
 * date is said instead, as on the Plants list.
 */
export function dayRef(date: Date, today: Date): DayRef {
	const days = differenceInCalendarDays(date, today);
	if (days === 0) return { kind: 'today' };
	if (days === -1) return { kind: 'yesterday' };
	if (days === 1) return { kind: 'tomorrow' };
	return Math.abs(days) < 7 ? { kind: 'weekday', date } : { kind: 'date', date };
}

/** The most recent day any plant was watered, from the checks' `lastAnswer`. */
export function lastWatered(tasks: readonly Task[]): Date | null {
	let latest: Date | null = null;
	for (const task of tasks) {
		if (task.lastAnswer?.kind !== 'watered') continue;
		const on = parseLocalDate(task.lastAnswer.on);
		if (on && (!latest || on > latest)) latest = on;
	}
	return latest;
}

/** One day of the "This week" strip and the plants checked on it. */
export type WeekDay = { date: Date; plants: Plant[] };

/**
 * Seven days from today, each with the plants whose next check falls on it.
 * Only the actual next check, never a guessed repeat (Niko, 2026-11-13):
 * dates move whenever something is logged, so a projection would mislead.
 */
export function weekAhead(
	plants: readonly Plant[],
	tasks: readonly Task[],
	today: Date,
	locale: string
): WeekDay[] {
	const days: WeekDay[] = Array.from({ length: 7 }, (_, offset) => ({
		date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset),
		plants: []
	}));
	for (const task of tasks) {
		const due = effectiveDueDate(task);
		const plant = plants.find((p) => p.id === task.plantId);
		if (!due || !plant) continue;
		const offset = differenceInCalendarDays(due, today);
		if (offset >= 0 && offset < 7) days[offset].plants.push(plant);
	}
	for (const day of days) day.plants.sort((a, b) => a.name.localeCompare(b.name, locale));
	return days;
}
