<!--
  Plant detail, Care tab (screens.md "Plant detail").

  Layout follows docs/mockups/plant-detail.dc.html: a 300 px photo header with
  round Back and Edit buttons over it, and a content sheet that overlaps the
  photo by 28 px with a rounded top.

  Care is the only tab that exists. Log and Photos are in the design and are
  rendered disabled rather than hidden, so the shape of the screen is honest
  about what is coming without pretending to offer it.
-->
<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Leaf from '@lucide/svelte/icons/leaf';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import HealthFace from '#lib/components/HealthFace.svelte';
	import { PlantQuery } from '#lib/firebase/plants.svelte.js';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { nextCheck } from '#lib/plants/care.js';
	import { careRows, healthLabel, nextCheckDetailLabel } from '#lib/plants/labels.js';

	const query = new PlantQuery();

	$effect(() => {
		const uid = session.user?.uid;
		// `params.id` is typed optional, and re-reading it here also means the
		// listener restarts when navigating straight from one plant to another.
		const id = page.params.id;
		if (!uid || !id) return;
		return query.listen(uid, id);
	});

	const plant = $derived(query.plant);
	const next = $derived(nextCheck(query.checkTask, new Date()));
	const overdue = $derived(next.kind === 'overdue');
	const rows = $derived(plant ? careRows(plant.careProfile) : []);
	// "Terracotta · clay pebbles" — whichever of the two the plant has.
	const pot = $derived(
		[plant?.pot?.material, plant?.pot?.topLayer].filter((part) => part?.trim()).join(' · ')
	);
</script>

<svelte:head>
	<title>{plant ? `${plant.name} · Water.it` : 'Water.it'}</title>
</svelte:head>

{#if query.loading}
	<p class="flex min-h-dvh items-center justify-center text-sm text-muted" role="status">
		{m.loading()}
	</p>
{:else if query.missing || !plant}
	<main
		class="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center gap-4 px-5 text-center"
	>
		<h1 class="text-2xl font-extrabold text-ink">{m.plant_not_found_heading()}</h1>
		<p class="text-sm text-muted">{m.plant_not_found_body()}</p>
		<a
			href={resolve('/plants')}
			class="min-h-12 rounded-xl border border-border px-4 py-3 font-bold text-ink"
		>
			{m.plant_not_found_back()}
		</a>
	</main>
{:else}
	<div class="mx-auto w-full max-w-[420px]">
		<!-- Photo header. Photos are M3, so for now this is the placeholder
		     everywhere: the tint and leaf from the Plants list, enlarged. -->
		<div
			class="relative flex h-[300px] items-center justify-center"
			style:background="var(--thumb-tint)"
			style:color="var(--primary)"
		>
			<Leaf size={64} strokeWidth={1.4} aria-hidden="true" />
			<p class="absolute bottom-11 left-5 text-xs font-semibold text-muted">
				{m.plant_photo_none()}
			</p>

			<a
				href={resolve('/plants')}
				aria-label={m.plant_back()}
				class="absolute top-13 left-4 flex size-11 items-center justify-center rounded-full bg-surface/90 text-ink"
			>
				<ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
			</a>

			<!-- Inert until Add/Edit exists. -->
			<button
				type="button"
				disabled
				aria-label={m.plant_edit_soon()}
				class="absolute top-13 right-4 flex size-11 items-center justify-center rounded-full bg-surface/90 text-ink disabled:opacity-50"
			>
				<Pencil size={20} strokeWidth={2} aria-hidden="true" />
			</button>
		</div>

		<main
			class="relative -mt-7 flex flex-col gap-5 rounded-t-[28px] bg-bg px-5 pt-6 pb-10"
			data-health={plant.health}
		>
			<header class="flex flex-col gap-1.5">
				<h1 class="text-[30px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
					{plant.name}
				</h1>

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

			<!-- Care / Log / Photos. A real tablist, so the two that don't exist
			     yet announce themselves as disabled rather than just looking grey. -->
			<div
				role="tablist"
				aria-label={m.plant_tabs_label()}
				class="grid grid-cols-3 gap-1 rounded-[14px] p-1"
				style:background="var(--segment-bg)"
			>
				<button
					type="button"
					role="tab"
					aria-selected="true"
					class="min-h-10 rounded-[10px] bg-surface text-sm font-bold text-ink"
				>
					{m.plant_tab_care()}
				</button>
				{#each [m.plant_tab_log(), m.plant_tab_photos()] as label (label)}
					<button
						type="button"
						role="tab"
						aria-selected="false"
						disabled
						title={m.plant_tab_soon()}
						class="min-h-10 rounded-[10px] text-sm font-semibold text-muted disabled:opacity-60"
					>
						{label}
					</button>
				{/each}
			</div>

			<!-- Next check. The Watered / Still damp actions from the mockup are
			     not here: logging a check reschedules the plant, which is the
			     scheduling work in M2, and the same two buttons appear on the
			     Today view. Better built once, with tests, than wired up twice. -->
			<div class="rounded-[18px] bg-surface p-4 shadow-[0_1px_2px_rgba(20,40,30,0.06)]">
				<p
					class="text-xs font-bold tracking-[0.08em] uppercase"
					style:color={overdue ? 'var(--overdue)' : 'var(--muted-2)'}
				>
					{nextCheckDetailLabel(next)}
				</p>
			</div>

			<section class="flex flex-col gap-2">
				<h2 class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
					{m.plant_care_heading()}
				</h2>
				<dl class="flex flex-col rounded-[18px] bg-surface px-4 py-1">
					{#each rows as row, index (row.label)}
						<div
							class="grid grid-cols-[104px_minmax(0,1fr)] gap-3 py-3.5 text-sm leading-[1.4]"
							class:border-b={index < rows.length - 1}
							style:border-color="var(--line)"
						>
							<dt class="font-bold text-muted">{row.label}</dt>
							<dd class="text-ink">{row.value}</dd>
						</div>
					{/each}
				</dl>
			</section>

			{#if plant.sitterNote?.trim()}
				<section class="flex flex-col gap-2">
					<h2 class="text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase">
						{m.plant_sitter_heading()}
					</h2>
					<p class="rounded-[18px] bg-surface px-4 py-3.5 text-sm leading-[1.45] text-ink-2">
						{plant.sitterNote}
					</p>
				</section>
			{/if}
		</main>
	</div>
{/if}
