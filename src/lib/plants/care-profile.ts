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
		if (overrides[field] !== undefined) care[field] = overrides[field];
	}
	return {
		care: care as CareProfile,
		edited: preset ? CARE_FIELDS.filter((field) => overrides[field] !== undefined) : []
	};
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
