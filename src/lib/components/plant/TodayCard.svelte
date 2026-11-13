<!--
  One plant on Today (docs/mockups/today.dc.html, screens.md "Today").

  Open: thumbnail, name, "Today" / "Overdue N days", the check hint, Still
  damp and Skip, and the big square Watered button on the right — the
  fastest action, so the biggest target. Overdue cards get the danger border.

  Answered: the same card in place, its buttons replaced by the status badge,
  what happens next and Undo; the square turns into a tinted status tile.

  iPad (`md`+, docs/mockups/tablet-today.dc.html): the card stands upright
  in a two-column grid — name, hint, then Still damp / Skip on the left and a
  wide Watered button on the right; answered, the badge, next step and Undo
  share one row. The phone's square button and status tile are hidden there
  (display: none, so a screen reader meets each control once).

  The thumbnail and name link to the plant, for "which one is this?".
-->
<script lang="ts">
	import Droplet from '@lucide/svelte/icons/droplet';
	import Leaf from '@lucide/svelte/icons/leaf';
	import Check from '@lucide/svelte/icons/check';
	import Clock from '@lucide/svelte/icons/clock';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import X from '@lucide/svelte/icons/x';
	import { resolve } from '$app/paths';
	import CheckStatus from './CheckStatus.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { careOf } from '#lib/plants/labels.js';
	import type { CheckAction } from '#lib/plants/schedule.js';
	import type { TodayCard } from '#lib/plants/today.js';

	let {
		card,
		onanswer,
		onundo
	}: {
		card: TodayCard;
		onanswer: (action: CheckAction) => void;
		onundo: () => void;
	} = $props();

	const name = $derived(card.plant.name);
	const overdue = $derived(card.state === 'open' && card.overdueDays > 0);
	const hint = $derived(careOf(card.plant).care.dryDownTest);
</script>

<article
	class="flex items-stretch gap-3 rounded-[18px] border-2 bg-surface p-2.5 shadow-[0_1px_2px_rgba(20,40,30,0.06)] md:py-3 md:pr-3 md:pl-3.5"
	style:border-color={overdue ? 'var(--danger-border)' : 'transparent'}
	aria-label={name}
>
	<div class="flex min-w-0 flex-1 flex-col gap-2 md:gap-2.5">
		<a
			href={resolve('/(app)/plants/[id]', { id: card.plant.id })}
			class="flex min-h-11 items-center gap-2.5 text-ink no-underline"
		>
			<span
				class="flex size-11 flex-none items-center justify-center rounded-xl text-primary"
				style="background: var(--thumb-tint)"
			>
				<Leaf size={22} strokeWidth={1.7} aria-hidden="true" />
			</span>
			<span class="flex min-w-0 flex-col gap-px">
				<span class="truncate text-base font-bold">{name}</span>
				{#if card.state === 'open'}
					<span
						class="flex items-center gap-1 text-xs font-bold"
						style:color={overdue ? 'var(--danger)' : 'var(--due-today)'}
					>
						{#if overdue}
							<TriangleAlert size={14} strokeWidth={2.4} aria-hidden="true" />
							{m.today_overdue({ days: card.overdueDays })}
						{:else}
							{m.today_due_today()}
						{/if}
					</span>
				{/if}
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
						onclick={() => onanswer('checked-damp')}
						aria-label={m.check_damp_aria({ name })}
						class="min-h-11 rounded-[10px] border-[1.5px] border-border bg-surface px-3 text-[13px] font-semibold text-ink"
					>
						{m.check_damp()}
					</button>
					<button
						type="button"
						onclick={() => onanswer('skipped')}
						aria-label={m.check_skip_aria({ name })}
						class="min-h-11 rounded-[10px] px-2.5 text-[13px] font-semibold text-muted"
					>
						{m.check_skip()}
					</button>
					<button
						type="button"
						onclick={() => onanswer('watered')}
						aria-label={m.check_watered_aria({ name })}
						class="ml-auto hidden min-h-12 flex-none items-center gap-2 rounded-xl bg-water pr-5 pl-4 text-[15px] font-bold text-on-water md:inline-flex"
					>
						<Droplet size={20} fill="currentColor" strokeWidth={0} aria-hidden="true" />
						<span aria-hidden="true">{m.check_watered()}</span>
					</button>
				</div>
			</div>
		{:else}
			<CheckStatus
				action={card.answer.kind}
				nextInDays={card.nextInDays}
				{name}
				onundo={card.canUndo ? onundo : undefined}
			/>
		{/if}
	</div>

	{#if card.state === 'open'}
		<button
			type="button"
			onclick={() => onanswer('watered')}
			aria-label={m.check_watered_aria({ name })}
			class="flex min-h-[84px] w-[84px] flex-none flex-col items-center justify-center gap-1 rounded-[18px] bg-water text-xs font-bold text-on-water md:hidden"
		>
			<Droplet size={34} fill="currentColor" strokeWidth={0} aria-hidden="true" />
			<span aria-hidden="true">{m.check_watered()}</span>
		</button>
	{:else}
		<!-- Decorative: the badge beside it says the same in words. -->
		<span
			data-status={card.answer.kind}
			class="flex w-[84px] flex-none items-center justify-center rounded-[18px] md:hidden"
			style="background: var(--status-bg); color: var(--status-fg)"
			aria-hidden="true"
		>
			{#if card.answer.kind === 'watered'}
				<Check size={34} strokeWidth={2.4} />
			{:else if card.answer.kind === 'checked-damp'}
				<Clock size={34} strokeWidth={2.2} />
			{:else}
				<X size={34} strokeWidth={2.4} />
			{/if}
		</span>
	{/if}
</article>
