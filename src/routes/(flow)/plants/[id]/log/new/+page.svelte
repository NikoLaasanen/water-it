<!--
  Add to log (screens.md "Add to log"): care done by hand — fertilised,
  repotted, pruned, moved, a note or a problem — for one plant.

  A full-screen flow like Edit plant: Cancel · "Add to log" · Save at the top,
  then what was done (chips), when (today unless changed; no future days) and
  a note. Moved asks where the plant went instead, prefilled with its current
  spot, and saving also moves the plant there. Watering isn't offered: it goes
  through the check buttons, which keep the schedule.

  No mockup: Niko asked for a simple design (2026-11-14). It reuses the
  Add/Edit form's fields, chips and card.
-->
<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ChipChoice from '#lib/components/form/ChipChoice.svelte';
	import FormField from '#lib/components/form/FormField.svelte';
	import { fieldInput, fieldTextarea, formCard } from '#lib/components/form/styles.js';
	import { clock } from '#lib/clock.svelte.js';
	import { addManualEntry } from '#lib/firebase/log-writes.js';
	import { PlantQuery, PlantsQuery } from '#lib/firebase/plants.svelte.js';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { logKindLabel } from '#lib/plants/labels.js';
	import {
		MANUAL_KINDS,
		NOTE_MAX,
		manualEntryTime,
		manualNote,
		validateManual,
		type ManualDraft,
		type ManualErrorKey,
		type ManualKind
	} from '#lib/plants/manual-log.js';
	import { kindOfDone } from '#lib/plants/reminders.js';
	import { toLocalDateString } from '#lib/plants/schedule.js';

	const plantId = page.params.id ?? '';
	const detailHref = resolve('/(app)/plants/[id]', { id: plantId });

	const query = new PlantQuery();
	const others = new PlantsQuery();
	$effect(() => {
		const uid = session.user?.uid;
		if (!uid || !plantId) return;
		const stopPlant = query.listen(uid, plantId);
		const stopOthers = others.listen(uid);
		return () => {
			stopPlant();
			stopOthers();
		};
	});

	const todayString = $derived(toLocalDateString(clock.today));

	let draft = $state<ManualDraft>({
		kind: undefined,
		date: toLocalDateString(new Date()),
		note: '',
		location: ''
	});
	let submitted = $state(false);
	let saving = $state(false);

	// Moved starts from where the plant is now, once it has loaded.
	let locationTouched = false;
	$effect(() => {
		if (draft.kind === 'moved' && !locationTouched && query.plant) {
			draft.location = query.plant.location ?? '';
			locationTouched = true;
		}
	});

	const errors = $derived(submitted ? validateManual(draft, clock.today) : {});

	function message(key: ManualErrorKey | undefined): string | undefined {
		switch (key) {
			case 'kind':
				return m.log_error_kind();
			case 'date':
				return m.log_error_date();
			case 'note-missing':
				return m.log_error_note_missing();
			case 'note-long':
				return m.log_error_note_long({ max: NOTE_MAX });
			case 'location':
				return m.log_error_location();
			default:
				return undefined;
		}
	}

	const kinds = $derived(MANUAL_KINDS.map((kind) => ({ value: kind, label: logKindLabel(kind) })));

	const otherLocations = $derived(
		[...new Set(others.plants.map((plant) => plant.location?.trim() ?? '').filter(Boolean))]
			.filter((place) => place !== draft.location.trim())
			.sort((a, b) => a.localeCompare(b, getLocale()))
			.map((place) => ({ value: place, label: place }))
	);

	// Opened from the plant's page: leaving goes back, so Back afterwards
	// doesn't reopen the form. Opened directly, it replaces itself.
	let cameFromDetail = $state(false);
	afterNavigate(({ from }) => {
		cameFromDetail = from?.url.pathname === detailHref;
	});

	function leave() {
		if (cameFromDetail) history.back();
		// The path is resolve()'s; the rule can't see through the added query.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		else void goto(`${detailHref}?tab=log`, { replace: true });
	}

	function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		const uid = session.user?.uid;
		if (!uid || saving) return;
		submitted = true;
		const problems = validateManual(draft, clock.today);
		if (Object.keys(problems).length > 0 || !draft.kind) {
			requestAnimationFrame(() => {
				document
					.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid] button')
					?.focus();
			});
			return;
		}
		saving = true;
		const kind: ManualKind = draft.kind;
		const place = draft.location.trim();
		addManualEntry(
			uid,
			plantId,
			{ kind, at: manualEntryTime(draft.date, new Date()), note: manualNote(draft) },
			{
				newLocation:
					kind === 'moved' && place !== (query.plant?.location ?? '').trim() ? place : undefined,
				// Fertilised / Repotted also reset that reminder.
				reminder: query.reminders.find((r) => r.kind === kindOfDone({ kind }))
			}
		);
		leave();
	}
</script>

<svelte:head>
	<title>{m.log_add()} · Water.it</title>
</svelte:head>

{#if query.loading}
	<p class="flex min-h-dvh items-center justify-center text-sm text-muted" role="status">
		{m.loading()}
	</p>
{:else if query.missing || !query.plant}
	<main class="flex min-h-dvh flex-col justify-center gap-4 px-5 text-center">
		<h1 class="text-2xl font-extrabold text-ink">{m.plant_not_found_heading()}</h1>
		<p class="text-sm text-muted">{m.plant_not_found_body()}</p>
		<a
			href={resolve('/(app)/plants')}
			class="min-h-12 rounded-xl border border-border px-4 py-3 font-bold text-ink"
		>
			{m.plant_not_found_back()}
		</a>
	</main>
{:else}
	<main class="flex flex-col gap-5 px-5 pt-[52px] pb-10 md:pt-10">
		<!-- Cancel · Add to log · Save, as on Edit plant. -->
		<header class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
			<button
				type="button"
				class="flex min-h-11 items-center justify-self-start text-[15px] font-semibold text-link"
				onclick={leave}
			>
				{m.edit_cancel()}
			</button>
			<div class="flex flex-col items-center">
				<h1 class="text-[17px] font-bold text-ink">{m.log_add()}</h1>
				<p class="text-xs text-muted">{m.log_form_for({ name: query.plant.name })}</p>
			</div>
			<button
				type="submit"
				form="log-add"
				disabled={saving}
				class="flex min-h-11 items-center justify-self-end text-[15px] font-bold text-link disabled:opacity-60"
			>
				{m.edit_save()}
			</button>
		</header>

		<form id="log-add" class="flex flex-col gap-5" novalidate {onsubmit}>
			<div class={formCard}>
				<fieldset class="flex flex-col gap-2">
					<legend class="mb-2 text-sm font-bold text-ink-2">{m.log_form_what()}</legend>
					<div
						data-invalid={errors.kind ? 'true' : undefined}
						aria-describedby={errors.kind ? 'log-kind-error' : undefined}
					>
						<ChipChoice
							label={m.log_form_what()}
							options={kinds}
							value={draft.kind}
							onpick={(kind) => (draft.kind = kind)}
						/>
					</div>
					{#if errors.kind}
						<p id="log-kind-error" class="text-xs font-semibold" style:color="var(--danger)">
							{message(errors.kind)}
						</p>
					{/if}
				</fieldset>

				<FormField id="log-date" label={m.log_form_when()} error={message(errors.date)}>
					{#snippet children({ describedBy, invalid })}
						<input
							id="log-date"
							type="date"
							bind:value={draft.date}
							max={todayString}
							required
							aria-describedby={describedBy}
							aria-invalid={invalid}
							class={fieldInput}
						/>
					{/snippet}
				</FormField>

				{#if draft.kind === 'moved'}
					<div class="flex flex-col gap-2">
						<FormField
							id="log-location"
							label={m.log_form_location()}
							hint={m.log_form_location_hint()}
							error={message(errors.location)}
						>
							{#snippet children({ describedBy, invalid })}
								<input
									id="log-location"
									type="text"
									bind:value={draft.location}
									autocomplete="off"
									aria-describedby={describedBy}
									aria-invalid={invalid}
									class={fieldInput}
								/>
							{/snippet}
						</FormField>
						{#if otherLocations.length > 0}
							<ChipChoice
								label={m.form_location_others()}
								options={otherLocations}
								mode="fill"
								onpick={(place) => (draft.location = place ?? '')}
							/>
						{/if}
					</div>
				{/if}

				<FormField
					id="log-note"
					label={m.log_form_note()}
					optional={draft.kind !== 'note'}
					hint={draft.kind === 'problem' ? m.log_form_note_hint_problem() : undefined}
					error={message(errors.note)}
				>
					{#snippet children({ describedBy, invalid })}
						<textarea
							id="log-note"
							bind:value={draft.note}
							maxlength={NOTE_MAX + 50}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							class={fieldTextarea}></textarea>
					{/snippet}
				</FormField>
			</div>

			<button
				type="submit"
				disabled={saving}
				class="min-h-14 w-full rounded-2xl bg-primary px-4 text-[17px] font-extrabold text-on-primary disabled:opacity-60"
			>
				{m.log_add()}
			</button>
		</form>
	</main>
{/if}
