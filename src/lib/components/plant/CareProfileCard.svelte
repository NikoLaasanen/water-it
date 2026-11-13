<!--
  The care profile list on plant detail, with its provenance line underneath
  ("From the Pilea preset · edited by you: check test").
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { CareRow } from '#lib/plants/labels.js';

	let {
		rows,
		provenance
	}: {
		rows: CareRow[];
		/** Null for a plant with no preset. */
		provenance: string | null;
	} = $props();
</script>

<section class="flex flex-col gap-2">
	<h2 class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
		{m.plant_care_heading()}
	</h2>
	<dl class="flex flex-col rounded-[18px] bg-surface px-4 py-1">
		{#each rows as row, index (row.label)}
			<div
				class="grid grid-cols-[104px_minmax(0,1fr)] gap-3 py-3.5 text-sm leading-[1.4]"
				class:border-b={index < rows.length - 1}
				style:border-color="var(--line)"
			>
				<dt class="font-bold text-muted">{row.label}</dt>
				<dd class="text-ink">{row.value}</dd>
			</div>
		{/each}
	</dl>
	{#if provenance}
		<p class="text-xs text-muted-2">{provenance}</p>
	{/if}
</section>
