<!--
  Sign-in. Not designed on the canvas; follows the tokens, plus review
  feedback from 2026-11-13:

  - Google's branded button, white in light mode and dark in dark mode
    (GoogleButton.svelte).
  - Field borders at 3:1 contrast (`--field-border`).
  - "Forgot password?", a show-password toggle, and a next step for the
    invite ("Ask Niko for an invite").
  - Autofill: `current-password` on the password. The email field keeps
    `autocomplete="username"`, which is what Apple and the HTML spec ask for
    on the login identifier even when it is an email address: it is what
    pairs the two fields as one saved credential. `email` is the token for a
    contact-address field, and on iOS can offer the contact card's address
    instead of the saved login.
-->
<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { resolve } from '$app/paths';
	import AuthAlert from '#lib/components/auth/AuthAlert.svelte';
	import GoogleButton from '#lib/components/auth/GoogleButton.svelte';
	import { session } from '#lib/firebase/session.svelte.js';
	import { signinDraft } from '#lib/firebase/signin-draft.svelte.js';
	import { m } from '#lib/paraglide/messages.js';

	let password = $state('');
	let showPassword = $state(false);

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		await session.signInWithPassword(signinDraft.email, password);
	}
</script>

<svelte:head>
	<title>{m.signin_heading()} · Water.it</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center gap-6 px-5 py-14">
	<header class="flex flex-col items-center gap-3 text-center">
		<img src="/pwa-192x192.png" alt="" width="72" height="72" class="rounded-[18px]" />
		<h1 class="text-[34px] leading-tight font-extrabold text-ink">Water.it</h1>
		<p class="text-sm text-muted">
			{m.signin_intro()}<br />{m.signin_invite_hint()}
		</p>
	</header>

	{#if session.errorKey}
		<AuthAlert error={session.errorKey} />
	{/if}

	<GoogleButton busy={session.busy} onclick={() => session.signInWithGoogle()} />

	<div class="flex items-center gap-3 text-xs text-muted-2">
		<span class="h-px flex-1 bg-border"></span>
		{m.signin_or()}
		<span class="h-px flex-1 bg-border"></span>
	</div>

	<form class="flex flex-col gap-3" {onsubmit}>
		<label class="flex flex-col gap-1">
			<span class="text-xs font-bold text-muted">{m.signin_email_label()}</span>
			<input
				bind:value={signinDraft.email}
				type="email"
				name="email"
				autocomplete="username"
				autocapitalize="none"
				spellcheck="false"
				required
				class="min-h-12 rounded-xl border-[1.5px] border-field-border bg-field px-3 text-base text-ink"
			/>
		</label>

		<div class="flex flex-col gap-1">
			<label for="password" class="text-xs font-bold text-muted">
				{m.signin_password_label()}
			</label>
			<!-- The toggle sits inside the field's border, so the pair reads as
			     one control. -->
			<div
				class="flex min-h-12 items-center rounded-xl border-[1.5px] border-field-border bg-field focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
			>
				<input
					id="password"
					bind:value={password}
					type={showPassword ? 'text' : 'password'}
					name="password"
					autocomplete="current-password"
					autocapitalize="none"
					spellcheck="false"
					required
					class="min-h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-base text-ink outline-none"
				/>
				<button
					type="button"
					aria-label={m.signin_show_password()}
					aria-pressed={showPassword}
					aria-controls="password"
					class="flex size-11 flex-none items-center justify-center text-muted"
					onclick={() => (showPassword = !showPassword)}
				>
					{#if showPassword}
						<EyeOff size={20} strokeWidth={2} aria-hidden="true" />
					{:else}
						<Eye size={20} strokeWidth={2} aria-hidden="true" />
					{/if}
				</button>
			</div>
		</div>

		<a
			href={resolve('/signin/reset')}
			class="flex min-h-11 items-center self-end text-sm font-bold text-link"
		>
			{m.signin_forgot()}
		</a>

		<button
			type="submit"
			class="min-h-12 w-full rounded-xl bg-primary px-4 font-bold text-on-primary disabled:opacity-60"
			disabled={session.busy}
		>
			{session.busy ? m.signin_busy() : m.signin_submit()}
		</button>
	</form>
</main>
