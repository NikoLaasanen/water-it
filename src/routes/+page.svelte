<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { session } from '#lib/firebase/session.svelte.js';
</script>

<!--
	Placeholder home screen. The real Today view (screens.md) arrives with the
	catalogue; for now this exists so a signed-in session is visible on the
	phone, which is what the first device test needs.
-->
<main class="mx-auto flex w-full max-w-[420px] flex-col gap-5 px-5 py-14">
	<h1 class="text-[34px] leading-tight font-extrabold text-ink">Water.it</h1>
	<p class="text-sm text-muted">{m.home_placeholder()}</p>

	<!-- Stands in for the bottom tab bar, which waits for the Today view: the
	     designed bar has four tabs and only one of them exists yet. -->
	<a
		href={resolve('/plants')}
		class="min-h-12 w-fit rounded-xl bg-primary px-4 py-3 font-bold text-on-primary"
	>
		{m.nav_plants()}
	</a>

	<p class="text-xs text-muted-2">
		{m.signed_in_as({ email: session.user?.email ?? '' })}
	</p>

	<button
		type="button"
		class="min-h-12 w-fit rounded-xl border border-border px-4 font-bold text-ink"
		onclick={() => session.signOut()}
	>
		{m.sign_out()}
	</button>
</main>
