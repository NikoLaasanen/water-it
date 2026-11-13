<!--
  A segmented control: one choice out of a few, as in the mockups' pot
  material and light pickers (`segment-bg` track, the chosen segment lifted
  onto `segment-selected`).

  Native radio buttons under the hood, so keyboard, VoiceOver and form
  semantics come for free; the `fieldset`/`legend` names the group. The
  selection is carried by the lifted segment *and* by weight and ink colour,
  never by the quiet track edge alone (screens.md).
-->
<script lang="ts" generics="T extends string">
	let {
		legend,
		name,
		options,
		value = $bindable(),
		onchange
	}: {
		/** Visible label for the group. */
		legend: string;
		/** Radio group name; unique on the page. */
		name: string;
		options: readonly { value: T; label: string }[];
		value: T;
		onchange?: (value: T) => void;
	} = $props();
</script>

<fieldset class="flex flex-col gap-2">
	<legend class="mb-2 text-sm font-bold text-ink-2">{legend}</legend>
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
</fieldset>
