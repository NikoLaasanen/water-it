/**
 * Live view of the log entries made since a given moment — in practice, since
 * local midnight, for Today's answered cards and their Undo.
 *
 * Same ownership rule as PlantsQuery: `listen()` returns its own cleanup.
 * A range on one field needs no composite index.
 */
import {
	Timestamp,
	collection,
	onSnapshot,
	query,
	where,
	type DocumentData,
	type FirestoreError
} from 'firebase/firestore';
import { db } from './client';
import type { CheckSnapshot, LogEntry, LogKind } from '#lib/types/plant.js';

const KINDS: readonly LogKind[] = [
	'watered',
	'checked-damp',
	'checked-dry',
	'skipped',
	'fertilized',
	'repotted',
	'pruned',
	'moved',
	'note',
	'problem'
];

function snapshotOf(data: unknown): CheckSnapshot | null {
	if (typeof data !== 'object' || data === null) return null;
	const { nextDue, intervalDays, snoozedUntil } = data as DocumentData;
	if (typeof nextDue !== 'string') return null;
	return {
		nextDue,
		intervalDays: typeof intervalDays === 'number' ? intervalDays : undefined,
		snoozedUntil: typeof snoozedUntil === 'string' ? snoozedUntil : undefined
	};
}

/** Forgiving, like toPlant: a malformed entry is dropped, not fatal. */
function toLogEntry(id: string, data: DocumentData): LogEntry | null {
	if (typeof data.plantId !== 'string' || !(data.at instanceof Timestamp)) return null;
	if (!KINDS.includes(data.kind)) return null;
	const check = data.check as DocumentData | undefined;
	return {
		id,
		plantId: data.plantId,
		kind: data.kind,
		at: data.at,
		note: typeof data.note === 'string' ? data.note : undefined,
		check:
			check && typeof check.nextDue === 'string' && typeof check.intervalDays === 'number'
				? {
						before: snapshotOf(check.before),
						nextDue: check.nextDue,
						intervalDays: check.intervalDays
					}
				: undefined
	};
}

export class LogSince {
	entries = $state<LogEntry[]>([]);
	loading = $state(true);

	listen(uid: string, since: Date): () => void {
		this.loading = true;
		return onSnapshot(
			query(collection(db, 'users', uid, 'log'), where('at', '>=', Timestamp.fromDate(since))),
			(snapshot) => {
				this.entries = snapshot.docs
					.map((entry) => toLogEntry(entry.id, entry.data()))
					.filter((entry): entry is LogEntry => entry !== null);
				this.loading = false;
			},
			(error: FirestoreError) => {
				console.error('[log] listener failed', error.code);
				this.loading = false;
			}
		);
	}
}
