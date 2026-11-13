<!--
  The tag beside a care field's label: quiet "From preset" while it matches
  the preset, an amber "Edited" pill once it doesn't (screens.md "Edit plant").
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { edited }: { edited: boolean } = $props();
</script>

{#if edited}
	<span
		class="flex-none rounded-full px-2 py-0.5 text-[11px] font-bold"
		style:background="var(--edited-bg)"
		style:color="var(--edited-fg)"
	>
		{m.form_tag_edited()}
	</span>
{:else}
	<span class="flex-none text-[11px] font-semibold text-muted-2">{m.form_tag_preset()}</span>
{/if}
