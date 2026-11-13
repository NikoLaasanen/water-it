<!--
  Add plant, step 1: "What plant is it?" (docs/mockups/add-plant-species.dc.html,
  screens.md "Add plant").

  Every choice is a link to step 2: `/plants/new/<preset id>`, or
  `/plants/new/blank` for a blank profile. The chosen preset lives in the URL,
  so Back from step 2 and a reload both keep it.

  "Identify from a photo" is M2 and is left out until then rather than shown
  disabled: on a form, a control that does nothing is a trap.
-->
<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Search from '@lucide/svelte/icons/search';
	import { resolve } from '$app/paths';
	import CareChip from '#lib/components/CareChip.svelte';
	import FlowHeader from '#lib/components/plant/FlowHeader.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { waterLevel } from '#lib/plants/care.js';
	import { lightLabel, waterLabel } from '#lib/plants/labels.js';
	import { BLANK_PRESET, localText, matchesPreset, presets } from '#lib/presets/index.js';

	let search = $state('');

	const locale = $derived(getLocale());
	const species = $derived(
		presets.filter((preset) => preset.kind === 'species' && matchesPreset(preset, search, locale))
	);
	// The general starting points stay visible whatever is typed: they are the
	// answer when the search finds nothing.
	const generic = presets.filter((preset) => preset.kind === 'generic');
</script>

<svelte:head>
	<title>{m.add_species_heading()} · Water.it</title>
</svelte:head>

<main class="flex flex-col gap-5 px-5 pt-[52px] pb-8 md:pt-10">
	<FlowHeader href={resolve('/(app)/plants')} kind="close" step={1} />

	<header class="flex flex-col gap-1.5">
		<h1 class="text-[30px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
			{m.add_species_heading()}
		</h1>
		<p class="text-sm leading-[1.45] text-muted">{m.add_species_intro()}</p>
	</header>

	<label
		class="flex min-h-[52px] items-center gap-2.5 rounded-[14px] border-[1.5px] border-field-border bg-field px-3.5 text-muted"
	>
		<Search size={20} strokeWidth={2} aria-hidden="true" />
		<span class="sr-only">{m.plants_search_label()}</span>
		<input
			type="search"
			bind:value={search}
			placeholder={m.add_search_placeholder()}
			autocapitalize="none"
			spellcheck="false"
			class="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-placeholder"
		/>
	</label>

	<section class="flex flex-col gap-2" aria-labelledby="presets-heading">
		<h2 id="presets-heading" class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
			{m.add_presets_heading()}
		</h2>
		{#if species.length === 0}
			<p class="rounded-[18px] bg-surface px-4 py-3.5 text-sm text-muted" role="status">
				{m.add_search_none({ query: search.trim() })}
			</p>
		{:else}
			<ul
				class="flex flex-col rounded-[18px] bg-surface px-3.5 shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
			>
				{#each species as preset, index (preset.id)}
					{@const light = lightLabel(preset.care.lightLevel)}
					{@const water = waterLabel(waterLevel(preset.care.wateringStyle))}
					<li class:border-b={index < species.length - 1} style:border-color="var(--line)">
						<a
							href={resolve('/(flow)/plants/new/[preset]', { preset: preset.id })}
							class="flex min-h-16 items-center gap-3 py-2.5 text-ink no-underline"
						>
							<span class="flex min-w-0 flex-1 flex-col gap-0.5">
								<span class="text-base font-bold">{localText(preset.name, locale)}</span>
								{#if preset.scientificName}
									<i class="truncate text-[13px] text-muted">{preset.scientificName}</i>
								{/if}
							</span>
							<!-- The chips wrap under each other on a narrow phone rather
							     than squeezing the name. -->
							<span class="flex flex-none flex-wrap justify-end gap-1.5">
								<CareChip variant="sun" label={light} aria={m.light_aria({ level: light })} />
								<CareChip variant="water" label={water} aria={m.water_aria({ level: water })} />
							</span>
							<span class="flex-none text-muted-2">
								<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="flex flex-col gap-2" aria-labelledby="generic-heading">
		<h2 id="generic-heading" class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
			{m.add_generic_heading()}
		</h2>
		<div class="grid grid-cols-2 gap-2.5">
			{#each generic as preset (preset.id)}
				<a
					href={resolve('/(flow)/plants/new/[preset]', { preset: preset.id })}
					class="flex flex-col gap-1 rounded-[18px] bg-surface p-3.5 text-ink no-underline shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
				>
					<span class="text-[15px] font-bold">{localText(preset.name, locale)}</span>
					{#if preset.description}
						<span class="text-xs leading-[1.4] text-muted">
							{localText(preset.description, locale)}
						</span>
					{/if}
				</a>
			{/each}
		</div>
		<a
			href={resolve('/(flow)/plants/new/[preset]', { preset: BLANK_PRESET })}
			class="flex min-h-11 items-center self-center text-sm font-bold text-link"
		>
			{m.add_blank()}
		</a>
	</section>
</main>
