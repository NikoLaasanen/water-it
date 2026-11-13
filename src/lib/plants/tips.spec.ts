import { describe, expect, it } from 'vitest';
import { tipIndex, tipOfTheDay } from './tips.js';

describe('tipIndex', () => {
	it('moves on by one each local day and wraps around', () => {
		const a = tipIndex(new Date(2026, 10, 13, 0, 5), 5);
		expect(tipIndex(new Date(2026, 10, 13, 23, 55), 5)).toBe(a);
		expect(tipIndex(new Date(2026, 10, 14, 8), 5)).toBe((a + 1) % 5);
		expect(tipIndex(new Date(2026, 10, 18, 8), 5)).toBe(a);
	});
});

describe('tipOfTheDay', () => {
	it('picks from the season’s list', () => {
		expect(tipOfTheDay(new Date(2026, 10, 13), false).heading).toBe('Winter care');
		expect(tipOfTheDay(new Date(2026, 5, 13), true).heading).toBe('Growing season');
	});
});
