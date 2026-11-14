<!--
  A fertilise or repot reminder on Today (screens.md "Fertilise and repot
  reminders"). Laid out like the water card so the list reads as one, but in
  the reminder's own colour and icon (violet flask, terracotta pot) so it is
  never mistaken for a water check:

  - Open: icon tile, plant name, "Fertilise · Due today", what the profile
    says ("Every 30 days in the growing season…"), Later, and a big Done
    square (a wide Done button on the iPad).
  - Done today: the Fertilised / Repotted badge, "Next on 14 December" and
    Undo, for the rest of the day.

  No red overdue border: a late feed isn't urgent the way a dry plant is.
-->
<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { resolve } from '$app/paths';
	import LogKindBadge from '#lib/components/plant/LogKindBadge.svelte';
	import ReminderIcon from '#lib/components/ReminderIcon.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import {
		careOf,
		dayRefPhrase,
		logKindLabel,
		reminderDueLabel,
		reminderHint,
		reminderLabel
	} from '#lib/plants/labels.js';
	import type { ReminderCard } from '#lib/plants/reminders.js';
	import { effectiveDueDate } from '#lib/plants/care.js';
	import { dayRef } from '#lib/plants/today.js';

	let {
		card,
		today,
		ondone,
		onlater,
		onundo
	}: {
		card: ReminderCard;
		today: Date;
		ondone: () => void;
		onlater: () => void;
		onundo: () => void;
	} = $props();

	const name = $derived(card.plant.name);
	const task = $derived(reminderLabel(card.kind));
	const hint = $derived(reminderHint(card.kind, careOf(card.plant).care));
	const due = $derived(card.state === 'open' ? effectiveDueDate(card.task) : null);
</script>

<article
	class="flex items-stretch gap-3 rounded-[18px] border-2 border-transparent bg-surface p-2.5 shadow-[var(--shadow-raised)] md:py-3 md:pr-3 md:pl-3.5 md:shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
	data-reminder={card.kind}
	aria-label="{task}: {name}"
>
	<div class="flex min-w-0 flex-1 flex-col gap-2 md:gap-2.5">
		<a
			href={resolve('/(app)/plants/[id]', { id: card.plant.id })}
			class="flex min-h-11 items-center gap-2.5 text-ink no-underline"
		>
			<span
				class="flex size-11 flex-none items-center justify-center rounded-xl"
				style="background: var(--rm-bg); color: var(--rm-icon)"
			>
				<ReminderIcon kind={card.kind} />
			</span>
			<span class="flex min-w-0 flex-col gap-px">
				<span class="truncate text-base font-bold">{name}</span>
				<span class="text-xs font-bold" style:color="var(--rm-fg)">
					{task}{#if due}&nbsp;· {reminderDueLabel(due, today)}{/if}
				</span>
			</span>
		</a>

		{#if card.state === 'open'}
			<div class="flex flex-col gap-1.5 md:gap-2.5">
				{#if hint}
					<p class="text-[13px] leading-[1.4] text-ink-2">{hint}</p>
				{/if}
				<div class="flex flex-wrap items-center gap-1">
					<button
						type="button"
						onclick={onlater}
						aria-label={m.reminder_later_aria({ task, name })}
						class="min-h-11 rounded-[10px] border-[1.5px] border-border bg-surface px-3 text-[13px] font-semibold text-ink"
					>
						{m.reminder_later()}
					</button>
					<button
						type="button"
						onclick={ondone}
						aria-label={m.reminder_done_aria({ task, name })}
						class="ml-auto hidden min-h-12 flex-none items-center gap-2 rounded-xl pr-5 pl-4 text-[15px] font-bold md:inline-flex"
						style="background: var(--rm-fill); color: var(--on-rm)"
					>
						<ReminderIcon kind={card.kind} size={20} strokeWidth={2.2} />
						<span aria-hidden="true">{m.reminder_done()}</span>
					</button>
				</div>
			</div>
		{:else}
			<div
				class="flex flex-col items-start gap-1 md:min-h-12 md:flex-row md:flex-wrap md:items-center md:gap-2.5"
			>
				<LogKindBadge kind={card.entry.kind} />
				<span class="flex flex-wrap items-center gap-x-2 text-[13px] text-muted md:flex-1">
					{#if card.next}
						<span>{m.reminder_next({ when: dayRefPhrase(dayRef(card.next, today)) })}</span>
					{/if}
					{#if card.canUndo}
						<button
							type="button"
							onclick={onundo}
							aria-label={m.check_undo_aria({ status: logKindLabel(card.entry.kind), name })}
							class="min-h-11 px-1 font-bold text-ink underline underline-offset-2 md:ml-auto md:px-2"
						>
							{m.check_undo()}
						</button>
					{/if}
				</span>
			</div>
		{/if}
	</div>

	{#if card.state === 'open'}
		<button
			type="button"
			onclick={ondone}
			aria-label={m.reminder_done_aria({ task, name })}
			class="flex min-h-[84px] w-[84px] flex-none flex-col items-center justify-center gap-1 rounded-[18px] text-xs font-bold md:hidden"
			style="background: var(--rm-fill); color: var(--on-rm)"
		>
			<ReminderIcon kind={card.kind} size={32} strokeWidth={2} />
			<span aria-hidden="true">{m.reminder_done()}</span>
		</button>
	{:else}
		<!-- Decorative: the badge beside it says the same in words. -->
		<span
			class="flex w-[84px] flex-none items-center justify-center rounded-[18px] md:hidden"
			style="background: var(--rm-bg); color: var(--rm-fg)"
			aria-hidden="true"
		>
			<Check size={34} strokeWidth={2.4} />
		</span>
	{/if}
</article>
