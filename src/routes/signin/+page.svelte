<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { session } from '#lib/firebase/session.svelte.js';

	let email = $state('');
	let password = $state('');

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		await session.signInWithPassword(email, password);
	}
</script>

<main class="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center gap-6 px-5 py-14">
	<header class="flex flex-col items-center gap-3 text-center">
		<img src="/pwa-192x192.png" alt="" width="72" height="72" class="rounded-[18px]" />
		<h1 class="text-[34px] leading-tight font-extrabold text-ink">Water.it</h1>
		<p class="text-sm text-muted">{m.signin_intro()}</p>
	</header>

	{#if session.errorKey}
		<!-- Icon + text, never colour alone (screens.md). -->
		<p
			role="alert"
			class="flex items-start gap-2 rounded-xl border border-border bg-surface p-3 text-sm text-ink"
		>
			<span aria-hidden="true">⚠️</span>
			<span>
				{#if session.errorKey === 'signin_error_invalid'}{m.signin_error_invalid()}
				{:else if session.errorKey === 'signin_error_too_many'}{m.signin_error_too_many()}
				{:else if session.errorKey === 'signin_error_network'}{m.signin_error_network()}
				{:else}{m.signin_error_unknown()}{/if}
			</span>
		</p>
	{/if}

	<button
		type="button"
		class="min-h-12 w-full rounded-xl bg-primary px-4 font-bold text-on-primary disabled:opacity-60"
		disabled={session.busy}
		onclick={() => session.signInWithGoogle()}
	>
		{session.busy ? m.signin_busy() : m.signin_google()}
	</button>

	<div class="flex items-center gap-3 text-xs text-muted-2">
		<span class="h-px flex-1 bg-border"></span>
		{m.signin_or()}
		<span class="h-px flex-1 bg-border"></span>
	</div>

	<form class="flex flex-col gap-3" {onsubmit}>
		<label class="flex flex-col gap-1">
			<span class="text-xs font-bold text-muted">{m.signin_email_label()}</span>
			<input
				bind:value={email}
				type="email"
				name="email"
				autocomplete="username"
				required
				class="min-h-12 rounded-xl border border-border bg-surface px-3 text-ink"
			/>
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-xs font-bold text-muted">{m.signin_password_label()}</span>
			<input
				bind:value={password}
				type="password"
				name="password"
				autocomplete="current-password"
				required
				class="min-h-12 rounded-xl border border-border bg-surface px-3 text-ink"
			/>
		</label>

		<button
			type="submit"
			class="min-h-12 w-full rounded-xl border border-border px-4 font-bold text-ink disabled:opacity-60"
			disabled={session.busy}
		>
			{session.busy ? m.signin_busy() : m.signin_submit()}
		</button>
	</form>
</main>
