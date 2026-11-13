<!-- "Reset to preset", under an edited care field. -->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { onclick }: { onclick: () => void } = $props();
</script>

<button
	type="button"
	class="flex min-h-11 items-center self-start text-sm font-bold text-link"
	{onclick}
>
	{m.form_reset_preset()}
</button>
