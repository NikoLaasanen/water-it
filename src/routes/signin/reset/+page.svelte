<!--
  "Forgot password?" — sends Firebase's password-reset email.

  The link in the email opens Firebase's own reset page (in Safari on an
  iPhone). Once the password is changed there, it works in the installed app
  too: the account is the same, only the browser storage differs.
-->
<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import MailCheck from '@lucide/svelte/icons/mail-check';
	import { resolve } from '$app/paths';
	import AuthAlert from '#lib/components/auth/AuthAlert.svelte';
	import { session } from '#lib/firebase/session.svelte.js';
	import { signinDraft } from '#lib/firebase/signin-draft.svelte.js';
	import { m } from '#lib/paraglide/messages.js';

	/** The address the link went to, once sent. */
	let sentTo = $state<string | null>(null);

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		const email = signinDraft.email.trim();
		if (await session.sendPasswordReset(email)) sentTo = email;
	}
</script>

<svelte:head>
	<title>{m.reset_heading()} · Water.it</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center gap-6 px-5 py-14">
	<a
		href={resolve('/signin')}
		class="flex min-h-11 items-center gap-1 self-start text-sm font-bold text-link"
		onclick={() => (session.errorKey = null)}
	>
		<ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
		{m.reset_back()}
	</a>

	<header class="flex flex-col gap-2">
		<h1 class="text-[30px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
			{m.reset_heading()}
		</h1>
		{#if !sentTo}
			<p class="text-sm leading-[1.45] text-muted">{m.reset_intro()}</p>
		{/if}
	</header>

	{#if sentTo}
		<div role="status" class="flex flex-col gap-3 rounded-[18px] bg-surface p-4">
			<p class="flex items-start gap-2 text-sm leading-[1.45] text-ink">
				<span class="mt-px flex-none text-primary">
					<MailCheck size={20} strokeWidth={2} aria-hidden="true" />
				</span>
				<span>{m.reset_sent({ email: sentTo })}</span>
			</p>
			<p class="text-sm leading-[1.45] text-muted">{m.reset_google_note()}</p>
		</div>
		<a
			href={resolve('/signin')}
			class="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 font-bold text-on-primary"
		>
			{m.reset_back()}
		</a>
	{:else}
		{#if session.errorKey}
			<AuthAlert error={session.errorKey} />
		{/if}

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

			<button
				type="submit"
				class="min-h-12 w-full rounded-xl bg-primary px-4 font-bold text-on-primary disabled:opacity-60"
				disabled={session.busy}
			>
				{session.busy ? m.reset_busy() : m.reset_submit()}
			</button>
		</form>
	{/if}
</main>
