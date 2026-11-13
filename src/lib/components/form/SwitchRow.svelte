<!--
  A labelled on/off row: title and a one-line explanation on the left, the
  52 × 32 switch on the right ("Under a grow light", "Resting (dormant)").
  The whole text is the switch's label.
-->
<script lang="ts">
	import { Switch } from '#lib/components/ui/switch/index.js';

	let {
		id,
		label,
		description,
		checked = $bindable()
	}: {
		id: string;
		label: string;
		description?: string;
		checked: boolean;
	} = $props();
</script>

<div class="flex items-center justify-between gap-3">
	<label for={id} class="flex min-w-0 cursor-pointer flex-col gap-0.5">
		<span class="text-[15px] font-bold text-ink">{label}</span>
		{#if description}<span class="text-xs leading-[1.4] text-muted">{description}</span>{/if}
	</label>
	<Switch {id} size="lg" bind:checked />
</div>
