import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import raw from './presets.json';
import { BLANK_PRESET, matchesPreset, presetById, presets, PresetsSchema } from './index.js';

// The presets file is hand-edited, and plants read their care text from it on
// every render, so these guard the two things a typo could break: the shape of
// the file, and the ids plants already point at.

describe('presets.json', () => {
	it('matches the schema', () => {
		const result = v.safeParse(PresetsSchema, raw);
		expect(result.issues?.map((issue) => `${v.getDotPath(issue)}: ${issue.message}`)).toBe(
			undefined
		);
	});

	it('has the starter presets from design.md §8, with permanent ids', () => {
		// Changing one of these ids orphans every plant that uses it. If this
		// test fails because an id was renamed, rename it back.
		expect(presets.map((preset) => preset.id)).toEqual([
			'pilea-peperomioides',
			'dracaena-marginata',
			'aloidendron-barberae',
			'crassula-ovata',
			'yucca-gigantea',
			'generic-succulent',
			'generic-tropical-foliage'
		]);
	});

	it('gives every generic preset a description, and every species a scientific name', () => {
		for (const preset of presets) {
			if (preset.kind === 'generic') expect(preset.description, preset.id).toBeDefined();
			else expect(preset.scientificName, preset.id).toBeTruthy();
		}
	});

	it('keeps the comfortable range in order and above the minimum', () => {
		for (const { id, care } of presets) {
			if (!care.tempComfortC) continue;
			const [low, high] = care.tempComfortC;
			expect(low, id).toBeLessThan(high);
			if (care.tempMinC !== undefined) expect(care.tempMinC, id).toBeLessThanOrEqual(low);
		}
	});

	it('never checks more often when resting than when growing', () => {
		for (const { id, care } of presets) {
			expect(care.checkIntervalDays.resting, id).toBeGreaterThanOrEqual(
				care.checkIntervalDays.growing
			);
		}
	});
});

describe('presetById', () => {
	it('finds a preset, and returns undefined for none or an unknown id', () => {
		expect(presetById('pilea-peperomioides')?.scientificName).toBe('Pilea peperomioides');
		expect(presetById(undefined)).toBeUndefined();
		expect(presetById('no-such-plant')).toBeUndefined();
	});
});

describe('BLANK_PRESET', () => {
	it('can never collide with a preset id', () => {
		expect(presetById(BLANK_PRESET)).toBeUndefined();
	});
});

describe('matchesPreset', () => {
	const pilea = presetById('pilea-peperomioides')!;

	it('matches every preset on an empty query', () => {
		expect(presets.every((preset) => matchesPreset(preset, '  ', 'en'))).toBe(true);
	});

	it('finds by short, common or scientific name, ignoring case', () => {
		expect(matchesPreset(pilea, 'PILEA', 'en')).toBe(true);
		expect(matchesPreset(pilea, 'money plant', 'en')).toBe(true);
		expect(matchesPreset(pilea, 'peperomioides', 'en')).toBe(true);
	});

	it('finds by the name in the other language too', () => {
		expect(matchesPreset(pilea, 'kiinanpilea', 'en')).toBe(true);
		expect(matchesPreset(pilea, 'money', 'fi')).toBe(true);
	});

	it('needs every word to match', () => {
		expect(matchesPreset(pilea, 'money tree', 'en')).toBe(false);
	});
});
