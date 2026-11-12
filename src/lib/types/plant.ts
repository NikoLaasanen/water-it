/**
 * The stored shapes, from design.md §6. These are the contract between
 * Firestore and the app, so they stay free of anything view-specific.
 *
 * Only the collections M1 touches are here. `LogEntry`, `Photo` and `Share`
 * arrive with the milestones that read them.
 */
import type { Timestamp } from 'firebase/firestore';

/** A plant's condition. Dormancy is separate — see `Plant.dormant`. */
export type Health = 'thriving' | 'okay' | 'recovering' | 'struggling';

/**
 * How much light the plant wants, as a value rather than prose.
 *
 * `CareProfile.light` holds the full sentence for the Care tab, but the Plants
 * list shows a one-word chip that has to exist in English and Finnish, so it
 * cannot be parsed back out of that sentence. Hence a separate enum: the prose
 * is for reading, this is for the UI and for sorting or filtering later.
 */
export type LightLevel = 'low' | 'medium' | 'bright';

/** How thirsty the plant is. Derived from `wateringStyle`, never stored. */
export type WaterLevel = 'little' | 'moderate' | 'lots';

export type WateringStyle = 'soak-and-dry' | 'keep-moist' | 'sparse';

export type CareProfile = {
	/** Full sentence for the Care tab, e.g. "Bright indirect; no hot sun". */
	light: string;
	/** The same requirement as a value, for chips and filters. */
	lightLevel: LightLevel;
	wateringStyle: WateringStyle;
	checkIntervalDays: { growing: number; resting: number };
	/** "Water every N days" instead of "check the soil". */
	fixedSchedule?: boolean;
	dryDownTest?: string;
	tempMinC?: number;
	tempComfortC?: [number, number];
	fertilize?: { intervalDays: number; growingOnly: boolean };
	repotIntervalMonths?: number;
	watchOuts?: string[];
};

export type Plant = {
	id: string;
	name: string;
	/** Default note shown to plant-sitters (M4). */
	sitterNote?: string;
	/** Which bundled preset this was prefilled from. */
	speciesId?: string;
	location?: string;
	/** Local calendar date, `YYYY-MM-DD` — never a Timestamp (CLAUDE.md). */
	acquired?: string;
	origin?: 'bought' | 'cutting' | 'propagated' | 'gift';
	pot?: { material?: string; sizeCm?: number; topLayer?: string };
	health: Health;
	/** Seasonal mode, not a health state: pauses feeding, uses the long interval. */
	dormant?: boolean;
	/** Growing-season interval all year round. */
	underGrowLight?: boolean;
	notes?: string;
	coverPhotoId?: string;
	careProfile: CareProfile;
	createdAt: Timestamp;
};

export type TaskKind =
	| 'check-water'
	| 'fertilize'
	| 'rotate'
	| 'repot'
	| 'photo'
	| 'wipe-leaves'
	| 'pest-check'
	| 'season-move'
	| 'custom';

export type Task = {
	id: string;
	plantId: string;
	kind: TaskKind;
	/** Local calendar date, `YYYY-MM-DD`. */
	nextDue: string;
	intervalDays?: number;
	/** Local calendar date, `YYYY-MM-DD`. */
	snoozedUntil?: string;
};
