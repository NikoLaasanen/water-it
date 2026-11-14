<script lang="ts">
	import './layout.css';
	// Loaded for its side effect: applies the theme setting and follows the
	// phone while it is on "auto".
	import '#lib/theme.svelte.js';
	import { pwaInfo } from 'virtual:pwa-info';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { LayoutProps } from './$types';
	import ReloadPrompt from '#lib/components/ReloadPrompt.svelte';
	import { session } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { hideSplash } from '#lib/splash.js';

	let { children }: LayoutProps = $props();

	// The manifest's filename is hashed at build time, so the link tag has to
	// come from the plugin rather than being written into app.html.
	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	// /signin and /signin/reset: the pages a signed-out user may see.
	const onSignInPage = $derived(
		page.url.pathname === '/signin' || page.url.pathname.startsWith('/signin/')
	);
	const blocked = $derived(session.user !== null && session.invited === false);

	// Route guard. It waits for `session.ready`, because Firebase restores a
	// persisted session asynchronously and acting sooner would bounce a
	// signed-in user to /signin on every cold start.
	$effect(() => {
		if (!session.ready) return;
		if (!session.user && !onSignInPage) {
			void goto(resolve('/signin'), { replace: true });
		} else if (session.user && onSignInPage && !blocked) {
			void goto(resolve('/(app)'), { replace: true });
		}
	});

	// Opening animation (app.html): open onto the app once there is something
	// to see. Signed out or not invited, that is now. Signed in, Today ends it
	// itself when its plants have loaded; this is the fallback for a cold start
	// on any other page.
	$effect(() => {
		if (!session.ready) return;
		if (!session.user || blocked) {
			hideSplash();
			return;
		}
		const timer = setTimeout(hideSplash, 1000);
		return () => clearTimeout(timer);
	});
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html webManifestLink}
</svelte:head>

{#if !session.ready}
	<p class="flex min-h-dvh items-center justify-center text-sm text-muted" role="status">
		{m.loading()}
	</p>
{:else if blocked}
	<!-- Signed in, but `firestore.rules` won't let this account touch anything.
	     Without this the app would just fail every read with no explanation. -->
	<main
		class="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center gap-4 px-5 text-center"
	>
		<h1 class="text-2xl font-extrabold text-ink">{m.not_invited_heading()}</h1>
		<p class="text-sm text-muted">
			{m.not_invited_body({ email: session.user?.email ?? '' })}
		</p>
		<button
			type="button"
			class="min-h-12 w-full rounded-xl border border-border px-4 font-bold text-ink"
			onclick={() => session.signOut()}
		>
			{m.sign_out()}
		</button>
	</main>
{:else if session.user || onSignInPage}
	{@render children()}
{/if}

<ReloadPrompt />
