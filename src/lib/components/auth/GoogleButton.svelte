<!--
  "Continue with Google", following Google's sign-in branding guidelines
  (developers.google.com/identity/branding-guidelines, checked 2026-11-13):

  - The standard four-colour "G", never recoloured or redrawn. The paths are
    Google's own, from their published button markup.
  - Their Light theme (white fill, #747775 stroke, #1F1F1F text) in light
    mode and their Dark theme (#131314 fill, #8E918F stroke, #E3E3E3 text) in
    dark mode — the `--google-*` tokens in layout.css.
  - The "G" has to sit on white, so in the dark theme it gets a white disc.
  - Padding 12 px before the logo, 10 px after it, 12 px after the text.
    Scaled up to our 48 px touch height, which the guidelines allow as long
    as the logo keeps its aspect ratio.

  One known gap: the guidelines name Google Sans Medium as the font. It isn't
  licensed for us to bundle, so this uses the app's font at medium weight.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let {
		busy = false,
		onclick
	}: {
		busy?: boolean;
		onclick: () => void;
	} = $props();
</script>

<button
	type="button"
	disabled={busy}
	{onclick}
	class="flex min-h-12 w-full items-center justify-center rounded-xl border pr-3 pl-3 text-base font-medium disabled:opacity-60"
	style:background="var(--google-bg)"
	style:border-color="var(--google-border)"
	style:color="var(--google-fg)"
>
	<span
		class="mr-2.5 flex size-7 flex-none items-center justify-center rounded-full"
		style:background="var(--google-logo-bg)"
	>
		<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
			<path
				fill="#EA4335"
				d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
			/>
			<path
				fill="#4285F4"
				d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
			/>
			<path
				fill="#FBBC05"
				d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
			/>
			<path
				fill="#34A853"
				d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
			/>
		</svg>
	</span>
	<span>{busy ? m.signin_busy() : m.signin_google()}</span>
</button>
