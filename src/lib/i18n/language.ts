/**
 * The language choice in Settings: automatic (the phone's language) or a
 * fixed English / Finnish.
 *
 * Paraglide's `localStorage` strategy can't express "automatic" by itself: on
 * first use it saves the language it resolved, so the phone's language of that
 * day would stick forever. So the user's own choice lives under a separate
 * key. While it is unset, the boot script in src/app.html clears Paraglide's
 * saved value before the app starts, and the phone's language wins again.
 *
 * Stored per device for now. design.md §6 `Settings.language` moves it into
 * the user's Firestore settings once that document exists.
 */
import { locales, localStorageKey, setLocale, type Locale } from '#lib/paraglide/runtime.js';

export type LanguagePreference = 'auto' | Locale;

/** Shared with the boot script in src/app.html — change both together. */
export const LANGUAGE_STORAGE_KEY = 'water-it-language';

export function languagePreference(): LanguagePreference {
	try {
		const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
		return (locales as readonly string[]).includes(stored ?? '') ? (stored as Locale) : 'auto';
	} catch {
		return 'auto';
	}
}

/** Saves the choice and reloads, which is how Paraglide switches language. */
export function setLanguagePreference(preference: LanguagePreference): void {
	try {
		if (preference === 'auto') {
			localStorage.removeItem(LANGUAGE_STORAGE_KEY);
			localStorage.removeItem(localStorageKey);
		} else {
			localStorage.setItem(LANGUAGE_STORAGE_KEY, preference);
		}
	} catch {
		// Blocked storage: Paraglide's own reload below still applies a fixed
		// language for this session.
	}
	if (preference === 'auto') window.location.reload();
	else void setLocale(preference);
}
