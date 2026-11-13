<!--
  One labelled form field: the label row (with the care tag for care fields),
  the control, a hint, an error, and "Reset to preset" under an edited care
  field (screens.md "Edit plant").

  The caller renders the control with `id={id}` and spreads the
  `describedBy` / `invalid` it is handed, so the hint and error are announced
  with the field.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import CareTag from './CareTag.svelte';
	import ResetToPreset from './ResetToPreset.svelte';
	import { m } from '#lib/paraglide/messages.js';

	let {
		id,
		label,
		optional = false,
		hint,
		error,
		edited,
		onreset,
		children
	}: {
		id: string;
		label: string;
		optional?: boolean;
		hint?: string;
		error?: string;
		/** Care fields from a preset only: undefined shows no tag at all. */
		edited?: boolean;
		onreset?: () => void;
		children: Snippet<[{ describedBy: string | undefined; invalid: boolean }]>;
	} = $props();

	const describedBy = $derived(
		[hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
			undefined
	);
</script>

<div class="flex flex-col gap-1.5">
	<div class="flex items-center justify-between gap-2">
		<label for={id} class="text-sm font-bold text-ink-2">
			{label}
			{#if optional}<span class="font-semibold text-muted-2"> ({m.form_optional()})</span>{/if}
		</label>
		{#if edited !== undefined}<CareTag {edited} />{/if}
	</div>

	{@render children({ describedBy, invalid: Boolean(error) })}

	{#if hint}
		<p id="{id}-hint" class="text-xs leading-[1.4] text-muted">{hint}</p>
	{/if}
	{#if error}
		<p id="{id}-error" class="text-xs font-semibold" style:color="var(--danger)">{error}</p>
	{/if}
	{#if edited && onreset}<ResetToPreset onclick={onreset} />{/if}
</div>
