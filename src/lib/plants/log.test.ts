import { describe, expect, it } from 'vitest';
import type { LogEntry } from '#lib/types/plant.js';
import { groupByMonth, lastWateredAt } from './log.js';

const entry = (id: string, kind: LogEntry['kind'], date: Date): LogEntry => ({
	id,
	plantId: 'pilea',
	kind,
	at: { toDate: () => date, toMillis: () => date.getTime() } as LogEntry['at']
});

describe('groupByMonth', () => {
	it('splits newest-first entries into local calendar months, keeping their order', () => {
		const groups = groupByMonth([
			entry('a', 'watered', new Date(2026, 10, 12, 9)),
			entry('b', 'checked-damp', new Date(2026, 10, 1, 0, 5)),
			entry('c', 'watered', new Date(2026, 9, 31, 23, 50)),
			entry('d', 'skipped', new Date(2025, 9, 3))
		]);
		expect(groups.map((g) => g.key)).toEqual(['2026-11', '2026-10', '2025-10']);
		expect(groups[0].entries.map((e) => e.id)).toEqual(['a', 'b']);
		expect(groups[1].month).toEqual(new Date(2026, 9, 1));
	});

	it('lists each month once even if an entry arrives out of order', () => {
		const groups = groupByMonth([
			entry('a', 'watered', new Date(2026, 10, 12)),
			entry('b', 'watered', new Date(2026, 9, 2)),
			entry('c', 'watered', new Date(2026, 10, 3))
		]);
		expect(groups.map((g) => g.key)).toEqual(['2026-11', '2026-10']);
		expect(groups[0].entries.map((e) => e.id)).toEqual(['a', 'c']);
	});

	it('is empty for no entries', () => {
		expect(groupByMonth([])).toEqual([]);
	});
});

describe('lastWateredAt', () => {
	it('is the latest watering, ignoring other kinds', () => {
		const latest = new Date(2026, 10, 9);
		expect(
			lastWateredAt([
				entry('a', 'checked-damp', new Date(2026, 10, 12)),
				entry('b', 'watered', latest),
				entry('c', 'watered', new Date(2026, 9, 25))
			])
		).toEqual(latest);
	});

	it('is null when nothing was watered', () => {
		expect(lastWateredAt([entry('a', 'skipped', new Date(2026, 10, 12))])).toBeNull();
	});
});
