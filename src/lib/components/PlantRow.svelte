<!--
  One plant in a list, linking to the plant (screens.md "Plants").

  Two sizes:
  - `full` — the Plants list card: 68 px thumbnail, health, next check and the
    two care chips.
  - `compact` — the iPad side list beside plant detail
    (docs/mockups/tablet-plant-detail.dc.html): 48 px thumbnail, name, and
    "health · next check" on one line. The open plant is highlighted and
    marked `aria-current`.

  The whole card is the link, as in the mockup: a thumbnail and a few lines of
  text are easier to hit than any single element inside them.
-->
<script lang="ts">
	import Clock from '@lucide/svelte/icons/clock';
	import Leaf from '@lucide/svelte/icons/leaf';
	import { resolve } from '$app/paths';
	import CareChip from './CareChip.svelte';
	import HealthFace from './HealthFace.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { isOverdue, nextCheck, waterLevel } from '#lib/plants/care.js';
	import {
		careOf,
		healthLabel,
		lightLabel,
		nextCheckLabel,
		waterLabel
	} from '#lib/plants/labels.js';
	import type { Plant, Task } from '#lib/types/plant.js';

	let {
		plant,
		task,
		today,
		size = 'full',
		current = false
	}: {
		plant: Plant;
		/** This plant's `check-water` task, if it has one. */
		task?: Task;
		/** Passed in rather than read here, so every row agrees on the date. */
		today: Date;
		size?: 'full' | 'compact';
		/** This plant is the one open beside the list. Compact rows only. */
		current?: boolean;
	} = $props();

	const next = $derived(nextCheck(task, today));
	const overdue = $derived(isOverdue(next));
	const care = $derived(careOf(plant).care);

	// Each chip shows one word and announces the full phrase, so both renderings
	// come from the same label.
	const light = $derived(lightLabel(care.lightLevel));
	const water = $derived(waterLabel(waterLevel(care.wateringStyle)));
</script>

{#if size === 'compact'}
	<a
		href={resolve('/(app)/plants/[id]', { id: plant.id })}
		data-health={plant.health}
		aria-current={current ? 'page' : undefined}
		class={[
			'flex items-center gap-3 rounded-2xl border-2 p-2.5 no-underline',
			current ? 'bg-selected' : 'border-transparent'
		]}
		style:border-color={current ? 'var(--selected-border)' : undefined}
	>
		<div
			class="relative size-12 flex-none rounded-[14px]"
			style:background="var(--thumb-tint)"
			style:color="var(--primary)"
		>
			<div class="flex size-full items-center justify-center">
				<Leaf size={22} strokeWidth={1.6} aria-hidden="true" />
			</div>
			<div class="absolute -right-1.5 -bottom-1.5">
				<HealthFace health={plant.health} size={26} />
			</div>
		</div>
		<div class="flex min-w-0 flex-1 flex-col gap-0.5 pl-0.5">
			<p class="truncate text-[15px] font-bold text-ink">{plant.name}</p>
			<p class="truncate text-xs">
				<span class="font-semibold" style:color="var(--health-fg)">
					{healthLabel(plant.health)}
				</span>
				<span class="text-muted">·</span>
				<span style:color={overdue ? 'var(--overdue)' : 'var(--muted)'}>
					{nextCheckLabel(next)}
				</span>
			</p>
		</div>
	</a>
{:else}
	<a
		href={resolve('/(app)/plants/[id]', { id: plant.id })}
		data-health={plant.health}
		class="flex items-center gap-3.5 rounded-[18px] border border-card-edge bg-surface p-3 no-underline shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
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
	</a>
{/if}
