/**
 * Ends the opening animation (src/app.html, "Opening animation").
 *
 * Call it once the screen underneath is worth looking at. The splash then
 * finishes its intro if it is still playing and opens onto the app. Safe to
 * call any number of times, and a no-op when there is no splash (in a browser
 * tab, or after it has gone).
 */
export function hideSplash(): void {
	if (typeof window !== 'undefined') window.__hideSplash?.();
}
