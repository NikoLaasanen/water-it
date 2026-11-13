<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui';
	import { cn, type WithoutChildrenOrChild } from '#lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		size = 'default',
		...restProps
	}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
		/** `lg` (local addition): the 52 × 32 switch from the Add/Edit mockups. */
		size?: 'sm' | 'default' | 'lg';
	} = $props();
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	data-size={size}
	class={cn(
		'peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50 data-unchecked:bg-input data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=lg]:h-8 data-[size=lg]:w-[52px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px]',
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class={cn(
			'pointer-events-none block rounded-full bg-[var(--switch-knob)] shadow-[0_1px_2px_rgba(0,0,0,0.25)] ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=lg]/switch:size-[26px] group-data-[size=sm]/switch:size-3 data-checked:bg-[var(--switch-knob-on)] group-data-[size=default]/switch:data-checked:translate-x-[calc(100%_-_2px)] group-data-[size=lg]/switch:data-checked:translate-x-[22px] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%_-_2px)] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=lg]/switch:data-unchecked:translate-x-[2px] group-data-[size=sm]/switch:data-unchecked:translate-x-0',
			'rtl:data-[state=checked]:translate-x-[calc(-100%)]'
		)}
	/>
</SwitchPrimitive.Root>
