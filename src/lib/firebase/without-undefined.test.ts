import { describe, expect, it } from 'vitest';
import { fieldsForUpdate, withoutUndefined } from './without-undefined.js';

describe('withoutUndefined', () => {
	it('drops undefined fields at any depth, keeping null, false and 0', () => {
		expect(
			withoutUndefined({
				name: 'Pilea',
				location: undefined,
				dormant: false,
				pot: { material: 'terracotta', sizeCm: undefined, topLayer: undefined },
				careOverrides: { tempMinC: null, repotIntervalMonths: 0 },
				list: [{ a: 1, b: undefined }]
			})
		).toEqual({
			name: 'Pilea',
			dormant: false,
			pot: { material: 'terracotta' },
			careOverrides: { tempMinC: null, repotIntervalMonths: 0 },
			list: [{ a: 1 }]
		});
	});

	it('leaves non-plain objects, like Firestore sentinels or dates, alone', () => {
		const date = new Date(0);
		expect(withoutUndefined({ at: date }).at).toBe(date);
	});
});

describe('fieldsForUpdate', () => {
	it('turns cleared top-level fields into the delete marker, and writes maps whole', () => {
		const REMOVE = Symbol('deleteField');
		expect(
			fieldsForUpdate(
				{
					name: 'Pilea',
					location: undefined,
					pot: { material: 'plastic', sizeCm: undefined },
					careOverrides: {}
				},
				REMOVE
			)
		).toEqual({
			name: 'Pilea',
			location: REMOVE,
			pot: { material: 'plastic' },
			careOverrides: {}
		});
	});
});
