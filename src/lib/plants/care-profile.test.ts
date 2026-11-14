import { describe, expect, it } from 'vitest';
import { presetById } from '#lib/presets/index.js';
import {
	BLANK_CARE,
	diffOverrides,
	presetCare,
	readOverrides,
	resolveCare,
	withIntervals
} from './care-profile.js';

const pilea = presetById('pilea-peperomioides')!;

describe('resolveCare', () => {
	it('reads an unedited plant entirely from its preset, in the asked language', () => {
		const en = resolveCare(pilea, {}, 'en');
		const fi = resolveCare(pilea, {}, 'fi');

		expect(en.edited).toEqual([]);
		expect(en.care.light).toBe(pilea.care.light.en);
		expect(fi.care.light).toBe(pilea.care.light.fi);
		expect(fi.care.watchOuts).toEqual(pilea.care.watchOuts?.map((text) => text.fi));
		expect(en.care.checkIntervalDays).toEqual({ growing: 7, resting: 14 });
	});

	it('lays edits over the preset and reports them in display order', () => {
		const { care, edited } = resolveCare(
			pilea,
			{ watchOuts: ['Cat chews it'], dryDownTest: 'Skewer under the pebbles' },
			'fi'
		);

		expect(care.dryDownTest).toBe('Skewer under the pebbles');
		expect(care.watchOuts).toEqual(['Cat chews it']);
		// Untouched fields still follow the preset, and the language.
		expect(care.light).toBe(pilea.care.light.fi);
		expect(edited).toEqual(['dryDownTest', 'watchOuts']);
	});

	it('replaces an interval override whole, never field by field', () => {
		const { care } = resolveCare(pilea, { checkIntervalDays: { growing: 10, resting: 20 } }, 'en');
		expect(care.checkIntervalDays).toEqual({ growing: 10, resting: 20 });
	});

	it('does not let an edit leak back into the preset', () => {
		const { care } = resolveCare(pilea, {}, 'en');
		care.checkIntervalDays.growing = 99;
		care.tempComfortC![0] = 99;
		expect(pilea.care.checkIntervalDays.growing).toBe(7);
		expect(pilea.care.tempComfortC?.[0]).toBe(15);
	});

	it('falls back to a blank profile without a preset, with nothing marked edited', () => {
		expect(resolveCare(undefined, {}, 'en')).toEqual({ care: BLANK_CARE, edited: [] });

		const own = resolveCare(undefined, { light: 'North window' }, 'en');
		expect(own.care.light).toBe('North window');
		// No preset to differ from, so no "Edited" tags.
		expect(own.edited).toEqual([]);
	});
});

describe('readOverrides', () => {
	it('keeps well-formed fields', () => {
		const stored = {
			light: 'North window',
			lightLevel: 'low',
			wateringStyle: 'keep-moist',
			checkIntervalDays: { growing: 5, resting: 9 },
			fixedSchedule: true,
			dryDownTest: 'Finger test',
			tempMinC: 12,
			tempComfortC: [18, 25],
			fertilize: { intervalDays: 14, growingOnly: false },
			repotIntervalMonths: 12,
			watchOuts: ['Thrips']
		};
		expect(readOverrides(stored)).toEqual(stored);
	});

	it('drops malformed fields, which then read as not edited', () => {
		expect(
			readOverrides({
				lightLevel: 'blinding',
				checkIntervalDays: { growing: 5 },
				tempComfortC: [18],
				fertilize: { intervalDays: 0, growingOnly: true },
				watchOuts: ['ok', 3],
				repotIntervalMonths: 1.5,
				somethingElse: 'x'
			})
		).toEqual({});
	});

	it('treats anything but an object as no overrides', () => {
		expect(readOverrides(undefined)).toEqual({});
		expect(readOverrides('pilea')).toEqual({});
		expect(readOverrides(['light'])).toEqual({});
	});
});

describe('diffOverrides', () => {
	it('stores nothing for an untouched preset profile', () => {
		expect(diffOverrides(presetCare(pilea, 'fi'), pilea, 'fi')).toEqual({});
	});

	it('stores only the fields that differ', () => {
		const edited = {
			...presetCare(pilea, 'en'),
			dryDownTest: 'Skewer under the pebbles',
			checkIntervalDays: { growing: 9, resting: 14 }
		};
		expect(diffOverrides(edited, pilea, 'en')).toEqual({
			checkIntervalDays: { growing: 9, resting: 14 },
			dryDownTest: 'Skewer under the pebbles'
		});
	});

	it('drops an edit that was typed back to the preset value', () => {
		const edited = { ...presetCare(pilea, 'en'), light: pilea.care.light.en };
		expect(diffOverrides(edited, pilea, 'en')).toEqual({});
	});

	it('stores a cleared field so the preset does not come back', () => {
		const edited = {
			...presetCare(pilea, 'en'),
			light: '',
			tempMinC: undefined,
			watchOuts: []
		};
		const overrides = diffOverrides(edited, pilea, 'en');
		expect(overrides).toEqual({ light: '', tempMinC: null, watchOuts: null });
		// …and reading it back shows nothing there.
		const { care, edited: fields } = resolveCare(pilea, overrides, 'en');
		expect(care.light).toBe('');
		expect(care.tempMinC).toBeUndefined();
		expect(care.watchOuts).toBeUndefined();
		expect(fields).toEqual(['light', 'tempMinC', 'watchOuts']);
	});

	it('ignores fixedSchedule off when the preset has none', () => {
		const edited = { ...presetCare(pilea, 'en'), fixedSchedule: false };
		expect(diffOverrides(edited, pilea, 'en')).toEqual({});
	});

	it('stores every filled-in field for a plant without a preset', () => {
		const own = { ...BLANK_CARE, light: 'North window', dryDownTest: '', watchOuts: [] };
		expect(diffOverrides(own, undefined, 'en')).toEqual({
			light: 'North window',
			lightLevel: 'medium',
			wateringStyle: 'soak-and-dry',
			checkIntervalDays: { growing: 7, resting: 14 }
		});
	});
});

describe('readOverrides and null', () => {
	it('keeps null on optional fields, meaning cleared', () => {
		expect(readOverrides({ tempMinC: null, watchOuts: null, light: null })).toEqual({
			tempMinC: null,
			watchOuts: null
		});
	});
});

describe('withIntervals', () => {
	it('sets the intervals and keeps the other overrides', () => {
		expect(withIntervals({ dryDownTest: 'Skewer' }, pilea, { growing: 7, resting: 18 })).toEqual({
			dryDownTest: 'Skewer',
			checkIntervalDays: { growing: 7, resting: 18 }
		});
	});

	it("removes the override when the intervals are back to the preset's", () => {
		expect(
			withIntervals({ checkIntervalDays: { growing: 7, resting: 18 } }, pilea, {
				growing: 7,
				resting: 14
			})
		).toEqual({});
	});

	it('always stores them for a plant with no preset', () => {
		expect(withIntervals({}, undefined, { growing: 7, resting: 14 })).toEqual({
			checkIntervalDays: { growing: 7, resting: 14 }
		});
	});
});
