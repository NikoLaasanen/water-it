import { describe, expect, it } from 'vitest';
import type { LogEntry } from '#lib/types/plant.js';
import { suggestInterval } from './interval-suggestion.js';

let seq = 0;
/** A check answer on day `day` of 2026 (day 1 = 1 Jan), with the check's due date before it. */
function answer(
	kind: 'watered' | 'checked-damp' | 'skipped',
	day: number,
	opts: { due?: number; interval?: number } = {}
): LogEntry {
	const date = new Date(2026, 0, day, 10);
	const due = new Date(2026, 0, opts.due ?? day);
	const iso = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	return {
		id: `e${seq++}`,
		plantId: 'pilea',
		kind,
		at: { toDate: () => date, toMillis: () => date.getTime() } as LogEntry['at'],
		check: { before: { nextDue: iso(due) }, nextDue: iso(due), intervalDays: opts.interval ?? 7 }
	};
}
const water = (day: number, due = day, interval = 7) => answer('watered', day, { due, interval });
const damp = (day: number, interval = 7) => answer('checked-damp', day, { interval });

const base = { intervalDays: 7, season: 'resting' as const };

describe('suggestInterval', () => {
	it('suggests longer after damp soil in each of the last three rounds', () => {
		// Waterings on days 1, 10, 19, 29, each after a damp check at day 7.
		const entries = [water(1), damp(8), water(10), damp(17), water(19), damp(26), water(29)];
		expect(suggestInterval({ ...base, entries })).toEqual({
			direction: 'longer',
			season: 'resting',
			fromDays: 7,
			toDays: 9,
			rounds: 3
		});
	});

	it('needs three rounds in a row', () => {
		expect(
			suggestInterval({ ...base, entries: [water(1), damp(8), water(10), damp(17), water(19)] })
		).toBeNull();
		// A round with no damp check breaks the streak.
		expect(
			suggestInterval({
				...base,
				entries: [water(1), damp(8), water(10), water(17), damp(24), water(26), damp(33), water(35)]
			})
		).toBeNull();
	});

	it('suggests shorter when the last three waterings came before their due date', () => {
		// Due every 7 days, watered after 5.
		const entries = [water(1), water(6, 8), water(11, 13), water(16, 18)];
		expect(suggestInterval({ ...base, entries })).toMatchObject({
			direction: 'shorter',
			fromDays: 7,
			toDays: 5
		});
	});

	it('does not call a late watering early, nor suggest anything for it', () => {
		// Watered late (days 9, 18, 27 against dues 8, 16, 25): just forgotten.
		const entries = [water(1), water(9, 8), water(18, 16), water(27, 25)];
		expect(suggestInterval({ ...base, entries })).toBeNull();
	});

	it('only counts answers given under the current interval', () => {
		const entries = [
			water(1, 1, 5),
			damp(8, 5),
			water(10, 10, 5),
			damp(17, 5),
			water(19, 19, 5),
			damp(26),
			water(29)
		];
		expect(suggestInterval({ ...base, entries })).toBeNull();
	});

	it('ignores answers on or before the last "Keep"', () => {
		const entries = [water(1), damp(8), water(10), damp(17), water(19), damp(26), water(29)];
		expect(suggestInterval({ ...base, entries, dismissedOn: '2026-01-29' })).toBeNull();
		expect(suggestInterval({ ...base, entries, dismissedOn: '2026-01-12' })).toBeNull();
		expect(suggestInterval({ ...base, entries, dismissedOn: '2025-12-31' })).not.toBeNull();
	});

	it('suggests nothing for a fixed schedule', () => {
		const entries = [water(1), damp(8), water(10), damp(17), water(19), damp(26), water(29)];
		expect(suggestInterval({ ...base, entries, fixedSchedule: true })).toBeNull();
	});

	it('takes entries in any order', () => {
		const entries = [water(29), damp(26), water(19), damp(17), water(10), damp(8), water(1)];
		expect(suggestInterval({ ...base, entries })?.toDays).toBe(9);
	});

	it('uses the median gap, so one odd round does not swing it', () => {
		const entries = [water(1), damp(8), water(10), damp(17), water(19), damp(26), water(40)];
		expect(suggestInterval({ ...base, entries })?.toDays).toBe(9);
	});
});
