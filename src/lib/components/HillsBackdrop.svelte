<!--
  The rolling hills at the bottom of every signed-in screen except Today,
  which has its header scene instead (screens.md "Backdrops"; Plants and
  TabletPlants boards). Decorative: aria-hidden, no pointer events.

  `fixed` (the default) pins it to the bottom of the viewport behind the
  page: z-index -1 paints it above the body's background and below
  everything in the page. Plant detail can't use that — its content sheet has
  an opaque background, so it places the hills inside the sheet instead
  (`placement="inside"`, absolute at the sheet's bottom).

  One drawing per layout, scaled to cover the width (`slice`) and anchored to
  the bottom, so the ground always reaches the screen edges.
-->
<script lang="ts">
	let {
		placement = 'fixed',
		rail = false
	}: {
		placement?: 'fixed' | 'inside';
		/** Start right of the 96 px side rail from `md`, so the drawing centres on the content. */
		rail?: boolean;
	} = $props();
</script>

{#snippet sprout(x: number, y: number)}
	<g transform="translate({x} {y})" fill="var(--hl-sprout)">
		<path d="M0 0 V-9" stroke="var(--hl-sprout)" stroke-width="2" stroke-linecap="round" />
		<path d="M0 -6 C-5 -6 -8 -9 -8 -13 C-3 -13 0 -10 0 -6 Z" />
		<path d="M0 -8 C5 -8 8 -11 8 -15 C3 -15 0 -12 0 -8 Z" />
	</g>
{/snippet}

{#snippet hill(
	x: number,
	y: number,
	w: number,
	h: number,
	layer: 'back' | 'front',
	marks?: [number, number]
)}
	<rect
		{x}
		{y}
		width={w}
		height={h}
		rx={w / 2}
		fill="var(--hl-{layer})"
		stroke="var(--hl-{layer}-line)"
		stroke-width="2"
	/>
	{#if marks}
		<rect x={marks[0]} y={marks[1]} width="4" height="10" rx="2" fill="var(--hl-{layer}-mark)" />
		<rect
			x={marks[0] + 10}
			y={marks[1]}
			width="4"
			height="10"
			rx="2"
			fill="var(--hl-{layer}-mark)"
		/>
	{/if}
{/snippet}

{#snippet groundLine(d: string, h: number)}
	<path d="{d} V{h} H0 Z" fill="var(--hl-ground)" />
	<path {d} fill="none" stroke="var(--hl-ground-line)" stroke-width="2" />
{/snippet}

<div
	class={[
		'pointer-events-none bottom-0 -z-10',
		placement === 'fixed' ? 'vt-hills fixed inset-x-0' : 'absolute inset-x-0',
		rail && 'md:left-24'
	]}
	data-hills
	aria-hidden="true"
>
	<!-- Phone (Plants): 390 × 430. -->
	<svg
		class="block h-[430px] w-full md:hidden"
		viewBox="0 0 390 430"
		preserveAspectRatio="xMidYMax slice"
	>
		{@render hill(-30, 110, 150, 420, 'back', [56, 177.5])}
		{@render hill(228, 40, 128, 470, 'back', [300.36, 97.6])}
		{@render hill(330, 160, 110, 360, 'back')}
		{@render hill(92, 190, 160, 330, 'front', [184.2, 262])}
		{@render hill(-50, 250, 120, 260, 'front')}
		{@render groundLine('M0 318 C60 296 120 296 190 314 S320 340 390 304', 430)}
		{@render sprout(40, 314)}
		{@render sprout(150, 304)}
		{@render sprout(300, 326)}
		{@render sprout(362, 310)}
	</svg>

	<!-- iPad (TabletPlants): 1084 × 340. -->
	<svg
		class="hidden h-[340px] w-full md:block"
		viewBox="0 0 1084 340"
		preserveAspectRatio="xMidYMax slice"
	>
		{@render hill(-30, 90, 150, 360, 'back', [56, 157.5])}
		{@render hill(250, 40, 130, 400, 'back', [323.6, 98.5])}
		{@render hill(560, 110, 120, 330, 'back')}
		{@render hill(820, 20, 140, 420, 'back', [899.8, 83])}
		{@render hill(990, 130, 120, 300, 'back')}
		{@render hill(100, 170, 160, 260, 'front', [192.2, 242])}
		{@render hill(420, 180, 150, 250, 'front', [506, 247.5])}
		{@render hill(700, 160, 140, 270, 'front')}
		{@render hill(930, 200, 130, 230, 'front', [1003.6, 258.5])}
		{@render groundLine(
			'M0 262 C90 240 180 240 270 256 S450 282 560 258 S760 232 860 252 S1010 276 1084 248',
			340
		)}
		{@render sprout(60, 256)}
		{@render sprout(210, 248)}
		{@render sprout(390, 270)}
		{@render sprout(620, 252)}
		{@render sprout(790, 242)}
		{@render sprout(1000, 262)}
	</svg>
</div>
