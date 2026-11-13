/**
 * The stored shapes, from design.md §6. These are the contract between
 * Firestore and the app, so they stay free of anything view-specific.
 *
 * `Photo` and `Share` arrive with the milestones that read them.
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

/**
 * What a plant stores about its care: only the fields the owner has changed
 * from its preset (design.md §6, "Care overrides").
 *
 * The effective profile is the preset's text, in the current language, with
 * these laid over it — see `resolveCare` in `#lib/plants/care-profile.ts`.
 * Storing a full copy instead would freeze the preset's text in whatever
 * language the plant was added in, and make "Edited" a guess.
 *
 * Each key is all-or-nothing: an override of `checkIntervalDays` holds both
 * intervals, and "Reset to preset" deletes the key. A plant with no preset
 * ("Start from a blank profile") keeps its whole profile here.
 *
 * `null` on an optional field means the owner cleared it on purpose: the
 * plant shows nothing there, rather than falling back to the preset.
 */
export type CareOverrides = {
	[K in keyof CareProfile]?: undefined extends CareProfile[K]
		? CareProfile[K] | null
		: CareProfile[K];
};

export type PotMaterial = 'plastic' | 'terracotta' | 'glazed';

/** What covers the soil. `soil` means nothing does. */
export type PotTopLayer = 'soil' | 'pebbles' | 'gravel';

export type PlantOrigin = 'bought' | 'cutting' | 'propagated' | 'gift';

export type Plant = {
	id: string;
	name: string;
	/** Default note shown to plant-sitters (M4). */
	sitterNote?: string;
	/**
	 * The bundled preset this plant starts from (`src/lib/presets`). Preset
	 * ids are permanent: a plant's care text is read from its preset on every
	 * render, so renaming or removing one would empty that plant's profile.
	 */
	speciesId?: string;
	location?: string;
	/**
	 * When it arrived, to the month: `YYYY-MM`. Nobody remembers the day they
	 * bought a plant, and the form asks "e.g. June 2024". A calendar date like
	 * the due dates, never a Timestamp (CLAUDE.md).
	 */
	acquired?: string;
	origin?: PlantOrigin;
	pot?: { material?: PotMaterial; sizeCm?: number; topLayer?: PotTopLayer };
	health: Health;
	/** Seasonal mode, not a health state: pauses feeding, uses the long interval. */
	dormant?: boolean;
	/** Growing-season interval all year round. */
	underGrowLight?: boolean;
	notes?: string;
	coverPhotoId?: string;
	careOverrides: CareOverrides;
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
	/**
	 * The latest answer to this check and the local day it was given. Kept
	 * on the check so Today can say "last watered on Wednesday" and "check
	 * soil again" without reading the log. Older checks may not have it.
	 */
	lastAnswer?: { kind: 'watered' | 'checked-damp' | 'skipped'; on: string };
};

export type LogKind =
	| 'watered'
	| 'checked-damp'
	| 'checked-dry'
	| 'skipped'
	| 'fertilized'
	| 'repotted'
	| 'pruned'
	| 'moved'
	| 'note'
	| 'problem';

/** The water check as it stood before an answer was logged, for Undo. */
export type CheckSnapshot = Pick<Task, 'nextDue' | 'intervalDays' | 'snoozedUntil' | 'lastAnswer'>;

export type LogEntry = {
	id: string;
	plantId: string;
	kind: LogKind;
	/** When it was logged, by the phone's clock (so it is right offline too). */
	at: Timestamp;
	note?: string;
	by?: { kind: 'owner' } | { kind: 'sitter'; name?: string; shareId: string };
	/**
	 * For an answer to a water check: what it did to the check. `before` is
	 * the check as it was (null if the plant had none), so Undo can put it
	 * back from any device, after a reload too; `nextDue` is where it moved.
	 */
	check?: { before: CheckSnapshot | null; nextDue: string; intervalDays: number };
};
