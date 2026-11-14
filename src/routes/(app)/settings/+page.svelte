<!--
  Settings. Not designed yet (screens.md "Settings"): account, language and
  appearance for now. The growing season and notifications join later
  (design.md §6 `Settings`).

  Language and appearance are stored per device for now (#lib/i18n/language.ts,
  #lib/theme.svelte.ts).
-->
<script lang="ts">
	import Download from '@lucide/svelte/icons/download';
	import SegmentedChoice from '#lib/components/SegmentedChoice.svelte';
	import { session } from '#lib/firebase/session.svelte.js';
	import {
		languagePreference,
		setLanguagePreference,
		type LanguagePreference
	} from '#lib/i18n/language.js';
	import { m } from '#lib/paraglide/messages.js';
	import { theme, type ThemePreference } from '#lib/theme.svelte.js';
	import { backupFile, deliverFile } from '#lib/firebase/backup.js';
	import { storagePersistence } from '#lib/storage-persist.svelte.js';

	/**
	 * Backup: one tap reads everything and opens the share sheet. If the
	 * browser says that tap is too old by then, the file is kept and a second
	 * button hands it over with a fresh tap (#lib/firebase/backup.ts).
	 */
	let backup = $state<
		| { step: 'idle' | 'preparing' | 'error' }
		| { step: 'ready'; file: File }
		| { step: 'downloaded'; name: string }
	>({ step: 'idle' });

	async function hand(file: File) {
		const result = await deliverFile(file);
		backup =
			result === 'blocked'
				? { step: 'ready', file }
				: result === 'downloaded'
					? { step: 'downloaded', name: file.name }
					: { step: 'idle' };
	}

	async function saveBackup() {
		const uid = session.user?.uid;
		if (!uid || backup.step === 'preparing') return;
		backup = { step: 'preparing' };
		try {
			await hand(await backupFile(uid));
		} catch (error) {
			console.error('Making a backup failed', error);
			backup = { step: 'error' };
		}
	}

	async function saveReady(file: File) {
		try {
			await hand(file);
		} catch (error) {
			console.error('Sharing a backup failed', error);
			backup = { step: 'error' };
		}
	}

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
			class="flex flex-col gap-5 rounded-[18px] border border-card-edge bg-surface p-4 shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
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
			{m.settings_backup()}
		</h2>
		<div
			class="flex flex-col gap-4 rounded-[18px] border border-card-edge bg-surface p-4 shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
		>
			<div class="flex flex-col gap-2.5">
				<p class="text-sm text-ink-2">{m.backup_hint()}</p>
				{#if backup.step === 'ready'}
					{@const file = backup.file}
					<p class="text-sm font-semibold text-ink" role="status">{m.backup_ready()}</p>
					<button
						type="button"
						class="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-primary px-4 font-bold text-primary-foreground"
						onclick={() => saveReady(file)}
					>
						<Download size={18} aria-hidden="true" />
						{m.backup_save_file()}
					</button>
				{:else}
					<button
						type="button"
						class="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-border px-4 font-bold text-ink disabled:opacity-60"
						disabled={backup.step === 'preparing'}
						onclick={saveBackup}
					>
						<Download size={18} aria-hidden="true" />
						{backup.step === 'preparing' ? m.backup_preparing() : m.backup_save()}
					</button>
				{/if}
				<div role="status" aria-live="polite" class="text-sm empty:hidden">
					{#if backup.step === 'error'}
						<span class="text-danger">{m.backup_error()}</span>
					{:else if backup.step === 'downloaded'}
						<span class="text-muted">{m.backup_downloaded({ file: backup.name })}</span>
					{/if}
				</div>
			</div>

			{#if storagePersistence.state === 'granted' || storagePersistence.state === 'not-granted'}
				<div class="flex flex-col gap-0.5 border-t border-border pt-3.5">
					<p class="text-sm font-semibold text-ink">{m.storage_label()}</p>
					<p class="text-xs text-muted">
						{storagePersistence.state === 'granted' ? m.storage_granted() : m.storage_not_granted()}
					</p>
				</div>
			{/if}
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
			{m.settings_account()}
		</h2>
		<div
			class="flex flex-col gap-3 rounded-[18px] border border-card-edge bg-surface p-4 shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
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
