import { describe, expect, it } from 'vitest';
import { partOfDay } from './part-of-day.js';

const at = (hour: number, minute = 0) => new Date(2026, 10, 14, hour, minute);

describe('partOfDay', () => {
	it('splits the day at 5, 12 and 18', () => {
		expect(partOfDay(at(4, 59))).toBe('evening');
		expect(partOfDay(at(5))).toBe('morning');
		expect(partOfDay(at(11, 59))).toBe('morning');
		expect(partOfDay(at(12))).toBe('afternoon');
		expect(partOfDay(at(17, 59))).toBe('afternoon');
		expect(partOfDay(at(18))).toBe('evening');
		expect(partOfDay(at(0))).toBe('evening');
	});
});
