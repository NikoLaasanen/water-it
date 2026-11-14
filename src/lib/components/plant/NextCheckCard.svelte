<!--
  The next-check card on plant detail (screens.md "Plant detail").

  The status line ("Check overdue 2 days" / "Next check Sat"), "Last watered
  25 Oct · winter interval 14 days", then either
  **Watered** and **Still damp**, or — once the check has been answered today —
  the same status badge, next step and Undo as the Today card. The writes are
  the Today view's (check-writes.ts), so the two can't drift apart.

  Unlike Today, the buttons are always offered, due or not: watering a plant
  early is a real thing to log, and it restarts the interval from today.
-->
<script lang="ts">
	import Droplet from '@lucide/svelte/icons/droplet';
	import { differenceInCalendarDays } from 'date-fns';
	import CheckStatus from './CheckStatus.svelte';
	import { clock } from '#lib/clock.svelte.js';
	import { answerCheck, undoAnswer } from '#lib/firebase/check-writes.js';
	import { LogSince } from '#lib/firebase/log.svelte.js';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { nextCheck, parseLocalDate } from '#lib/plants/care.js';
	import { careOf, lastWateredLine, nextCheckDetailLabel } from '#lib/plants/labels.js';
	import { currentIntervalDays, currentSeason, type CheckAction } from '#lib/plants/schedule.js';
	import { canUndo, latestAnswerFor } from '#lib/plants/today.js';
	import type { Plant, Task } from '#lib/types/plant.js';

	let {
		plant,
		task,
		lastWatered
	}: {
		plant: Plant;
		task: Task | undefined;
		/** From the plant's log (or the check's last answer); null if never. */
		lastWatered: Date | null;
	} = $props();

	const log = new LogSince();
	$effect(() => {
		const uid = session.user?.uid;
		const since = clock.startOfToday;
		if (!uid) return;
		return log.listen(uid, since);
	});

	const today = $derived(clock.today);
	const next = $derived(nextCheck(task, today));
	const overdue = $derived(next.kind === 'overdue');
	const answer = $derived(latestAnswerFor(log.entries, plant.id));
	const nextDue = $derived(answer ? parseLocalDate(answer.check.nextDue) : null);
	const wateredLine = $derived(
		lastWateredLine(
			lastWatered,
			currentSeason(plant, today),
			currentIntervalDays(careOf(plant).care, plant, today)
		)
	);

	function answerWith(action: CheckAction) {
		const uid = session.user?.uid;
		if (!uid) return;
		const now = new Date();
		const interval = currentIntervalDays(careOf(plant).care, plant, now);
		answerCheck(uid, plant.id, task, action, interval, now);
	}

	function undo() {
		const uid = session.user?.uid;
		if (uid && answer) undoAnswer(uid, answer);
	}
</script>

<div
	class="flex flex-col gap-3 rounded-[18px] bg-surface p-4 shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
>
	<p
		class="text-xs font-bold tracking-[0.08em] uppercase"
		style:color={overdue ? 'var(--overdue)' : 'var(--muted-2)'}
	>
		{nextCheckDetailLabel(next)}
	</p>
	<p class="text-[15px] text-ink-2">{wateredLine}</p>

	{#if answer && nextDue}
		<CheckStatus
			action={answer.kind}
			nextInDays={differenceInCalendarDays(nextDue, today)}
			name={plant.name}
			onundo={canUndo(task, answer) ? undo : undefined}
		/>
	{:else if !log.loading}
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => answerWith('watered')}
				aria-label={m.check_watered_aria({ name: plant.name })}
				class="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-water px-3 text-[15px] font-bold text-on-water"
			>
				<Droplet size={18} fill="currentColor" strokeWidth={0} aria-hidden="true" />
				<span aria-hidden="true">{m.check_watered()}</span>
			</button>
			<button
				type="button"
				onclick={() => answerWith('checked-damp')}
				aria-label={m.check_damp_aria({ name: plant.name })}
				class="flex min-h-12 flex-1 items-center justify-center rounded-xl border-[1.5px] border-border bg-surface px-3 text-[15px] font-semibold text-ink"
			>
				{m.check_damp()}
			</button>
		</div>
	{/if}
</div>
