<!--
  "Recent log" on the iPad Care tab (docs/mockups/tablet-plant-detail.dc.html):
  the latest four entries — badge, note or what it did, date — and
  "Open full log", which switches to the Log tab.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { dayMonthLabel, logNextCheckLabel } from '#lib/plants/labels.js';
	import type { LogEntry } from '#lib/types/plant.js';
	import LogKindBadge from './LogKindBadge.svelte';

	let { entries, onopen }: { entries: LogEntry[]; onopen: () => void } = $props();

	const recent = $derived(entries.slice(0, 4));

	const detail = (entry: LogEntry) => entry.note ?? logNextCheckLabel(entry) ?? '';
</script>

<section class="flex flex-col gap-2">
	<h2 class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
		{m.log_recent_heading()}
	</h2>
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
