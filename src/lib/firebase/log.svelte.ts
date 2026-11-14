/**
 * Live views of the log: the entries made since a given moment (in practice,
 * since local midnight, for Today's answered cards and their Undo), and one
 * plant's entries, newest first, for plant detail's Log tab.
 *
 * Same ownership rule as PlantsQuery: `listen()` returns its own cleanup.
 */
import {
	Timestamp,
	collection,
	limit,
	onSnapshot,
	orderBy,
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

/** A check's `lastAnswer`, if it is one we can read. */
export function readLastAnswer(data: unknown): CheckSnapshot['lastAnswer'] {
	if (typeof data !== 'object' || data === null) return undefined;
	const { kind, on } = data as DocumentData;
	if (!['watered', 'checked-damp', 'skipped'].includes(kind) || typeof on !== 'string') {
		return undefined;
	}
	return { kind, on };
}

function snapshotOf(data: unknown): CheckSnapshot | null {
	if (typeof data !== 'object' || data === null) return null;
	const { nextDue, intervalDays, snoozedUntil, lastAnswer } = data as DocumentData;
	if (typeof nextDue !== 'string') return null;
	return {
		nextDue,
		intervalDays: typeof intervalDays === 'number' ? intervalDays : undefined,
		snoozedUntil: typeof snoozedUntil === 'string' ? snoozedUntil : undefined,
		lastAnswer: readLastAnswer(lastAnswer)
	};
}

/** Forgiving, like toPlant: a malformed entry is dropped, not fatal. */
function toLogEntry(id: string, data: DocumentData): LogEntry | null {
	if (typeof data.plantId !== 'string' || !(data.at instanceof Timestamp)) return null;
	if (!KINDS.includes(data.kind)) return null;
	const check = data.check as DocumentData | undefined;
	const reminder = data.reminder as DocumentData | undefined;
	const before = reminder?.before as DocumentData | null | undefined;
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
				: undefined,
		reminder:
			reminder && typeof reminder === 'object'
				? {
						before:
							before && typeof before === 'object'
								? {
										lastDone: typeof before.lastDone === 'string' ? before.lastDone : undefined,
										snoozedUntil:
											typeof before.snoozedUntil === 'string' ? before.snoozedUntil : undefined
									}
								: null
					}
				: undefined
	};
}

/** Since a moment; a range on one field needs no composite index. */
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

/**
 * One plant's log, newest first, at most `max` entries. Uses the
 * `plantId + at desc` index in firestore.indexes.json. One extra entry is
 * asked for, so the page knows whether "Show older" has anything to show.
 *
 * Re-listening with a larger `max` keeps the entries on screen until the
 * new snapshot arrives (straight from the offline cache), so the list
 * doesn't flash empty.
 */
export class PlantLog {
	entries = $state<LogEntry[]>([]);
	loading = $state(true);
	hasMore = $state(false);
	#plantId: string | null = null;

	listen(uid: string, plantId: string, max: number): () => void {
		if (plantId !== this.#plantId) {
			this.#plantId = plantId;
			this.entries = [];
			this.hasMore = false;
			this.loading = true;
		}
		return onSnapshot(
			query(
				collection(db, 'users', uid, 'log'),
				where('plantId', '==', plantId),
				orderBy('at', 'desc'),
				limit(max + 1)
			),
			(snapshot) => {
				const entries = snapshot.docs
					.map((entry) => toLogEntry(entry.id, entry.data()))
					.filter((entry): entry is LogEntry => entry !== null);
				this.hasMore = snapshot.docs.length > max;
				this.entries = entries.slice(0, max);
				this.loading = false;
			},
			(error: FirestoreError) => {
				console.error('[log] plant log listener failed', error.code);
				this.loading = false;
			}
		);
	}
}
