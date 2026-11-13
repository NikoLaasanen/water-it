<!--
  The top bar of the Add plant steps: a round 44 px button on the left (Close
  on step 1, Back on step 2), "Step N of 2" in the middle, and an empty slot
  on the right that keeps the label centred (docs/mockups/add-plant*.dc.html).
-->
<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import X from '@lucide/svelte/icons/x';
	import { m } from '#lib/paraglide/messages.js';

	let {
		href,
		kind,
		step
	}: {
		/** Already resolved. */
		href: string;
		kind: 'close' | 'back';
		step: 1 | 2;
	} = $props();
</script>

<div class="flex items-center justify-between">
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		{href}
		aria-label={kind === 'close' ? m.add_close() : m.add_back_species()}
		class="flex size-11 items-center justify-center rounded-full bg-surface text-ink shadow-[0_1px_2px_rgba(20,40,30,0.06)]"
	>
		{#if kind === 'close'}
			<X size={20} strokeWidth={2.2} aria-hidden="true" />
		{:else}
			<ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
		{/if}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
	<span class="text-[13px] font-semibold text-muted-2">{m.add_step({ step })}</span>
	<span class="w-11" aria-hidden="true"></span>
</div>
