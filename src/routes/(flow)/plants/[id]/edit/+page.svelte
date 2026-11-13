<!--
  Edit plant (docs/mockups/edit-plant-dark.dc.html, screens.md "Edit plant").

  The Add form, prefilled from the plant: Cancel · "Edit plant" · Save at the
  top, "Edited" tags and "Reset to preset" on changed care fields, and Save
  changes plus Delete plant at the bottom.

  "Change" on the species row opens SpeciesPicker over the form with shallow
  routing, so the iOS back swipe closes it. Picking reloads the care fields
  from the new preset (PlantForm.changePreset); nothing is written until Save,
  so Cancel still discards it.

  Saving updates the plant and, if the interval for today's season changed,
  moves its next check so it still counts from the last check
  (`rescheduleForNewInterval`). Delete asks first, then removes the plant with
  its checks and log.
-->
<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { untrack } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import SpeciesPicker from '#lib/components/plant/SpeciesPicker.svelte';
	import PlantFormFields from '#lib/components/plant/PlantFormFields.svelte';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { deletePlant, updatePlant, type CheckUpdate } from '#lib/firebase/plant-writes.js';
	import { PlantQuery, PlantsQuery } from '#lib/firebase/plants.svelte.js';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { PlantForm } from '#lib/plants/plant-form.svelte.js';
	import {
		checkDateAfter,
		currentIntervalDays,
		rescheduleForNewInterval
	} from '#lib/plants/schedule.js';
	import { BLANK_PRESET, presetById } from '#lib/presets/index.js';

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

	// Built once, from the first snapshot. Later snapshots (this plant saved
	// from another device, say) must not wipe what is being typed.
	let form = $state<PlantForm | null>(null);
	$effect(() => {
		const plant = query.plant;
		if (plant && untrack(() => form) === null) {
			form = new PlantForm(presetById(plant.speciesId), getLocale(), plant);
		}
	});

	const locations = $derived(
		[...new Set(others.plants.map((plant) => plant.location?.trim() ?? '').filter(Boolean))].sort(
			(a, b) => a.localeCompare(b, getLocale())
		)
	);

	// Came here from the plant's own page? Then leaving goes *back*, so Back
	// afterwards doesn't reopen the form. Opened directly, it replaces itself.
	let cameFromDetail = $state(false);
	// Shallow navigations (opening and closing the species picker) fire this
	// too in SvelteKit 3; they say nothing about where Edit was opened from.
	afterNavigate(({ from, shallow }) => {
		if (shallow) return;
		cameFromDetail = from?.url.pathname === detailHref;
	});

	const picking = $derived(page.state.pickingSpecies === true);
	let formScroll = 0;

	function openPicker() {
		formScroll = window.scrollY;
		void goto(resolve('/(flow)/plants/[id]/edit', { id: plantId }), {
			shallow: true,
			state: { pickingSpecies: true }
		});
		window.scrollTo(0, 0);
	}

	// Closing (Back, swipe, or a pick) returns to where the form was scrolled.
	$effect(() => {
		if (!picking) requestAnimationFrame(() => window.scrollTo(0, formScroll));
	});

	function pickSpecies(id: string) {
		form?.changePreset(id === BLANK_PRESET ? undefined : presetById(id));
		history.back();
	}

	function leave() {
		if (cameFromDetail) history.back();
		else void goto(detailHref, { replaceState: true });
	}

	let saving = $state(false);
	let deleting = $state(false);
	let confirmOpen = $state(false);

	function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		const uid = session.user?.uid;
		if (!uid || !form || saving) return;
		if (!form.validate()) {
			requestAnimationFrame(() => {
				document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			});
			return;
		}
		saving = true;

		const today = new Date();
		const intervalDays = currentIntervalDays(form.care, form, today);
		const task = query.checkTask;
		const check: CheckUpdate = !task
			? { kind: 'create', nextDue: checkDateAfter(today, intervalDays), intervalDays }
			: task.intervalDays !== undefined && task.intervalDays !== intervalDays
				? {
						kind: 'set',
						nextDue: rescheduleForNewInterval(task.nextDue, task.intervalDays, intervalDays),
						intervalDays
					}
				: { kind: 'keep' };

		updatePlant(uid, plantId, form.toPlantData(), check);
		leave();
	}

	async function confirmDelete() {
		const uid = session.user?.uid;
		if (!uid || deleting) return;
		deleting = true;
		await deletePlant(uid, plantId);
		confirmOpen = false;
		await goto(resolve('/(app)/plants'), { replaceState: true });
	}
</script>

<svelte:head>
	<title>{m.edit_heading()} · Water.it</title>
</svelte:head>

{#if query.loading || (query.plant && !form)}
	<p class="flex min-h-dvh items-center justify-center text-sm text-muted" role="status">
		{m.loading()}
	</p>
{:else if (query.missing || !form) && !deleting}
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
{:else if form}
	{#if picking}
		<main class="flex flex-col gap-5 px-5 pt-[52px] pb-8 md:pt-10">
			<button
				type="button"
				onclick={() => history.back()}
				aria-label={m.species_change_back()}
				class="flex size-11 items-center justify-center rounded-full bg-surface text-ink shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
			>
				<ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
			</button>
			<header class="flex flex-col gap-1.5">
				<h1 class="text-[30px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
					{m.species_change_heading()}
				</h1>
				<p class="text-sm leading-[1.45] text-muted">{m.species_change_intro()}</p>
			</header>
			<SpeciesPicker onpick={pickSpecies} current={form.preset?.id ?? BLANK_PRESET} />
		</main>
	{/if}
	<!-- Hidden, not unmounted, while the picker is open: the form keeps its
	     open sections and Save stays wired up. -->
	<main class="flex flex-col gap-5 px-5 pt-[52px] pb-10 md:pt-10" hidden={picking}>
		<!-- Cancel · Edit plant · Save, as in the mockup. Save submits the form
		     below through the `form` attribute. -->
		<header class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
			<button
				type="button"
				class="flex min-h-11 items-center justify-self-start text-[15px] font-semibold text-link"
				onclick={leave}
			>
				{m.edit_cancel()}
			</button>
			<h1 class="text-[17px] font-bold text-ink">{m.edit_heading()}</h1>
			<button
				type="submit"
				form="plant-edit"
				disabled={saving}
				class="flex min-h-11 items-center justify-self-end text-[15px] font-bold text-link disabled:opacity-60"
			>
				{m.edit_save()}
			</button>
		</header>

		<form id="plant-edit" class="flex flex-col gap-5" novalidate {onsubmit}>
			<PlantFormFields {form} {locations} onchangespecies={openPicker} />

			<div class="flex flex-col gap-3">
				<button
					type="submit"
					disabled={saving}
					class="min-h-14 w-full rounded-2xl bg-primary px-4 text-[17px] font-extrabold text-on-primary disabled:opacity-60"
				>
					{m.edit_save_changes()}
				</button>

				<AlertDialog.Root bind:open={confirmOpen}>
					<!-- type="button": it sits inside the form and must not submit it. -->
					<AlertDialog.Trigger
						type="button"
						class="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] bg-transparent text-base font-bold"
						style="border-color: var(--danger-border); color: var(--danger)"
					>
						<Trash size={18} strokeWidth={2.2} aria-hidden="true" />
						{m.edit_delete()}
					</AlertDialog.Trigger>
					<AlertDialog.Content class="max-w-[calc(100%-2.5rem)] rounded-[18px] p-5 sm:max-w-sm">
						<AlertDialog.Header>
							<AlertDialog.Title class="text-lg font-bold text-ink">
								{m.delete_title({ name: form.name.trim() || query.plant?.name || '' })}
							</AlertDialog.Title>
							<AlertDialog.Description class="text-sm leading-[1.45] text-muted">
								{m.delete_body()}
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer class="mx-0 mb-0 flex-col gap-2 border-0 bg-transparent p-0">
							<AlertDialog.Action
								class="min-h-12 w-full rounded-xl text-base font-bold"
								style="background: var(--danger-fill); color: var(--on-danger)"
								disabled={deleting}
								onclick={confirmDelete}
							>
								{deleting ? m.delete_busy() : m.delete_confirm()}
							</AlertDialog.Action>
							<AlertDialog.Cancel
								class="min-h-12 w-full rounded-xl border-[1.5px] border-border bg-surface text-base font-semibold text-ink"
							>
								{m.delete_keep()}
							</AlertDialog.Cancel>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>

				<p class="text-center text-xs leading-[1.4] text-muted">{m.edit_delete_note()}</p>
			</div>
		</form>
	</main>
{/if}
