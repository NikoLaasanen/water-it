/**
 * Live view of one user's plants and their water checks.
 *
 * Owned by the component that renders them: `listen()` returns its own cleanup
 * so it can be handed straight back from an `$effect`. A module-level
 * singleton would outlive sign-out and keep listening as the previous user.
 */
import {
	collection,
	doc,
	onSnapshot,
	query,
	where,
	type DocumentData,
	type FirestoreError
} from 'firebase/firestore';
import { db } from './client';
import type {
	CareProfile,
	Health,
	LightLevel,
	Plant,
	Task,
	WateringStyle
} from '#lib/types/plant.js';

const HEALTH: readonly Health[] = ['thriving', 'okay', 'recovering', 'struggling'];
const LIGHT_LEVELS: readonly LightLevel[] = ['low', 'medium', 'bright'];
const WATERING_STYLES: readonly WateringStyle[] = ['soak-and-dry', 'keep-moist', 'sparse'];

function oneOf<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
	return typeof value === 'string' && (allowed as readonly string[]).includes(value)
		? (value as T)
		: fallback;
}

/**
 * Turns a stored document into a `Plant`, filling in anything missing.
 *
 * Deliberately forgiving: these documents are hand-seeded now and will later
 * be written by versions of this app that didn't know about every field. One
 * incomplete document should cost its own row some detail, not blank the whole
 * list. Input validation belongs on the Add/Edit form, where someone can still
 * be told what's wrong.
 */
function toPlant(id: string, data: DocumentData): Plant | null {
	const name = typeof data.name === 'string' ? data.name.trim() : '';
	// A row with no name is unidentifiable and untappable in any useful sense.
	if (!name) return null;

	const stored: DocumentData = typeof data.careProfile === 'object' ? data.careProfile : {};
	const interval: DocumentData =
		typeof stored.checkIntervalDays === 'object' ? stored.checkIntervalDays : {};

	const careProfile: CareProfile = {
		...stored,
		light: typeof stored.light === 'string' ? stored.light : '',
		lightLevel: oneOf(LIGHT_LEVELS, stored.lightLevel, 'medium'),
		wateringStyle: oneOf(WATERING_STYLES, stored.wateringStyle, 'soak-and-dry'),
		checkIntervalDays: {
			growing: typeof interval.growing === 'number' ? interval.growing : 7,
			resting: typeof interval.resting === 'number' ? interval.resting : 14
		}
	};

	return { ...data, id, name, health: oneOf(HEALTH, data.health, 'okay'), careProfile } as Plant;
}

export class PlantsQuery {
	plants = $state<Plant[]>([]);

	/** Only `check-water` tasks: the list shows nothing else. */
	checkTasks = $state<Task[]>([]);

	/** True until both collections have answered once. */
	loading = $state(true);

	/** A listener failed. The reason is already on screen via the session. */
	failed = $state(false);

	/**
	 * This plant's water check, for the "Check:" line.
	 *
	 * A scan rather than a lookup table: the list is a handful of plants, and
	 * an object keyed by plant id would answer `constructor` and `toString`
	 * with something inherited from `Object.prototype` — plant ids come from
	 * Firestore and nothing stops one being called that.
	 */
	checkTaskFor(plantId: string): Task | undefined {
		return this.checkTasks.find((task) => task.plantId === plantId);
	}

	#delivered = { plants: false, tasks: false };

	#settle(which: 'plants' | 'tasks') {
		this.#delivered[which] = true;
		if (this.#delivered.plants && this.#delivered.tasks) this.loading = false;
	}

	#onError = (error: FirestoreError) => {
		// Not shown here: an uninvited account is already looking at the "no
		// invite" screen, and offline reads are answered from the local cache.
		console.error('[plants] listener failed', error.code);
		this.failed = true;
		this.loading = false;
	};

	/**
	 * Starts listening for `uid`. Returns the unsubscribe function, so a caller
	 * can `return query.listen(uid)` from an `$effect` and have both listeners
	 * torn down when the component goes away or the user changes.
	 */
	listen(uid: string): () => void {
		const stopPlants = onSnapshot(
			collection(db, 'users', uid, 'plants'),
			(snapshot) => {
				this.plants = snapshot.docs
					.map((doc) => toPlant(doc.id, doc.data()))
					.filter((plant): plant is Plant => plant !== null);
				this.#settle('plants');
			},
			this.#onError
		);

		const stopTasks = onSnapshot(
			// One equality filter needs no composite index.
			query(collection(db, 'users', uid, 'tasks'), where('kind', '==', 'check-water')),
			(snapshot) => {
				this.checkTasks = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Task);
				this.#settle('tasks');
			},
			this.#onError
		);

		return () => {
			stopPlants();
			stopTasks();
		};
	}
}

/**
 * Live view of one plant and its water check, for the detail screen.
 *
 * A listener rather than a one-off read: editing a plant, or logging a check
 * from somewhere else, should be reflected here without a reload. Same
 * ownership rule as `PlantsQuery` — `listen()` hands back its own cleanup.
 */
export class PlantQuery {
	plant = $state<Plant | null>(null);

	/** This plant's `check-water` task. */
	checkTask = $state<Task | undefined>(undefined);

	loading = $state(true);

	/** The document is not there — a stale link, or a deleted plant. */
	missing = $state(false);

	failed = $state(false);

	#delivered = { plant: false, task: false };

	#settle(which: 'plant' | 'task') {
		this.#delivered[which] = true;
		if (this.#delivered.plant && this.#delivered.task) this.loading = false;
	}

	#onError = (error: FirestoreError) => {
		console.error('[plant] listener failed', error.code);
		this.failed = true;
		this.loading = false;
	};

	listen(uid: string, plantId: string): () => void {
		const stopPlant = onSnapshot(
			doc(db, 'users', uid, 'plants', plantId),
			(snapshot) => {
				const data = snapshot.data();
				// `exists()` false is a missing plant; a document that exists but
				// can't be read as one (no name) is equally unusable here.
				this.plant = data ? toPlant(snapshot.id, data) : null;
				this.missing = this.plant === null;
				this.#settle('plant');
			},
			this.#onError
		);

		const stopTask = onSnapshot(
			query(
				collection(db, 'users', uid, 'tasks'),
				where('kind', '==', 'check-water'),
				where('plantId', '==', plantId)
			),
			(snapshot) => {
				this.checkTask = snapshot.docs
					.map((task) => ({ ...task.data(), id: task.id }) as Task)
					.at(0);
				this.#settle('task');
			},
			this.#onError
		);

		return () => {
			stopPlant();
			stopTask();
		};
	}
}
