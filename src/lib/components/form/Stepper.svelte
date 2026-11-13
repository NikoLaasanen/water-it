<!--
  A − / value / + stepper for a whole number of days, as in the Watering
  section of docs/mockups/add-plant.dc.html ("Growing season · Apr–Sep ·
  − 7 days +"). The value is announced politely as it changes.
-->
<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';

	let {
		label,
		sublabel,
		value = $bindable(),
		min = 1,
		max = 120,
		display,
		decreaseLabel,
		increaseLabel
	}: {
		label: string;
		sublabel?: string;
		value: number;
		min?: number;
		max?: number;
		/** The value as words, e.g. "7 days". */
		display: string;
		decreaseLabel: string;
		increaseLabel: string;
	} = $props();

	const step = (delta: number) => (value = Math.max(min, Math.min(max, value + delta)));
</script>

<div class="flex items-center justify-between gap-3">
	<span class="flex min-w-0 flex-col">
		<span class="text-[15px] font-bold text-ink">{label}</span>
		{#if sublabel}<span class="text-xs text-muted">{sublabel}</span>{/if}
	</span>
	<span class="flex flex-none items-center gap-1">
		<button
			type="button"
			aria-label={decreaseLabel}
			disabled={value <= min}
			class="flex size-11 items-center justify-center rounded-full border-[1.5px] border-field-border text-ink disabled:opacity-40"
			onclick={() => step(-1)}
		>
			<Minus size={18} strokeWidth={2.4} aria-hidden="true" />
		</button>
		<span aria-live="polite" class="min-w-[4.5rem] text-center text-base font-bold text-ink">
			{display}
		</span>
		<button
			type="button"
			aria-label={increaseLabel}
			disabled={value >= max}
			class="flex size-11 items-center justify-center rounded-full border-[1.5px] border-field-border text-ink disabled:opacity-40"
			onclick={() => step(1)}
		>
			<Plus size={18} strokeWidth={2.4} aria-hidden="true" />
		</button>
	</span>
</div>
