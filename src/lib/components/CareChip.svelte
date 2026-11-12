<!--
  A labelled care chip: how much light or water the plant wants in general —
  not what it needs today (screens.md).

  The visible text is a single word that only means something next to the icon,
  and the icon says nothing to a screen reader. So the chip shows the word and
  announces the whole phrase ("Light: Bright") — two renderings of the same
  fact, rather than an `aria-label` that would replace the word with it.
-->
<script lang="ts">
	import Droplet from '@lucide/svelte/icons/droplet';
	import Sun from '@lucide/svelte/icons/sun';

	let {
		variant,
		label,
		aria
	}: {
		variant: 'sun' | 'water';
		/** The one-word value, already translated. */
		label: string;
		/** The same value as a full phrase, e.g. "Light: Bright". */
		aria: string;
	} = $props();

	const COLOURS = {
		sun: { bg: 'var(--chip-sun-bg)', fg: 'var(--chip-sun-fg)', icon: 'var(--chip-sun-icon)' },
		water: {
			bg: 'var(--chip-water-bg)',
			fg: 'var(--chip-water-fg)',
			icon: 'var(--chip-water-icon)'
		}
	} as const;

	const colours = $derived(COLOURS[variant]);
</script>

<span
	class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
	style:background={colours.bg}
	style:color={colours.fg}
>
	{#if variant === 'sun'}
		<Sun size={13} color={colours.icon} strokeWidth={2} aria-hidden="true" />
	{:else}
		<!-- Filled, per screens.md: the drop is solid wherever it means water. -->
		<Droplet size={13} fill={colours.icon} strokeWidth={0} aria-hidden="true" />
	{/if}
	<span class="sr-only">{aria}</span>
	<span aria-hidden="true">{label}</span>
</span>
