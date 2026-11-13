<!--
  The Add/Edit plant form body (docs/mockups/add-plant.dc.html, screens.md
  "Add plant"): everything between the header and the submit button. Shared
  by Add and Edit; the pages own the header, the submit and the write.

  Decided before building (screens.md): structured inputs where the mockup
  shows free text (fertilizing, repotting, the comfortable range), "When" as a
  month picker, watch-outs one per line, and the photo button hidden until M3.
  Added: "Water needs" next to Light, since a blank profile otherwise has no
  way to set the water chip.
-->
<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import SegmentedChoice from '#lib/components/SegmentedChoice.svelte';
	import ChipChoice from '#lib/components/form/ChipChoice.svelte';
	import FormField from '#lib/components/form/FormField.svelte';
	import HealthPicker from '#lib/components/form/HealthPicker.svelte';
	import Stepper from '#lib/components/form/Stepper.svelte';
	import SwitchRow from '#lib/components/form/SwitchRow.svelte';
	import CareTag from '#lib/components/form/CareTag.svelte';
	import ResetToPreset from '#lib/components/form/ResetToPreset.svelte';
	import {
		fieldInput,
		fieldTextarea,
		formCard,
		sectionHeading
	} from '#lib/components/form/styles.js';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { CareField } from '#lib/plants/care-profile.js';
	import {
		lightLabel,
		potHint,
		potMaterialLabel,
		potTopLayerLabel,
		presetName,
		seasonRanges,
		waterLabel
	} from '#lib/plants/labels.js';
	import { waterLevel } from '#lib/plants/care.js';
	import type { PlantForm } from '#lib/plants/plant-form.svelte.js';
	import { DEFAULT_GROWING_MONTHS } from '#lib/plants/schedule.js';
	import type {
		LightLevel,
		PlantOrigin,
		PotMaterial,
		PotTopLayer,
		WateringStyle
	} from '#lib/types/plant.js';

	let {
		form,
		locations
	}: {
		form: PlantForm;
		/** Locations the user's other plants use, for the quick-fill chips. */
		locations: string[];
	} = $props();

	const hasPreset = $derived(form.preset !== undefined);
	/** The care tag's state for a field, or undefined (no tag) without a preset. */
	const editedOf = (field: CareField) => (hasPreset ? form.edited.includes(field) : undefined);

	const seasons = seasonRanges(DEFAULT_GROWING_MONTHS);

	const MORE_FIELDS: CareField[] = [
		'light',
		'lightLevel',
		'wateringStyle',
		'tempMinC',
		'tempComfortC',
		'fertilize',
		'repotIntervalMonths',
		'watchOuts'
	];
	// "More care details" starts open when something inside is already edited
	// (Edit), and opens on its own when a field inside fails validation, so
	// neither hides behind a closed section. After that it is the user's.
	let moreOpen = $state(untrack(() => MORE_FIELDS.some((field) => form.edited.includes(field))));
	$effect(() => {
		if (
			form.errors.tempMin ||
			form.errors.comfortMax ||
			form.errors.fertilizeDays ||
			form.errors.repotMonths
		) {
			moreOpen = true;
		}
	});

	const otherLocations = $derived(
		locations
			.filter((place) => place.trim() && place.trim() !== form.location.trim())
			.map((place) => ({ value: place, label: place }))
	);

	const potMaterials: { value: PotMaterial; label: string }[] = (
		['plastic', 'terracotta', 'glazed'] as const
	).map((value) => ({ value, label: potMaterialLabel(value) }));
	const potTopLayers: { value: PotTopLayer; label: string }[] = (
		['soil', 'pebbles', 'gravel'] as const
	).map((value) => ({ value, label: potTopLayerLabel(value) }));
	const lightLevels: { value: LightLevel; label: string }[] = (
		['bright', 'medium', 'low'] as const
	).map((value) => ({ value, label: lightLabel(value) }));
	const waterNeeds: { value: WateringStyle; label: string }[] = (
		['sparse', 'soak-and-dry', 'keep-moist'] as const
	).map((value) => ({ value, label: waterLabel(waterLevel(value)) }));
	const origins: { value: PlantOrigin; label: string }[] = [
		{ value: 'bought', label: m.origin_bought() },
		{ value: 'cutting', label: m.origin_cutting() },
		{ value: 'propagated', label: m.origin_propagated() },
		{ value: 'gift', label: m.origin_gift() }
	];

	const hint = $derived(potHint(form.potMaterial, form.potTopLayer));
	const days = (count: number) => m.form_days({ count });
</script>

<!-- The plant: name, species, where it lives. -->
<div class={formCard}>
	<FormField
		id="plant-name"
		label={m.form_name()}
		hint={m.form_name_hint()}
		error={form.errors.name}
	>
		{#snippet children({ describedBy, invalid })}
			<input
				id="plant-name"
				type="text"
				bind:value={form.name}
				maxlength="60"
				autocomplete="off"
				aria-describedby={describedBy}
				aria-invalid={invalid}
				class={fieldInput}
			/>
		{/snippet}
	</FormField>

	<div class="flex items-center justify-between gap-3 rounded-xl bg-bg px-3.5 py-2.5">
		<span class="flex min-w-0 flex-col">
			<span class="text-xs font-bold text-muted">{m.form_species()}</span>
			<span class="truncate text-[15px] text-ink">
				{#if form.preset}
					{presetName(form.preset)}{#if form.preset.scientificName}&nbsp;·&nbsp;<i
							>{form.preset.scientificName}</i
						>{/if}
				{:else}
					{m.form_species_blank()}
				{/if}
			</span>
		</span>
		<a
			href={resolve('/(flow)/plants/new')}
			class="flex min-h-11 flex-none items-center text-sm font-bold text-link"
		>
			{m.form_species_change()}
		</a>
	</div>

	<div class="flex flex-col gap-2">
		<FormField id="plant-location" label={m.form_location()}>
			{#snippet children({ describedBy })}
				<input
					id="plant-location"
					type="text"
					bind:value={form.location}
					autocomplete="off"
					aria-describedby={describedBy}
					class={fieldInput}
				/>
			{/snippet}
		</FormField>
		{#if otherLocations.length > 0}
			<ChipChoice
				label={m.form_location_others()}
				options={otherLocations}
				mode="fill"
				onpick={(place) => (form.location = place ?? '')}
			/>
		{/if}
	</div>
</div>

<section class="flex flex-col gap-2">
	<h2 class={sectionHeading}>{m.form_health()}</h2>
	<HealthPicker bind:value={form.health} />
</section>

<section class="flex flex-col gap-2">
	<h2 class={sectionHeading}>{m.form_pot()}</h2>
	<div class={formCard}>
		<SegmentedChoice
			legend={m.form_pot_material()}
			name="pot-material"
			options={potMaterials}
			bind:value={form.potMaterial}
		/>
		<div class="flex flex-col gap-1.5">
			<SegmentedChoice
				legend={m.form_pot_top()}
				name="pot-top"
				options={potTopLayers}
				bind:value={form.potTopLayer}
			/>
			{#if hint}<p class="text-xs leading-[1.4] text-muted">{hint}</p>{/if}
		</div>
		<FormField id="plant-pot-size" label={m.form_pot_size()} optional error={form.errors.potSize}>
			{#snippet children({ describedBy, invalid })}
				<span class="flex items-center gap-2">
					<input
						id="plant-pot-size"
						type="number"
						inputmode="numeric"
						min="1"
						max="200"
						bind:value={form.potSize}
						aria-describedby={describedBy}
						aria-invalid={invalid}
						class="{fieldInput} w-24"
					/>
					<span class="text-sm text-muted">{m.form_pot_size_unit()}</span>
				</span>
			{/snippet}
		</FormField>
	</div>
</section>

<section class="flex flex-col gap-2">
	<h2 class={sectionHeading}>{m.form_watering()}</h2>
	<div class={formCard}>
		<p class="text-sm leading-[1.45] text-muted">
			{form.preset
				? m.form_watering_from_preset({ preset: presetName(form.preset) })
				: m.form_watering_blank()}
		</p>

		<fieldset class="flex flex-col">
			<legend class="mb-2 flex w-full items-center justify-between gap-2">
				<span class="text-sm font-bold text-ink-2">{m.form_reminder()}</span>
				{#if editedOf('fixedSchedule') !== undefined}
					<CareTag edited={Boolean(editedOf('fixedSchedule'))} />
				{/if}
			</legend>
			<div class="flex flex-col gap-2">
				{#each [false, true] as fixed (fixed)}
					{@const chosen = form.fixedSchedule === fixed}
					<label
						class={[
							'flex cursor-pointer items-start gap-3 rounded-[14px] p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
							chosen ? 'border-2 bg-selected' : 'border-[1.5px] border-border'
						]}
						style:border-color={chosen ? 'var(--selected-border)' : undefined}
					>
						<input
							type="radio"
							name="reminder"
							checked={chosen}
							class="sr-only"
							onchange={() => (form.fixedSchedule = fixed)}
						/>
						<span
							aria-hidden="true"
							class="mt-0.5 size-5 flex-none rounded-full"
							style:border={chosen
								? '6px solid var(--selected-border)'
								: '2px solid var(--field-border)'}
						></span>
						<span class="flex flex-col gap-0.5">
							<span class="text-[15px] font-bold text-ink">
								{fixed ? m.form_reminder_fixed() : m.form_reminder_check()}
							</span>
							<span class="text-xs leading-[1.4] text-muted">
								{fixed ? m.form_reminder_fixed_hint() : m.form_reminder_check_hint()}
							</span>
						</span>
					</label>
				{/each}
			</div>
			{#if editedOf('fixedSchedule')}
				<ResetToPreset onclick={() => form.reset('fixedSchedule')} />
			{/if}
		</fieldset>

		<div class="h-px bg-line"></div>

		<div class="flex flex-col gap-3">
			<div class="flex items-center justify-between gap-2">
				<span class="text-sm font-bold text-ink-2">
					{form.fixedSchedule ? m.form_interval_water() : m.form_interval_check()}
				</span>
				{#if editedOf('checkIntervalDays') !== undefined}
					<CareTag edited={Boolean(editedOf('checkIntervalDays'))} />
				{/if}
			</div>
			<Stepper
				label={m.form_season_growing()}
				sublabel={seasons.growing}
				bind:value={form.growing}
				display={days(form.growing)}
				decreaseLabel={m.form_interval_fewer({ season: m.form_season_growing() })}
				increaseLabel={m.form_interval_more({ season: m.form_season_growing() })}
			/>
			<Stepper
				label={m.form_season_resting()}
				sublabel={seasons.resting}
				bind:value={form.resting}
				display={days(form.resting)}
				decreaseLabel={m.form_interval_fewer({ season: m.form_season_resting() })}
				increaseLabel={m.form_interval_more({ season: m.form_season_resting() })}
			/>
			{#if editedOf('checkIntervalDays')}
				<ResetToPreset onclick={() => form.reset('checkIntervalDays')} />
			{/if}
		</div>

		<div class="h-px bg-line"></div>

		<FormField
			id="plant-check"
			label={m.form_check_test()}
			edited={editedOf('dryDownTest')}
			onreset={() => form.reset('dryDownTest')}
		>
			{#snippet children({ describedBy })}
				<input
					id="plant-check"
					type="text"
					bind:value={form.dryDownTest}
					aria-describedby={describedBy}
					class={fieldInput}
				/>
			{/snippet}
		</FormField>

		<div class="h-px bg-line"></div>

		<SwitchRow
			id="plant-grow-light"
			label={m.form_grow_light()}
			description={m.form_grow_light_hint()}
			bind:checked={form.underGrowLight}
		/>
		<SwitchRow
			id="plant-dormant"
			label={m.form_dormant()}
			description={m.form_dormant_hint()}
			bind:checked={form.dormant}
		/>
	</div>
</section>

<Collapsible.Root bind:open={moreOpen}>
	<Collapsible.Trigger
		class="flex w-full items-center justify-between gap-3 rounded-[18px] bg-surface p-4 text-left shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
	>
		<span class="flex flex-col gap-0.5">
			<span class="text-[15px] font-bold text-ink">{m.form_more()}</span>
			<span class="text-xs text-muted">{m.form_more_hint()}</span>
		</span>
		<span class={['flex-none text-muted transition-transform', moreOpen && 'rotate-180']}>
			<ChevronDown size={20} strokeWidth={2.2} aria-hidden="true" />
		</span>
	</Collapsible.Trigger>
	<Collapsible.Content class="mt-2">
		<div class={formCard}>
			<SegmentedChoice
				legend={m.care_light()}
				name="light-level"
				options={lightLevels}
				bind:value={form.lightLevel}
				edited={editedOf('lightLevel')}
				onreset={() => form.reset('lightLevel')}
			/>
			<FormField
				id="plant-light"
				label={m.form_light_notes()}
				edited={editedOf('light')}
				onreset={() => form.reset('light')}
			>
				{#snippet children({ describedBy })}
					<input
						id="plant-light"
						type="text"
						bind:value={form.light}
						aria-describedby={describedBy}
						class={fieldInput}
					/>
				{/snippet}
			</FormField>
			<SegmentedChoice
				legend={m.form_water_needs()}
				name="water-needs"
				options={waterNeeds}
				bind:value={form.wateringStyle}
				edited={editedOf('wateringStyle')}
				onreset={() => form.reset('wateringStyle')}
			/>

			<div class="h-px bg-line"></div>

			<FormField
				id="plant-temp-min"
				label={m.form_temp_min()}
				error={form.errors.tempMin}
				edited={editedOf('tempMinC')}
				onreset={() => form.reset('tempMinC')}
			>
				{#snippet children({ describedBy, invalid })}
					<span class="flex items-center gap-2">
						<input
							id="plant-temp-min"
							type="number"
							inputmode="numeric"
							bind:value={form.tempMin}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							class="{fieldInput} w-24"
						/>
						<span class="text-sm text-muted">°C</span>
					</span>
				{/snippet}
			</FormField>

			<FormField
				id="plant-comfort-min"
				label={m.form_temp_comfort()}
				error={form.errors.comfortMax}
				edited={editedOf('tempComfortC')}
				onreset={() => form.reset('tempComfortC')}
			>
				{#snippet children({ describedBy, invalid })}
					<span class="flex items-center gap-2">
						<input
							id="plant-comfort-min"
							type="number"
							inputmode="numeric"
							bind:value={form.comfortMin}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							aria-label={m.form_temp_comfort_from()}
							class="{fieldInput} w-24"
						/>
						<span class="text-sm text-muted" aria-hidden="true">–</span>
						<input
							type="number"
							inputmode="numeric"
							bind:value={form.comfortMax}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							aria-label={m.form_temp_comfort_to()}
							class="{fieldInput} w-24"
						/>
						<span class="text-sm text-muted">°C</span>
					</span>
				{/snippet}
			</FormField>

			<div class="h-px bg-line"></div>

			<div class="flex flex-col gap-3">
				<FormField
					id="plant-fertilize"
					label={m.care_fertilizing()}
					hint={m.form_fertilize_hint()}
					error={form.errors.fertilizeDays}
					edited={editedOf('fertilize')}
					onreset={() => form.reset('fertilize')}
				>
					{#snippet children({ describedBy, invalid })}
						<span class="flex items-center gap-2">
							<span class="text-sm text-muted">{m.form_every()}</span>
							<input
								id="plant-fertilize"
								type="number"
								inputmode="numeric"
								min="1"
								bind:value={form.fertilizeDays}
								aria-describedby={describedBy}
								aria-invalid={invalid}
								class="{fieldInput} w-24"
							/>
							<span class="text-sm text-muted">{m.form_days_unit()}</span>
						</span>
					{/snippet}
				</FormField>
				{#if form.fertilizeDays !== null}
					<SwitchRow
						id="plant-fertilize-growing"
						label={m.form_fertilize_growing_only()}
						bind:checked={form.fertilizeGrowingOnly}
					/>
				{/if}
			</div>

			<FormField
				id="plant-repot"
				label={m.care_repot()}
				error={form.errors.repotMonths}
				edited={editedOf('repotIntervalMonths')}
				onreset={() => form.reset('repotIntervalMonths')}
			>
				{#snippet children({ describedBy, invalid })}
					<span class="flex items-center gap-2">
						<span class="text-sm text-muted">{m.form_every()}</span>
						<input
							id="plant-repot"
							type="number"
							inputmode="numeric"
							min="1"
							bind:value={form.repotMonths}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							class="{fieldInput} w-24"
						/>
						<span class="text-sm text-muted">{m.form_months_unit()}</span>
					</span>
				{/snippet}
			</FormField>

			<FormField
				id="plant-watch-outs"
				label={m.form_watch_outs()}
				hint={m.form_watch_outs_hint()}
				edited={editedOf('watchOuts')}
				onreset={() => form.reset('watchOuts')}
			>
				{#snippet children({ describedBy })}
					<textarea
						id="plant-watch-outs"
						bind:value={form.watchOuts}
						rows="3"
						aria-describedby={describedBy}
						class={fieldTextarea}></textarea>
				{/snippet}
			</FormField>
		</div>
	</Collapsible.Content>
</Collapsible.Root>

<section class="flex flex-col gap-2">
	<h2 class={sectionHeading}>
		{m.form_about()} <span class="tracking-normal normal-case">({m.form_optional()})</span>
	</h2>
	<div class={formCard}>
		<div class="flex flex-col gap-2">
			<span class="text-sm font-bold text-ink-2">{m.form_origin()}</span>
			<ChipChoice
				label={m.form_origin()}
				options={origins}
				value={form.origin}
				onpick={(origin) => (form.origin = origin)}
			/>
		</div>
		<FormField
			id="plant-acquired"
			label={m.form_acquired()}
			hint={m.form_acquired_hint()}
			error={form.errors.acquired}
		>
			{#snippet children({ describedBy, invalid })}
				<input
					id="plant-acquired"
					type="month"
					bind:value={form.acquired}
					lang={getLocale()}
					aria-describedby={describedBy}
					aria-invalid={invalid}
					class={fieldInput}
				/>
			{/snippet}
		</FormField>
		<FormField id="plant-notes" label={m.form_notes()}>
			{#snippet children({ describedBy })}
				<textarea
					id="plant-notes"
					bind:value={form.notes}
					rows="3"
					placeholder={m.form_notes_placeholder()}
					aria-describedby={describedBy}
					class={fieldTextarea}></textarea>
			{/snippet}
		</FormField>
		<!-- "Note for plant-sitters" is left out until plant-sitting (M4)
		     lands. The form still carries `sitterNote` through, so editing a
		     plant never drops a note it already has. -->
	</div>
</section>
