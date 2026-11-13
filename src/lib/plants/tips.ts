/**
 * The seasonal tip on Today's "nothing due" screen. A short bundled list per
 * season, one tip a day in turn. The text is in the Paraglide messages like
 * every other string, so it is translated and reviewed with them.
 */
import { m } from '#lib/paraglide/messages.js';

const GROWING = [
	m.tip_growing_1,
	m.tip_growing_2,
	m.tip_growing_3,
	m.tip_growing_4,
	m.tip_growing_5
];
const RESTING = [
	m.tip_resting_1,
	m.tip_resting_2,
	m.tip_resting_3,
	m.tip_resting_4,
	m.tip_resting_5
];

/** Which of `count` tips to show on `date`: the next one each local day. */
export function tipIndex(date: Date, count: number): number {
	const day = Math.floor(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
	);
	return day % count;
}

export function tipOfTheDay(date: Date, growing: boolean): { heading: string; text: string } {
	const list = growing ? GROWING : RESTING;
	return {
		heading: growing ? m.tip_heading_growing() : m.tip_heading_resting(),
		text: list[tipIndex(date, list.length)]()
	};
}
