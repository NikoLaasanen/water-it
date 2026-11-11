import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

// CLAUDE.md: "No hard-coded UI text. Every user-facing string goes through
// Paraglide messages, in both `en` and `fi`." Paraglide itself does not fail a
// build when a locale is missing a key — it falls back to the base locale — so
// a drift between en and fi would ship silently as English text in a Finnish
// UI. This test is the guard.

const messagesDir = join(dirname(fileURLToPath(import.meta.url)), '../../../messages');

function keysOf(locale: string): string[] {
	const raw = JSON.parse(readFileSync(join(messagesDir, `${locale}.json`), 'utf8'));
	return Object.keys(raw)
		.filter((key) => key !== '$schema')
		.sort();
}

describe('paraglide messages', () => {
	it('defines the same message keys in every locale', () => {
		const en = keysOf('en');
		const fi = keysOf('fi');

		expect(fi, 'fi.json is missing keys present in en.json (or has extras)').toEqual(en);
	});

	it('has no empty translations', () => {
		for (const locale of ['en', 'fi']) {
			const raw = JSON.parse(readFileSync(join(messagesDir, `${locale}.json`), 'utf8'));
			for (const [key, value] of Object.entries(raw)) {
				if (key === '$schema') continue;
				expect(
					typeof value === 'string' && value.trim().length > 0,
					`${locale}.${key} is empty`
				).toBe(true);
			}
		}
	});
});
