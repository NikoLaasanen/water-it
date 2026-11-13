/** Pure helper, kept apart from the Firestore client so it tests without it. */

/**
 * Drops `undefined` fields, recursively through plain objects. Firestore
 * rejects `undefined` outright; `null` (a cleared care field) is kept.
 */
export function withoutUndefined<T>(value: T): T {
	if (Array.isArray(value)) return value.map(withoutUndefined) as T;
	if (typeof value !== 'object' || value === null) return value;
	if (Object.getPrototypeOf(value) !== Object.prototype) return value;
	return Object.fromEntries(
		Object.entries(value)
			.filter(([, inner]) => inner !== undefined)
			.map(([key, inner]) => [key, withoutUndefined(inner)])
	) as T;
}

/**
 * Top-level fields for an `updateDoc`: `undefined` becomes `remove` (the
 * caller passes Firestore's `deleteField()`), so a field the user cleared is
 * deleted rather than left behind. Nested values are written whole — an
 * update replaces a map field entirely, which is what `careOverrides` needs:
 * an override that was reset must disappear, not survive a merge.
 */
export function fieldsForUpdate<R>(
	data: Record<string, unknown>,
	remove: R
): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(data).map(([key, value]) => [
			key,
			value === undefined ? remove : withoutUndefined(value)
		])
	);
}
