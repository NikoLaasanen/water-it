/**
 * Morning, afternoon or evening, for Today's greeting and its header scene
 * (screens.md "Today header scene"). Evening runs from 18:00 to 04:59, and
 * the scene shows the moon and stars for exactly that stretch, so "Good
 * evening" always comes with the evening sky.
 */
export type PartOfDay = 'morning' | 'afternoon' | 'evening';

export function partOfDay(date: Date): PartOfDay {
	const hour = date.getHours();
	if (hour >= 5 && hour < 12) return 'morning';
	if (hour >= 12 && hour < 18) return 'afternoon';
	return 'evening';
}
