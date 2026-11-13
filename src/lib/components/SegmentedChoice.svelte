<!--
  A segmented control: one choice out of a few, as in the mockups' pot
  material and light pickers (`segment-bg` track, the chosen segment lifted
  onto `segment-selected`).

  Native radio buttons under the hood, so keyboard, VoiceOver and form
  semantics come for free; the `fieldset`/`legend` names the group. The
  selection is carried by the lifted segment *and* by weight and ink colour,
  never by the quiet track edge alone (screens.md).

  `value` may be undefined — nothing chosen yet, for optional fields like the
  pot material. With `edited` set it shows the care tag and, when edited,
  "Reset to preset".
-->
<script lang="ts" generics="T extends string">
	import CareTag from './form/CareTag.svelte';
	import ResetToPreset from './form/ResetToPreset.svelte';

	let {
		legend,
		name,
		options,
		value = $bindable(),
		onchange,
		edited,
		onreset
	}: {
		/** Visible label for the group. */
		legend: string;
		/** Radio group name; unique on the page. */
		name: string;
		options: readonly { value: T; label: string }[];
		value: T | undefined;
		onchange?: (value: T) => void;
		/** Care fields from a preset only. */
		edited?: boolean;
		onreset?: () => void;
	} = $props();
</script>

<fieldset class="flex flex-col">
	<!-- The legend must be the fieldset's first child to name the group, so
	     the care tag lives inside it. -->
	<legend class="mb-1.5 flex w-full items-center justify-between gap-2">
		<span class="text-sm font-bold text-ink-2">{legend}</span>
		{#if edited !== undefined}<CareTag {edited} />{/if}
	</legend>
	<div
		class="grid gap-1 rounded-[14px] bg-segment p-1"
		style:grid-template-columns="repeat({options.length}, minmax(0, 1fr))"
	>
		{#each options as option (option.value)}
			<label
				class={[
					'flex min-h-11 cursor-pointer items-center justify-center rounded-[10px] px-2 text-center text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
					value === option.value
						? 'bg-segment-selected font-bold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
						: 'font-semibold text-muted'
				]}
			>
				<input
					type="radio"
					{name}
					value={option.value}
					checked={value === option.value}
					class="sr-only"
					onchange={() => {
						value = option.value;
						onchange?.(option.value);
					}}
				/>
				{option.label}
			</label>
		{/each}
	</div>
	{#if edited && onreset}<ResetToPreset onclick={onreset} />{/if}
</fieldset>
