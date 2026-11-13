<!--
  "How is it doing?" — four radio cards in a 2 × 2 grid, face + label. The
  chosen card takes its health colours (`data-health`), plus a 2 px border,
  so the choice never rests on colour alone.
-->
<script lang="ts">
	import HealthFace from '#lib/components/HealthFace.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { healthLabel } from '#lib/plants/labels.js';
	import type { Health } from '#lib/types/plant.js';

	let { value = $bindable() }: { value: Health } = $props();

	const OPTIONS: Health[] = ['thriving', 'okay', 'recovering', 'struggling'];
</script>

<fieldset>
	<legend class="sr-only">{m.form_health()}</legend>
	<div class="grid grid-cols-2 gap-2.5">
		{#each OPTIONS as option (option)}
			{@const chosen = value === option}
			<label
				data-health={option}
				class={[
					'flex min-h-14 cursor-pointer items-center gap-2.5 rounded-[14px] px-3 text-[15px] font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
					chosen ? 'border-2' : 'border-[1.5px] border-border bg-surface text-ink-2'
				]}
				style:background={chosen ? 'var(--health-bg)' : undefined}
				style:color={chosen ? 'var(--health-fg)' : undefined}
				style:border-color={chosen ? 'var(--health-fg)' : undefined}
			>
				<input
					type="radio"
					name="health"
					value={option}
					checked={chosen}
					class="sr-only"
					onchange={() => (value = option)}
				/>
				<HealthFace health={option} size={34} ring={false} />
				{healthLabel(option)}
			</label>
		{/each}
	</div>
</fieldset>
