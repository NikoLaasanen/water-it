import { describe, expect, it } from 'vitest';
import type { CareProfile, LogEntry, Plant } from '#lib/types/plant.js';
import {
	fertilizeDue,
	reminderCards,
	reminderTasks,
	repotDue,
	soonReminders,
	type StoredReminder
} from './reminders.js';

const plain = { dormant: false, underGrowLight: false };
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('fertilizeDue', () => {
	const care = { fertilize: { intervalDays: 30, growingOnly: true } };

	it('adds the interval', () => {
		expect(fertilizeDue(care, plain, d(2026, 5, 10))).toEqual(d(2026, 6, 9));
	});

	it('moves a growing-only date out of winter to the next growing month', () => {
		expect(fertilizeDue(care, plain, d(2026, 9, 20))).toEqual(d(2027, 4, 1));
		expect(fertilizeDue(care, plain, d(2026, 11, 13))).toEqual(d(2027, 4, 1));
	});

	it('keeps winter dates under a grow light, or when the profile feeds all year', () => {
		expect(fertilizeDue(care, { ...plain, underGrowLight: true }, d(2026, 11, 1))).toEqual(
			d(2026, 12, 1)
		);
		expect(
			fertilizeDue({ fertilize: { intervalDays: 30, growingOnly: false } }, plain, d(2026, 11, 1))
		).toEqual(d(2026, 12, 1));
	});

	it('gives none for a dormant plant or a profile without fertilising', () => {
		expect(fertilizeDue(care, { ...plain, dormant: true }, d(2026, 5, 1))).toBeNull();
		expect(fertilizeDue({}, plain, d(2026, 5, 1))).toBeNull();
	});
});

describe('repotDue', () => {
	it('adds the months and moves the date forward into spring (April–May)', () => {
		expect(repotDue({ repotIntervalMonths: 24 }, d(2025, 4, 20))).toEqual(d(2027, 4, 20));
		expect(repotDue({ repotIntervalMonths: 24 }, d(2024, 11, 13))).toEqual(d(2027, 4, 1));
		expect(repotDue({ repotIntervalMonths: 12 }, d(2026, 2, 10))).toEqual(d(2027, 4, 1));
	});

	it('gives none without an interval', () => {
		expect(repotDue({}, d(2026, 1, 1))).toBeNull();
	});
});

const care: CareProfile = {
	light: '',
	lightLevel: 'medium',
	wateringStyle: 'soak-and-dry',
	checkIntervalDays: { growing: 7, resting: 14 },
	fertilize: { intervalDays: 30, growingOnly: false },
	repotIntervalMonths: 24
};
const ts = (date: Date) => ({ toDate: () => date, toMillis: () => date.getTime() });
const plant = (id: string, added: Date) =>
	({ id, name: id, ...plain, createdAt: ts(added) }) as unknown as Plant;

describe('reminderTasks', () => {
	it('counts from the last time it was done, or from when the plant was added', () => {
		const stored: StoredReminder[] = [
			{ id: 'fertilize-a', plantId: 'a', kind: 'fertilize', lastDone: '2026-11-01' }
		];
		const tasks = reminderTasks([plant('a', d(2026, 1, 5))], stored, () => care);
		expect(tasks.map((t) => [t.id, t.nextDue])).toEqual([
			['fertilize-a', '2026-12-01'],
			['repot-a', '2028-04-01']
		]);
	});

	it('carries a Later', () => {
		const stored: StoredReminder[] = [
			{ id: 'fertilize-a', plantId: 'a', kind: 'fertilize', snoozedUntil: '2026-11-20' }
		];
		const [fertilize] = reminderTasks([plant('a', d(2026, 10, 1))], stored, () => care);
		expect(fertilize.snoozedUntil).toBe('2026-11-20');
	});
});

describe('reminderCards', () => {
	const today = d(2026, 11, 14);
	const a = plant('a', d(2026, 10, 1));

	it('shows the ones due today or earlier, most overdue first', () => {
		const tasks = reminderTasks([a, plant('b', d(2026, 10, 10))], [], () => care);
		const cards = reminderCards([a], tasks, [], [], today, 'en');
		expect(cards.map((c) => [c.state, c.plant.id, c.kind])).toEqual([['open', 'a', 'fertilize']]);
		expect(cards[0].state === 'open' && cards[0].overdueDays).toBe(14);
	});

	it('hides one put off with Later', () => {
		const stored: StoredReminder[] = [
			{ id: 'fertilize-a', plantId: 'a', kind: 'fertilize', snoozedUntil: '2026-11-21' }
		];
		const tasks = reminderTasks([a], stored, () => care);
		expect(reminderCards([a], tasks, stored, [], today, 'en')).toEqual([]);
	});

	it('keeps one done today, with Undo while nothing has changed it since', () => {
		const stored: StoredReminder[] = [
			{ id: 'fertilize-a', plantId: 'a', kind: 'fertilize', lastDone: '2026-11-14' }
		];
		const entry = {
			id: 'e1',
			plantId: 'a',
			kind: 'fertilized',
			at: ts(new Date(2026, 10, 14, 9)),
			reminder: { before: null }
		} as unknown as LogEntry;
		const tasks = reminderTasks([a], stored, () => care);
		const [card] = reminderCards([a], tasks, stored, [entry], today, 'en');
		expect(card.state).toBe('done');
		expect(card.state === 'done' && card.canUndo).toBe(true);
		expect(card.state === 'done' && card.next).toEqual(d(2026, 12, 14));
	});
});

describe('soonReminders', () => {
	it('keeps the ones due within two weeks', () => {
		const task = (id: string, nextDue: string) => ({
			id,
			plantId: 'a',
			kind: 'fertilize' as const,
			nextDue
		});
		const today = d(2026, 11, 14);
		expect(
			soonReminders(
				[task('a', '2026-11-20'), task('b', '2026-11-28'), task('c', '2027-04-01')],
				today
			).map((t) => t.id)
		).toEqual(['a', 'b']);
	});
});
