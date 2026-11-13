/**
 * State, validation and output of the Add/Edit plant form (screens.md
 * "Add plant", "Edit plant").
 *
 * The form holds the *effective* care profile, prefilled from the preset in
 * the current language; what gets stored is only the difference
 * (`diffOverrides`), so untouched fields keep following the preset.
 *
 * Numbers bound to `<input type="number">` are `number | null`: Svelte binds
 * an empty number field as null.
 */
import * as v from 'valibot';
import { m } from '#lib/paraglide/messages.js';
import type { Locale } from '#lib/paraglide/runtime.js';
import type { Preset } from '#lib/presets/index.js';
import type {
	CareProfile,
	Health,
	LightLevel,
	Plant,
	PlantOrigin,
	PotMaterial,
	PotTopLayer,
	WateringStyle
} from '#lib/types/plant.js';
import {
	BLANK_CARE,
	diffOverrides,
	presetCare,
	resolveCare,
	type CareField
} from './care-profile.js';

/** What the form writes to the plant document, minus `createdAt`. */
export type PlantData = Omit<Plant, 'id' | 'createdAt'>;

const NAME_MAX = 60;
const DAYS_MAX = 120;

/** Everything the form can flag, keyed by the field the message sits under. */
export type FormErrors = Partial<
	Record<
		| 'name'
		| 'growing'
		| 'resting'
		| 'potSize'
		| 'tempMin'
		| 'comfortMax'
		| 'fertilizeDays'
		| 'repotMonths'
		| 'acquired',
		string
	>
>;

const optionalNumber = (min: number, max: number, message: string) =>
	v.nullable(v.pipe(v.number(message), v.minValue(min, message), v.maxValue(max, message)));

/**
 * Built per call so the messages come from the current locale (changing
 * language reloads the app, but tests and future callers shouldn't care).
 */
function schema() {
	const days = m.form_error_days({ max: DAYS_MAX });
	return v.pipe(
		v.object({
			name: v.pipe(
				v.string(),
				v.trim(),
				v.nonEmpty(m.form_error_name_required()),
				v.maxLength(NAME_MAX, m.form_error_name_long({ max: NAME_MAX }))
			),
			growing: v.pipe(
				v.number(days),
				v.integer(days),
				v.minValue(1, days),
				v.maxValue(DAYS_MAX, days)
			),
			resting: v.pipe(
				v.number(days),
				v.integer(days),
				v.minValue(1, days),
				v.maxValue(DAYS_MAX, days)
			),
			potSize: optionalNumber(1, 200, m.form_error_pot_size()),
			tempMin: optionalNumber(-10, 45, m.form_error_temperature()),
			comfortMin: optionalNumber(-10, 45, m.form_error_temperature()),
			comfortMax: optionalNumber(-10, 45, m.form_error_temperature()),
			fertilizeDays: optionalNumber(1, 365, m.form_error_fertilize()),
			repotMonths: optionalNumber(1, 120, m.form_error_repot()),
			acquired: v.union(
				[v.literal(''), v.pipe(v.string(), v.regex(/^\d{4}-(0[1-9]|1[0-2])$/))],
				m.form_error_month()
			)
		}),
		v.forward(
			v.partialCheck(
				[['comfortMin'], ['comfortMax']],
				({ comfortMin, comfortMax }) =>
					(comfortMin === null) === (comfortMax === null) &&
					(comfortMin === null || comfortMax === null || comfortMin < comfortMax),
				m.form_error_comfort()
			),
			['comfortMax']
		)
	);
}

const trimmed = (text: string) => text.trim() || undefined;

export class PlantForm {
	/** The species preset the care profile starts from; changes with `changePreset`. */
	preset = $state<Preset | undefined>(undefined);
	readonly #locale: Locale;

	// --- The plant -------------------------------------------------------------
	name = $state('');
	location = $state('');
	health = $state<Health>('okay');
	potMaterial = $state<PotMaterial | undefined>(undefined);
	potTopLayer = $state<PotTopLayer | undefined>(undefined);
	potSize = $state<number | null>(null);
	dormant = $state(false);
	underGrowLight = $state(false);
	origin = $state<PlantOrigin | undefined>(undefined);
	/** `YYYY-MM`, as `<input type="month">` gives it, or ''. */
	acquired = $state('');
	notes = $state('');
	sitterNote = $state('');

	// --- Its care, as shown on the form ----------------------------------------
	light = $state('');
	lightLevel = $state<LightLevel>('medium');
	wateringStyle = $state<WateringStyle>('soak-and-dry');
	fixedSchedule = $state(false);
	growing = $state(7);
	resting = $state(14);
	dryDownTest = $state('');
	tempMin = $state<number | null>(null);
	comfortMin = $state<number | null>(null);
	comfortMax = $state<number | null>(null);
	fertilizeDays = $state<number | null>(null);
	fertilizeGrowingOnly = $state(true);
	repotMonths = $state<number | null>(null);
	/** One watch-out per line. */
	watchOuts = $state('');

	errors = $state<FormErrors>({});

	constructor(preset: Preset | undefined, locale: Locale, plant?: Plant) {
		this.preset = preset;
		this.#locale = locale;
		const care = plant
			? resolveCare(preset, plant.careOverrides, locale).care
			: preset
				? presetCare(preset, locale)
				: BLANK_CARE;
		this.#loadCare(care);

		if (plant) {
			this.name = plant.name;
			this.location = plant.location ?? '';
			this.health = plant.health;
			this.potMaterial = plant.pot?.material;
			this.potTopLayer = plant.pot?.topLayer;
			this.potSize = plant.pot?.sizeCm ?? null;
			this.dormant = plant.dormant ?? false;
			this.underGrowLight = plant.underGrowLight ?? false;
			this.origin = plant.origin;
			this.acquired = plant.acquired ?? '';
			this.notes = plant.notes ?? '';
			this.sitterNote = plant.sitterNote ?? '';
		} else if (preset) {
			this.name = preset.name[locale];
		}
	}

	#loadCare(care: CareProfile, only?: CareField) {
		const all = only === undefined;
		if (all || only === 'light') this.light = care.light;
		if (all || only === 'lightLevel') this.lightLevel = care.lightLevel;
		if (all || only === 'wateringStyle') this.wateringStyle = care.wateringStyle;
		if (all || only === 'fixedSchedule') this.fixedSchedule = care.fixedSchedule ?? false;
		if (all || only === 'checkIntervalDays') {
			this.growing = care.checkIntervalDays.growing;
			this.resting = care.checkIntervalDays.resting;
		}
		if (all || only === 'dryDownTest') this.dryDownTest = care.dryDownTest ?? '';
		if (all || only === 'tempMinC') this.tempMin = care.tempMinC ?? null;
		if (all || only === 'tempComfortC') {
			this.comfortMin = care.tempComfortC?.[0] ?? null;
			this.comfortMax = care.tempComfortC?.[1] ?? null;
		}
		if (all || only === 'fertilize') {
			this.fertilizeDays = care.fertilize?.intervalDays ?? null;
			this.fertilizeGrowingOnly = care.fertilize?.growingOnly ?? true;
		}
		if (all || only === 'repotIntervalMonths') this.repotMonths = care.repotIntervalMonths ?? null;
		if (all || only === 'watchOuts') this.watchOuts = (care.watchOuts ?? []).join('\n');
	}

	/** The care profile as currently filled in. */
	get care(): CareProfile {
		const watchOuts = this.watchOuts
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);
		return {
			light: this.light.trim(),
			lightLevel: this.lightLevel,
			wateringStyle: this.wateringStyle,
			checkIntervalDays: { growing: this.growing, resting: this.resting },
			fixedSchedule: this.fixedSchedule,
			dryDownTest: trimmed(this.dryDownTest),
			tempMinC: this.tempMin ?? undefined,
			tempComfortC:
				this.comfortMin !== null && this.comfortMax !== null
					? [this.comfortMin, this.comfortMax]
					: undefined,
			fertilize:
				this.fertilizeDays !== null
					? { intervalDays: this.fertilizeDays, growingOnly: this.fertilizeGrowingOnly }
					: undefined,
			repotIntervalMonths: this.repotMonths ?? undefined,
			watchOuts: watchOuts.length > 0 ? watchOuts : undefined
		};
	}

	/** Care fields that differ from the preset — what gets the "Edited" tag. */
	edited = $derived.by((): readonly CareField[] => {
		if (!this.preset) return [];
		return Object.keys(diffOverrides(this.care, this.preset, this.#locale)) as CareField[];
	});

	/** "Reset to preset": put one care field back to the preset's value. */
	reset(field: CareField): void {
		if (this.preset) this.#loadCare(presetCare(this.preset, this.#locale), field);
	}

	/**
	 * Switch the plant to another species (screens.md "Edit plant"). The care
	 * fields start over from the new preset, so edits made against the old one
	 * are dropped; everything that isn't care (pot, location, notes, health)
	 * stays. A name still equal to the old preset's default follows the new
	 * one, since it was never really chosen.
	 *
	 * Switching to no preset keeps the care as it stands: it becomes the
	 * plant's own profile instead of being wiped.
	 */
	changePreset(next: Preset | undefined): void {
		const previous = this.preset;
		if (next?.id === previous?.id) return;
		this.preset = next;
		if (!next) return;
		this.#loadCare(presetCare(next, this.#locale));
		const oldDefault = previous ? previous.name[this.#locale] : '';
		if (this.name.trim() === oldDefault) this.name = next.name[this.#locale];
	}

	/** Checks the form; fills `errors` and returns whether it can be saved. */
	validate(): boolean {
		const result = v.safeParse(schema(), {
			name: this.name,
			growing: this.growing,
			resting: this.resting,
			potSize: this.potSize,
			tempMin: this.tempMin,
			comfortMin: this.comfortMin,
			comfortMax: this.comfortMax,
			fertilizeDays: this.fertilizeDays,
			repotMonths: this.repotMonths,
			acquired: this.acquired
		});
		if (result.success) {
			this.errors = {};
			return true;
		}
		const nested = v.flatten<ReturnType<typeof schema>>(result.issues).nested ?? {};
		this.errors = Object.fromEntries(
			Object.entries(nested).map(([key, messages]) => [key, messages?.[0] ?? ''])
		) as FormErrors;
		return false;
	}

	/** The plant document to write. Call after `validate()`. */
	toPlantData(): PlantData {
		const pot = {
			material: this.potMaterial,
			topLayer: this.potTopLayer,
			sizeCm: this.potSize ?? undefined
		};
		return {
			name: this.name.trim(),
			health: this.health,
			speciesId: this.preset?.id,
			location: trimmed(this.location),
			pot: Object.values(pot).some((part) => part !== undefined) ? pot : undefined,
			dormant: this.dormant,
			underGrowLight: this.underGrowLight,
			origin: this.origin,
			acquired: this.acquired || undefined,
			notes: trimmed(this.notes),
			sitterNote: trimmed(this.sitterNote),
			careOverrides: diffOverrides(this.care, this.preset, this.#locale)
		};
	}
}
