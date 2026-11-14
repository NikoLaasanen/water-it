/**
 * Care logged by hand (screens.md "Add to log"): fertilised, repotted,
 * pruned, moved, a note or a problem. Watering isn't here: it goes through
 * the check buttons, so the schedule has one way in.
 *
 * Plain TS, tested on its own. The form feeds it what was typed; the page
 * writes the result.
 */
import { parseLocalDate } from './care.js';
import { toLocalDateString } from './schedule.js';
import type { LogEntry, LogKind } from '#lib/types/plant.js';

export const MANUAL_KINDS = [
	'fertilized',
	'repotted',
	'pruned',
	'moved',
	'note',
	'problem'
] as const satisfies readonly LogKind[];
export type ManualKind = (typeof MANUAL_KINDS)[number];

export const NOTE_MAX = 500;

/** Entries added by hand, which can be deleted; check answers have Undo instead. */
export function isManualEntry(entry: Pick<LogEntry, 'kind' | 'check'>): boolean {
	return !entry.check && (MANUAL_KINDS as readonly string[]).includes(entry.kind);
}

export type ManualDraft = {
	kind: ManualKind | undefined;
	/** `YYYY-MM-DD`, from the date input. */
	date: string;
	note: string;
	/** Moved only: where it went. */
	location: string;
};

export type ManualErrorKey = 'kind' | 'date' | 'note-missing' | 'note-long' | 'location';

/** What's wrong with a draft, as keys the page turns into messages. */
export function validateManual(
	draft: ManualDraft,
	today: Date
): Partial<Record<'kind' | 'date' | 'note' | 'location', ManualErrorKey>> {
	const errors: Partial<Record<'kind' | 'date' | 'note' | 'location', ManualErrorKey>> = {};
	if (!draft.kind) errors.kind = 'kind';
	const day = parseLocalDate(draft.date);
	if (!day || draft.date > toLocalDateString(today)) errors.date = 'date';
	const note = draft.note.trim();
	if (draft.kind === 'moved') {
		if (!draft.location.trim()) errors.location = 'location';
	} else if (draft.kind === 'note' && !note) {
		errors.note = 'note-missing';
	}
	if (note.length > NOTE_MAX) errors.note = 'note-long';
	return errors;
}

/**
 * When the entry happened: now, if it's for today, so it sorts after
 * anything already logged today; otherwise midday on the chosen day, clear
 * of any time-zone edge.
 */
export function manualEntryTime(date: string, now: Date): Date {
	if (date === toLocalDateString(now)) return now;
	const day = parseLocalDate(date) ?? now;
	return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12);
}

/**
 * The note to store. For Moved, the new spot is what's worth keeping, so it
 * leads, followed by any note typed with it.
 */
export function manualNote(draft: ManualDraft): string | undefined {
	const note = draft.note.trim();
	if (draft.kind === 'moved') {
		const place = draft.location.trim();
		return note ? `${place} — ${note}` : place;
	}
	return note || undefined;
}
