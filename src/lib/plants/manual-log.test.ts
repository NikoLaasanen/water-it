import { describe, expect, it } from 'vitest';
import {
	NOTE_MAX,
	isManualEntry,
	manualEntryTime,
	manualNote,
	validateManual,
	type ManualDraft
} from './manual-log.js';

const today = new Date(2026, 10, 14, 15, 30);
const draft = (extra: Partial<ManualDraft> = {}): ManualDraft => ({
	kind: 'fertilized',
	date: '2026-11-14',
	note: '',
	location: '',
	...extra
});

describe('validateManual', () => {
	it('accepts a plain entry for today with no note', () => {
		expect(validateManual(draft(), today)).toEqual({});
	});

	it('needs a kind and a day that is not in the future', () => {
		expect(validateManual(draft({ kind: undefined }), today)).toEqual({ kind: 'kind' });
		expect(validateManual(draft({ date: '2026-11-15' }), today)).toEqual({ date: 'date' });
		expect(validateManual(draft({ date: '' }), today)).toEqual({ date: 'date' });
		expect(validateManual(draft({ date: '2026-10-01' }), today)).toEqual({});
	});

	it('needs text for a Note, and a place for Moved', () => {
		expect(validateManual(draft({ kind: 'note', note: '  ' }), today)).toEqual({
			note: 'note-missing'
		});
		expect(validateManual(draft({ kind: 'moved' }), today)).toEqual({ location: 'location' });
		expect(validateManual(draft({ kind: 'moved', location: 'Bedroom' }), today)).toEqual({});
	});

	it('caps the note length', () => {
		expect(validateManual(draft({ note: 'x'.repeat(NOTE_MAX + 1) }), today)).toEqual({
			note: 'note-long'
		});
	});
});

describe('manualEntryTime', () => {
	it('is now for today, midday for an earlier day', () => {
		expect(manualEntryTime('2026-11-14', today)).toBe(today);
		expect(manualEntryTime('2026-11-02', today)).toEqual(new Date(2026, 10, 2, 12));
	});
});

describe('manualNote', () => {
	it('stores the note trimmed, or nothing', () => {
		expect(manualNote(draft({ note: '  Half dose ' }))).toBe('Half dose');
		expect(manualNote(draft())).toBeUndefined();
	});

	it('leads with the new spot for Moved', () => {
		expect(manualNote(draft({ kind: 'moved', location: 'Bedroom' }))).toBe('Bedroom');
		expect(manualNote(draft({ kind: 'moved', location: 'Bedroom', note: 'Less sun' }))).toBe(
			'Bedroom — Less sun'
		);
	});
});

describe('isManualEntry', () => {
	it('is true for hand-logged kinds without a check', () => {
		expect(isManualEntry({ kind: 'note' })).toBe(true);
		expect(isManualEntry({ kind: 'watered' })).toBe(false);
		expect(
			isManualEntry({
				kind: 'fertilized',
				check: { before: null, nextDue: '2026-11-20', intervalDays: 7 }
			})
		).toBe(false);
	});
});
