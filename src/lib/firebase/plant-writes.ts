/**
 * Writes for plants: the first write path in the app.
 *
 * Offline-first: Firestore's persistent cache applies a write locally at once
 * and syncs it when it can. `commit()` only resolves when the *server* has it,
 * which offline could be hours, so callers don't wait on it — the plant is on
 * screen immediately either way. A rejection (rules, or a malformed write)
 * rolls the local change back; that is logged, and the plant disappears.
 */
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './client';
import { withoutUndefined } from './without-undefined.js';
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
