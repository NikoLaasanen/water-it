<!--
  The Plants list — the catalogue (screens.md "Plants").

  Phone: docs/mockups/plants.dc.html — one column, 56 px above the title to
  clear the status bar, 20 px page padding, 10 px between rows, a square Add
  button.
  iPad (`md`+): docs/mockups/tablet-plants.dc.html — a grid of the same cards,
  two columns in portrait and three in landscape, with a search field and a
  labelled Add button in the header.

  The data comes from `/plants/+layout.svelte`, which owns the listener.
-->
<script lang="ts">
	import { clock } from '#lib/clock.svelte.js';
	import Plus from '@lucide/svelte/icons/plus';
	import { resolve } from '$app/paths';
	import Search from '@lucide/svelte/icons/search';
	import PlantRow from '#lib/components/PlantRow.svelte';
	import { getPlantsQuery } from '#lib/firebase/plants.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	const query = getPlantsQuery();

	const plants = $derived(query.sorted(getLocale()));
	const struggling = $derived(plants.filter((plant) => plant.health === 'struggling').length);

	// Search is in the iPad design only; the field is hidden on phones, where
	// a handful of plants fits on one screen anyway.
	let search = $state('');
	const needle = $derived(search.trim().toLocaleLowerCase(getLocale()));
	const shown = $derived(
		needle
			? plants.filter((plant) =>
					[plant.name, plant.location ?? ''].some((text) =>
						text.toLocaleLowerCase(getLocale()).includes(needle)
					)
				)
			: plants
	);

	// One date for the whole list, so no two rows can disagree about "today";
	// the shared clock moves it on at midnight and when the app is reopened.
	const today = $derived(clock.today);
</script>

<svelte:head>
	<title>{m.plants_title()} · Water.it</title>
</svelte:head>

<main class="flex flex-col gap-5 px-5 pt-14 pb-10 md:px-8 md:pt-10">
	<header class="flex items-end justify-between gap-3 md:gap-4">
		<div class="flex min-w-0 flex-col gap-1">
			<h1 class="text-[34px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
				{m.plants_title()}
			</h1>
			{#if !query.loading && plants.length > 0}
				<p class="text-[15px] text-muted">
					{m.plants_summary_count({ count: plants.length })}{#if struggling > 0}
						&nbsp;·&nbsp;{m.plants_summary_struggling({ count: struggling })}
					{/if}
				</p>
			{/if}
		</div>

		<div class="flex flex-none items-center gap-3">
			{#if plants.length > 0}
				<label
					class="hidden min-h-12 w-[280px] items-center gap-2 rounded-[14px] border-[1.5px] border-field-border bg-field px-3.5 text-muted md:flex"
				>
					<Search size={20} strokeWidth={2} aria-hidden="true" />
					<span class="sr-only">{m.plants_search_label()}</span>
					<input
						type="search"
						bind:value={search}
						placeholder={m.plants_search_label()}
						class="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-placeholder"
					/>
				</label>
			{/if}

			<!-- A square icon button on phones, labelled from `md`. The label is
			     always there for screen readers, visually hidden on phones. -->
			<a
				href={resolve('/(flow)/plants/new')}
				class="flex size-12 flex-none items-center justify-center gap-2 rounded-2xl bg-primary text-on-primary no-underline md:w-auto md:rounded-[14px] md:px-[18px]"
			>
				<Plus size={24} strokeWidth={2.4} aria-hidden="true" />
				<span class="sr-only text-[15px] font-bold md:not-sr-only">{m.plants_add()}</span>
			</a>
		</div>
	</header>

	{#if query.loading}
		<p class="text-sm text-muted" role="status">{m.plants_loading()}</p>
	{:else if query.failed}
		<p
			role="alert"
			class="flex items-start gap-2 rounded-xl border border-border bg-surface p-3 text-sm text-ink"
		>
			<span aria-hidden="true">⚠️</span>
			<span>{m.plants_failed()}</span>
		</p>
	{:else if plants.length === 0}
		<!-- Empty states are listed as "not designed yet" in screens.md, so this
		     follows the tokens and leads straight to adding the first plant
		     (design.md 9: empty states guide adding the first plant). -->
		<div class="flex max-w-xl flex-col gap-2 rounded-[18px] bg-surface p-5 text-center">
			<h2 class="text-lg font-bold text-ink">{m.plants_empty_heading()}</h2>
			<p class="text-sm text-muted">{m.plants_empty_body()}</p>
			<a
				href={resolve('/(flow)/plants/new')}
				class="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-bold text-on-primary no-underline"
			>
				<Plus size={20} strokeWidth={2.4} aria-hidden="true" />
				{m.plants_empty_add()}
			</a>
		</div>
	{:else if shown.length === 0}
		<p class="text-sm text-muted" role="status">{m.plants_search_none({ query: search.trim() })}</p>
	{:else}
		<div class="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3 lg:grid-cols-3">
			{#each shown as plant (plant.id)}
				<PlantRow {plant} task={query.checkTaskFor(plant.id)} {today} />
			{/each}
		</div>
	{/if}
</main>
