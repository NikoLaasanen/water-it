<!--
  An answered water check (screens.md "Today"): the status badge — icon and
  word, never colour alone — what happens next, and Undo. Used on the Today
  cards and on plant detail's next-check card. From `md` the three share one
  row, Undo at its end, as on the iPad Today card.
-->
<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Clock from '@lucide/svelte/icons/clock';
	import X from '@lucide/svelte/icons/x';
	import { m } from '#lib/paraglide/messages.js';
	import { statusLabel, statusNextLabel } from '#lib/plants/labels.js';
	import type { CheckAction } from '#lib/plants/schedule.js';

	let {
		action,
		nextInDays,
		name,
		onundo
	}: {
		action: CheckAction;
		nextInDays: number;
		/** The plant's name, for Undo's accessible label. */
		name: string;
		/** Left out when the answer can no longer be undone. */
		onundo?: () => void;
	} = $props();

	const status = $derived(statusLabel(action));
</script>

<div
	class="flex flex-col items-start gap-1 md:min-h-12 md:flex-row md:flex-wrap md:items-center md:gap-2.5"
	data-status={action}
>
	<span
		class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[13px] font-bold"
		style="background: var(--status-bg); color: var(--status-fg)"
	>
		{#if action === 'watered'}
			<Check size={15} strokeWidth={2.6} aria-hidden="true" />
		{:else if action === 'checked-damp'}
			<Clock size={15} strokeWidth={2.4} aria-hidden="true" />
		{:else}
			<X size={15} strokeWidth={2.6} aria-hidden="true" />
		{/if}
		{status}
	</span>
	<span class="flex flex-wrap items-center gap-x-2 text-[13px] text-muted md:flex-1">
		<span>{statusNextLabel(action, nextInDays)}</span>
		{#if onundo}
			<button
				type="button"
				onclick={onundo}
				data-refocus
				aria-label={m.check_undo_aria({ status, name })}
				class="min-h-11 px-1 font-bold text-ink underline underline-offset-2 md:ml-auto md:px-2"
			>
				{m.check_undo()}
			</button>
		{/if}
	</span>
</div>
