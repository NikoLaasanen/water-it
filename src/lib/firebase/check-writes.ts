/**
 * Answering a water check — Watered, Still damp, Skip — and undoing it; and
 * accepting or keeping an interval suggestion.
 *
 * Each answer is one batch: a log entry plus the check's new date. The entry
 * also keeps the check as it was, so Undo can restore it from any device,
 * after a reload too (design.md §4.3, screens.md "Today").
 *
 * Not awaited, like the plant writes (see plant-writes.ts): offline, the
 * server could take hours to confirm, and the local cache shows the change
 * at once.
 */
import { Timestamp, collection, deleteField, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './client';
import { checkTaskId } from './plant-writes.js';
import { withoutUndefined } from './without-undefined.js';
import {
	nextDueAfter,
	rescheduleForNewInterval,
	toLocalDateString,
	type CheckAction
} from '#lib/plants/schedule.js';
import type { CheckAnswer } from '#lib/plants/today.js';
import type { CareOverrides, CheckSnapshot, LogEntry, Task } from '#lib/types/plant.js';

function report(what: string) {
	return (error: { code?: string }) => {
		console.error(`[checks] ${what} failed`, error.code ?? error);
	};
}

/**
 * Logs an answer to a plant's water check and moves the check.
 *
 * `intervalDays` is the plant's interval for today's season; it is written to
 * the check too, so a season change takes effect at the next answer. The
 * time is the phone's clock rather than a server timestamp: offline, a
 * pending server timestamp has no value yet, and "logged today" couldn't be
 * answered until the phone was back online.
 */
export function answerCheck(
	uid: string,
	plantId: string,
	task: Task | undefined,
	action: CheckAction,
	intervalDays: number,
	now: Date = new Date()
): void {
	const nextDue = nextDueAfter(action, now, intervalDays);
	const before: CheckSnapshot | null = task
		? {
				nextDue: task.nextDue,
				intervalDays: task.intervalDays,
				snoozedUntil: task.snoozedUntil,
				lastAnswer: task.lastAnswer
			}
		: null;
	const lastAnswer = { kind: action, on: toLocalDateString(now) };
	const entry: Omit<LogEntry, 'id'> = {
		plantId,
		kind: action,
		at: Timestamp.fromDate(now),
		by: { kind: 'owner' },
		check: { before, nextDue, intervalDays }
	};

	const batch = writeBatch(db);
	batch.set(doc(collection(db, 'users', uid, 'log')), withoutUndefined(entry));
	batch.set(
		doc(db, 'users', uid, 'tasks', checkTaskId(plantId)),
		{
			plantId,
			kind: 'check-water',
			nextDue,
			intervalDays,
			lastAnswer,
			snoozedUntil: deleteField()
		},
		{ merge: true }
	);
	batch.commit().catch(report('logging the check'));
}

/** Deletes the answer and puts the check back as it was before it. */
export function undoAnswer(uid: string, answer: CheckAnswer): void {
	const taskRef = doc(db, 'users', uid, 'tasks', checkTaskId(answer.plantId));
	const { before } = answer.check;

	const batch = writeBatch(db);
	batch.delete(doc(db, 'users', uid, 'log', answer.id));
	if (before) {
		batch.set(
			taskRef,
			{
				nextDue: before.nextDue,
				intervalDays: before.intervalDays ?? deleteField(),
				snoozedUntil: before.snoozedUntil ?? deleteField(),
				lastAnswer: before.lastAnswer ?? deleteField()
			},
			{ merge: true }
		);
	} else {
		// The plant had no check before (older data); the answer created it.
		batch.delete(taskRef);
	}
	batch.commit().catch(report('undoing the check'));
}

/**
 * Accepts an interval suggestion (interval-suggestion.ts): the plant's care
 * overrides get the new interval for that season, and the check moves with
 * it, in one batch.
 *
 * The check moves only if the plant was last watered: then its date is
 * "watering + old interval", and shifting it by the difference gives
 * "watering + new interval", still counted from the watering. After a Still
 * damp or a Skip the check is a short snooze, which stays as it is; the new
 * interval starts at the next watering.
 */
export function acceptIntervalSuggestion(
	uid: string,
	plantId: string,
	careOverrides: CareOverrides,
	task: Task,
	toDays: number
): void {
	const moves = task.lastAnswer?.kind === 'watered' && task.intervalDays !== undefined;
	const batch = writeBatch(db);
	batch.update(doc(db, 'users', uid, 'plants', plantId), { careOverrides });
	batch.set(
		doc(db, 'users', uid, 'tasks', checkTaskId(plantId)),
		{
			intervalDays: toDays,
			...(moves
				? { nextDue: rescheduleForNewInterval(task.nextDue, task.intervalDays!, toDays) }
				: {}),
			suggestionKeptOn: deleteField()
		},
		{ merge: true }
	);
	batch.commit().catch(report('changing the interval'));
}

/**
 * "Keep" on an interval suggestion: remembered on the check, so it stays
 * hidden on every device until enough new answers say the same again.
 */
export function keepInterval(uid: string, plantId: string, today: Date = new Date()): void {
	setDoc(
		doc(db, 'users', uid, 'tasks', checkTaskId(plantId)),
		{ suggestionKeptOn: toLocalDateString(today) },
		{ merge: true }
	).catch(report('keeping the interval'));
}
