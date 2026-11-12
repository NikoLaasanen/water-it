import { describe, expect, it } from 'vitest';
import { effectiveDueDate, nextCheck, parseLocalDate, waterLevel } from './care.js';

describe('waterLevel', () => {
	it('maps every watering style', () => {
		expect(waterLevel('sparse')).toBe('little');
		expect(waterLevel('soak-and-dry')).toBe('moderate');
		expect(waterLevel('keep-moist')).toBe('lots');
	});
});

describe('parseLocalDate', () => {
	it('reads the date in the local zone, not UTC', () => {
		const parsed = parseLocalDate('2026-11-14');
		// Reading it as UTC midnight would give the 13th anywhere east of
		// Greenwich, so a check due tomorrow would look due today in Helsinki.
		expect(parsed?.getFullYear()).toBe(2026);
		expect(parsed?.getMonth()).toBe(10);
		expect(parsed?.getDate()).toBe(14);
		expect(parsed?.getHours()).toBe(0);
	});

	it('rejects malformed and impossible dates', () => {
		expect(parseLocalDate('')).toBeNull();
		expect(parseLocalDate('2026-11-14T10:00:00Z')).toBeNull();
		expect(parseLocalDate('14.11.2026')).toBeNull();
		// Would otherwise roll over into March and schedule a phantom check.
		expect(parseLocalDate('2026-02-31')).toBeNull();
		expect(parseLocalDate('2026-13-01')).toBeNull();
	});
});

describe('effectiveDueDate', () => {
	it('uses the due date when there is no snooze', () => {
		expect(effectiveDueDate({ nextDue: '2026-11-14' })).toEqual(new Date(2026, 10, 14));
	});

	it('pushes the date out when snoozed past it', () => {
		expect(effectiveDueDate({ nextDue: '2026-11-14', snoozedUntil: '2026-11-16' })).toEqual(
			new Date(2026, 10, 16)
		);
	});

	it('never pulls a check earlier than its due date', () => {
		// A stale snooze must not make a plant look due sooner than it is.
		expect(effectiveDueDate({ nextDue: '2026-11-14', snoozedUntil: '2026-11-01' })).toEqual(
			new Date(2026, 10, 14)
		);
	});

	it('is null when the stored date is unusable', () => {
		expect(effectiveDueDate({ nextDue: 'soon' })).toBeNull();
	});
});

describe('nextCheck', () => {
	const today = new Date(2026, 10, 12, 14, 30); // Thu 12 Nov 2026, mid-afternoon

	it('counts whole calendar days overdue, not elapsed hours', () => {
		// 23:00 yesterday to 14:30 today is under 24 hours but is still a day
		// late, which is what someone looking at the list means by "overdue".
		expect(nextCheck({ nextDue: '2026-11-11' }, today)).toEqual({ kind: 'overdue', days: 1 });
		expect(nextCheck({ nextDue: '2026-11-05' }, today)).toEqual({ kind: 'overdue', days: 7 });
	});

	it('calls today today', () => {
		expect(nextCheck({ nextDue: '2026-11-12' }, today)).toEqual({ kind: 'today' });
	});

	it('names the weekday for the days just ahead', () => {
		expect(nextCheck({ nextDue: '2026-11-13' }, today)).toEqual({
			kind: 'weekday',
			date: new Date(2026, 10, 13)
		});
		expect(nextCheck({ nextDue: '2026-11-18' }, today)).toEqual({
			kind: 'weekday',
			date: new Date(2026, 10, 18)
		});
	});

	it('counts days once a weekday name would be ambiguous', () => {
		// A week out, "Thu" could mean either Thursday.
		expect(nextCheck({ nextDue: '2026-11-19' }, today)).toEqual({ kind: 'in-days', days: 7 });
		expect(nextCheck({ nextDue: '2026-11-21' }, today)).toEqual({ kind: 'in-days', days: 9 });
	});

	it('respects a snooze', () => {
		expect(nextCheck({ nextDue: '2026-11-10', snoozedUntil: '2026-11-15' }, today)).toEqual({
			kind: 'weekday',
			date: new Date(2026, 10, 15)
		});
	});

	it('is unscheduled with no task or an unusable date', () => {
		expect(nextCheck(undefined, today)).toEqual({ kind: 'unscheduled' });
		expect(nextCheck({ nextDue: '' }, today)).toEqual({ kind: 'unscheduled' });
	});

	it('is not thrown off by the time of day', () => {
		// Same calendar day, one minute before midnight: still "today", not overdue.
		const lateNight = new Date(2026, 10, 12, 23, 59);
		expect(nextCheck({ nextDue: '2026-11-12' }, lateNight)).toEqual({ kind: 'today' });
	});
});
