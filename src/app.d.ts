// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// PWA virtual module types live in src/pwa.d.ts.

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		/** Shallow-routing state (goto with `shallow: true`). */
		interface PageState {
			/** Edit plant: the species picker is open over the form. */
			pickingSpecies?: boolean;
		}
		// interface Platform {}
	}

	interface Window {
		/** Set by the opening-animation script in app.html (#lib/splash.ts). */
		__hideSplash?: () => void;
	}
}

export {};
