import { describe, expect, it } from 'vitest';
import {
	checkDateAfter,
	currentIntervalDays,
	currentSeason,
	isGrowingSeason,
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
