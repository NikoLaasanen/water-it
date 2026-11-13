<!--
  Settings. Not designed yet (screens.md "Not designed yet"), so for now it
  holds only the account: who is signed in, and signing out. Language, the
  growing season and notifications join it later (design.md §6 `Settings`).
-->
<script lang="ts">
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.nav_settings()} · Water.it</title>
</svelte:head>

<main class="flex max-w-xl flex-col gap-5 px-5 pt-14 md:px-8 md:pt-10">
	<h1 class="text-[34px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
		{m.nav_settings()}
	</h1>

	<section class="flex flex-col gap-2">
		<h2 class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
			{m.settings_account()}
		</h2>
		<div
			class="flex flex-col gap-3 rounded-[18px] bg-surface p-4 shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
		>
			<p class="text-sm break-words text-ink-2">
				{m.signed_in_as({ email: session.user?.email ?? '' })}
			</p>
			<button
				type="button"
				class="min-h-11 w-fit rounded-xl border border-border px-4 font-bold text-ink"
				onclick={() => session.signOut()}
			>
				{m.sign_out()}
			</button>
		</div>
	</section>
</main>
