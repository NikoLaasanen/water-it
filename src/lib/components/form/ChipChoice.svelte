<!--
  Pill chips (docs/mockups/add-plant.dc.html):

  - `mode="single"` — pick one or none, tapping the chosen chip clears it
    ("How did you get it?"). Toggle buttons with `aria-pressed`, since a radio
    group can't be emptied again.
  - `mode="fill"` — each chip fills a value in and stays unpressed ("Your
    other locations" under "Where is it?").
-->
<script lang="ts" generics="T extends string">
	let {
		label,
		options,
		value,
		mode = 'single',
		onpick
	}: {
		/** Names the group for screen readers. */
		label: string;
		options: readonly { value: T; label: string }[];
		value?: T;
		mode?: 'single' | 'fill';
		onpick: (value: T | undefined) => void;
	} = $props();
</script>

<div role="group" aria-label={label} class="flex flex-wrap gap-2">
	{#each options as option (option.value)}
		{@const chosen = mode === 'single' && value === option.value}
		<button
			type="button"
			aria-pressed={mode === 'single' ? chosen : undefined}
			class={[
				'min-h-11 rounded-full border-[1.5px] px-4 text-sm',
				chosen
					? 'bg-selected font-bold text-ink'
					: 'border-border bg-surface font-semibold text-ink-2'
			]}
			style:border-color={chosen ? 'var(--selected-border)' : undefined}
			onclick={() => onpick(chosen ? undefined : option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>
