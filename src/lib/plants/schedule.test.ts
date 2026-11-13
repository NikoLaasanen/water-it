import { describe, expect, it } from 'vitest';
import {
	checkDateAfter,
	dampSnoozeDays,
	nextDueAfter,
	currentIntervalDays,
	currentSeason,
	isGrowingSeason,
	rescheduleForNewInterval,
	toLocalDateString
} from './schedule.js';

// Local-time constructors throughout: the app works in calendar dates.
const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);
const care = { checkIntervalDays: { growing: 7, resting: 14 } };

describe('isGrowingSeason', () => {
	it('uses April–September by default, inclusive at both ends', () => {
		expect(isGrowingSeason(day(2026, 3, 31))).toBe(false);
		expect(isGrowingSeason(day(2026, 4, 1))).toBe(true);
		expect(isGrowingSeason(day(2026, 9, 30))).toBe(true);
		expect(isGrowingSeason(day(2026, 10, 1))).toBe(false);
	});

	it('honours other growing months', () => {
		expect(isGrowingSeason(day(2026, 3, 15), [3, 4, 5])).toBe(true);
		expect(isGrowingSeason(day(2026, 6, 15), [3, 4, 5])).toBe(false);
	});
});

describe('currentSeason and currentIntervalDays', () => {
	const summer = day(2026, 7, 1);
	const winter = day(2026, 11, 13);

	it('follows the calendar for an ordinary plant', () => {
		expect(currentSeason({}, summer)).toBe('growing');
		expect(currentIntervalDays(care, {}, summer)).toBe(7);
		expect(currentIntervalDays(care, {}, winter)).toBe(14);
	});

	it('keeps a plant under a grow light on the growing interval all year', () => {
		expect(currentIntervalDays(care, { underGrowLight: true }, winter)).toBe(7);
	});

	it('puts a dormant plant on the resting interval, even in summer or under a light', () => {
		expect(currentIntervalDays(care, { dormant: true }, summer)).toBe(14);
		expect(currentIntervalDays(care, { dormant: true, underGrowLight: true }, summer)).toBe(14);
	});
});

describe('toLocalDateString', () => {
	it('uses local parts, so just after midnight is still that day', () => {
		// toISOString() would say the 12th in Helsinki (UTC+2).
		expect(toLocalDateString(day(2026, 11, 13, 0))).toBe('2026-11-13');
	});
});

describe('checkDateAfter', () => {
	it('counts days on the calendar from the given day', () => {
		expect(checkDateAfter(day(2026, 11, 13), 14)).toBe('2026-11-27');
		expect(checkDateAfter(day(2026, 12, 25), 7)).toBe('2027-01-01');
	});

	it('is not thrown by the clock change', () => {
		// Finland moves to summer time on 29 March 2026; a 7-day check from the
		// 26th is still the 2nd, not the 1st.
		expect(checkDateAfter(day(2026, 3, 26, 0), 7)).toBe('2026-04-02');
	});
});

describe('rescheduleForNewInterval', () => {
	it('keeps counting from the last check when the interval changes', () => {
		// Checked on the 13th with a 14-day interval → due the 27th. Now 7 days
		// → due the 20th, a week after that check.
		expect(rescheduleForNewInterval('2026-11-27', 14, 7)).toBe('2026-11-20');
		expect(rescheduleForNewInterval('2026-11-27', 14, 21)).toBe('2026-12-04');
	});

	it('can land in the past, which makes the plant honestly overdue', () => {
		expect(rescheduleForNewInterval('2026-11-15', 30, 7)).toBe('2026-10-23');
	});

	it('leaves the date alone when nothing changed or it is unreadable', () => {
		expect(rescheduleForNewInterval('2026-11-27', 14, 14)).toBe('2026-11-27');
		expect(rescheduleForNewInterval('garbage', 14, 7)).toBe('garbage');
	});
});

describe('answering a check', () => {
	const today = day(2026, 11, 13);

	it('Watered: the full interval, counted from today', () => {
		expect(nextDueAfter('watered', today, 14)).toBe('2026-11-27');
	});

	it('Still damp: a quarter of the interval, at least two days', () => {
		expect(dampSnoozeDays(14)).toBe(3);
		expect(dampSnoozeDays(10)).toBe(2);
		expect(dampSnoozeDays(7)).toBe(2);
		expect(dampSnoozeDays(3)).toBe(2);
		expect(dampSnoozeDays(28)).toBe(7);
		expect(nextDueAfter('checked-damp', today, 7)).toBe('2026-11-15');
	});

	it('Skip: back tomorrow', () => {
		expect(nextDueAfter('skipped', today, 14)).toBe('2026-11-14');
	});

	it('crosses a month end as a calendar date', () => {
		expect(nextDueAfter('watered', day(2026, 1, 28, 23), 7)).toBe('2026-02-04');
	});

	it('is counted from today even when the check was weeks overdue', () => {
		expect(nextDueAfter('watered', day(2026, 12, 20), 14)).toBe('2027-01-03');
	});
});
