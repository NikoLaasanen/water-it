import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { emulatorProjectId } from './config.js';

// The emulator project id is named in four places: this config, the
// `emulators` script, and the two seed scripts. If any of them drifts, the
// client talks to a different database inside the same emulator — one that is
// empty and, because no rules are loaded for it, wide open. Nothing fails:
// reads just come back empty and writes are never checked. It cost an evening
// once, so it is asserted here.

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('emulator project id', () => {
	it('matches the project the emulators are started with', () => {
		const { scripts } = JSON.parse(read('package.json'));
		const named = /--project\s+(\S+)/.exec(scripts.emulators)?.[1];

		expect(named, `package.json "emulators" must pass --project ${emulatorProjectId}`).toBe(
			emulatorProjectId
		);
	});

	it('matches the project the rules tests run against', () => {
		const { scripts } = JSON.parse(read('package.json'));
		const named = /--project\s+(\S+)/.exec(scripts['test:rules'])?.[1];

		expect(named, 'rules tests must run against the same project as dev').toBe(emulatorProjectId);
	});

	it.each(['scripts/seed-emulator.mjs', 'scripts/seed-plants.mjs'])(
		'matches the project %s seeds',
		(script) => {
			const named = /const PROJECT = '([^']+)'/.exec(read(script))?.[1];

			expect(named, `${script} seeds the wrong project`).toBe(emulatorProjectId);
		}
	);

	it('is a demo project, so the emulators can never reach production', () => {
		// The `demo-` prefix is what makes the emulators work offline and
		// unauthenticated, and what stops a stray config from writing to the
		// real project.
		expect(emulatorProjectId.startsWith('demo-')).toBe(true);
	});
});
