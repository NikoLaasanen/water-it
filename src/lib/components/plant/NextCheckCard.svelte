<!--
  The next-check card on plant detail (screens.md "Plant detail").

  Status line only for now. The Watered / Still damp buttons in the mockup
  log a check and reschedule the plant — M2's scheduling work, and the same
  buttons as on the Today view — so they arrive together, built once with
  tests.
-->
<script lang="ts">
	import type { NextCheck } from '#lib/plants/care.js';
	import { nextCheckDetailLabel } from '#lib/plants/labels.js';

	let { next }: { next: NextCheck } = $props();

	const overdue = $derived(next.kind === 'overdue');
</script>

<div class="rounded-[18px] bg-surface p-4 shadow-[0_1px_2px_rgba(20,40,30,0.06)]">
	<p
		class="text-xs font-bold tracking-[0.08em] uppercase"
		style:color={overdue ? 'var(--overdue)' : 'var(--muted-2)'}
	>
		{nextCheckDetailLabel(next)}
	</p>
</div>
