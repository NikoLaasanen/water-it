import { describe, expect, it } from 'vitest';
import { careRows, nextCheckDetailLabel } from './labels.js';
import type { CareProfile } from '#lib/types/plant.js';

// These run against the compiled English messages, so they check the real
// sentences the Care tab shows — the thing a type checker can't see.

// What a plant added by hand would have: the fields the form will require,
// and nothing else.
const minimal: CareProfile = {
	light: 'Medium indirect light',
	lightLevel: 'medium',
	wateringStyle: 'soak-and-dry',
	checkIntervalDays: { growing: 7, resting: 14 }
};

const full: CareProfile = {
	...minimal,
	light: 'Bright indirect light; avoid hot direct sun',
	dryDownTest: 'Skewer dry 2–3 cm down.',
	tempMinC: 10,
	tempComfortC: [15, 24],
	fertilize: { intervalDays: 30, growingOnly: true },
	repotIntervalMonths: 24,
	watchOuts: ['Overwatering', 'Cold drafts']
};

describe('careRows', () => {
	it('lists every row, in the order screens.md gives', () => {
		expect(careRows(full).map((row) => row.label)).toEqual([
			'Light',
			'Watering',
			'Check test',
			'Temperature',
			'Fertilizing',
			'Repot',
			'Watch out'
		]);
	});

	it('drops rows with nothing to say instead of showing them empty', () => {
		// A plant added by hand may have only the two required fields. A column
		// of blank values would read as something broken.
		expect(careRows(minimal).map((row) => row.label)).toEqual(['Light', 'Watering']);
	});

	it('keeps the light row out when the sentence is blank or spaces', () => {
		expect(careRows({ ...minimal, light: '   ' }).map((row) => row.label)).toEqual(['Watering']);
	});

	it('describes the watering style and the rhythm together', () => {
		const watering = (care: CareProfile) =>
			careRows(care).find((row) => row.label === 'Watering')?.value;

		expect(watering(full)).toBe(
			'Soak, then let it dry. Check every 7 days when growing, 14 when resting.'
		);
		expect(watering({ ...full, wateringStyle: 'keep-moist' })).toBe(
			'Keep the soil lightly moist. Check every 7 days when growing, 14 when resting.'
		);
		expect(watering({ ...full, wateringStyle: 'sparse' })).toBe(
			'Water sparingly, and let it dry out well. Check every 7 days when growing, 14 when resting.'
		);
	});

	it('says water, not check, on a fixed schedule', () => {
		// A different instruction, not just different wording: "water every N
		// days" ignores the soil, which is the point of the flag.
		const value = careRows({ ...full, fixedSchedule: true }).find(
			(row) => row.label === 'Watering'
		)?.value;

		expect(value).toContain('Water every 7 days when growing');
		expect(value).not.toContain('Check every');
	});

	it('combines the comfortable range with the damage threshold', () => {
		const temperature = (care: CareProfile) =>
			careRows(care).find((row) => row.label === 'Temperature')?.value;

		expect(temperature(full)).toBe('15–24 °C. Damage below 10 °C.');
		// Either half can stand alone.
		expect(temperature({ ...full, tempMinC: undefined })).toBe('15–24 °C.');
		expect(temperature({ ...full, tempComfortC: undefined })).toBe('Damage below 10 °C.');
	});

	it('distinguishes feeding in the growing season from all year', () => {
		const fertilizing = (care: CareProfile) =>
			careRows(care).find((row) => row.label === 'Fertilizing')?.value;

		expect(fertilizing(full)).toBe('Every 30 days in the growing season, none when resting.');
		expect(fertilizing({ ...full, fertilize: { intervalDays: 30, growingOnly: false } })).toBe(
			'Every 30 days.'
		);
	});

	it('runs the watch-outs into one sentence', () => {
		expect(careRows(full).find((row) => row.label === 'Watch out')?.value).toBe(
			'Overwatering. Cold drafts.'
		);
	});
});

describe('nextCheckDetailLabel', () => {
	it('counts the days overdue, with the singular for one', () => {
		expect(nextCheckDetailLabel({ kind: 'overdue', days: 1 })).toBe('Check overdue 1 day');
		expect(nextCheckDetailLabel({ kind: 'overdue', days: 3 })).toBe('Check overdue 3 days');
	});

	it('covers the other states', () => {
		expect(nextCheckDetailLabel({ kind: 'today' })).toBe('Check due today');
		expect(nextCheckDetailLabel({ kind: 'in-days', days: 9 })).toBe('Next check In 9 days');
		expect(nextCheckDetailLabel({ kind: 'unscheduled' })).toBe('No check scheduled');
	});
});
