<!--
  The app's main navigation (screens.md "Navigation").

  One component, two shapes: a bottom tab bar on phones, and from `md` (768 px,
  iPad portrait and up) a 96 px side rail, as in docs/mockups/tablet-*.dc.html.
  Same four destinations in the same order either way, so nothing has to be
  relearned when the phone is turned into an iPad.

  Photos is M3. It stays in the bar, disabled, so the bar keeps its designed
  shape and the tab doesn't appear from nowhere later.
-->
<script lang="ts">
	import Camera from '@lucide/svelte/icons/camera';
	import Droplet from '@lucide/svelte/icons/droplet';
	import Leaf from '@lucide/svelte/icons/leaf';
	import Settings from '@lucide/svelte/icons/settings';
	import type { Component } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';

	type Item = {
		label: string;
		icon: Component<{ size?: number; strokeWidth?: number; 'aria-hidden'?: 'true' }>;
		/** Absent for a destination that doesn't exist yet. */
		route?: '/(app)' | '/(app)/plants' | '/(app)/settings';
		/** Whether the current URL belongs to this tab. */
		active: boolean;
	};

	const path = $derived(page.url.pathname);

	const items: Item[] = $derived([
		{ label: m.nav_today(), icon: Droplet, route: '/(app)', active: path === '/' },
		{
			label: m.nav_plants(),
			icon: Leaf,
			route: '/(app)/plants',
			active: path === '/plants' || path.startsWith('/plants/')
		},
		{ label: m.nav_photos(), icon: Camera, active: false },
		{
			label: m.nav_settings(),
			icon: Settings,
			route: '/(app)/settings',
			active: path.startsWith('/settings')
		}
	]);
</script>

<nav
	aria-label={m.nav_label()}
	class="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-surface/95 px-3 pt-2 pb-[max(24px,env(safe-area-inset-bottom))] backdrop-blur md:sticky md:top-0 md:flex md:h-dvh md:w-24 md:flex-none md:flex-col md:items-center md:gap-3 md:border-t-0 md:border-r md:px-0 md:py-7 md:pb-7"
>
	<!-- App mark, rail only. Decorative for sighted users; the name is still
	     announced, as in the mockup. -->
	<div
		role="img"
		aria-label="Water.it"
		class="mb-4 hidden size-12 items-center justify-center rounded-[14px] bg-primary text-on-primary md:flex"
	>
		<Droplet size={24} strokeWidth={2} aria-hidden="true" />
	</div>

	{#each items as item (item.label)}
		{@const Icon = item.icon}
		{#if item.route}
			<a
				href={resolve(item.route)}
				aria-current={item.active ? 'page' : undefined}
				class={[
					'flex min-h-11 flex-col items-center justify-center gap-[3px] text-[11px] no-underline md:min-h-16 md:gap-1 md:text-xs',
					item.active ? 'font-bold text-primary' : 'font-semibold text-muted-2'
				]}
			>
				<!-- The rail puts the active icon on a pill; the bar relies on colour
				     and weight, plus aria-current, as in the phone mockup. -->
				<span
					class={[
						'flex items-center justify-center md:h-8 md:w-14 md:rounded-full',
						item.active && 'md:bg-selected'
					]}
				>
					<Icon size={24} strokeWidth={2} aria-hidden="true" />
				</span>
				{item.label}
			</a>
		{:else}
			<span
				aria-disabled="true"
				title={m.nav_soon()}
				class="flex min-h-11 flex-col items-center justify-center gap-[3px] text-[11px] font-semibold text-muted-2 opacity-50 md:min-h-16 md:gap-1 md:text-xs"
			>
				<span class="flex items-center justify-center md:h-8 md:w-14">
					<Icon size={24} strokeWidth={2} aria-hidden="true" />
				</span>
				{item.label}
				<span class="sr-only">({m.nav_soon()})</span>
			</span>
		{/if}
	{/each}
</nav>
