<!--
  A reminder's icon: a flask of liquid feed for fertilising, a plant pot for
  repotting (screens.md "Fertilise and repot reminders"). Decorative; the
  word always sits beside it.
-->
<script lang="ts">
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import PlantPot from '@lucide/svelte/icons/plant-pot';
	import type { ReminderKind } from '#lib/plants/reminders.js';

	let {
		kind,
		size = 22,
		strokeWidth = 1.9
	}: { kind: ReminderKind; size?: number; strokeWidth?: number } = $props();

	const Icon = $derived(kind === 'fertilize' ? FlaskConical : PlantPot);
</script>

<Icon {size} {strokeWidth} aria-hidden="true" />
