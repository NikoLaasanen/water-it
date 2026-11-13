/**
 * Writes for plants: create, update, delete.
 *
 * Offline-first: Firestore's persistent cache applies a write locally at once
 * and syncs it when it can. `commit()` only resolves when the *server* has it,
 * which offline could be hours, so callers don't wait on it — the plant is on
 * screen immediately either way. A rejection (rules, or a malformed write)
 * rolls the local change back; that is logged, and the plant disappears.
 */
import {
	collection,
	deleteField,
	doc,
	getDocs,
	query,
	serverTimestamp,
	where,
	writeBatch
} from 'firebase/firestore';
import { db } from './client';
import { fieldsForUpdate, withoutUndefined } from './without-undefined.js';
import type { PlantData } from '#lib/plants/plant-form.svelte.js';

/** The id of a plant's water check. One per plant, so it is derived. */
export function checkTaskId(plantId: string): string {
	return `check-water-${plantId}`;
}

/**
 * Creates a plant and its first water check in one batch, so there is never
 * a plant without a schedule. Returns the new plant's id.
 */
export function createPlant(
	uid: string,
	data: PlantData,
	firstCheck: { nextDue: string; intervalDays: number }
): string {
	const plantRef = doc(collection(db, 'users', uid, 'plants'));
	const taskRef = doc(db, 'users', uid, 'tasks', checkTaskId(plantRef.id));

	const batch = writeBatch(db);
	batch.set(plantRef, { ...withoutUndefined(data), createdAt: serverTimestamp() });
	batch.set(taskRef, {
		plantId: plantRef.id,
		kind: 'check-water',
		nextDue: firstCheck.nextDue,
		intervalDays: firstCheck.intervalDays
	});
	batch.commit().catch((error: { code?: string }) => {
		console.error('[plants] saving the new plant failed', error.code ?? error);
	});

	return plantRef.id;
}

/** What an edit does to the plant's water check, decided by the caller. */
export type CheckUpdate =
	| { kind: 'keep' }
	| { kind: 'set'; nextDue: string; intervalDays: number }
	/** The plant had no check (older data): create one. */
	| { kind: 'create'; nextDue: string; intervalDays: number };

/**
 * Saves an edited plant, and its water check if the interval changed, in one
 * batch. Cleared fields are deleted, and `careOverrides` is replaced whole,
 * so an override reset to the preset really goes away.
 */
export function updatePlant(
	uid: string,
	plantId: string,
	data: PlantData,
	check: CheckUpdate
): void {
	const batch = writeBatch(db);
	batch.update(doc(db, 'users', uid, 'plants', plantId), fieldsForUpdate(data, deleteField()));
	if (check.kind !== 'keep') {
		batch.set(
			doc(db, 'users', uid, 'tasks', checkTaskId(plantId)),
			{
				plantId,
				kind: 'check-water',
				nextDue: check.nextDue,
				intervalDays: check.intervalDays
			},
			{ merge: true }
		);
	}
	batch.commit().catch((error: { code?: string }) => {
		console.error('[plants] saving the edited plant failed', error.code ?? error);
	});
}

/**
 * Deletes a plant with everything that belongs to it: its tasks and its log
 * entries (photos join this in M3). One batch, so a plant never half-exists.
 *
 * Finding the tasks and log entries is a read, answered from the offline
 * cache when there is no connection. The delete itself is not awaited, for
 * the same reason as the other writes.
 */
export async function deletePlant(uid: string, plantId: string): Promise<void> {
	const belonging = await Promise.all(
		(['tasks', 'log'] as const).map((name) =>
			// One equality filter, so no composite index is needed.
			getDocs(query(collection(db, 'users', uid, name), where('plantId', '==', plantId)))
		)
	);
	const batch = writeBatch(db);
	batch.delete(doc(db, 'users', uid, 'plants', plantId));
	for (const snapshot of belonging) {
		for (const entry of snapshot.docs) batch.delete(entry.ref);
	}
	batch.commit().catch((error: { code?: string }) => {
		console.error('[plants] deleting the plant failed', error.code ?? error);
	});
}
