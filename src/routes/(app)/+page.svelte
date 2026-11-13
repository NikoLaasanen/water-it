<!--
  Today — the home screen (docs/mockups/today.dc.html, screens.md "Today").

  One card per plant whose water check is due, overdue first. Answering a
  card (Watered / Still damp / Skip) logs it and moves the check; the card
  stays in place in its answered state, with Undo, for the rest of the day —
  after a reload too, because the answered state is read from today's log.

  iPad (docs/mockups/tablet-today.dc.html): from `md` the cards go into two
  columns and "Coming up" (the next checks after today) sits below them; from
  `lg` it is a 300 px column on the right. Phones have the one-line "Next up"
  instead, shown when nothing is left for today.

  "Today" comes from the shared clock, which moves on at midnight and when the
  app is reopened, so a Home Screen app left open for days doesn't show stale
  checks.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import TodayCard from '#lib/components/plant/TodayCard.svelte';
	import { clock } from '#lib/clock.svelte.js';
	import { answerCheck, undoAnswer } from '#lib/firebase/check-writes.js';
	import { LogSince } from '#lib/firebase/log.svelte.js';
	import { PlantsQuery } from '#lib/firebase/plants.svelte.js';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { careOf, longDateLabel, shortDateLabel } from '#lib/plants/labels.js';
	import { currentIntervalDays, type CheckAction } from '#lib/plants/schedule.js';
	import { comingUp, nextUpcoming, todayCards, type TodayCard as Card } from '#lib/plants/today.js';

	const plants = new PlantsQuery();
	const log = new LogSince();

	$effect(() => {
		const uid = session.user?.uid;
		if (!uid) return;
		return plants.listen(uid);
	});

	// Re-subscribes when the day changes, so yesterday's answers drop away.
	$effect(() => {
		const uid = session.user?.uid;
		const since = clock.startOfToday;
		if (!uid) return;
		return log.listen(uid, since);
	});

	const today = $derived(clock.today);
	const cards = $derived(
		todayCards(plants.plants, plants.checkTasks, log.entries, today, getLocale())
	);
	const open = $derived(cards.filter((card) => card.state === 'open').length);
	const upcoming = $derived(
		open === 0 ? nextUpcoming(plants.plants, plants.checkTasks, today) : null
	);
	const loading = $derived(plants.loading || log.loading);
	const upcomingRows = $derived(comingUp(plants.plants, plants.checkTasks, today));

	const weekday = $derived(new Intl.DateTimeFormat(getLocale(), { weekday: 'short' }));

	function answer(card: Card, action: CheckAction) {
		const uid = session.user?.uid;
		if (!uid) return;
		const now = new Date();
		const interval = currentIntervalDays(careOf(card.plant).care, card.plant, now);
		answerCheck(uid, card.plant.id, card.task, action, interval, now);
	}

	function undo(card: Card) {
		const uid = session.user?.uid;
		if (uid && card.state === 'answered') undoAnswer(uid, card.answer);
	}
</script>

<svelte:head>
	<title>{m.nav_today()} · Water.it</title>
</svelte:head>

<main
	class="flex max-w-3xl flex-col gap-5 px-5 pt-14 pb-10 md:px-8 md:pt-10 lg:max-w-none lg:flex-row lg:items-start lg:gap-6"
>
	<div class="flex min-w-0 flex-1 flex-col gap-5">
		<header class="flex flex-col gap-1">
			<p class="text-[13px] font-semibold tracking-[0.02em] text-muted-2">
				{longDateLabel(today)}
			</p>
			<h1 class="text-[34px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
				{m.nav_today()}
			</h1>
			{#if !loading}
				<!-- Announced when it changes, so answering a card is confirmed aloud. -->
				<p class="text-[15px] text-muted" role="status">
					{#if open > 0}
						{m.today_summary_open({ count: open })}
					{:else if cards.length > 0}
						{m.today_summary_done()}
					{:else if plants.plants.length > 0}
						{m.today_summary_none()}
					{/if}
				</p>
			{/if}
		</header>

		{#if loading}
			<p class="text-sm text-muted" role="status">{m.today_loading()}</p>
		{:else if plants.plants.length === 0}
			<div class="flex flex-col items-start gap-3">
				<p class="text-sm text-muted">{m.today_no_plants()}</p>
				<a
					href={resolve('/(flow)/plants/new')}
					class="flex min-h-12 items-center rounded-xl bg-primary px-4 font-bold text-on-primary no-underline"
				>
					{m.plants_add()}
				</a>
			</div>
		{:else}
			{#if cards.length > 0}
				<ul
					class="flex flex-col gap-2.5 md:grid md:grid-cols-2 md:items-start md:gap-3"
					aria-label={m.today_cards_label()}
				>
					{#each cards as card (card.plant.id)}
						<li>
							<TodayCard
								{card}
								onanswer={(action) => answer(card, action)}
								onundo={() => undo(card)}
							/>
						</li>
					{/each}
				</ul>
			{/if}
			{#if upcoming}
				<p class="text-sm text-muted md:hidden">
					{m.today_next_up({ name: upcoming.plant.name, when: shortDateLabel(upcoming.due) })}
				</p>
			{/if}
		{/if}
	</div>

	{#if !loading && plants.plants.length > 0}
		<aside
			aria-labelledby="coming-up-heading"
			class="hidden flex-col gap-3 md:flex lg:w-[300px] lg:flex-none lg:pt-[88px]"
		>
			<h2
				id="coming-up-heading"
				class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase"
			>
				{m.today_coming_up()}
			</h2>
			<div
				class="flex flex-col rounded-[18px] bg-surface px-4 py-1 shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
			>
				{#if upcomingRows.length === 0}
					<p class="py-3 text-sm text-muted">{m.today_coming_up_none()}</p>
				{:else}
					<ul class="flex flex-col">
						{#each upcomingRows as row (row.task.id)}
							<li class="flex gap-3 border-b py-3" style:border-color="var(--line)">
								<!-- The date block is drawn for the eye; the sr-only line
								     gives a screen reader the whole date. -->
								<span
									class="flex w-11 flex-none flex-col items-center justify-center rounded-xl bg-bg py-1.5"
									aria-hidden="true"
								>
									<span class="text-[11px] font-bold text-muted-2 uppercase">
										{weekday.format(row.due)}
									</span>
									<span class="text-lg leading-tight font-extrabold text-ink">
										{row.due.getDate()}
									</span>
								</span>
								<span class="flex min-w-0 flex-col justify-center gap-0.5">
									<span class="sr-only">{shortDateLabel(row.due)}:</span>
									<span class="truncate text-[15px] font-bold text-ink">{row.plant.name}</span>
									<span class="text-[13px] text-muted">
										{careOf(row.plant).care.fixedSchedule ? m.task_water() : m.task_check_soil()}
									</span>
								</span>
							</li>
						{/each}
					</ul>
				{/if}
				<a
					href={resolve('/(app)/plants')}
					class="flex min-h-12 items-center text-sm font-bold text-link"
				>
					{m.today_see_all()}
				</a>
			</div>
			<p class="text-xs leading-[1.45] text-muted-2">{m.today_dates_note()}</p>
		</aside>
	{/if}
</main>
