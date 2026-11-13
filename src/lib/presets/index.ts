/**
 * The bundled species presets (design.md §8): read-only starting points for a
 * plant's care profile, shipped with the app rather than stored in Firestore.
 *
 * `presets.json` is meant to be hand-edited, so it is validated here against
 * the same Valibot schema the tests use, and a malformed file fails loudly at
 * startup instead of rendering half a care profile.
 *
 * Two rules for editing it:
 * - **Never change or remove an `id`.** Plants store only `speciesId` plus
 *   their own edits, and read the rest from here on every render.
 * - **Every text is `{ en, fi }`.** Care text is content, so it is translated
 *   here rather than through Paraglide messages.
 */
import * as v from 'valibot';
import raw from './presets.json';
import type { Locale } from '#lib/paraglide/runtime.js';

const Text = v.object({
	en: v.pipe(v.string(), v.trim(), v.nonEmpty()),
	fi: v.pipe(v.string(), v.trim(), v.nonEmpty())
});

const Days = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(365));
const Celsius = v.pipe(v.number(), v.minValue(-10), v.maxValue(45));

const PresetCare = v.object({
	light: Text,
	lightLevel: v.picklist(['low', 'medium', 'bright']),
	wateringStyle: v.picklist(['soak-and-dry', 'keep-moist', 'sparse']),
	checkIntervalDays: v.object({ growing: Days, resting: Days }),
	dryDownTest: v.optional(Text),
	tempMinC: v.optional(Celsius),
	tempComfortC: v.optional(v.tuple([Celsius, Celsius])),
	fertilize: v.optional(v.object({ intervalDays: Days, growingOnly: v.boolean() })),
	repotIntervalMonths: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
	watchOuts: v.optional(v.array(Text))
});

export const PresetSchema = v.object({
	/** Permanent. Lower-case slug, usually the scientific name. */
	id: v.pipe(v.string(), v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
	/**
	 * `species` is listed under "Presets" on the Add plant picker; `generic`
	 * under "Not sure? Start general", with its `description`.
	 */
	kind: v.picklist(['species', 'generic']),
	/** What the plant is called day to day: "Pilea", "Dragon tree". */
	name: Text,
	/** The longer everyday name, where it differs: "Chinese money plant". */
	commonName: v.optional(Text),
	scientificName: v.optional(v.string()),
	/** One line for the picker. Generic presets only. */
	description: v.optional(Text),
	care: PresetCare
});

export const PresetsSchema = v.pipe(
	v.array(PresetSchema),
	v.check(
		(list) => new Set(list.map((preset) => preset.id)).size === list.length,
		'Preset ids must be unique'
	)
);

export type Preset = v.InferOutput<typeof PresetSchema>;
export type PresetCare = Preset['care'];
export type LocalText = v.InferOutput<typeof Text>;

export const presets: readonly Preset[] = v.parse(PresetsSchema, raw);

/** The preset with this id, or undefined — a plant from a blank profile has none. */
export function presetById(id: string | undefined): Preset | undefined {
	return id ? presets.find((preset) => preset.id === id) : undefined;
}

/**
 * The route segment for "Start from a blank profile" on the Add plant flow
 * (`/plants/new/blank`). Never a preset id — a test holds it to that.
 */
export const BLANK_PRESET = 'blank';

/**
 * Whether a preset matches what was typed on the Add plant picker.
 *
 * Searches the short and common names in **both** languages plus the
 * scientific name: people type the name they know a plant by, which isn't
 * always the one in the UI language ("money plant" in a Finnish UI).
 * Case-insensitive, substring, every word must match somewhere.
 */
export function matchesPreset(preset: Preset, query: string, locale: Locale): boolean {
	const words = query.trim().toLocaleLowerCase(locale).split(/\s+/).filter(Boolean);
	if (words.length === 0) return true;
	const haystack = [
		preset.name.en,
		preset.name.fi,
		preset.commonName?.en,
		preset.commonName?.fi,
		preset.scientificName
	]
		.filter((text): text is string => Boolean(text))
		.join(' ')
		.toLocaleLowerCase(locale);
	return words.every((word) => haystack.includes(word));
}

/** A preset's text in one language. */
export function localText(text: LocalText, locale: Locale): string {
	return text[locale];
}
