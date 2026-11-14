/**
 * Adaptive intervals (design.md §4.3): when the log keeps saying a plant's
 * check comes too early or too late, suggest a different interval. Only a
 * suggestion — the owner accepts or keeps the old one; nothing changes on its
 * own (Niko, 2026-11-13: Still damp only snoozes).
 *
 * A **round** is the time from one watering to the next. Two signals:
 *
 * - **Longer:** the soil was still damp at least once in each of the last
 *   ROUNDS rounds. The plant dries slower than the interval assumes.
 * - **Shorter:** each of the last ROUNDS waterings was logged before its
 *   check was due, with no damp answer in between. The owner keeps finding it
 *   dry early. (design.md's "Checked, very dry" answer isn't built; watering
 *   early is the evidence we have.)
 *
 * The suggested interval is the median real gap between those waterings, so
 * it says what the owner has actually been doing.
 *
 * Only answers given under the current season's interval count: a season
 * change, an edit, or an accepted suggestion starts the count again, as does
 * "Keep" (answers on or before `dismissedOn` are ignored). Plants on a fixed
 * schedule ("water every N days") get no suggestions: the owner has opted out
 * of checking.
 *
 * Plain TS, tested on its own.
 */
import { differenceInCalendarDays } from 'date-fns';
import { toLocalDateString, type Season } from './schedule.js';
import { isCheckAnswer, type CheckAnswer } from './today.js';
import type { LogEntry } from '#lib/types/plant.js';

/** How many rounds in a row must agree before suggesting anything. */
export const ROUNDS = 3;
/** The Edit form's stepper bounds, with 2 rather than 1 at the bottom. */
const MIN_DAYS = 2;
const MAX_DAYS = 120;

export type IntervalSuggestion = {
	direction: 'longer' | 'shorter';
	season: Season;
	fromDays: number;
	toDays: number;
	rounds: number;
};

type Round = { gap: number; damp: boolean; early: boolean };

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function suggestInterval({
	entries,
	intervalDays,
	season,
	fixedSchedule,
	dismissedOn
}: {
	/** The plant's log, in any order. */
	entries: readonly LogEntry[];
	/** The current season's interval. */
	intervalDays: number;
	season: Season;
	fixedSchedule?: boolean;
	/** `YYYY-MM-DD` of the last "Keep", from the check. */
	dismissedOn?: string;
}): IntervalSuggestion | null {
	if (fixedSchedule) return null;

	const answers = entries.filter(isCheckAnswer).sort((a, b) => a.at.toMillis() - b.at.toMillis());
	const counts = (answer: CheckAnswer) =>
		answer.check.intervalDays === intervalDays &&
		(!dismissedOn || toLocalDateString(answer.at.toDate()) > dismissedOn);

	const rounds: Round[] = [];
	let lastWatering: Date | null = null;
	let damp = false;
	for (const answer of answers) {
		const at = answer.at.toDate();
		if (answer.kind === 'checked-damp') {
			if (counts(answer)) damp = true;
		} else if (answer.kind === 'watered') {
			if (lastWatering && counts(answer)) {
				const due = answer.check.before?.nextDue;
				rounds.push({
					gap: differenceInCalendarDays(at, lastWatering),
					damp,
					early: !damp && due !== undefined && toLocalDateString(at) < due
				});
			}
			lastWatering = at;
			damp = false;
		}
	}

	const recent = rounds.slice(-ROUNDS);
	if (recent.length < ROUNDS) return null;
	const toDays = Math.min(MAX_DAYS, Math.max(MIN_DAYS, median(recent.map((r) => r.gap))));
	const base = { season, fromDays: intervalDays, toDays, rounds: ROUNDS };

	if (recent.every((r) => r.damp) && toDays > intervalDays) {
		return { ...base, direction: 'longer' };
	}
	if (recent.every((r) => r.early) && toDays < intervalDays) {
		return { ...base, direction: 'shorter' };
	}
	return null;
}
