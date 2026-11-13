<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
</script>

<!--
	Placeholder for the Today view (screens.md "Today"), which arrives with the
	scheduling work in M2. Sign-out has moved to Settings and the link to Plants
	to the tab bar.
-->
<svelte:head>
	<title>{m.nav_today()} · Water.it</title>
</svelte:head>

<main class="flex max-w-3xl flex-col gap-5 px-5 pt-14 md:px-8 md:pt-10">
	<h1 class="text-[34px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
		{m.nav_today()}
	</h1>
	<p class="text-sm text-muted">{m.home_placeholder()}</p>
</main>
