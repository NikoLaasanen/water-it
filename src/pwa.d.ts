/**
 * Types for the virtual modules the PWA plugin injects at build time.
 *
 * Upstream ships these as `@unplugin-pwa/core/svelte.d.ts` and
 * `info.d.ts`, but that package is only a *transitive* dependency of
 * `@vite-pwa/sveltekit`, so under pnpm's strict layout there is no top-level
 * `node_modules` entry for TypeScript to resolve the subpath from. Declaring
 * `@unplugin-pwa/core` as a direct dependency purely to reach its types would
 * be worse, so these mirror the upstream declarations instead.
 *
 * Kept deliberately narrow: only the members this app uses. `trustedScriptUrl`
 * is omitted because its type comes from `trusted-types`, which is also not
 * resolvable from here.
 */

declare module 'virtual:pwa-register/svelte' {
	import type { Writable } from 'svelte/store';

	export interface RegisterSWOptions {
		immediate?: boolean;
		/** Called when the worker has taken control and the page would reload. */
		onNeedReload?: () => void;
		onNeedRefresh?: () => void;
		onOfflineReady?: () => void;
		onRegisteredSW?: (
			swScriptUrl: string,
			registration: ServiceWorkerRegistration | undefined
		) => void;
		onRegisterError?: (error: unknown) => void;
		updateViaCache?: ServiceWorkerUpdateViaCache;
	}

	export function useRegisterSW(options?: RegisterSWOptions): {
		needRefresh: Writable<boolean>;
		offlineReady: Writable<boolean>;
		/**
		 * Lets the waiting worker take control and reloads the page. Takes no
		 * arguments in @vite-pwa/sveltekit v2 — the older `reloadPage` parameter
		 * is gone.
		 */
		updateServiceWorker: () => Promise<void>;
	};
}

declare module 'virtual:pwa-info' {
	export interface PwaInfo {
		pwaInDevEnvironment: boolean;
		webManifest: {
			href: string;
			useCredentials: boolean;
			/** `<link rel="manifest" ...>`, with the build-time hashed filename. */
			linkTag: string;
		};
	}

	/**
	 * `undefined` on an SSR build, when the plugin is disabled, and in
	 * `vite dev` whenever `devOptions.enabled` is false — which is this
	 * project's dev setup, so callers must always guard.
	 */
	export const pwaInfo: PwaInfo | undefined;
}
