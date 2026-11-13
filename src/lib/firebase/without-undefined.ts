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
