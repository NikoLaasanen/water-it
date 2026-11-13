<!--
  The sign-in error, shared by the sign-in and password-reset pages.
  Icon + text, never colour alone (screens.md).
-->
<script lang="ts">
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import type { AuthErrorKey } from '#lib/firebase/session.svelte.js';
	import { m } from '#lib/paraglide/messages.js';

	let { error }: { error: AuthErrorKey } = $props();

	const MESSAGES: Record<AuthErrorKey, () => string> = {
		signin_error_invalid: m.signin_error_invalid,
		signin_error_email: m.signin_error_email,
		signin_error_too_many: m.signin_error_too_many,
		signin_error_network: m.signin_error_network,
		signin_error_unknown: m.signin_error_unknown
	};
</script>

<p
	role="alert"
	class="flex items-start gap-2 rounded-xl border border-border bg-surface p-3 text-sm text-ink"
>
	<span class="mt-px flex-none" style:color="var(--danger)">
		<TriangleAlert size={18} strokeWidth={2.2} aria-hidden="true" />
	</span>
	<span>{MESSAGES[error]()}</span>
</p>
