import { describe, expect, it } from 'vitest';
import type { LogEntry, Plant, Task } from '#lib/types/plant.js';
import {
	canUndo,
	comingUp,
	dayRef,
	lastWatered,
	latestAnswerFor,
	todayCards,
	weekAhead
} from './today.js';

const today = new Date(2026, 10, 13, 9);
const plant = (id: string, name = id) => ({ id, name }) as Plant;
const task = (plantId: string, nextDue: string, extra: Partial<Task> = {}): Task => ({
	id: `check-water-${plantId}`,
	plantId,
	kind: 'check-water',
	nextDue,
	intervalDays: 14,
	...extra
});
const at = (ms: number) => ({ toMillis: () => ms }) as LogEntry['at'];
const answer = (
	plantId: string,
	kind: LogEntry['kind'],
	beforeDue: string,
	nextDue: string,
	ms = 1
): LogEntry => ({
	id: `log-${plantId}-${ms}`,
	plantId,
	kind,
	at: at(ms),
	check: { before: { nextDue: beforeDue, intervalDays: 14 }, nextDue, intervalDays: 14 }
});

const cards = (plants: Plant[], tasks: Task[], log: LogEntry[] = []) =>
	todayCards(plants, tasks, log, today, 'en');

describe('todayCards', () => {
	it('lists checks due today or earlier, most overdue first, and nothing later', () => {
		const result = cards(
			[plant('a', 'Aloe'), plant('b', 'Basil'), plant('c', 'Cactus'), plant('d', 'Dracaena')],
			[
				task('a', '2026-11-13'),
				task('b', '2026-11-10'),
				task('c', '2026-11-14'),
				task('d', '2026-11-12')
			]
		);
		expect(result.map((c) => [c.plant.id, c.state === 'open' && c.overdueDays])).toEqual([
			['b', 3],
			['d', 1],
			['a', 0]
		]);
	});

	it('respects a snooze that is still running', () => {
		expect(cards([plant('a')], [task('a', '2026-11-10', { snoozedUntil: '2026-11-15' })])).toEqual(
			[]
		);
	});

	it('keeps an answered card in its place, with what happens next', () => {
		const result = cards(
			[plant('a', 'Aloe'), plant('b', 'Basil')],
			[task('a', '2026-11-13'), task('b', '2026-11-27')],
			[answer('b', 'watered', '2026-11-11', '2026-11-27')]
		);
		expect(result.map((c) => c.plant.id)).toEqual(['b', 'a']);
		expect(result[0]).toMatchObject({ state: 'answered', nextInDays: 14, canUndo: true });
	});

	it('shows the latest answer of the day, due by the first', () => {
		const [card] = cards(
			[plant('a')],
			[task('a', '2026-11-27')],
			[
				answer('a', 'checked-damp', '2026-11-13', '2026-11-16', 1),
				answer('a', 'watered', '2026-11-16', '2026-11-27', 2)
			]
		);
		expect(card).toMatchObject({ state: 'answered', answer: { kind: 'watered' }, canUndo: true });
	});

	it('leaves out a plant watered early from its own page', () => {
		expect(
			cards(
				[plant('a')],
				[task('a', '2026-11-27')],
				[answer('a', 'watered', '2026-11-20', '2026-11-27')]
			)
		).toEqual([]);
	});

	it('offers Undo only while the answer is the latest thing on the check', () => {
		const [card] = cards(
			[plant('a')],
			[task('a', '2026-11-30')],
			[answer('a', 'watered', '2026-11-13', '2026-11-27')]
		);
		expect(card).toMatchObject({ state: 'answered', canUndo: false });
	});

	it('skips a plant without a check, and a check without a plant', () => {
		expect(cards([plant('a')], [task('b', '2026-11-01')])).toEqual([]);
	});
});

describe('latestAnswerFor and canUndo', () => {
	const log = [
		answer('a', 'checked-damp', '2026-11-13', '2026-11-16', 1),
		answer('a', 'watered', '2026-11-16', '2026-11-27', 2),
		answer('b', 'skipped', '2026-11-13', '2026-11-14', 3)
	];

	it('picks the plant’s latest answer', () => {
		expect(latestAnswerFor(log, 'a')?.kind).toBe('watered');
		expect(latestAnswerFor(log, 'c')).toBeUndefined();
	});

	it('allows Undo only while the check is where the answer put it', () => {
		const latest = latestAnswerFor(log, 'a')!;
		expect(canUndo(task('a', '2026-11-27'), latest)).toBe(true);
		expect(canUndo(task('a', '2026-11-28'), latest)).toBe(false);
		expect(canUndo(undefined, latest)).toBe(false);
	});
});

describe('comingUp', () => {
	it('lists checks after today, soonest first, up to the limit', () => {
		const result = comingUp(
			[plant('a'), plant('b'), plant('c'), plant('d')],
			[
				task('a', '2026-11-20'),
				task('b', '2026-11-13'),
				task('c', '2026-11-14'),
				task('d', '2026-11-30')
			],
			today,
			2
		);
		expect(result.map((row) => row.plant.id)).toEqual(['c', 'a']);
	});
});

describe('dayRef', () => {
	const on = (d: number) => new Date(2026, 10, d);
	it('names nearby days, weekdays within six days, dates beyond', () => {
		expect(dayRef(on(13), today).kind).toBe('today');
		expect(dayRef(on(12), today).kind).toBe('yesterday');
		expect(dayRef(on(14), today).kind).toBe('tomorrow');
		expect(dayRef(on(11), today).kind).toBe('weekday');
		expect(dayRef(on(19), today).kind).toBe('weekday');
		expect(dayRef(on(20), today).kind).toBe('date');
		expect(dayRef(on(6), today).kind).toBe('date');
	});
});

describe('lastWatered', () => {
	it('is the latest watering, ignoring other answers and older checks', () => {
		const result = lastWatered([
			task('a', '2026-11-20', { lastAnswer: { kind: 'watered', on: '2026-11-09' } }),
			task('b', '2026-11-20', { lastAnswer: { kind: 'watered', on: '2026-11-11' } }),
			task('c', '2026-11-20', { lastAnswer: { kind: 'checked-damp', on: '2026-11-12' } }),
			task('d', '2026-11-20')
		]);
		expect(result).toEqual(new Date(2026, 10, 11));
	});

	it('is null when nothing has been watered yet', () => {
		expect(lastWatered([task('a', '2026-11-20')])).toBeNull();
	});
});

describe('weekAhead', () => {
	it('puts each plant on the day of its next check, for seven days', () => {
		const week = weekAhead(
			[plant('a', 'Aloe'), plant('b', 'Basil'), plant('c', 'Cactus'), plant('d', 'Dracaena')],
			[
				task('b', '2026-11-14'),
				task('a', '2026-11-14'),
				task('c', '2026-11-19'),
				task('d', '2026-11-20')
			],
			today,
			'en'
		);
		expect(week).toHaveLength(7);
		expect(week[0].date).toEqual(new Date(2026, 10, 13));
		expect(week[1].plants.map((p) => p.name)).toEqual(['Aloe', 'Basil']);
		expect(week[6].plants.map((p) => p.name)).toEqual(['Cactus']);
		expect(week.flatMap((day) => day.plants)).toHaveLength(3);
	});
});
