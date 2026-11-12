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

/**
 * Every translated string in one message, with a label saying where it came
 * from. A message is usually a plain string, but a message with plural
 * variants is an array of `{ match: { "countPlural=one": "…" } }`, and those
 * inner strings need checking too.
 */
function textsOf(value: unknown): [string, unknown][] {
	if (!Array.isArray(value)) return [['', value]];
	return value.flatMap((variants: { match?: Record<string, unknown> }) =>
		Object.entries(variants?.match ?? {}).map(([match, text]): [string, unknown] => [
			` [${match}]`,
			text
		])
	);
}

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
				for (const [variant, text] of textsOf(value)) {
					expect(
						typeof text === 'string' && text.trim().length > 0,
						`${locale}.${key}${variant} is empty`
					).toBe(true);
				}
			}
		}
	});

	it('gives every plural message a fallback variant', () => {
		// A plural message that matches only `one` renders nothing for every
		// other count, so an unmatched variant is a blank line on screen rather
		// than a build error. The number of categories is locale-specific (fi
		// and en both have two, Polish has four), so what can be asserted
		// everywhere is that a catch-all exists.
		for (const locale of ['en', 'fi']) {
			const raw = JSON.parse(readFileSync(join(messagesDir, `${locale}.json`), 'utf8'));
			for (const [key, value] of Object.entries(raw)) {
				if (!Array.isArray(value)) continue;
				for (const variants of value) {
					const keys = Object.keys(variants?.match ?? {});
					expect(
						keys.some((match) => /=(other|\*)\s*$/.test(match)),
						`${locale}.${key} has no \`other\` or \`*\` variant: ${keys.join(', ')}`
					).toBe(true);
				}
			}
		}
	});
});
