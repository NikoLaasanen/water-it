<!--
  Add plant, step 2 (docs/mockups/add-plant.dc.html).

  PLACEHOLDER until the details form is built (next step). It already reads
  the chosen preset from the URL, including `blank` and an unknown id, so the
  picker's links have somewhere real to land.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import FlowHeader from '#lib/components/plant/FlowHeader.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { BLANK_PRESET, localText, presetById } from '#lib/presets/index.js';

	const id = $derived(page.params.preset);
	const blank = $derived(id === BLANK_PRESET);
	const preset = $derived(presetById(id));
	const heading = $derived(
		preset
			? m.add_details_heading({ name: localText(preset.name, getLocale()) })
			: m.add_blank_heading()
	);
</script>

<svelte:head>
	<title>{heading} · Water.it</title>
</svelte:head>

<main class="flex flex-col gap-5 px-5 pt-[52px] pb-8 md:pt-10">
	<FlowHeader href={resolve('/(flow)/plants/new')} kind="back" step={2} />

	{#if preset || blank}
		<h1 class="text-[30px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
			{heading}
		</h1>
		<p class="rounded-[18px] bg-surface p-4 text-sm text-muted">{m.add_details_soon()}</p>
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
