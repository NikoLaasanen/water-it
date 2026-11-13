/**
 * Light / dark / automatic, chosen in Settings (design.md 9.1).
 *
 * The CSS dark block is keyed on `<html data-theme="dark">`. An inline script
 * in src/app.html sets that attribute before first paint, from the same
 * storage key, so a reload never flashes the wrong theme; this module takes
 * over once the app runs and follows the phone live while on "auto".
 *
 * Stored per device in localStorage, as a convenience: it is a display
 * preference, and an unreadable store simply means "auto".
 */

export type ThemePreference = 'auto' | 'light' | 'dark';

/** Shared with the boot script in src/app.html — change both together. */
export const THEME_STORAGE_KEY = 'water-it-theme';

/** `--bg` of each theme, for the iOS status bar tint. Mirrors layout.css. */
const STATUS_BAR = { light: '#F3F5F1', dark: '#121614' } as const;

function readPreference(): ThemePreference {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		return stored === 'light' || stored === 'dark' ? stored : 'auto';
	} catch {
		return 'auto';
	}
}

class Theme {
	preference = $state<ThemePreference>('auto');

	#media: MediaQueryList | null = null;

	constructor() {
		if (typeof window === 'undefined') return;
		this.preference = readPreference();
		this.#media = window.matchMedia('(prefers-color-scheme: dark)');
		// The phone switching at sunset should reach an open app on "auto".
		this.#media.addEventListener('change', () => this.#apply());
		this.#apply();
	}

	set(preference: ThemePreference): void {
		this.preference = preference;
		try {
			if (preference === 'auto') localStorage.removeItem(THEME_STORAGE_KEY);
			else localStorage.setItem(THEME_STORAGE_KEY, preference);
		} catch {
			// Private mode or blocked storage: the choice lasts this session.
		}
		this.#apply();
	}

	#apply(): void {
		const dark =
			this.preference === 'dark' || (this.preference === 'auto' && !!this.#media?.matches);
		const resolved = dark ? 'dark' : 'light';
		document.documentElement.dataset.theme = resolved;
		// app.html carries one theme-color per media query for "auto". A forced
		// theme must win over the phone's setting, so both get its colour.
		for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
			const own = meta.media.includes('dark') ? STATUS_BAR.dark : STATUS_BAR.light;
			meta.content = this.preference === 'auto' ? own : STATUS_BAR[resolved];
		}
	}
}

export const theme = new Theme();
