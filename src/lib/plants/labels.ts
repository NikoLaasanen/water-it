/**
 * Turns the care descriptors into text for the current locale.
 *
 * Kept apart from `care.ts` so the logic there stays testable without a
 * locale, and apart from the components so no component holds a `switch` over
 * a stored value.
 */
import { m } from '#lib/paraglide/messages.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import type { Health, LightLevel, WaterLevel } from '#lib/types/plant.js';
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
