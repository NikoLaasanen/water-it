<!--
  The health face badge: a round face whose mouth says how the plant is doing.

  Status is never colour alone (CLAUDE.md), so the mouth shape carries the same
  meaning as the colour, and the badge announces itself as "Health: Thriving"
  to a screen reader.

  Colours come from `data-health` on this element, resolved in layout.css, so
  the badge works wherever it is dropped and holds no colour of its own.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { healthLabel } from '#lib/plants/labels.js';
	import type { Health } from '#lib/types/plant.js';

	let { health, size = 32 }: { health: Health; size?: number } = $props();

	// Mouth paths from docs/mockups/plants.dc.html, which is the reference for
	// the exact shapes: a smile, a flat line, a faint smile and a frown.
	const MOUTHS: Record<Health, string> = {
		thriving: 'M8 14s1.5 2 4 2 4-2 4-2',
		okay: 'M8.5 15h7',
		recovering: 'M9 14.6c.8.5 1.8.8 3 .8s2.2-.3 3-.8',
		struggling: 'M16 16s-1.5-2-4-2-4 2-4 2'
	};

	const label = $derived(m.health_aria({ health: healthLabel(health) }));
	// The face sits in the middle of the badge at the mockup's proportions.
	const glyph = $derived(Math.round(size * 0.625));
</script>

<span
	data-health={health}
	role="img"
	aria-label={label}
	class="flex flex-none items-center justify-center rounded-full"
	style:width="{size}px"
	style:height="{size}px"
	style:background="var(--health-bg)"
	style:color="var(--health-fg)"
	style:border="2.5px solid var(--surface)"
>
	<svg
		width={glyph}
		height={glyph}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="10" />
		<circle cx="9" cy="10" r="0.6" fill="currentColor" />
		<circle cx="15" cy="10" r="0.6" fill="currentColor" />
		<path d={MOUTHS[health]} />
	</svg>
</span>
