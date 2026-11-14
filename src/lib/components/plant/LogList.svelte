<!--
  The Log tab on plant detail (screens.md "Plant detail — Log tab"): the
  plant's whole log, newest first, in one card per month. Each row has the
  day (number over weekday), the badge, what the entry did ("Next check
  Sat 21 Nov") or its note, and the time it was logged. "Show older" asks for
  the next page; most plants will never need it.

  "Add to log" at the top opens the hand-logging flow. Hand-added entries
  have a delete button (with a confirmation) where check answers show their
  time: those are taken back with Undo instead, and a hand-added entry's time
  isn't shown, because one logged for an earlier day has no real time.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash from '@lucide/svelte/icons/trash-2';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import {
		logKindLabel,
		logNextCheckLabel,
		monthLabel,
		shortDateLabel,
		timeLabel
	} from '#lib/plants/labels.js';
	import { groupByMonth } from '#lib/plants/log.js';
	import { isManualEntry } from '#lib/plants/manual-log.js';
	import type { LogEntry } from '#lib/types/plant.js';
	import LogKindBadge from './LogKindBadge.svelte';

	let {
		entries,
		loading,
		hasMore,
		onmore,
		plantId,
		ondelete
	}: {
		entries: LogEntry[];
		loading: boolean;
		hasMore: boolean;
		onmore: () => void;
		/** For the Add to log link. */
		plantId: string;
		ondelete: (entry: LogEntry) => void;
	} = $props();

	/** The entry waiting for its delete confirmation. */
	let pending = $state<LogEntry | null>(null);
	let confirmOpen = $state(false);

	function askDelete(entry: LogEntry) {
		pending = entry;
		confirmOpen = true;
	}

	function confirmDelete() {
		if (pending) ondelete(pending);
		confirmOpen = false;
	}

	const months = $derived(groupByMonth(entries));

	function weekday(date: Date): string {
		return new Intl.DateTimeFormat(getLocale(), { weekday: 'short' }).format(date);
	}
</script>

<section class="flex flex-col gap-5 md:max-w-[640px]" aria-label={m.log_heading()}>
	<a
		href={resolve('/(flow)/plants/[id]/log/new', { id: plantId })}
		class="flex min-h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] border-border bg-surface px-4 text-[15px] font-bold text-ink no-underline"
	>
		<Plus size={18} strokeWidth={2.4} aria-hidden="true" />
		{m.log_add()}
	</a>

	{#if loading}
		<p class="text-sm text-muted" role="status">{m.log_loading()}</p>
	{:else if months.length === 0}
		<p class="rounded-[18px] bg-surface p-4 text-sm leading-[1.45] text-muted">{m.log_empty()}</p>
	{:else}
		{#each months as group (group.key)}
			<div class="flex flex-col gap-2">
				<h2 class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
					{monthLabel(group.month)}
				</h2>
				<ol class="flex flex-col rounded-[18px] bg-surface px-4">
					{#each group.entries as entry, index (entry.id)}
						{@const at = entry.at.toDate()}
						{@const next = logNextCheckLabel(entry)}
						<li
							class="flex items-center gap-3 py-3"
							class:border-b={index < group.entries.length - 1}
							style:border-color="var(--line)"
						>
							<!-- The day, readable without the month heading for screen readers. -->
							<span class="sr-only">{shortDateLabel(at)}</span>
							<span
								class="flex w-9 shrink-0 flex-col items-center leading-tight"
								aria-hidden="true"
							>
								<span class="text-[17px] font-extrabold text-ink">{at.getDate()}</span>
								<span class="text-[11px] font-semibold text-muted-2">{weekday(at)}</span>
							</span>
							<span class="flex min-w-0 flex-1 flex-col items-start gap-1">
								<LogKindBadge kind={entry.kind} />
								{#if next}
									<span class="text-[13px] text-muted">{next}</span>
								{/if}
								{#if entry.note}
									<span class="text-[13px] leading-[1.4] text-ink-2">{entry.note}</span>
								{/if}
							</span>
							{#if isManualEntry(entry)}
								<button
									type="button"
									onclick={() => askDelete(entry)}
									aria-label={m.log_delete_aria({
										kind: logKindLabel(entry.kind),
										date: shortDateLabel(at)
									})}
									class="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-2"
								>
									<Trash size={18} strokeWidth={2} aria-hidden="true" />
								</button>
							{:else}
								<span class="shrink-0 text-[13px] font-semibold text-muted-2">{timeLabel(at)}</span>
							{/if}
						</li>
					{/each}
				</ol>
			</div>
		{/each}

		{#if hasMore}
			<button
				type="button"
				onclick={onmore}
				class="min-h-12 rounded-xl border-[1.5px] border-border bg-surface px-4 text-[15px] font-semibold text-ink"
			>
				{m.log_show_older()}
			</button>
		{/if}
	{/if}
</section>

<AlertDialog.Root bind:open={confirmOpen}>
	<AlertDialog.Content class="max-w-[calc(100%-2.5rem)] rounded-[18px] p-5 sm:max-w-sm">
		<AlertDialog.Header>
			<AlertDialog.Title class="text-lg font-bold text-ink"
				>{m.log_delete_title()}</AlertDialog.Title
			>
			{#if pending}
				<AlertDialog.Description class="text-sm leading-[1.45] text-muted">
					{m.log_delete_body({
						kind: logKindLabel(pending.kind),
						date: shortDateLabel(pending.at.toDate())
					})}
				</AlertDialog.Description>
			{/if}
		</AlertDialog.Header>
		<AlertDialog.Footer class="mx-0 mb-0 flex-col gap-2 border-0 bg-transparent p-0">
			<AlertDialog.Action
				class="min-h-12 w-full rounded-xl text-base font-bold"
				style="background: var(--danger-fill); color: var(--on-danger)"
				onclick={confirmDelete}
			>
				{m.log_delete_confirm()}
			</AlertDialog.Action>
			<AlertDialog.Cancel
				class="min-h-12 w-full rounded-xl border-[1.5px] border-border bg-surface text-base font-semibold text-ink"
			>
				{m.log_delete_keep()}
			</AlertDialog.Cancel>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
