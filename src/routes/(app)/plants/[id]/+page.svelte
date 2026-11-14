<!--
  Plant detail, Care tab (screens.md "Plant detail").

  Phone: docs/mockups/plant-detail.dc.html — a 300 px photo header with round
  Back and Edit buttons over it, and a content sheet that overlaps the photo by
  28 px with a rounded top. Sections stack: name, next check, the tabs, then
  the open tab (care profile or log). Next check sits above the tabs so the
  watering info comes first on every tab (Niko, 2026-11-14).
  iPad (`md`+): docs/mockups/tablet-plant-detail.dc.html — the tabs move up
  beside the name, and the sections go into two columns: next check on the left, the care
  profile on the right. The sitter note from the mockups waits for M4. From `lg` the plant list
  sits beside this page (plants/+layout.svelte), so Back is hidden and the
  photo header drops to 220 px.

  Care and Log are built (Log since 2026-11-14; the open tab is `?tab=log` in
  the URL, so a reload keeps it). Photos is in the design and rendered disabled
  rather than hidden, so the shape of the screen is honest about what is coming
  without pretending to offer it. From `md` the Care tab also shows the latest
  four log entries (Recent log), as in the tablet mockup.
-->
<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Leaf from '@lucide/svelte/icons/leaf';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { MediaQuery } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import HealthFace from '#lib/components/HealthFace.svelte';
	import CareProfileCard from '#lib/components/plant/CareProfileCard.svelte';
	import LogList from '#lib/components/plant/LogList.svelte';
	import NextCheckCard from '#lib/components/plant/NextCheckCard.svelte';
	import RecentLogCard from '#lib/components/plant/RecentLogCard.svelte';
	import { PlantLog } from '#lib/firebase/log.svelte.js';
	import { PlantQuery } from '#lib/firebase/plants.svelte.js';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import {
		careOf,
		careRows,
		healthLabel,
		potChip,
		provenanceLine,
		speciesLine
	} from '#lib/plants/labels.js';
	import { parseLocalDate } from '#lib/plants/care.js';
	import { lastWateredAt } from '#lib/plants/log.js';
	import { presetById } from '#lib/presets/index.js';

	const query = new PlantQuery();
	// Tailwind's `md` (48rem): where the next-check card moves into the Care tab.
	const wide = new MediaQuery('min-width: 48rem');

	$effect(() => {
		const uid = session.user?.uid;
		// `params.id` is typed optional, and re-reading it here also means the
		// listener restarts when navigating straight from one plant to another.
		const id = page.params.id;
		if (!uid || !id) return;
		return query.listen(uid, id);
	});

	// The plant's log, newest first: the Log tab, Recent log and "Last
	// watered" all read this one listener. A page at a time; "Show older"
	// raises the limit for the plant it was pressed on.
	const LOG_PAGE = 30;
	const log = new PlantLog();
	let older = $state({ plantId: '', max: LOG_PAGE });
	const logMax = $derived(older.plantId === page.params.id ? older.max : LOG_PAGE);

	$effect(() => {
		const uid = session.user?.uid;
		const id = page.params.id;
		if (!uid || !id) return;
		return log.listen(uid, id, logMax);
	});

	function showOlder() {
		older = { plantId: page.params.id ?? '', max: logMax + LOG_PAGE };
	}

	type Tab = 'care' | 'log';
	const tab = $derived<Tab>(page.url.searchParams.get('tab') === 'log' ? 'log' : 'care');

	function openTab(next: Tab) {
		const id = page.params.id;
		if (next === tab || !id) return;
		// Replace, not push: Back leaves the plant rather than stepping
		// through tab switches.
		const options = { replace: true, reset: false };
		// The path is resolve()'s; the rule just can't see through the added query.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		if (next === 'log') void goto(`${resolve('/(app)/plants/[id]', { id })}?tab=log`, options);
		else void goto(resolve('/(app)/plants/[id]', { id }), options);
	}

	/** Arrow keys move between the tabs that exist, as a tablist should. */
	function onTabKey(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		const next: Tab = tab === 'care' ? 'log' : 'care';
		openTab(next);
		document.getElementById(`tab-${next}`)?.focus();
	}

	const plant = $derived(query.plant);
	// The log covers the last LOG_PAGE entries; the check's last answer
	// covers a watering older than that (or one still syncing).
	const lastWatered = $derived.by(() => {
		const fromLog = lastWateredAt(log.entries);
		const answer = query.checkTask?.lastAnswer;
		const fromCheck = answer?.kind === 'watered' ? parseLocalDate(answer.on) : null;
		if (!fromLog) return fromCheck;
		return fromCheck && fromCheck > fromLog ? fromCheck : fromLog;
	});
	const preset = $derived(presetById(plant?.speciesId));
	const resolved = $derived(plant ? careOf(plant) : null);
	const rows = $derived(resolved ? careRows(resolved.care) : []);
	const provenance = $derived(resolved ? provenanceLine(preset, resolved.edited) : null);
	const species = $derived(speciesLine(preset));
	const pot = $derived(potChip(plant?.pot));
</script>

<svelte:head>
	<title>{plant ? `${plant.name} · Water.it` : 'Water.it'}</title>
</svelte:head>

{#if query.loading}
	<p class="flex min-h-dvh items-center justify-center text-sm text-muted" role="status">
		{m.loading()}
	</p>
{:else if query.missing || !plant}
	<main class="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center gap-4 px-5 text-center">
		<h1 class="text-2xl font-extrabold text-ink">{m.plant_not_found_heading()}</h1>
		<p class="text-sm text-muted">{m.plant_not_found_body()}</p>
		<a
			href={resolve('/(app)/plants')}
			class="min-h-12 rounded-xl border border-border px-4 py-3 font-bold text-ink"
		>
			{m.plant_not_found_back()}
		</a>
	</main>
{:else}
	<!-- Photo header. Photos are M3, so for now this is the placeholder
	     everywhere: the tint and leaf from the Plants list, enlarged. -->
	<!-- The photo stays put while the content sheet scrolls up over it
	     (sticky, under the sheet's z-10). Back and Edit sit in their own
	     zero-height sticky layer above both, so they stay reachable at any
	     scroll position instead of disappearing under the sheet. -->
	<div class="sticky top-0 z-20 h-0">
		<a
			href={resolve('/(app)/plants')}
			aria-label={m.plant_back()}
			class="absolute top-13 left-4 flex size-11 items-center justify-center rounded-full bg-surface/90 text-ink md:top-7 md:left-6 lg:hidden"
		>
			<ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
		</a>

		<!-- Edit: round on phones, a labelled pill on the iPad, as in the two
		     mockups. -->
		<a
			href={resolve('/(flow)/plants/[id]/edit', { id: plant.id })}
			class="absolute top-13 right-4 flex size-11 items-center justify-center gap-2 rounded-full bg-surface/90 text-ink no-underline md:top-7 md:right-6 md:w-auto md:px-4"
		>
			<Pencil size={20} strokeWidth={2} aria-hidden="true" />
			<!-- The label is always there for screen readers; visible from `md`. -->
			<span class="sr-only text-sm font-bold md:not-sr-only">{m.plant_edit()}</span>
		</a>
	</div>

	<div
		class="sticky top-0 flex h-[300px] items-center justify-center lg:h-[220px]"
		style:background="var(--thumb-tint)"
		style:color="var(--primary)"
	>
		<Leaf size={64} strokeWidth={1.4} aria-hidden="true" />
		<p class="absolute bottom-11 left-5 text-xs font-semibold text-muted md:left-8">
			{m.plant_photo_none()}
		</p>
	</div>

	<main
		class="relative z-10 -mt-7 flex flex-col gap-5 rounded-t-[28px] bg-bg px-5 pt-6 pb-10 md:px-8 md:pb-8"
		data-health={plant.health}
	>
		<div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
			<header class="flex min-w-0 flex-col gap-1.5">
				<h1 class="text-[30px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
					{plant.name}
				</h1>

				{#if species}
					<p class="text-sm text-muted">
						{species.common ??
							''}{#if species.common && species.scientific}&nbsp;·&nbsp;{/if}{#if species.scientific}<i
								>{species.scientific}</i
							>{/if}
					</p>
				{/if}

				<div class="mt-1.5 flex flex-wrap gap-2">
					<span
						class="inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs font-bold"
						style:background="var(--health-bg)"
						style:color="var(--health-fg)"
					>
						<HealthFace health={plant.health} size={22} ring={false} />
						{healthLabel(plant.health)}
					</span>

					{#if plant.dormant}
						<span
							class="rounded-full border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-2"
						>
							{m.plant_dormant()}
						</span>
					{/if}

					{#if plant.location?.trim()}
						<span
							class="rounded-full border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-2"
						>
							{plant.location}
						</span>
					{/if}

					{#if pot}
						<span
							class="rounded-full border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-2"
						>
							{pot}
						</span>
					{/if}
				</div>
			</header>

			<!-- Phones: watering comes first (Niko, 2026-11-14), so the next-check
			     card sits above the tabs and stays there on every tab. From `md`
			     it opens the Care tab's left column instead, as in the tablet
			     mockup. One instance either way, chosen by the media query. -->
			{#if !wide.current}
				<NextCheckCard {plant} task={query.checkTask} {lastWatered} />
			{/if}

			<!-- Care / Log / Photos. A real tablist, so Photos, which doesn't
			     exist yet, announces itself as disabled rather than just looking
			     grey. Roving tabindex: Tab reaches the open tab, arrows switch. -->
			<div
				role="tablist"
				tabindex="-1"
				aria-label={m.plant_tabs_label()}
				onkeydown={onTabKey}
				class="grid grid-cols-3 gap-1 rounded-[14px] bg-segment p-1 md:w-[300px] md:flex-none"
			>
				{#each [{ id: 'care', label: m.plant_tab_care() }, { id: 'log', label: m.plant_tab_log() }] as const as item (item.id)}
					<button
						type="button"
						role="tab"
						id="tab-{item.id}"
						aria-selected={tab === item.id}
						aria-controls="tabpanel"
						tabindex={tab === item.id ? 0 : -1}
						onclick={() => openTab(item.id)}
						class={[
							'min-h-10 rounded-[10px] text-sm',
							tab === item.id
								? 'bg-segment-selected font-bold text-ink'
								: 'font-semibold text-muted'
						]}
					>
						{item.label}
					</button>
				{/each}
				<button
					type="button"
					role="tab"
					aria-selected="false"
					disabled
					title={m.plant_tab_soon()}
					class="min-h-10 rounded-[10px] text-sm font-semibold text-muted disabled:opacity-60"
				>
					{m.plant_tab_photos()}
				</button>
			</div>
		</div>

		<!-- Care tab: on phones just the care profile (next check is above the
		     tabs). From `md` two columns: next check and Recent log on the left,
		     the care profile on the right. `contents` lets the left column's
		     cards take part in the phone's single-column order, and `order`
		     places the care profile among them — which matters again when the
		     sitter note arrives (M4, hidden until plant-sitting lands). -->
		<div id="tabpanel" role="tabpanel" aria-labelledby="tab-{tab}">
			{#if tab === 'log'}
				<LogList
					entries={log.entries}
					loading={log.loading}
					hasMore={log.hasMore}
					onmore={showOlder}
				/>
			{:else}
				<div class="grid gap-5 md:grid-cols-2 md:items-start">
					<div class="contents md:flex md:flex-col md:gap-5">
						{#if wide.current}
							<NextCheckCard {plant} task={query.checkTask} {lastWatered} />
						{/if}
						<!-- iPad only, as designed: on a phone the Log tab is one tap away. -->
						<div class="hidden md:block">
							<RecentLogCard entries={log.entries} onopen={() => openTab('log')} />
						</div>
					</div>
					<div class="order-2 md:order-none">
						<CareProfileCard {rows} {provenance} />
					</div>
				</div>
			{/if}
		</div>
	</main>
{/if}
