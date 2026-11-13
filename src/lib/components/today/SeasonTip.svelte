<!--
  The seasonal tip on Today's nothing-due screen: one bundled tip a day, from
  the growing-season or the winter list (#lib/plants/tips.ts).
-->
<script lang="ts">
	import Thermometer from '@lucide/svelte/icons/thermometer';
	import { isGrowingSeason } from '#lib/plants/schedule.js';
	import { tipOfTheDay } from '#lib/plants/tips.js';

	let { today }: { today: Date } = $props();

	const tip = $derived(tipOfTheDay(today, isGrowingSeason(today)));
</script>

<section
	aria-labelledby="tip-heading"
	class="flex items-start gap-3 rounded-[18px] px-4 py-3.5"
	style="background: var(--chip-sun-bg)"
>
	<span
		class="flex size-9 flex-none items-center justify-center rounded-[10px] bg-surface"
		style="color: var(--chip-sun-icon)"
	>
		<Thermometer size={20} strokeWidth={2} aria-hidden="true" />
	</span>
	<div class="flex flex-col gap-[3px]">
		<h2
			id="tip-heading"
			class="text-xs font-bold tracking-[0.06em] uppercase"
			style="color: var(--chip-sun-fg)"
		>
			{tip.heading}
		</h2>
		<p class="text-sm leading-[1.45]" style="color: var(--tip-fg)">{tip.text}</p>
	</div>
</section>
