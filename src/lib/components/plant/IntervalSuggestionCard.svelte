<!--
  An interval suggestion on plant detail (screens.md "Interval suggestions"),
  under the next-check card. Shown only while the log supports one
  (interval-suggestion.ts); "Change" writes the new interval for this season,
  "Keep" hides it until enough new answers say the same again. Coloured like
  the seasonal tip: advice, not a warning.
-->
<script lang="ts">
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import { clock } from '#lib/clock.svelte.js';
	import { acceptIntervalSuggestion, keepInterval } from '#lib/firebase/check-writes.js';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { withIntervals } from '#lib/plants/care-profile.js';
	import { suggestInterval, type IntervalSuggestion } from '#lib/plants/interval-suggestion.js';
	import { careOf } from '#lib/plants/labels.js';
	import { currentSeason } from '#lib/plants/schedule.js';
	import { presetById } from '#lib/presets/index.js';
	import type { LogEntry, Plant, Task } from '#lib/types/plant.js';

	let { plant, task, entries }: { plant: Plant; task: Task; entries: LogEntry[] } = $props();

	const care = $derived(careOf(plant).care);
	const suggestion = $derived.by(() => {
		const season = currentSeason(plant, clock.today);
		return suggestInterval({
			entries,
			intervalDays: care.checkIntervalDays[season],
			season,
			fixedSchedule: care.fixedSchedule,
			dismissedOn: task.suggestionKeptOn
		});
	});

	function text(s: IntervalSuggestion): string {
		const values = { rounds: s.rounds, to: s.toDays, from: s.fromDays };
		if (s.direction === 'longer') {
			return s.season === 'growing'
				? m.suggest_longer_growing(values)
				: m.suggest_longer_resting(values);
		}
		return s.season === 'growing'
			? m.suggest_shorter_growing(values)
			: m.suggest_shorter_resting(values);
	}

	function accept(s: IntervalSuggestion) {
		const uid = session.user?.uid;
		if (!uid) return;
		const intervals = { ...care.checkIntervalDays, [s.season]: s.toDays };
		const overrides = withIntervals(plant.careOverrides, presetById(plant.speciesId), intervals);
		acceptIntervalSuggestion(uid, plant.id, overrides, task, s.toDays);
	}

	function keep() {
		const uid = session.user?.uid;
		if (uid) keepInterval(uid, plant.id);
	}
</script>

{#if suggestion}
	<section
		class="flex flex-col gap-3 rounded-[18px] p-4"
		style:background="var(--chip-sun-bg)"
		style:color="var(--chip-sun-fg)"
		aria-labelledby="suggestion-heading"
	>
		<h2
			id="suggestion-heading"
			class="flex items-center gap-2 text-xs font-bold tracking-[0.08em] uppercase"
		>
			<Lightbulb
				size={16}
				strokeWidth={2.2}
				style="color: var(--chip-sun-icon)"
				aria-hidden="true"
			/>
			{m.suggest_heading()}
		</h2>
		<p class="text-[15px] leading-[1.45]">{text(suggestion)}</p>
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				onclick={() => accept(suggestion)}
				class="min-h-11 flex-1 rounded-xl bg-primary px-4 text-[15px] font-bold whitespace-nowrap text-primary-foreground"
			>
				{m.suggest_accept({ days: suggestion.toDays })}
			</button>
			<button
				type="button"
				onclick={keep}
				class="min-h-11 flex-1 rounded-xl border-[1.5px] border-border bg-surface px-4 text-[15px] font-semibold whitespace-nowrap text-ink"
			>
				{m.suggest_keep({ days: suggestion.fromDays })}
			</button>
		</div>
		<p class="text-xs">{m.suggest_note()}</p>
	</section>
{/if}
