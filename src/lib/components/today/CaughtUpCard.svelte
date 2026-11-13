<!--
  "All caught up" (docs/mockups: TodayCaughtUp, TabletTodayCaughtUp): shown
  on Today when nothing is left to answer. A small drawn plant with a check,
  the heading, and one or two sentences: what was done ("Everything due
  today is done." / "Last watering on Wednesday.") and what's next ("Next up
  is Yucca, tomorrow.").

  The illustration is decorative and drawn with tokens, so it follows dark
  mode like everything else.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { dayRefPhrase } from '#lib/plants/labels.js';
	import { dayRef } from '#lib/plants/today.js';
	import type { Plant } from '#lib/types/plant.js';

	let {
		today,
		answeredToday,
		lastWatered,
		next
	}: {
		today: Date;
		/** Something due today was answered today. */
		answeredToday: boolean;
		lastWatered: Date | null;
		next: { plant: Plant; due: Date } | null;
	} = $props();

	const done = $derived(
		answeredToday
			? m.caught_up_done_today()
			: lastWatered
				? m.caught_up_last_watered({ when: dayRefPhrase(dayRef(lastWatered, today)) })
				: null
	);
	const upcoming = $derived(
		next
			? m.caught_up_next({ name: next.plant.name, when: dayRefPhrase(dayRef(next.due, today)) })
			: m.caught_up_nothing_next()
	);
</script>

<section
	aria-labelledby="caught-up-heading"
	class="flex items-center gap-4 rounded-[18px] bg-surface px-[18px] pt-5 pb-[18px] shadow-[0_1px_2px_rgba(20,40,30,0.06)] md:gap-6 md:px-7 md:py-6"
>
	<svg
		viewBox="0 0 96 96"
		aria-hidden="true"
		class="size-24 flex-none md:size-[120px]"
		data-status="watered"
	>
		<circle cx="48" cy="48" r="46" fill="var(--illo-bg)" />
		<path
			d="M48 58 C48 46 48 38 48 30"
			stroke="var(--illo-stem)"
			stroke-width="3"
			stroke-linecap="round"
			fill="none"
		/>
		<path d="M48 44 C38 44 30 38 29 28 C40 27 47 33 48 44 Z" fill="var(--illo-leaf-1)" />
		<path d="M48 38 C58 38 66 31 67 21 C56 20 49 27 48 38 Z" fill="var(--illo-leaf-2)" />
		<path d="M48 52 C56 52 62 48 63 41 C55 40 49 45 48 52 Z" fill="var(--illo-leaf-3)" />
		<path d="M31 58 H65 L61 80 a4 4 0 0 1 -4 3 H39 a4 4 0 0 1 -4 -3 Z" fill="var(--illo-pot)" />
		<rect x="29" y="55" width="38" height="7" rx="3" fill="var(--illo-rim)" />
		<circle
			cx="72"
			cy="66"
			r="12"
			fill="var(--status-bg)"
			stroke="var(--surface)"
			stroke-width="3"
		/>
		<path
			d="M66.5 66.5 l3.5 3.5 l7 -7"
			stroke="var(--status-fg)"
			stroke-width="2.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			fill="none"
		/>
	</svg>
	<div class="flex min-w-0 flex-col gap-1.5 md:gap-2">
		<h2
			id="caught-up-heading"
			class="text-xl font-extrabold tracking-[-0.01em] text-ink md:text-[26px]"
		>
			{m.caught_up_heading()}
		</h2>
		<p class="max-w-[440px] text-sm leading-[1.45] text-ink-2 md:text-[15px] md:leading-normal">
			{done ? `${done} ${upcoming}` : upcoming}
		</p>
	</div>
</section>
