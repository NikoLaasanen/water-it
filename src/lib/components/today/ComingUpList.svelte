<!--
  The next checks after today, each row opening its plant (screens.md
  "Today", "Coming up").

  - `pill` (phone, nothing-due screen): thumbnail, name, "Check soil ·
    Kitchen window", and a day pill on the right ("Tomorrow", "Mon",
    "Wed 25").
  - `tile` (the iPad column): a date tile (weekday over day number) instead
    of the thumbnail.

  Tomorrow's row is picked out in the water colours. "Check soil again" when
  the plant's last answer was "Still damp".
-->
<script lang="ts">
	import Leaf from '@lucide/svelte/icons/leaf';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { careOf, dayRefPill, shortDateLabel } from '#lib/plants/labels.js';
	import { dayRef } from '#lib/plants/today.js';
	import type { Plant, Task } from '#lib/types/plant.js';

	let {
		rows,
		today,
		variant
	}: {
		rows: { plant: Plant; task: Task; due: Date }[];
		today: Date;
		variant: 'pill' | 'tile';
	} = $props();

	const weekday = $derived(new Intl.DateTimeFormat(getLocale(), { weekday: 'short' }));

	function what(plant: Plant, task: Task): string {
		const action =
			task.lastAnswer?.kind === 'checked-damp'
				? m.task_check_again()
				: careOf(plant).care.fixedSchedule
					? m.task_water()
					: m.task_check_soil();
		return plant.location ? `${action} · ${plant.location}` : action;
	}
</script>

<ul class="flex flex-col">
	{#each rows as row, index (row.task.id)}
		{@const ref = dayRef(row.due, today)}
		{@const soon = ref.kind === 'tomorrow'}
		<li
			class:border-t={variant === 'pill' && index > 0}
			class:border-b={variant === 'tile'}
			style:border-color="var(--line)"
		>
			<a
				href={resolve('/(app)/plants/[id]', { id: row.plant.id })}
				class="flex items-center gap-3 text-ink no-underline {variant === 'pill'
					? 'min-h-16 py-2.5 pr-3.5 pl-2.5'
					: 'py-3'}"
			>
				{#if variant === 'pill'}
					<span
						class="flex size-11 flex-none items-center justify-center rounded-xl text-primary"
						style="background: var(--thumb-tint)"
					>
						<Leaf size={22} strokeWidth={1.7} aria-hidden="true" />
					</span>
				{:else}
					<span
						class="flex w-11 flex-none flex-col items-center justify-center rounded-xl py-1.5"
						style:background={soon ? 'var(--chip-water-bg)' : 'var(--bg)'}
						aria-hidden="true"
					>
						<span
							class="text-[11px] font-bold uppercase"
							style:color={soon ? 'var(--chip-water-fg)' : 'var(--muted-2)'}
						>
							{weekday.format(row.due)}
						</span>
						<span class="text-lg leading-tight font-extrabold text-ink">{row.due.getDate()}</span>
					</span>
				{/if}
				<span class="flex min-w-0 flex-1 flex-col gap-0.5">
					{#if variant === 'tile'}
						<span class="sr-only">{shortDateLabel(row.due)}:</span>
					{/if}
					<span class="truncate text-[15px] font-bold">{row.plant.name}</span>
					<span class="truncate text-[13px] text-muted">{what(row.plant, row.task)}</span>
				</span>
				{#if variant === 'pill'}
					<span
						class="flex-none rounded-full px-2.5 py-[5px] text-[13px] font-bold"
						style:background={soon ? 'var(--chip-water-bg)' : 'var(--pill-bg)'}
						style:color={soon ? 'var(--chip-water-fg)' : 'var(--pill-fg)'}
					>
						{dayRefPill(ref)}
					</span>
				{/if}
			</a>
		</li>
	{/each}
</ul>
