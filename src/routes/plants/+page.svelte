<!--
  The Plants list — the catalogue (screens.md "Plants").

  Layout follows docs/mockups/plants.dc.html: 56 px above the title to clear
  the status bar, 20 px page padding, 10 px between rows.
-->
<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import PlantRow from '#lib/components/PlantRow.svelte';
	import { PlantsQuery } from '#lib/firebase/plants.svelte.js';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	const query = new PlantsQuery();

	// The component owns the listeners: returning the unsubscribe from the
	// effect tears them down when the page closes or the user changes.
	$effect(() => {
		const uid = session.user?.uid;
		if (!uid) return;
		return query.listen(uid);
	});

	// Sorted here rather than by Firestore, which orders strings by byte value
	// and would file Ä after Z — wrong in Finnish, where it belongs after A.
	const plants = $derived(
		[...query.plants].sort((a, b) => a.name.localeCompare(b.name, getLocale()))
	);

	const struggling = $derived(plants.filter((plant) => plant.health === 'struggling').length);

	// One date for the whole list, so no two rows can disagree about "today".
	// It is read once per mount: a list left open past midnight shows the
	// previous day until the page is revisited, which the Today view will have
	// to solve properly.
	const today = new Date();
</script>

<svelte:head>
	<title>{m.plants_title()} · Water.it</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-[420px] flex-col gap-5 px-5 pt-14 pb-10">
	<header class="flex items-end justify-between gap-3">
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

		<!-- Inert until the Add/Edit view exists. Disabled rather than hidden so
		     the header keeps its designed shape, and it says why when focused. -->
		<button
			type="button"
			disabled
			aria-label={m.plants_add_soon()}
			class="flex size-12 flex-none items-center justify-center rounded-2xl bg-primary text-on-primary disabled:opacity-50"
		>
			<Plus size={24} strokeWidth={2.4} aria-hidden="true" />
		</button>
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
		     follows the tokens and says plainly why the list is empty. -->
		<div class="flex flex-col gap-2 rounded-[18px] bg-surface p-5 text-center">
			<h2 class="text-lg font-bold text-ink">{m.plants_empty_heading()}</h2>
			<p class="text-sm text-muted">{m.plants_empty_body()}</p>
		</div>
	{:else}
		<div class="flex flex-col gap-2.5">
			{#each plants as plant (plant.id)}
				<PlantRow {plant} task={query.checkTaskFor(plant.id)} {today} />
			{/each}
		</div>
	{/if}
</main>
