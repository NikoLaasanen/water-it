import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { BACKUP_FORMAT, backupFileName, buildBackup, toJsonValue } from './backup.js';

describe('toJsonValue', () => {
	it('turns Timestamps into ISO strings, deep inside maps and arrays', () => {
		const at = Timestamp.fromDate(new Date('2026-11-14T08:30:00Z'));
		expect(
			toJsonValue({ at, nested: { list: [at, 'x'] }, due: '2026-11-20', n: 3, gone: null })
		).toEqual({
			at: '2026-11-14T08:30:00.000Z',
			nested: { list: ['2026-11-14T08:30:00.000Z', 'x'] },
			due: '2026-11-20',
			n: 3,
			gone: null
		});
	});

	it('survives a JSON round trip unchanged', () => {
		const value = toJsonValue({ a: [1, { b: true }], at: Timestamp.fromMillis(0) });
		expect(JSON.parse(JSON.stringify(value))).toEqual(value);
	});
});

describe('buildBackup', () => {
	const now = new Date('2026-11-14T12:00:00Z');

	it('marks the file and sorts plants by name, log oldest first', () => {
		const backup = buildBackup(
			{
				settings: null,
				plants: [
					{ id: 'b', name: 'Yucca' },
					{ id: 'a', name: 'Pilea' }
				],
				tasks: [{ id: 'repot-a' }, { id: 'check-a' }],
				log: [
					{ id: '2', at: Timestamp.fromDate(new Date('2026-11-10T10:00:00Z')) },
					{ id: '1', at: Timestamp.fromDate(new Date('2026-11-01T10:00:00Z')) }
				]
			},
			now
		);
		expect(backup.app).toBe('water-it');
		expect(backup.format).toBe(BACKUP_FORMAT);
		expect(backup.exportedAt).toBe('2026-11-14T12:00:00.000Z');
		expect(backup.plants.map((p) => p.name)).toEqual(['Pilea', 'Yucca']);
		expect(backup.tasks.map((t) => t.id)).toEqual(['check-a', 'repot-a']);
		expect(backup.log.map((e) => e.id)).toEqual(['1', '2']);
		expect(backup.log[0].at).toBe('2026-11-01T10:00:00.000Z');
	});
});

describe('backupFileName', () => {
	it('uses the local date', () => {
		expect(backupFileName(new Date(2026, 0, 5, 23, 59))).toBe('water-it-backup-2026-01-05.json');
	});
});
