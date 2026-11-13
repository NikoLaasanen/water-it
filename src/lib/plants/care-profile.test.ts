import { describe, expect, it } from 'vitest';
import { presetById } from '#lib/presets/index.js';
import { BLANK_CARE, readOverrides, resolveCare } from './care-profile.js';

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
