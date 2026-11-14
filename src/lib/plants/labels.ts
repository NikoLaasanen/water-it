/**
 * Turns the care descriptors into text for the current locale.
 *
 * Kept apart from `care.ts` so the logic there stays testable without a
 * locale, and apart from the components so no component holds a `switch` over
 * a stored value.
 */
import { m } from '#lib/paraglide/messages.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import { localText, presetById, type Preset } from '#lib/presets/index.js';
import type {
	CareProfile,
	Health,
	LightLevel,
	LogEntry,
	LogKind,
	Plant,
	PotMaterial,
	PotTopLayer,
	WaterLevel
} from '#lib/types/plant.js';
import { parseLocalDate, type NextCheck } from './care.js';
import type { CheckAction, Season } from './schedule.js';
import type { DayRef } from './today.js';
import { resolveCare, type CareField, type ResolvedCare } from './care-profile.js';

/** A plant's effective care profile in the current language. */
export function careOf(plant: Pick<Plant, 'speciesId' | 'careOverrides'>): ResolvedCare {
	return resolveCare(presetById(plant.speciesId), plant.careOverrides, getLocale());
}

/** A preset's everyday name in the current language: "Pilea". */
export function presetName(preset: Preset): string {
	return localText(preset.name, getLocale());
}

/**
 * The line under a plant's name: "Chinese money plant · Pilea peperomioides".
 * The scientific name is returned apart so the caller can italicise it.
 * Null when there is nothing to add — no preset, or a generic one.
 */
export function speciesLine(
	preset: Preset | undefined
): { common?: string; scientific?: string } | null {
	if (!preset || preset.kind === 'generic') return null;
	const common = preset.commonName ? localText(preset.commonName, getLocale()) : undefined;
	return common || preset.scientificName ? { common, scientific: preset.scientificName } : null;
}

/** What each care field is called in the provenance line, lower-cased there. */
function fieldLabel(field: CareField): string {
	switch (field) {
		case 'light':
		case 'lightLevel':
			return m.care_light();
		case 'wateringStyle':
		case 'checkIntervalDays':
		case 'fixedSchedule':
			return m.care_watering();
		case 'dryDownTest':
			return m.care_check_test();
		case 'tempMinC':
		case 'tempComfortC':
			return m.care_temperature();
		case 'fertilize':
			return m.care_fertilizing();
		case 'repotIntervalMonths':
			return m.care_repot();
		case 'watchOuts':
			return m.care_watch_out();
	}
}

/**
 * "From the Pilea preset · edited by you: check test" (screens.md, Plant
 * detail). Null for a plant with no preset, which has nothing to come from.
 */
export function provenanceLine(preset: Preset | undefined, edited: CareField[]): string | null {
	if (!preset) return null;
	const name = presetName(preset);
	if (edited.length === 0) return m.plant_care_source({ preset: name });
	const locale = getLocale();
	// Several fields map to one row ("light" and "lightLevel" are both Light),
	// so de-duplicate after labelling.
	const fields = [...new Set(edited.map((field) => fieldLabel(field).toLocaleLowerCase(locale)))];
	return m.plant_care_source_edited({
		preset: name,
		fields: new Intl.ListFormat(locale, { type: 'conjunction' }).format(fields)
	});
}

export function potMaterialLabel(material: PotMaterial): string {
	switch (material) {
		case 'plastic':
			return m.pot_plastic();
		case 'terracotta':
			return m.pot_terracotta();
		case 'glazed':
			return m.pot_glazed();
	}
}

export function potTopLayerLabel(top: PotTopLayer): string {
	switch (top) {
		case 'soil':
			return m.pot_top_soil();
		case 'pebbles':
			return m.pot_top_pebbles();
		case 'gravel':
			return m.pot_top_gravel();
	}
}

/**
 * The pot chip on plant detail: "Terracotta · clay pebbles". Bare soil is the
 * default and says nothing, so it is left out. Null when neither is known.
 */
export function potChip(pot: Plant['pot']): string | null {
	const material = pot?.material ? potMaterialLabel(pot.material) : null;
	const top = pot?.topLayer && pot.topLayer !== 'soil' ? potTopLayerLabel(pot.topLayer) : null;
	if (material && top) return `${material} · ${top.toLocaleLowerCase(getLocale())}`;
	// On its own the top layer starts the chip, so it keeps its capital.
	return material ?? top;
}

export function healthLabel(health: Health): string {
	switch (health) {
		case 'thriving':
			return m.health_thriving();
		case 'okay':
			return m.health_okay();
		case 'recovering':
			return m.health_recovering();
		case 'struggling':
			return m.health_struggling();
	}
}

export function lightLabel(level: LightLevel): string {
	switch (level) {
		case 'low':
			return m.light_low();
		case 'medium':
			return m.light_medium();
		case 'bright':
			return m.light_bright();
	}
}

export function waterLabel(level: WaterLevel): string {
	switch (level) {
		case 'little':
			return m.water_little();
		case 'moderate':
			return m.water_moderate();
		case 'lots':
			return m.water_lots();
	}
}

/**
 * What goes after "Check:" on a row.
 *
 * The weekday comes from `Intl` rather than a translated list: the browser
 * already has the names for every locale, and Finnish abbreviates them in
 * lower case ("la"), which a hand-written table would be likely to get wrong.
 */
export function nextCheckLabel(next: NextCheck): string {
	switch (next.kind) {
		case 'overdue':
			return m.plants_check_overdue();
		case 'today':
			return m.plants_check_today();
		case 'weekday':
			return new Intl.DateTimeFormat(getLocale(), { weekday: 'short' }).format(next.date);
		case 'in-days':
			return m.plants_check_in_days({ days: next.days });
		case 'unscheduled':
			return m.plants_check_unscheduled();
	}
}

/**
 * The next-check line on the plant detail screen.
 *
 * Says more than the list's chip: the list only needs "Overdue", while the
 * detail screen is where you decide what to do about it, so it counts the days.
 */
export function nextCheckDetailLabel(next: NextCheck): string {
	switch (next.kind) {
		case 'overdue':
			return m.plant_next_check_overdue({ days: next.days });
		case 'today':
			return m.plant_next_check_today();
		case 'weekday':
		case 'in-days':
			return m.plant_next_check_on({ when: nextCheckLabel(next) });
		case 'unscheduled':
			return m.plant_next_check_unscheduled();
	}
}

/** One row of the care profile list. */
export type CareRow = { label: string; value: string };

function wateringValue(care: CareProfile): string {
	const style =
		care.wateringStyle === 'keep-moist'
			? m.care_watering_moist()
			: care.wateringStyle === 'sparse'
				? m.care_watering_sparse()
				: m.care_watering_soak();

	const { growing, resting } = care.checkIntervalDays;
	// "Water every N days" when the plant is on a fixed schedule, rather than
	// "check the soil" — a different instruction, not just different wording.
	const rhythm = care.fixedSchedule
		? m.care_watering_fixed({ growing, resting })
		: m.care_watering_intervals({ growing, resting });

	return `${style} ${rhythm}`;
}

function temperatureValue(care: CareProfile): string | null {
	const parts: string[] = [];
	if (care.tempComfortC) {
		const [min, max] = care.tempComfortC;
		parts.push(m.care_temp_comfort({ min, max }));
	}
	if (typeof care.tempMinC === 'number') parts.push(m.care_temp_min({ min: care.tempMinC }));
	return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * The care profile as label/value rows, in the order screens.md lists them.
 *
 * Rows with nothing to say are dropped rather than shown empty: a plant added
 * by hand may have only a couple of these filled in, and a column of blank
 * values reads as something broken.
 */
export function careRows(care: CareProfile): CareRow[] {
	const rows: (CareRow | null)[] = [
		care.light.trim() ? { label: m.care_light(), value: care.light } : null,
		{ label: m.care_watering(), value: wateringValue(care) },
		care.dryDownTest?.trim() ? { label: m.care_check_test(), value: care.dryDownTest } : null,
		(() => {
			const value = temperatureValue(care);
			return value ? { label: m.care_temperature(), value } : null;
		})(),
		care.fertilize
			? {
					label: m.care_fertilizing(),
					value: care.fertilize.growingOnly
						? m.care_fertilize_growing({ days: care.fertilize.intervalDays })
						: m.care_fertilize_always({ days: care.fertilize.intervalDays })
				}
			: null,
		typeof care.repotIntervalMonths === 'number'
			? { label: m.care_repot(), value: m.care_repot_months({ months: care.repotIntervalMonths }) }
			: null,
		care.watchOuts && care.watchOuts.length > 0
			? // Joined into a sentence: the design shows one paragraph, not a nested
				// list inside a row.
				{ label: m.care_watch_out(), value: care.watchOuts.join('. ') + '.' }
			: null
	];

	return rows.filter((row): row is CareRow => row !== null);
}

/**
 * The months each season covers, for the interval steppers: "Apr–Sep" and
 * "Oct–Mar" with the default growing months. Names come from `Intl`, so
 * Finnish gets "huhti–syys". Assumes the growing months are one unbroken run,
 * which is all Settings will offer.
 */
export function seasonRanges(growingMonths: readonly number[]): {
	growing: string;
	resting: string;
} {
	const name = (month: number) =>
		new Intl.DateTimeFormat(getLocale(), { month: 'short' })
			.format(new Date(2026, month - 1, 1))
			.replace(/\.$/, '');
	const sorted = [...growingMonths].sort((a, b) => a - b);
	const first = sorted[0] ?? 4;
	const last = sorted.at(-1) ?? 9;
	const wrap = (month: number) => ((month + 11) % 12) + 1;
	return {
		growing: `${name(first)}–${name(last)}`,
		resting: `${name(wrap(last + 1))}–${name(wrap(first - 1))}`
	};
}

/**
 * The pot hint under "Top layer" (docs/mockups/add-plant.dc.html): what the
 * pot means for checking. Null when nothing chosen says anything useful.
 */
export function potHint(material?: PotMaterial, top?: PotTopLayer): string | null {
	const pebbles = top === 'pebbles';
	if (material === 'terracotta') {
		return pebbles ? m.pot_hint_terracotta_pebbles() : m.pot_hint_terracotta();
	}
	if (pebbles) return m.pot_hint_pebbles();
	if (material === 'plastic' || material === 'glazed') return m.pot_hint_damp();
	return null;
}

/** "Wed 18 Nov": a check date, short, in the current language. */
export function shortDateLabel(date: Date): string {
	return new Intl.DateTimeFormat(getLocale(), {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	}).format(date);
}

/** The badge on an answered check: "Watered", "Still damp", "Skipped". */
export function statusLabel(action: CheckAction): string {
	switch (action) {
		case 'watered':
			return m.status_watered();
		case 'checked-damp':
			return m.status_damp();
		case 'skipped':
			return m.status_skipped();
	}
}

/** What an answer did, beside its badge: "Next check in 14 days". */
export function statusNextLabel(action: CheckAction, days: number): string {
	switch (action) {
		case 'watered':
			return m.status_next_watered({ days });
		case 'checked-damp':
			return m.status_next_damp({ days });
		case 'skipped':
			return m.status_next_skipped();
	}
}

/**
 * The date line on Today: "Friday 13 November". Finnish writes weekdays in
 * lower case ("perjantai 13. marraskuuta"); this starts the line, so its
 * first letter is raised.
 */
export function longDateLabel(date: Date): string {
	const text = new Intl.DateTimeFormat(getLocale(), {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	}).format(date);
	return text.charAt(0).toLocaleUpperCase(getLocale()) + text.slice(1);
}

/**
 * A day inside a sentence: "yesterday", "tomorrow", "on Saturday",
 * "on 25 November". Finnish says the weekday in the essive ("lauantaina"),
 * which every Finnish weekday forms by adding -na to the name `Intl` gives.
 */
export function dayRefPhrase(ref: DayRef): string {
	switch (ref.kind) {
		case 'today':
			return m.when_today();
		case 'yesterday':
			return m.when_yesterday();
		case 'tomorrow':
			return m.when_tomorrow();
		case 'weekday': {
			const name = new Intl.DateTimeFormat(getLocale(), { weekday: 'long' }).format(ref.date);
			return m.when_on_weekday({ weekday: getLocale() === 'fi' ? `${name}na` : name });
		}
		case 'date':
			return m.when_on_date({
				date: new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'long' }).format(
					ref.date
				)
			});
	}
}

/** A day on its own, for a pill: "Tomorrow", "Mon", "Wed 25". */
export function dayRefPill(ref: DayRef): string {
	switch (ref.kind) {
		case 'today':
			return m.week_today();
		case 'tomorrow':
			return m.pill_tomorrow();
		case 'yesterday':
			// Pills only show days ahead; said as a word just in case.
			return m.when_yesterday();
		case 'weekday':
			return new Intl.DateTimeFormat(getLocale(), { weekday: 'short' }).format(ref.date);
		case 'date':
			return new Intl.DateTimeFormat(getLocale(), { weekday: 'short', day: 'numeric' }).format(
				ref.date
			);
	}
}

/** A log entry's badge: "Watered", "Repotted". */
export function logKindLabel(kind: LogKind): string {
	switch (kind) {
		case 'watered':
			return m.log_kind_watered();
		case 'checked-damp':
			return m.log_kind_checked_damp();
		case 'checked-dry':
			return m.log_kind_checked_dry();
		case 'skipped':
			return m.log_kind_skipped();
		case 'fertilized':
			return m.log_kind_fertilized();
		case 'repotted':
			return m.log_kind_repotted();
		case 'pruned':
			return m.log_kind_pruned();
		case 'moved':
			return m.log_kind_moved();
		case 'note':
			return m.log_kind_note();
		case 'problem':
			return m.log_kind_problem();
	}
}

/** A log month heading: "November 2026", "marraskuu 2026" (raised like longDateLabel). */
export function monthLabel(month: Date): string {
	const text = new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(
		month
	);
	return text.charAt(0).toLocaleUpperCase(getLocale()) + text.slice(1);
}

/** "25 Oct": a past day, short, as in the Recent log card and "Last watered". */
export function dayMonthLabel(date: Date): string {
	return new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' }).format(date);
}

/** "09:14": when an entry was logged. */
export function timeLabel(date: Date): string {
	return new Intl.DateTimeFormat(getLocale(), { hour: '2-digit', minute: '2-digit' }).format(date);
}

/** The next-check card's second line: "Last watered 25 Oct · winter interval 14 days". */
export function lastWateredLine(
	lastWatered: Date | null,
	season: Season,
	intervalDays: number
): string {
	const interval =
		season === 'growing'
			? m.log_interval_growing({ days: intervalDays })
			: m.log_interval_resting({ days: intervalDays });
	if (!lastWatered) return interval.charAt(0).toLocaleUpperCase(getLocale()) + interval.slice(1);
	return `${m.log_last_watered({ date: dayMonthLabel(lastWatered) })} · ${interval}`;
}

/**
 * What a check answer did, for its log row: "Next check Sat 21 Nov". Null for
 * other entries and for Skip, whose next check is simply tomorrow.
 */
export function logNextCheckLabel(entry: Pick<LogEntry, 'kind' | 'check'>): string | null {
	if (!entry.check || entry.kind === 'skipped') return null;
	const date = parseLocalDate(entry.check.nextDue);
	return date ? m.log_next_check({ date: shortDateLabel(date) }) : null;
}
