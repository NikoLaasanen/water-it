<!--
  Settings. Not designed yet (screens.md "Settings"): account, language and
  appearance for now. The growing season and notifications join later
  (design.md §6 `Settings`).

  Language and appearance are stored per device for now (#lib/i18n/language.ts,
  #lib/theme.svelte.ts).
-->
<script lang="ts">
	import SegmentedChoice from '#lib/components/SegmentedChoice.svelte';
	import { session } from '#lib/firebase/session.svelte.js';
	import {
		languagePreference,
		setLanguagePreference,
		type LanguagePreference
	} from '#lib/i18n/language.js';
	import { m } from '#lib/paraglide/messages.js';
	import { theme, type ThemePreference } from '#lib/theme.svelte.js';

	// Changing it reloads the app, so it never has to be reactive afterwards.
	const language = languagePreference();

	const languages: { value: LanguagePreference; label: string }[] = [
		{ value: 'auto', label: m.settings_auto() },
		{ value: 'en', label: m.language_en() },
		{ value: 'fi', label: m.language_fi() }
	];

	const themes: { value: ThemePreference; label: string }[] = [
		{ value: 'auto', label: m.settings_auto() },
		{ value: 'light', label: m.theme_light() },
		{ value: 'dark', label: m.theme_dark() }
	];
</script>

<svelte:head>
	<title>{m.nav_settings()} · Water.it</title>
</svelte:head>

<main class="flex max-w-xl flex-col gap-6 px-5 pt-14 md:px-8 md:pt-10">
	<h1 class="text-[34px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
		{m.nav_settings()}
	</h1>

	<section class="flex flex-col gap-2">
		<h2 class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
			{m.settings_display()}
		</h2>
		<div
			class="flex flex-col gap-5 rounded-[18px] bg-surface p-4 shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
		>
			<div class="flex flex-col gap-1.5">
				<SegmentedChoice
					legend={m.settings_language()}
					name="language"
					options={languages}
					value={language}
					onchange={setLanguagePreference}
				/>
				<p class="text-xs text-muted">{m.settings_language_hint()}</p>
			</div>

			<div class="flex flex-col gap-1.5">
				<SegmentedChoice
					legend={m.settings_theme()}
					name="theme"
					options={themes}
					value={theme.preference}
					onchange={(value) => theme.set(value)}
				/>
				<p class="text-xs text-muted">{m.settings_theme_hint()}</p>
			</div>
		</div>
	</section>

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
