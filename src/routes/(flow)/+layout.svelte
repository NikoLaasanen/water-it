<!--
  Full-screen flows with no tab bar or rail: Add plant now, Edit plant next.
  The mockups draw them as one tall phone column, so on an iPad they stay a
  readable column in the middle rather than stretching to 1180 px.

  Signed-in only, like (app): the root layout's guard covers this group too.
-->
<script lang="ts">
	import type { LayoutProps } from './$types';
	import HillsBackdrop from '#lib/components/HillsBackdrop.svelte';

	let { children }: LayoutProps = $props();
</script>

<HillsBackdrop />

<div class="vt-page mx-auto w-full max-w-xl">
	{@render children()}
</div>
