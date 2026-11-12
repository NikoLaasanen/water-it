<script lang="ts">
	import './layout.css';
	import { pwaInfo } from 'virtual:pwa-info';
	import type { LayoutProps } from './$types';
	import ReloadPrompt from '#lib/components/ReloadPrompt.svelte';

	let { children }: LayoutProps = $props();

	// The manifest's filename is hashed at build time, so the link tag has to
	// come from the plugin rather than being written into app.html.
	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html webManifestLink}
</svelte:head>

{@render children()}

<ReloadPrompt />
