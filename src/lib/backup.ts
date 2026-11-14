/**
 * The personal backup file (design.md §7.5 "Backup", Settings → Backup).
 *
 * Firestore is the source of truth, so this is a keepsake rather than the
 * only copy: everything under `users/{uid}` as one readable JSON file. No
 * photos yet (M3); when they arrive the file becomes a zip with them inside,
 * and `format` goes up.
 *
 * Plain TS, tested on its own; the Firestore reads live in
 * `#lib/firebase/backup.ts`.
 */

/** Bumped whenever the shape of the file changes. */
export const BACKUP_FORMAT = 1;

export type BackupDoc = { id: string } & Record<string, unknown>;

export type Backup = {
	app: 'water-it';
	format: typeof BACKUP_FORMAT;
	/** ISO time the file was made. */
	exportedAt: string;
	/** The `users/{uid}` document (settings), if there is one. */
	settings: Record<string, unknown> | null;
	plants: BackupDoc[];
	tasks: BackupDoc[];
	log: BackupDoc[];
};

/** Duck-typed, so this module needn't import Firestore. */
function isTimestamp(value: unknown): value is { toDate(): Date } {
	return (
		typeof value === 'object' &&
		value !== null &&
		'toDate' in value &&
		typeof value.toDate === 'function' &&
		'seconds' in value &&
		'nanoseconds' in value
	);
}

/**
 * Firestore data as plain JSON: Timestamps become ISO strings, everything
 * else (strings, numbers, booleans, null, arrays, maps) stays as it is. Due
 * dates are already `YYYY-MM-DD` strings, so they come through unchanged.
 */
export function toJsonValue(value: unknown): unknown {
	if (isTimestamp(value)) return value.toDate().toISOString();
	if (value instanceof Date) return value.toISOString();
	if (Array.isArray(value)) return value.map(toJsonValue);
	if (typeof value === 'object' && value !== null) {
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJsonValue(v)]));
	}
	return value;
}

function byTimeThenId(a: BackupDoc, b: BackupDoc): number {
	const at = String(a.at ?? '');
	const bt = String(b.at ?? '');
	return at.localeCompare(bt) || a.id.localeCompare(b.id);
}

export function buildBackup(
	data: {
		settings: Record<string, unknown> | null;
		plants: BackupDoc[];
		tasks: BackupDoc[];
		log: BackupDoc[];
	},
	now: Date
): Backup {
	const docs = (list: BackupDoc[]) => list.map((d) => toJsonValue(d) as BackupDoc);
	return {
		app: 'water-it',
		format: BACKUP_FORMAT,
		exportedAt: now.toISOString(),
		settings: data.settings ? (toJsonValue(data.settings) as Record<string, unknown>) : null,
		plants: docs(data.plants).sort((a, b) => String(a.name).localeCompare(String(b.name))),
		tasks: docs(data.tasks).sort((a, b) => a.id.localeCompare(b.id)),
		// Oldest first, so the file reads as a diary.
		log: docs(data.log).sort(byTimeThenId)
	};
}

/** `water-it-backup-2026-11-14.json`, from the local date. */
export function backupFileName(now: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `water-it-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
