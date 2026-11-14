<!--
  Today — the home screen (screens.md "Today").

  With checks to answer (docs/mockups/today.dc.html): one card per plant
  whose water check is due, overdue first. Answering a card (Watered / Still
  damp / Skip) logs it and moves the check; the card stays in place in its
  answered state, with Undo, for the rest of the day — after a reload too,
  because the answered state is read from today's log.

  Nothing left to answer (docs/mockups: TodayCaughtUp): an "All caught up"
  card, then any cards answered today (so Undo stays in reach until
  midnight), "This week", "Coming up", a seasonal tip and a link to all
  plants.

  iPad (tablet-today, TabletTodayCaughtUp): from `md` the cards go into two
  columns and the "Coming up" column sits below; from `lg` it is a 300 px
  column on the right. On the nothing-due screen the tip moves into that
  column.

  "Today" comes from the shared clock, which moves on at midnight and when the
  app is reopened, so a Home Screen app left open for days doesn't show stale
  checks.
-->
<script lang="ts">
	import CalendarDays from '@lucide/svelte/icons/calendar';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { resolve } from '$app/paths';
	import TodayCard from '#lib/components/plant/TodayCard.svelte';
	import CaughtUpCard from '#lib/components/today/CaughtUpCard.svelte';
	import ComingUpList from '#lib/components/today/ComingUpList.svelte';
	import SeasonTip from '#lib/components/today/SeasonTip.svelte';
	import TodayScene from '#lib/components/today/TodayScene.svelte';
	import WeekStrip from '#lib/components/today/WeekStrip.svelte';
	import { clock } from '#lib/clock.svelte.js';
	import { answerCheck, undoAnswer } from '#lib/firebase/check-writes.js';
	import { LogSince } from '#lib/firebase/log.svelte.js';
	import { PlantsQuery } from '#lib/firebase/plants.svelte.js';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { careOf, greetingLine } from '#lib/plants/labels.js';
	import { partOfDay } from '#lib/plants/part-of-day.js';
	import { hideSplash } from '#lib/splash.js';
	import { currentIntervalDays, type CheckAction } from '#lib/plants/schedule.js';
	import {
		comingUp,
		lastWatered,
		todayCards,
		weekAhead,
		type TodayCard as Card
	} from '#lib/plants/today.js';

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

	// The greeting and the header scene follow the hour, so keep a minute
	// clock, refreshed on return to the app (timers stop while iOS has it
	// suspended).
	let now = $state(new Date());
	$effect(() => {
		const tick = () => (now = new Date());
		const timer = setInterval(tick, 60_000);
		document.addEventListener('visibilitychange', tick);
		return () => {
			clearInterval(timer);
			document.removeEventListener('visibilitychange', tick);
		};
	});
	const part = $derived(partOfDay(now));
	const firstName = $derived(session.user?.displayName);
	const cards = $derived(
		todayCards(plants.plants, plants.checkTasks, log.entries, today, getLocale())
	);
	const open = $derived(cards.filter((card) => card.state === 'open').length);
	const caughtUp = $derived(open === 0);
	const answeredToday = $derived(cards.length > 0);
	const loading = $derived(plants.loading || log.loading);
	const upcomingRows = $derived(comingUp(plants.plants, plants.checkTasks, today));

	// Opening animation: open onto Today once its cards are there, not onto
	// "Loading…".
	$effect(() => {
		if (!loading) hideSplash();
	});
	const week = $derived(weekAhead(plants.plants, plants.checkTasks, today, getLocale()));

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

<!-- The header scene sits behind the top of the page (screens.md "Today header
     scene"); the header's text takes its colours from the scene, so it reads
     on the evening sky too. -->
<div class="relative" data-scene={part === 'evening' ? 'evening' : 'day'}>
	<TodayScene evening={part === 'evening'} />

	<main
		class="relative z-[1] flex max-w-3xl flex-col gap-5 px-5 pt-14 pb-10 md:px-8 md:pt-10 lg:max-w-none lg:flex-row lg:items-start lg:gap-6"
	>
		<div class="flex min-w-0 flex-1 flex-col gap-4 md:gap-5">
			<!-- At least 150 px tall, so the cards always start below the scene's
		     ground line; on phones the text keeps clear of the cacti on the right. -->
			<header class="flex min-h-[150px] flex-col gap-1 pr-[120px] md:pr-0">
				<p class="text-[13px] font-semibold tracking-[0.02em]" style:color="var(--sc-eyebrow)">
					<span class="md:hidden">{greetingLine(part, firstName, today, 'short')}</span>
					<span class="hidden md:inline">{greetingLine(part, firstName, today, 'long')}</span>
				</p>
				<h1
					class="text-[34px] leading-tight font-extrabold tracking-[-0.02em]"
					style:color="var(--sc-title)"
				>
					{m.nav_today()}
				</h1>
				{#if !loading}
					<!-- Announced when it changes, so answering a card is confirmed aloud. -->
					<p class="text-[15px] leading-[1.4]" style:color="var(--sc-summary)" role="status">
						{#if open > 0}
							{m.today_summary_open({ count: open })}
						{:else if answeredToday}
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
				{#if caughtUp}
					<CaughtUpCard
						{today}
						{answeredToday}
						lastWatered={lastWatered(plants.checkTasks)}
						next={upcomingRows[0] ?? null}
					/>
				{/if}

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

				{#if caughtUp}
					<WeekStrip {week} {answeredToday} />

					<!-- Phone only: iPad has these in the column beside or below. -->
					{#if upcomingRows.length > 0}
						<section aria-labelledby="coming-up-phone" class="flex flex-col gap-2 md:hidden">
							<h2
								id="coming-up-phone"
								class="mx-1 mt-1.5 flex items-center gap-1.5 text-[13px] font-bold tracking-[0.06em] text-muted-2 uppercase"
							>
								<CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
								{m.today_coming_up()}
							</h2>
							<div
								class="overflow-hidden rounded-[18px] bg-surface shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
							>
								<ComingUpList rows={upcomingRows} {today} variant="pill" />
							</div>
						</section>
					{/if}
					<div class="md:hidden"><SeasonTip {today} /></div>
					<a
						href={resolve('/(app)/plants')}
						class="flex min-h-12 items-center justify-between rounded-[14px] border-[1.5px] border-border px-4 text-sm font-bold text-ink no-underline md:hidden"
					>
						<span>{m.today_see_all({ count: plants.plants.length })}</span>
						<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
					</a>
				{/if}
			{/if}
		</div>

		{#if !loading && plants.plants.length > 0}
			<aside
				aria-labelledby="coming-up-heading"
				class="hidden flex-col gap-3 md:flex lg:w-[300px] lg:flex-none lg:pt-[138px]"
			>
				<!-- 138 px + this 20 px heading + the 12 px gap = the header's 150 px +
			     the 20 px gap, so the list's top lines up with the first card. -->
				<h2
					id="coming-up-heading"
					class="flex h-5 items-center gap-1.5 text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase"
				>
					<CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
					{m.today_coming_up()}
				</h2>
				<div
					class="flex flex-col rounded-[18px] bg-surface px-4 py-1 shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
				>
					{#if upcomingRows.length === 0}
						<p class="py-3 text-sm text-muted">{m.today_coming_up_none()}</p>
					{:else}
						<ComingUpList rows={upcomingRows} {today} variant="tile" />
					{/if}
					<a
						href={resolve('/(app)/plants')}
						class="flex min-h-12 items-center text-sm font-bold text-link"
					>
						{m.today_see_all({ count: plants.plants.length })}
					</a>
				</div>
				{#if caughtUp}
					<div class="mt-2"><SeasonTip {today} /></div>
				{:else}
					<p class="text-xs leading-[1.45] text-muted-2">{m.today_dates_note()}</p>
				{/if}
			</aside>
		{/if}
	</main>
</div>
