<!--
  Add plant, step 2: the details (docs/mockups/add-plant.dc.html, screens.md
  "Add plant").

  The preset comes from the URL (`blank` for a blank profile). Saving writes
  the plant and its first water check in one batch and opens the new plant at
  once — the write lands in the offline cache immediately and syncs when it
  can (plant-writes.ts).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import FlowHeader from '#lib/components/plant/FlowHeader.svelte';
	import PlantFormFields from '#lib/components/plant/PlantFormFields.svelte';
	import { createPlant } from '#lib/firebase/plant-writes.js';
	import { PlantsQuery } from '#lib/firebase/plants.svelte.js';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { parseLocalDate } from '#lib/plants/care.js';
	import { presetName, shortDateLabel } from '#lib/plants/labels.js';
	import { PlantForm } from '#lib/plants/plant-form.svelte.js';
	import { checkDateAfter, currentIntervalDays } from '#lib/plants/schedule.js';
	import { BLANK_PRESET, presetById } from '#lib/presets/index.js';

	const id = page.params.preset;
	const preset = presetById(id);
	const known = preset !== undefined || id === BLANK_PRESET;

	const form = new PlantForm(preset, getLocale());

	// The user's other plants, only for the "Where is it?" quick-fill chips.
	const others = new PlantsQuery();
	$effect(() => {
		const uid = session.user?.uid;
		if (!uid) return;
		return others.listen(uid);
	});
	const locations = $derived(
		[...new Set(others.plants.map((plant) => plant.location?.trim() ?? '').filter(Boolean))].sort(
			(a, b) => a.localeCompare(b, getLocale())
		)
	);

	// The first check is counted from today (CLAUDE.md "Scheduling").
	const today = new Date();
	const firstCheck = $derived.by(() => {
		const intervalDays = currentIntervalDays(form.care, form, today);
		return { nextDue: checkDateAfter(today, intervalDays), intervalDays };
	});
	const firstCheckLabel = $derived(shortDateLabel(parseLocalDate(firstCheck.nextDue)!));

	const heading = preset
		? m.add_details_heading({ name: presetName(preset) })
		: m.add_blank_heading();

	let saving = $state(false);

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		const uid = session.user?.uid;
		if (!uid || saving) return;
		if (!form.validate()) {
			// Take the user to the first problem rather than leaving them to
			// scroll a long form looking for red text.
			requestAnimationFrame(() => {
				document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			});
			return;
		}
		saving = true;
		const plantId = createPlant(uid, form.toPlantData(), firstCheck);
		// Replace the form in history, so Back from the new plant doesn't
		// reopen a filled-in form that would add it twice.
		await goto(resolve('/(app)/plants/[id]', { id: plantId }), { replace: true });
	}
</script>

<svelte:head>
	<title>{known ? heading : m.add_preset_missing_heading()} · Water.it</title>
</svelte:head>

<main class="flex flex-col gap-5 px-5 pt-[52px] pb-10 md:pt-10">
	<FlowHeader href={resolve('/(flow)/plants/new')} kind="back" step={2} />

	{#if known}
		<h1 class="text-[30px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
			{heading}
		</h1>

		<form class="flex flex-col gap-5" novalidate {onsubmit}>
			<PlantFormFields {form} {locations} speciesHref={resolve('/(flow)/plants/new')} />

			<div class="flex flex-col gap-2">
				<button
					type="submit"
					disabled={saving}
					class="min-h-14 w-full rounded-2xl bg-primary px-4 text-[17px] font-extrabold text-on-primary disabled:opacity-60"
				>
					{m.add_submit()}
				</button>
				<p class="text-center text-xs text-muted">
					{m.add_first_check({ date: firstCheckLabel })}
				</p>
			</div>
		</form>
	{:else}
		<h1 class="text-2xl font-extrabold text-ink">{m.add_preset_missing_heading()}</h1>
		<p class="text-sm text-muted">{m.add_preset_missing_body()}</p>
		<a
			href={resolve('/(flow)/plants/new')}
			class="min-h-12 rounded-xl border border-border px-4 py-3 text-center font-bold text-ink"
		>
			{m.add_back_species()}
		</a>
	{/if}
</main>
