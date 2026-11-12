<!--
  One row of the Plants list (screens.md "Plants").

  Not a link yet: the plant detail route arrives with the next view, and a card
  that looks tappable but goes nowhere is worse than one that doesn't invite
  the tap. The `<a>` wrapper lands with that screen.
-->
<script lang="ts">
	import Clock from '@lucide/svelte/icons/clock';
	import Leaf from '@lucide/svelte/icons/leaf';
	import CareChip from './CareChip.svelte';
	import HealthFace from './HealthFace.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { isOverdue, nextCheck, waterLevel } from '#lib/plants/care.js';
	import { healthLabel, lightLabel, nextCheckLabel, waterLabel } from '#lib/plants/labels.js';
	import type { Plant, Task } from '#lib/types/plant.js';

	let {
		plant,
		task,
		today
	}: {
		plant: Plant;
		/** This plant's `check-water` task, if it has one. */
		task?: Task;
		/** Passed in rather than read here, so every row agrees on the date. */
		today: Date;
	} = $props();

	const next = $derived(nextCheck(task, today));
	const overdue = $derived(isOverdue(next));

	// Each chip shows one word and announces the full phrase, so both renderings
	// come from the same label.
	const light = $derived(lightLabel(plant.careProfile.lightLevel));
	const water = $derived(waterLabel(waterLevel(plant.careProfile.wateringStyle)));
</script>

<article
	data-health={plant.health}
	class="flex items-center gap-3.5 rounded-[18px] bg-surface p-3 shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
>
	<!-- Photo placeholder. Real photos arrive in M3, so for now every plant
	     gets the tinted square and leaf from the spec. -->
	<div
		class="relative size-[68px] flex-none rounded-2xl"
		style:background="var(--thumb-tint)"
		style:color="var(--primary)"
	>
		<div class="flex size-full items-center justify-center">
			<Leaf size={28} strokeWidth={1.6} aria-hidden="true" />
		</div>
		<div class="absolute -right-2 -bottom-2">
			<HealthFace health={plant.health} />
		</div>
	</div>

	<div class="flex min-w-0 flex-1 flex-col gap-[3px] pl-1">
		<h2 class="truncate text-[17px] font-bold text-ink">{plant.name}</h2>

		<p class="text-[13px] font-semibold" style:color="var(--health-fg)">
			{healthLabel(plant.health)}
		</p>

		<p
			class="flex items-center gap-[5px] text-[13px]"
			style:color={overdue ? 'var(--overdue)' : 'var(--muted)'}
		>
			<Clock size={14} strokeWidth={2.2} aria-hidden="true" />
			<span>{m.plants_check({ when: nextCheckLabel(next) })}</span>
		</p>

		<div class="mt-1 flex flex-wrap gap-1.5">
			<CareChip variant="sun" label={light} aria={m.light_aria({ level: light })} />
			<CareChip variant="water" label={water} aria={m.water_aria({ level: water })} />
		</div>
	</div>
</article>
