/**
 * Live view of one user's plants, their water checks and their stored
 * fertilise/repot reminders (reminders.ts).
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
import { createContext } from 'svelte';
import { db } from './client';
import { readLastAnswer } from './log.svelte.js';
import { readOverrides } from '#lib/plants/care-profile.js';
import type { ReminderKind, StoredReminder } from '#lib/plants/reminders.js';
import type {
	Health,
	Plant,
	PlantOrigin,
	PotMaterial,
	PotTopLayer,
	Task
} from '#lib/types/plant.js';

const HEALTH: readonly Health[] = ['thriving', 'okay', 'recovering', 'struggling'];
const POT_MATERIALS: readonly PotMaterial[] = ['plastic', 'terracotta', 'glazed'];
const POT_TOP_LAYERS: readonly PotTopLayer[] = ['soil', 'pebbles', 'gravel'];
const ORIGINS: readonly PlantOrigin[] = ['bought', 'cutting', 'propagated', 'gift'];

function oneOf<T extends string>(allowed: readonly T[], value: unknown): T | undefined {
	return typeof value === 'string' && (allowed as readonly string[]).includes(value)
		? (value as T)
		: undefined;
}

function text(value: unknown): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

/**
 * Turns a stored document into a `Plant`, filling in anything missing.
 *
 * Deliberately forgiving: these documents are hand-seeded now and will later
 * be written by versions of this app that didn't know about every field. One
 * incomplete document should cost its own row some detail, not blank the whole
 * list. Input validation belongs on the Add/Edit form, where someone can still
 * be told what's wrong.
 *
 * Fields are picked one by one rather than spread from `data`, so a stray or
 * mistyped field never reaches the UI looking like part of a `Plant`.
 */
function toPlant(id: string, data: DocumentData): Plant | null {
	const name = typeof data.name === 'string' ? data.name.trim() : '';
	// A row with no name is unidentifiable and untappable in any useful sense.
	if (!name) return null;

	const pot: DocumentData = typeof data.pot === 'object' && data.pot !== null ? data.pot : {};

	return {
		id,
		name,
		health: oneOf(HEALTH, data.health) ?? 'okay',
		speciesId: text(data.speciesId),
		location: text(data.location),
		sitterNote: text(data.sitterNote),
		notes: text(data.notes),
		acquired: text(data.acquired),
		origin: oneOf(ORIGINS, data.origin),
		pot: {
			material: oneOf(POT_MATERIALS, pot.material),
			topLayer: oneOf(POT_TOP_LAYERS, pot.topLayer),
			sizeCm: typeof pot.sizeCm === 'number' ? pot.sizeCm : undefined
		},
		dormant: data.dormant === true,
		underGrowLight: data.underGrowLight === true,
		coverPhotoId: text(data.coverPhotoId),
		careOverrides: readOverrides(data.careOverrides),
		createdAt: data.createdAt
	};
}

/** A stored fertilise/repot reminder, or null for anything else. */
function toReminder(id: string, data: DocumentData): StoredReminder | null {
	if (data.kind !== 'fertilize' && data.kind !== 'repot') return null;
	if (typeof data.plantId !== 'string') return null;
	return {
		id,
		plantId: data.plantId,
		kind: data.kind as ReminderKind,
		lastDone: typeof data.lastDone === 'string' ? data.lastDone : undefined,
		snoozedUntil: typeof data.snoozedUntil === 'string' ? data.snoozedUntil : undefined
	};
}

/** A stored check, with `lastAnswer` checked: Today builds sentences from it. */
function toTask(id: string, data: DocumentData): Task {
	return {
		...(data as Omit<Task, 'id'>),
		id,
		lastAnswer: readLastAnswer(data.lastAnswer),
		suggestionKeptOn: typeof data.suggestionKeptOn === 'string' ? data.suggestionKeptOn : undefined
	};
}

export class PlantsQuery {
	plants = $state<Plant[]>([]);

	/** Only `check-water` tasks: the list shows nothing else. */
	checkTasks = $state<Task[]>([]);

	/** Stored fertilise/repot reminders: only the ones the owner has acted on. */
	reminders = $state<StoredReminder[]>([]);

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

	/**
	 * The plants sorted by name for `locale`. Sorted here rather than by
	 * Firestore, which orders strings by byte value and would file Ä after Z —
	 * wrong in Finnish, where it belongs after A.
	 */
	sorted(locale: string): Plant[] {
		return [...this.plants].sort((a, b) => a.name.localeCompare(b.name, locale));
	}

	#delivered = { plants: false, tasks: false, reminders: false };

	#settle(which: 'plants' | 'tasks' | 'reminders') {
		this.#delivered[which] = true;
		if (this.#delivered.plants && this.#delivered.tasks && this.#delivered.reminders) {
			this.loading = false;
		}
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
				this.checkTasks = snapshot.docs.map((doc) => toTask(doc.id, doc.data()));
				this.#settle('tasks');
			},
			this.#onError
		);

		const stopReminders = onSnapshot(
			// `in` on one field: still a single-field index.
			query(collection(db, 'users', uid, 'tasks'), where('kind', 'in', ['fertilize', 'repot'])),
			(snapshot) => {
				this.reminders = snapshot.docs
					.map((doc) => toReminder(doc.id, doc.data()))
					.filter((reminder): reminder is StoredReminder => reminder !== null);
				this.#settle('reminders');
			},
			this.#onError
		);

		return () => {
			stopPlants();
			stopTasks();
			stopReminders();
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

	/** This plant's stored fertilise/repot reminders. */
	reminders = $state<StoredReminder[]>([]);

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

		// All of this plant's tasks in one listener: the water check and the
		// stored reminders are told apart by kind.
		const stopTask = onSnapshot(
			query(collection(db, 'users', uid, 'tasks'), where('plantId', '==', plantId)),
			(snapshot) => {
				const docs = snapshot.docs;
				this.checkTask = docs
					.filter((task) => task.data().kind === 'check-water')
					.map((task) => toTask(task.id, task.data()))
					.at(0);
				this.reminders = docs
					.map((task) => toReminder(task.id, task.data()))
					.filter((reminder): reminder is StoredReminder => reminder !== null);
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

/**
 * The plants list, shared by everything under /plants.
 *
 * `/plants/+layout.svelte` owns the one `PlantsQuery` and its listeners; the
 * list page and the iPad side list under plant detail both read it from here,
 * so moving between them never restarts a listener or flashes "Loading".
 */
export const [getPlantsQuery, setPlantsQuery] = createContext<PlantsQuery>();
