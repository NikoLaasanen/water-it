<!--
  Everything under /plants: the list, and plant detail.

  Owns the one `PlantsQuery`, shared through context, so the list page and the
  side list below read the same live data.

  On plant detail from `lg` (1024 px, iPad landscape) the list stays on screen
  as a 320 px column beside the plant (docs/mockups/tablet-plant-detail.dc.html).
  Below that — phones and iPad portrait — detail takes the whole width and has
  a Back button instead. The column is only hidden by CSS, not unmounted, so
  turning the iPad doesn't rebuild anything.
-->
<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import PlantRow from '#lib/components/PlantRow.svelte';
	import { PlantsQuery, setPlantsQuery } from '#lib/firebase/plants.svelte.js';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	let { children }: LayoutProps = $props();

	const query = setPlantsQuery(new PlantsQuery());

	// The layout owns the listeners: returning the unsubscribe from the effect
	// tears them down when /plants is left or the user changes.
	$effect(() => {
		const uid = session.user?.uid;
		if (!uid) return;
		return query.listen(uid);
	});

	const selectedId = $derived(page.params.id);
	const plants = $derived(query.sorted(getLocale()));

	// See plants/+page.svelte: one date per mount, so rows agree on "today".
	const today = new Date();
</script>

{#if selectedId}
	<div class="lg:flex">
		<section
			aria-label={m.plants_list_label()}
			class="sticky top-0 hidden h-dvh w-80 flex-none flex-col gap-4 overflow-y-auto border-r border-line px-4 pt-10 pb-6 lg:flex"
		>
			<div class="flex items-center justify-between gap-3 px-1.5">
				<h2 class="text-[28px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
					{m.plants_title()}
				</h2>
				<!-- Inert until Add/Edit exists, like the list's Add button. -->
				<button
					type="button"
					disabled
					aria-label={m.plants_add_soon()}
					class="flex size-11 flex-none items-center justify-center rounded-[14px] bg-primary text-on-primary disabled:opacity-50"
				>
					<Plus size={22} strokeWidth={2.4} aria-hidden="true" />
				</button>
			</div>
			<div class="flex flex-col gap-1">
				{#each plants as plant (plant.id)}
					<PlantRow
						{plant}
						task={query.checkTaskFor(plant.id)}
						{today}
						size="compact"
						current={plant.id === selectedId}
					/>
				{/each}
			</div>
		</section>
		<div class="min-w-0 flex-1">
			{@render children()}
		</div>
	</div>
{:else}
	{@render children()}
{/if}
