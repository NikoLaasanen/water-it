<!--
  The signed-in app shell: navigation plus the content area.

  Pages under (app) own their *layout* — columns, grids, padding — but not the
  frame around it. That is decided once here, so a phone gets the bottom tab
  bar and an iPad the side rail without any page knowing which (screens.md
  "Navigation" and "Breakpoints").

  The bottom padding keeps the last row of a page clear of the fixed tab bar:
  56 px of bar plus the home-indicator inset, matching AppNav. From `md` the
  rail sits beside the content instead and the padding goes.

  The hills backdrop (screens.md "Backdrops") is placed here, fixed behind
  the page, except on Today and plant detail.
-->
<script lang="ts">
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import AppNav from '#lib/components/AppNav.svelte';
	import HillsBackdrop from '#lib/components/HillsBackdrop.svelte';

	let { children }: LayoutProps = $props();

	// The hills sit behind every screen but Today, which has its header scene,
	// and plant detail, which draws them inside its content sheet.
	const hills = $derived(page.url.pathname !== '/' && !/^\/plants\/[^/]+$/.test(page.url.pathname));
</script>

{#if hills}
	<HillsBackdrop rail />
{/if}

<div class="min-h-dvh md:flex">
	<AppNav />
	<div class="min-w-0 flex-1 pb-[calc(60px+max(24px,env(safe-area-inset-bottom)))] md:pb-0">
		{@render children()}
	</div>
</div>
