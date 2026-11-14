<!--
  The species list shared by Add plant step 1 and Edit's "Change species"
  (docs/mockups/add-plant-species.dc.html, screens.md "Add plant"): search,
  the species presets, the general starting points and "start blank".

  Add gives `href`, so every choice is a link and the URL carries the preset.
  Edit gives `onpick`, so every choice is a button that changes the form in
  place. `current` marks the plant's present choice (a preset id, or
  BLANK_PRESET).
-->
<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Search from '@lucide/svelte/icons/search';
	import type { Snippet } from 'svelte';
	import CareChip from '#lib/components/CareChip.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { waterLevel } from '#lib/plants/care.js';
	import { lightLabel, waterLabel } from '#lib/plants/labels.js';
	import { BLANK_PRESET, localText, matchesPreset, presets } from '#lib/presets/index.js';

	let {
		href,
		onpick,
		current
	}: {
		/** Where a choice links to, already resolved. */
		href?: (presetId: string) => string;
		onpick?: (presetId: string) => void;
		current?: string;
	} = $props();

	let search = $state('');

	const locale = $derived(getLocale());
	const species = $derived(
		presets.filter((preset) => preset.kind === 'species' && matchesPreset(preset, search, locale))
	);
	// The general starting points stay visible whatever is typed: they are the
	// answer when the search finds nothing.
	const generic = presets.filter((preset) => preset.kind === 'generic');
</script>

<!-- A link when `href` is given, a button otherwise. -->
{#snippet choice(id: string, className: string, content: Snippet)}
	{#if href}
		<!-- href() returns resolved paths. -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a href={href(id)} class={className} aria-current={id === current ? 'true' : undefined}>
			{@render content()}
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else}
		<button
			type="button"
			class={className}
			aria-current={id === current ? 'true' : undefined}
			onclick={() => onpick?.(id)}
		>
			{@render content()}
		</button>
	{/if}
{/snippet}

<label
	class="flex min-h-[52px] items-center gap-2.5 rounded-[14px] border-[1.5px] border-field-border bg-field px-3.5 text-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
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
		<p
			class="rounded-[18px] border border-card-edge bg-surface px-4 py-3.5 text-sm text-muted"
			role="status"
		>
			{m.add_search_none({ query: search.trim() })}
		</p>
	{:else}
		<ul
			class="flex flex-col rounded-[18px] border border-card-edge bg-surface px-3.5 shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
		>
			{#each species as preset, index (preset.id)}
				{@const light = lightLabel(preset.care.lightLevel)}
				{@const water = waterLabel(waterLevel(preset.care.wateringStyle))}
				<li class:border-b={index < species.length - 1} style:border-color="var(--line)">
					{#snippet row()}
						<span class="flex min-w-0 flex-1 flex-col gap-0.5">
							<span class="text-base font-bold">{localText(preset.name, locale)}</span>
							{#if preset.scientificName}
								<i class="truncate text-[13px] text-muted">{preset.scientificName}</i>
							{/if}
							{#if preset.id === current}
								<span class="text-[13px] font-bold text-primary">{m.species_current()}</span>
							{/if}
						</span>
						<!-- The chips wrap under each other on a narrow phone rather
						     than squeezing the name. -->
						<span class="flex flex-none flex-wrap justify-end gap-1.5">
							<CareChip variant="sun" label={light} aria={m.light_aria({ level: light })} />
							<CareChip variant="water" label={water} aria={m.water_aria({ level: water })} />
						</span>
						<span class="flex-none text-muted-2">
							{#if preset.id === current}
								<Check size={18} strokeWidth={2.4} class="text-primary" aria-hidden="true" />
							{:else}
								<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
							{/if}
						</span>
					{/snippet}
					{@render choice(
						preset.id,
						'flex min-h-16 w-full items-center gap-3 py-2.5 text-left text-ink no-underline',
						row
					)}
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
			{#snippet card()}
				<span class="text-[15px] font-bold">{localText(preset.name, locale)}</span>
				{#if preset.id === current}
					<span class="text-xs font-bold text-primary">{m.species_current()}</span>
				{/if}
				{#if preset.description}
					<span class="text-xs leading-[1.4] text-muted">
						{localText(preset.description, locale)}
					</span>
				{/if}
			{/snippet}
			{@render choice(
				preset.id,
				'flex flex-col gap-1 rounded-[18px] border border-card-edge bg-surface p-3.5 text-ink no-underline text-left shadow-[0_1px_2px_rgba(20,40,30,0.06)]',
				card
			)}
		{/each}
	</div>
	{#if current !== BLANK_PRESET}
		{#snippet blank()}
			{m.add_blank()}
		{/snippet}
		{@render choice(
			BLANK_PRESET,
			'flex min-h-11 items-center self-center text-sm font-bold text-link',
			blank
		)}
	{/if}
</section>
