<!--
  "Note for plant-sitters" on plant detail. The same text goes on the share
  link in M4.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { note }: { note: string } = $props();
</script>

<section class="flex flex-col gap-2">
	<h2 class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
		{m.plant_sitter_heading()}
	</h2>
	<p class="rounded-[18px] bg-surface px-4 py-3.5 text-sm leading-[1.45] text-ink-2">
		{note}
	</p>
</section>
