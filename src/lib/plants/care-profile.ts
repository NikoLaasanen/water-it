/**
 * A plant's effective care profile: its preset, in the current language, with
 * the owner's own edits laid over it (design.md §6, "Care overrides").
 *
 * Pure and locale-explicit, so it tests without Paraglide; components call it
 * with `getLocale()`.
 */
import type { Locale } from '#lib/paraglide/runtime.js';
import { localText, type Preset } from '#lib/presets/index.js';
import type { CareOverrides, CareProfile, LightLevel, WateringStyle } from '#lib/types/plant.js';

/** Every field of a care profile, in the order the Care tab lists them. */
export const CARE_FIELDS = [
	'light',
	'lightLevel',
	'wateringStyle',
	'checkIntervalDays',
	'fixedSchedule',
	'dryDownTest',
	'tempMinC',
	'tempComfortC',
	'fertilize',
	'repotIntervalMonths',
	'watchOuts'
] as const satisfies readonly (keyof CareProfile)[];

export type CareField = (typeof CARE_FIELDS)[number];

/**
 * What a plant with neither a preset nor edits falls back to: enough for the
 * list's chips and a schedule, and nothing that claims to know the plant.
 */
export const BLANK_CARE: CareProfile = {
	light: '',
	lightLevel: 'medium',
	wateringStyle: 'soak-and-dry',
	checkIntervalDays: { growing: 7, resting: 14 }
};

/** A preset's care block as plain text in one language. */
export function presetCare(preset: Preset, locale: Locale): CareProfile {
	const care = preset.care;
	return {
		light: localText(care.light, locale),
		lightLevel: care.lightLevel,
		wateringStyle: care.wateringStyle,
		checkIntervalDays: { ...care.checkIntervalDays },
		dryDownTest: care.dryDownTest ? localText(care.dryDownTest, locale) : undefined,
		tempMinC: care.tempMinC,
		tempComfortC: care.tempComfortC ? [...care.tempComfortC] : undefined,
		fertilize: care.fertilize ? { ...care.fertilize } : undefined,
		repotIntervalMonths: care.repotIntervalMonths,
		watchOuts: care.watchOuts?.map((text) => localText(text, locale))
	};
}

export type ResolvedCare = {
	care: CareProfile;
	/**
	 * Fields where the plant differs from its preset, in display order. Empty
	 * for a plant with no preset: there is nothing for it to differ from, so
	 * the UI shows no "Edited" tags or provenance line.
	 */
	edited: CareField[];
};

export function resolveCare(
	preset: Preset | undefined,
	overrides: CareOverrides,
	locale: Locale
): ResolvedCare {
	const base = preset ? presetCare(preset, locale) : BLANK_CARE;
	const care = { ...base } as Record<CareField, unknown>;
	for (const field of CARE_FIELDS) {
		const value = overrides[field];
		// null = cleared on purpose: show nothing, not the preset's value.
		if (value !== undefined) care[field] = value === null ? undefined : value;
	}
	return {
		care: care as CareProfile,
		edited: preset ? CARE_FIELDS.filter((field) => overrides[field] !== undefined) : []
	};
}

// --- Writing: which fields are the owner's own ------------------------------

/** Deep equality for the plain values a care field can hold. */
function sameValue(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((item, index) => sameValue(item, b[index]));
	}
	if (isObject(a) && isObject(b)) {
		const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
		return [...keys].every((key) => sameValue(a[key], b[key]));
	}
	return false;
}

/** Empty text, an empty list and `undefined` all mean "nothing to say". */
function isEmpty(value: unknown): boolean {
	return (
		value === undefined ||
		(typeof value === 'string' && value.trim() === '') ||
		(Array.isArray(value) && value.length === 0)
	);
}

/**
 * The overrides to store for a care profile as edited on the form.
 *
 * With a preset, a field is stored only if it differs from the preset's value
 * in the language the form showed it in — so editing a field back to the
 * preset's text removes the override, as design.md §6 says. Untouched fields
 * are left out and keep following the preset, in whatever language the app
 * is in later.
 *
 * Without a preset, everything with a value is stored: there is nothing else
 * to read it from.
 *
 * A preset field the owner cleared is stored as `null`, so "nothing" stays
 * nothing rather than falling back to the preset's value.
 */
export function diffOverrides(
	edited: CareProfile,
	preset: Preset | undefined,
	locale: Locale
): CareOverrides {
	const out: Record<string, unknown> = {};
	if (!preset) {
		for (const field of CARE_FIELDS) {
			if (!isEmpty(edited[field])) out[field] = edited[field];
		}
		return out as CareOverrides;
	}
	const base = presetCare(preset, locale);
	for (const field of CARE_FIELDS) {
		const mine = edited[field];
		const theirs = base[field];
		if (isEmpty(mine) && isEmpty(theirs)) continue;
		if (field === 'fixedSchedule' && !mine && !theirs) continue;
		if (!sameValue(mine, theirs)) {
			// Firestore rejects `undefined`; a cleared optional field is stored as
			// null. `light` is required text, so cleared it is the empty string.
			out[field] = !isEmpty(mine) ? mine : field === 'light' ? '' : null;
		}
	}
	return out as CareOverrides;
}

/**
 * The overrides after changing only the watering intervals, as accepting an
 * interval suggestion does. The other overrides stay as they are. Same rule
 * as diffOverrides: intervals equal to the preset's remove the override, so
 * the plant follows its preset again. Intervals aren't text, so no locale.
 */
export function withIntervals(
	overrides: CareOverrides,
	preset: Preset | undefined,
	intervals: CareProfile['checkIntervalDays']
): CareOverrides {
	const out: CareOverrides = { ...overrides };
	const base = preset?.care.checkIntervalDays;
	if (base && base.growing === intervals.growing && base.resting === intervals.resting) {
		delete out.checkIntervalDays;
	} else {
		out.checkIntervalDays = { growing: intervals.growing, resting: intervals.resting };
	}
	return out;
}

// --- Reading overrides back from Firestore ----------------------------------

const LIGHT_LEVELS: readonly LightLevel[] = ['low', 'medium', 'bright'];
const WATERING_STYLES: readonly WateringStyle[] = ['soak-and-dry', 'keep-moist', 'sparse'];

type Unknownish = Record<string, unknown>;

const isObject = (value: unknown): value is Unknownish =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);
const isText = (value: unknown): value is string => typeof value === 'string';
const isDays = (value: unknown): value is number =>
	isNumber(value) && Number.isInteger(value) && value >= 1;

/**
 * Keeps only the overrides that are well-formed, dropping anything else.
 *
 * Forgiving on purpose, like `toPlant`: one bad field should fall back to the
 * preset's value, not blank the plant. A dropped field simply reads as
 * "not edited". The Add/Edit form validates properly before writing.
 */
export function readOverrides(data: unknown): CareOverrides {
	if (!isObject(data)) return {};
	const out: CareOverrides = {};

	if (isText(data.light)) out.light = data.light;
	if (isText(data.lightLevel) && (LIGHT_LEVELS as readonly string[]).includes(data.lightLevel)) {
		out.lightLevel = data.lightLevel as LightLevel;
	}
	if (
		isText(data.wateringStyle) &&
		(WATERING_STYLES as readonly string[]).includes(data.wateringStyle)
	) {
		out.wateringStyle = data.wateringStyle as WateringStyle;
	}
	if (
		isObject(data.checkIntervalDays) &&
		isDays(data.checkIntervalDays.growing) &&
		isDays(data.checkIntervalDays.resting)
	) {
		out.checkIntervalDays = {
			growing: data.checkIntervalDays.growing,
			resting: data.checkIntervalDays.resting
		};
	}
	if (typeof data.fixedSchedule === 'boolean') out.fixedSchedule = data.fixedSchedule;
	// Optional fields may be null: cleared on purpose (see `CareOverrides`).
	for (const field of [
		'dryDownTest',
		'tempMinC',
		'tempComfortC',
		'fertilize',
		'repotIntervalMonths',
		'watchOuts'
	] as const) {
		if (data[field] === null) out[field] = null;
	}
	if (isText(data.dryDownTest)) out.dryDownTest = data.dryDownTest;
	if (isNumber(data.tempMinC)) out.tempMinC = data.tempMinC;
	if (
		Array.isArray(data.tempComfortC) &&
		data.tempComfortC.length === 2 &&
		data.tempComfortC.every(isNumber)
	) {
		out.tempComfortC = [data.tempComfortC[0], data.tempComfortC[1]];
	}
	if (
		isObject(data.fertilize) &&
		isDays(data.fertilize.intervalDays) &&
		typeof data.fertilize.growingOnly === 'boolean'
	) {
		out.fertilize = {
			intervalDays: data.fertilize.intervalDays,
			growingOnly: data.fertilize.growingOnly
		};
	}
	if (isDays(data.repotIntervalMonths)) out.repotIntervalMonths = data.repotIntervalMonths;
	if (Array.isArray(data.watchOuts) && data.watchOuts.every(isText)) {
		out.watchOuts = [...data.watchOuts];
	}
	return out;
}
