<!--
  "This week" on Today's nothing-due screen: seven days from today, each
  with a blue drop if a check falls on it and a grey dot if not, plus the
  week's count. iPad (`md`+) names the plants under the drop ("Rest day" on
  an empty day, "Done" on today once it was dealt with).

  Each day also carries a full sentence for screen readers ("Saturday 14
  November: check Yucca"), since the drop and dot are drawn for the eye.
-->
<script lang="ts">
	import Droplet from '@lucide/svelte/icons/droplet';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { longDateLabel } from '#lib/plants/labels.js';
	import type { WeekDay } from '#lib/plants/today.js';

	let { week, answeredToday }: { week: WeekDay[]; answeredToday: boolean } = $props();

	/** iPad lists this many names per day before "+N more". */
	const NAMES_SHOWN = 2;

	const count = $derived(week.reduce((sum, day) => sum + day.plants.length, 0));
	const weekday = $derived(new Intl.DateTimeFormat(getLocale(), { weekday: 'short' }));
	const list = $derived(new Intl.ListFormat(getLocale(), { type: 'conjunction' }));
</script>

<section
	aria-labelledby="week-heading"
	class="flex flex-col gap-2.5 rounded-[18px] bg-surface px-3 pt-3.5 pb-3 shadow-[0_1px_2px_rgba(20,40,30,0.06)] md:gap-3.5 md:px-[18px] md:pt-[18px] md:pb-4"
>
	<div class="flex items-baseline justify-between px-1 md:px-0">
		<h2 id="week-heading" class="text-[13px] font-bold tracking-[0.06em] text-muted-2 uppercase">
			{m.week_heading()}
		</h2>
		<span class="text-[13px] text-muted">{m.week_count({ count })}</span>
	</div>
	<ol class="grid grid-cols-7 gap-1 md:gap-2">
		{#each week as day, index (day.date.getTime())}
			{@const isToday = index === 0}
			{@const has = day.plants.length > 0}
			<li
				class="flex flex-col items-center gap-1 rounded-xl border-[1.5px] pt-2 pb-2.5 md:min-h-[150px] md:gap-1.5 md:rounded-[14px] md:px-1.5 md:pt-3 md:pb-3.5"
				style:background={isToday
					? 'var(--selected-bg)'
					: has
						? 'var(--week-check-bg)'
						: 'var(--surface)'}
				style:border-color={isToday
					? 'var(--selected-border)'
					: has
						? 'transparent'
						: 'var(--line)'}
			>
				<span class="sr-only">
					{has
						? m.week_day_checks_sr({
								date: longDateLabel(day.date),
								names: list.format(day.plants.map((plant) => plant.name))
							})
						: m.week_day_none_sr({ date: longDateLabel(day.date) })}
				</span>
				<span
					class="text-[11px] font-bold md:text-xs"
					style:color={isToday ? 'var(--primary)' : 'var(--muted-2)'}
					aria-hidden="true"
				>
					{isToday ? m.week_today() : weekday.format(day.date)}
				</span>
				<span class="text-base font-extrabold text-ink md:text-xl" aria-hidden="true">
					{day.date.getDate()}
				</span>
				{#if has}
					<Droplet
						size={18}
						fill="currentColor"
						strokeWidth={0}
						class="size-4 text-water md:size-[18px]"
						aria-hidden="true"
					/>
					<span
						class="hidden text-center text-xs leading-[1.3] font-bold break-words md:block"
						style="color: var(--chip-water-fg)"
						aria-hidden="true"
					>
						{#each day.plants.slice(0, NAMES_SHOWN) as plant (plant.id)}
							<span class="block">{plant.name}</span>
						{/each}
						{#if day.plants.length > NAMES_SHOWN}
							<span class="block font-semibold">
								{m.week_more({ count: day.plants.length - NAMES_SHOWN })}
							</span>
						{/if}
					</span>
				{:else}
					<span class="flex size-4 items-center justify-center md:size-[18px]" aria-hidden="true">
						<span class="size-[5px] rounded-full" style="background: var(--border)"></span>
					</span>
					<span class="hidden text-xs text-muted-2 md:block" aria-hidden="true">
						{isToday && answeredToday ? m.week_done() : m.week_rest()}
					</span>
				{/if}
			</li>
		{/each}
	</ol>
</section>
