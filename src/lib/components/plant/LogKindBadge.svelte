<!--
  A log entry's badge: icon and word, never colour alone. The three check
  answers reuse the Today status colours (data-status); everything else is a
  neutral grey, as in the tablet mockup's "Photo" row.
-->
<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Clock from '@lucide/svelte/icons/clock';
	import Move from '@lucide/svelte/icons/move';
	import Scissors from '@lucide/svelte/icons/scissors';
	import Shovel from '@lucide/svelte/icons/shovel';
	import Sprout from '@lucide/svelte/icons/sprout';
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import Sun from '@lucide/svelte/icons/sun';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import X from '@lucide/svelte/icons/x';
	import { logKindLabel } from '#lib/plants/labels.js';
	import type { LogKind } from '#lib/types/plant.js';

	let { kind }: { kind: LogKind } = $props();

	const ICONS = {
		watered: Check,
		'checked-damp': Clock,
		'checked-dry': Sun,
		skipped: X,
		fertilized: Sprout,
		repotted: Shovel,
		pruned: Scissors,
		moved: Move,
		note: StickyNote,
		problem: TriangleAlert
	} as const;

	const Icon = $derived(ICONS[kind]);
	const status = $derived(
		kind === 'watered' || kind === 'checked-damp' || kind === 'skipped' ? kind : undefined
	);
</script>

<span
	class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
	data-status={status}
	style:background={status ? 'var(--status-bg)' : 'var(--segment-bg)'}
	style:color={status ? 'var(--status-fg)' : 'var(--muted)'}
>
	<Icon size={14} strokeWidth={2.5} aria-hidden="true" />
	{logKindLabel(kind)}
</span>
