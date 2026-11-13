<!--
  Add plant, step 1: "What plant is it?" (docs/mockups/add-plant-species.dc.html,
  screens.md "Add plant").

  Every choice is a link to step 2: `/plants/new/<preset id>`, or
  `/plants/new/blank` for a blank profile. The chosen preset lives in the URL,
  so Back from step 2 and a reload both keep it. The list itself is
  SpeciesPicker, shared with Edit's "Change species".

  "Identify from a photo" is M2 and is left out until then rather than shown
  disabled: on a form, a control that does nothing is a trap.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import FlowHeader from '#lib/components/plant/FlowHeader.svelte';
	import SpeciesPicker from '#lib/components/plant/SpeciesPicker.svelte';
	import { m } from '#lib/paraglide/messages.js';
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

	<SpeciesPicker href={(preset) => resolve('/(flow)/plants/new/[preset]', { preset })} />
</main>
