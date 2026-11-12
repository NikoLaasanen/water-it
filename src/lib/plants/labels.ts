/**
 * Turns the care descriptors into text for the current locale.
 *
 * Kept apart from `care.ts` so the logic there stays testable without a
 * locale, and apart from the components so no component holds a `switch` over
 * a stored value.
 */
import { m } from '#lib/paraglide/messages.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import type { CareProfile, Health, LightLevel, WaterLevel } from '#lib/types/plant.js';
import type { NextCheck } from './care.js';

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
