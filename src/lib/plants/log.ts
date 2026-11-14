/**
 * Shaping a plant's log for display (screens.md "Plant detail — Log tab").
 * Plain TS, tested on its own; the entries come newest first from the query.
 */
import type { LogEntry } from '#lib/types/plant.js';

export type LogMonth = {
	/** `YYYY-MM`, in local time. */
	key: string;
	/** The first day of the month, local midnight. */
	month: Date;
	entries: LogEntry[];
};

/**
 * Splits newest-first entries into calendar months (local time), keeping the
 * order inside each month. Entries out of order are tolerated: each month
 * appears once, where its first entry did.
 */
export function groupByMonth(entries: readonly LogEntry[]): LogMonth[] {
	const months: LogMonth[] = [];
	const byKey = new Map<string, LogMonth>();
	for (const entry of entries) {
		const at = entry.at.toDate();
		const key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}`;
		let month = byKey.get(key);
		if (!month) {
			month = { key, month: new Date(at.getFullYear(), at.getMonth(), 1), entries: [] };
			byKey.set(key, month);
			months.push(month);
		}
		month.entries.push(entry);
	}
	return months;
}

/** When the plant was last watered, from newest-first entries; null if not among them. */
export function lastWateredAt(entries: readonly LogEntry[]): Date | null {
	let latest: Date | null = null;
	for (const entry of entries) {
		if (entry.kind !== 'watered') continue;
		const at = entry.at.toDate();
		if (!latest || at > latest) latest = at;
	}
	return latest;
}
