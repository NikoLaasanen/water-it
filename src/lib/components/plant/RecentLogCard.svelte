<!--
  "Recent log" on the iPad Care tab (docs/mockups/tablet-plant-detail.dc.html):
  the latest four entries — badge, note or what it did, date — and
  "Open full log", which switches to the Log tab.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Plus from '@lucide/svelte/icons/plus';
	import { m } from '#lib/paraglide/messages.js';
	import { dayMonthLabel, logNextCheckLabel } from '#lib/plants/labels.js';
	import type { LogEntry } from '#lib/types/plant.js';
	import LogKindBadge from './LogKindBadge.svelte';

	let {
		entries,
		onopen,
		plantId,
		name
	}: {
		entries: LogEntry[];
		onopen: () => void;
		/** For the Add to log link. */
		plantId: string;
		/** The plant's name, for the Add link's accessible label. */
		name: string;
	} = $props();

	const recent = $derived(entries.slice(0, 4));

	const detail = (entry: LogEntry) => entry.note ?? logNextCheckLabel(entry) ?? '';
</script>

<section class="flex flex-col gap-2">
	<div class="flex items-center justify-between">
		<h2 class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
			{m.log_recent_heading()}
		</h2>
		<a
			href={resolve('/(flow)/plants/[id]/log/new', { id: plantId })}
			aria-label={m.log_add_aria({ name })}
			class="-my-3 flex min-h-11 items-center gap-1 px-1 text-sm font-bold text-primary no-underline"
		>
			<Plus size={16} strokeWidth={2.4} aria-hidden="true" />
			{m.log_add_short()}
		</a>
	</div>
	<div class="flex flex-col rounded-[18px] bg-surface px-4 pt-0.5 pb-1">
		{#if recent.length === 0}
			<p class="py-3 text-sm text-muted">{m.log_empty()}</p>
		{:else}
			<ul class="flex flex-col">
				{#each recent as entry (entry.id)}
					<li class="flex items-center gap-2.5 border-b py-2.5" style:border-color="var(--line)">
						<LogKindBadge kind={entry.kind} />
						<span class="min-w-0 flex-1 truncate text-[13px] text-muted">{detail(entry)}</span>
						<span class="shrink-0 text-[13px] font-semibold text-ink-2">
							{dayMonthLabel(entry.at.toDate())}
						</span>
					</li>
				{/each}
			</ul>
			<button
				type="button"
				onclick={onopen}
				class="min-h-11 self-start text-left text-sm font-bold text-primary"
			>
				{m.log_open_full()}
			</button>
		{/if}
	</div>
</section>
