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

/** The next check coming up after today, for the "nothing to do" state. */
export function nextUpcoming(
	plants: readonly Plant[],
	tasks: readonly Task[],
	today: Date
): { plant: Plant; due: Date } | null {
	let best: { plant: Plant; due: Date } | null = null;
	for (const task of tasks) {
		const due = effectiveDueDate(task);
		const plant = plants.find((p) => p.id === task.plantId);
		if (!due || !plant || differenceInCalendarDays(due, today) <= 0) continue;
		if (!best || due < best.due) best = { plant, due };
	}
	return best;
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
