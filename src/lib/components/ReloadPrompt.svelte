<!--
  "New version available, tap to reload" (CLAUDE.md). The service worker never
  reloads the page on its own: a silent reload could throw away a half-typed
  note or a log entry someone is in the middle of. `registerType: 'prompt'` in
  vite.config.ts is the other half of this.
-->
<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import { m } from '#lib/paraglide/messages.js';

	const { needRefresh, updateServiceWorker } = useRegisterSW({
		onRegisterError(error) {
			console.error('[pwa] service worker registration failed', error);
		}
	});
</script>

{#if $needRefresh}
	<!-- `status`/`polite`: an update is useful to know but must never steal
	     focus from whatever the user is doing. -->
	<div
		role="status"
		aria-live="polite"
		class="fixed inset-x-0 bottom-0 z-50 mx-4 flex flex-wrap items-center gap-3 rounded-[18px] border border-border bg-surface p-3 text-ink shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
		style="margin-bottom: calc(1rem + env(safe-area-inset-bottom, 0px))"
	>
		<p class="min-w-0 flex-1 text-sm font-bold">{m.pwa_update_ready()}</p>
		<button
			type="button"
			class="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary"
			onclick={() => updateServiceWorker()}
		>
			{m.pwa_reload()}
		</button>
		<button
			type="button"
			class="min-h-11 rounded-xl px-4 text-sm font-bold text-muted"
			onclick={() => needRefresh.set(false)}
		>
			{m.pwa_later()}
		</button>
	</div>
{/if}
