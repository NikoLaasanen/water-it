import { describe, expect, it } from 'vitest';
import { presetById } from '#lib/presets/index.js';
import type { Plant } from '#lib/types/plant.js';
import { PlantForm } from './plant-form.svelte.js';

// Runs against the compiled English messages, like labels.spec.ts.

const pilea = presetById('pilea-peperomioides')!;

describe('PlantForm prefill', () => {
	it('starts from the preset: its short name and care, in the current language', () => {
		const form = new PlantForm(pilea, 'fi');
		expect(form.name).toBe('Pilea');
		expect(form.light).toBe(pilea.care.light.fi);
		expect(form.growing).toBe(7);
		expect(form.watchOuts.split('\n')).toHaveLength(3);
		expect(form.edited.length).toBe(0);
	});

	it('starts blank without a preset', () => {
		const form = new PlantForm(undefined, 'en');
		expect(form.name).toBe('');
		expect(form.light).toBe('');
		expect(form.edited.length).toBe(0);
	});

	it('loads an existing plant with its overrides applied', () => {
		const plant = {
			id: 'p1',
			name: 'Pippa',
			health: 'thriving',
			speciesId: pilea.id,
			pot: { material: 'terracotta', topLayer: 'pebbles' },
			careOverrides: { dryDownTest: 'Skewer' },
			createdAt: null
		} as unknown as Plant;
		const form = new PlantForm(pilea, 'en', plant);
		expect(form.name).toBe('Pippa');
		expect(form.dryDownTest).toBe('Skewer');
		expect(form.potMaterial).toBe('terracotta');
		expect([...form.edited]).toEqual(['dryDownTest']);
	});
});

describe('PlantForm edits', () => {
	it('tracks edited fields and resets one back to the preset', () => {
		const form = new PlantForm(pilea, 'en');
		form.dryDownTest = 'Skewer under the pebbles';
		form.growing = 9;
		expect([...form.edited].sort()).toEqual(['checkIntervalDays', 'dryDownTest']);

		form.reset('checkIntervalDays');
		expect(form.growing).toBe(7);
		expect([...form.edited]).toEqual(['dryDownTest']);
	});

	it('writes only the overrides, the plant fields, and nothing undefined-only', () => {
		const form = new PlantForm(pilea, 'en');
		form.location = '  Living room window ';
		form.potMaterial = 'terracotta';
		form.dryDownTest = 'Skewer';
		const data = form.toPlantData();
		expect(data).toMatchObject({
			name: 'Pilea',
			speciesId: 'pilea-peperomioides',
			location: 'Living room window',
			pot: { material: 'terracotta' },
			careOverrides: { dryDownTest: 'Skewer' }
		});
		expect(data.notes).toBeUndefined();
	});

	it('leaves out the pot entirely when nothing about it is known', () => {
		expect(new PlantForm(pilea, 'en').toPlantData().pot).toBeUndefined();
	});

	it('stores the whole profile for a blank plant, and no speciesId', () => {
		const form = new PlantForm(undefined, 'en');
		form.name = 'Mystery';
		form.light = 'North window';
		const data = form.toPlantData();
		expect(data.speciesId).toBeUndefined();
		expect(data.careOverrides).toMatchObject({ light: 'North window', lightLevel: 'medium' });
	});
});

describe('PlantForm validation', () => {
	it('accepts the prefilled preset form', () => {
		const form = new PlantForm(pilea, 'en');
		expect(form.validate()).toBe(true);
		expect(form.errors).toEqual({});
	});

	it('requires a name', () => {
		const form = new PlantForm(pilea, 'en');
		form.name = '   ';
		expect(form.validate()).toBe(false);
		expect(form.errors.name).toBe('Give it a name.');
	});

	it('wants both ends of the comfortable range, lower first', () => {
		const form = new PlantForm(pilea, 'en');
		form.comfortMax = null;
		expect(form.validate()).toBe(false);
		expect(form.errors.comfortMax).toBeDefined();

		form.comfortMin = 25;
		form.comfortMax = 18;
		expect(form.validate()).toBe(false);

		form.comfortMin = null;
		form.comfortMax = null;
		expect(form.validate()).toBe(true);
	});

	it('flags numbers out of range and a malformed month', () => {
		const form = new PlantForm(pilea, 'en');
		form.potSize = 0;
		form.fertilizeDays = 400;
		form.acquired = '2024-13';
		expect(form.validate()).toBe(false);
		expect(Object.keys(form.errors).sort()).toEqual(['acquired', 'fertilizeDays', 'potSize']);
	});
});
