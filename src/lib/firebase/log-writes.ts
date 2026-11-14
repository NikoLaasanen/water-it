/**
 * Care logged by hand (manual-log.ts) and the fertilise/repot reminders it
 * completes (reminders.ts): adding an entry, deleting one, Undo and Later.
 *
 * Fertilised and Repotted always go through the same write, whether from
 * Today's Done or from Add to log: one batch with the log entry — carrying
 * the reminder as it was, for Undo — and the reminder's new `lastDone`.
 *
 * Not awaited, like the other writes: the offline cache shows the change at
 * once and syncs it later (see plant-writes.ts).
 */
import {
	Timestamp,
	collection,
	deleteDoc,
	deleteField,
	doc,
	setDoc,
	writeBatch,
	type WriteBatch
} from 'firebase/firestore';
import { db } from './client';
import { withoutUndefined } from './without-undefined.js';
import type { ManualKind } from '#lib/plants/manual-log.js';
import {
	kindOfDone,
	reminderId,
	type ReminderKind,
	type StoredReminder
} from '#lib/plants/reminders.js';
import { toLocalDateString } from '#lib/plants/schedule.js';
import type { LogEntry } from '#lib/types/plant.js';

function report(what: string) {
	return (error: { code?: string }) => {
		console.error(`[log] ${what} failed`, error.code ?? error);
	};
}

function reminderRef(uid: string, kind: ReminderKind, plantId: string) {
	return doc(db, 'users', uid, 'tasks', reminderId(kind, plantId));
}

/** Puts a reminder back as an entry found it (or removes it if there was none). */
function restoreReminder(
	batch: WriteBatch,
	uid: string,
	kind: ReminderKind,
	plantId: string,
	before: NonNullable<LogEntry['reminder']>['before']
) {
	const ref = reminderRef(uid, kind, plantId);
	if (before) {
		batch.set(
			ref,
			{
				lastDone: before.lastDone ?? deleteField(),
				snoozedUntil: before.snoozedUntil ?? deleteField()
			},
			{ merge: true }
		);
	} else {
		batch.delete(ref);
	}
}

/**
 * Adds a hand-logged entry.
 *
 * - For Moved, `newLocation` also becomes the plant's location.
 * - For Fertilised / Repotted, pass the plant's stored reminder of that kind
 *   (or undefined if there is none): the entry keeps it for Undo, and the
 *   reminder's `lastDone` moves to this day — unless something later was
 *   already logged, as when filling in an older one.
 */
export function addManualEntry(
	uid: string,
	plantId: string,
	entry: { kind: ManualKind; at: Date; note?: string },
	options: { newLocation?: string; reminder?: StoredReminder } = {}
): void {
	const reminderKind = kindOfDone(entry);
	const saved = options.reminder;
	const data: Omit<LogEntry, 'id'> = {
		plantId,
		kind: entry.kind,
		at: Timestamp.fromDate(entry.at),
		note: entry.note,
		by: { kind: 'owner' },
		reminder: reminderKind
			? {
					before: saved
						? withoutUndefined({ lastDone: saved.lastDone, snoozedUntil: saved.snoozedUntil })
						: null
				}
			: undefined
	};

	const batch = writeBatch(db);
	batch.set(doc(collection(db, 'users', uid, 'log')), withoutUndefined(data));
	if (options.newLocation !== undefined) {
		batch.update(doc(db, 'users', uid, 'plants', plantId), { location: options.newLocation });
	}
	if (reminderKind) {
		const day = toLocalDateString(entry.at);
		const lastDone = saved?.lastDone && saved.lastDone > day ? saved.lastDone : day;
		batch.set(
			reminderRef(uid, reminderKind, plantId),
			{ plantId, kind: reminderKind, lastDone, snoozedUntil: deleteField() },
			{ merge: true }
		);
	}
	batch.commit().catch(report('adding to the log'));
}

/** Today's Done on a reminder: logs Fertilised / Repotted now. */
export function completeReminder(
	uid: string,
	plantId: string,
	kind: ReminderKind,
	saved: StoredReminder | undefined,
	now: Date = new Date()
): void {
	addManualEntry(
		uid,
		plantId,
		{ kind: kind === 'fertilize' ? 'fertilized' : 'repotted', at: now },
		{ reminder: saved }
	);
}

/**
 * Deletes a hand-logged entry (Undo on Today, or the trash button in the
 * log). If it completed a reminder that nothing has moved since, the
 * reminder goes back to how the entry found it.
 */
export function deleteManualEntry(
	uid: string,
	entry: LogEntry,
	saved: StoredReminder | undefined
): void {
	const kind = kindOfDone(entry);
	const restores =
		kind !== null &&
		entry.reminder !== undefined &&
		saved?.lastDone === toLocalDateString(entry.at.toDate());
	if (!restores) {
		deleteDoc(doc(db, 'users', uid, 'log', entry.id)).catch(report('deleting a log entry'));
		return;
	}
	const batch = writeBatch(db);
	batch.delete(doc(db, 'users', uid, 'log', entry.id));
	restoreReminder(batch, uid, kind, entry.plantId, entry.reminder!.before);
	batch.commit().catch(report('deleting a log entry'));
}

/** "Later" on a reminder: hidden until `until` (`YYYY-MM-DD`). */
export function postponeReminder(
	uid: string,
	plantId: string,
	kind: ReminderKind,
	until: string
): void {
	setDoc(
		reminderRef(uid, kind, plantId),
		{ plantId, kind, snoozedUntil: until },
		{ merge: true }
	).catch(report('postponing a reminder'));
}
