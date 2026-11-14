<!--
  Today's header scene (screens.md "Today header scene"): a sky band with the
  sun (or, in the evening, the moon and stars), three rounded cacti and a
  potted plant on a soft ground line that melts into the page. Decorative
  only: aria-hidden, no pointer events.

  Drawn in layers so it fits any width without stretching the shapes: the sky
  is the container's background and the ground is a full-width path, while
  the sun, cacti and plant keep their designed size — anchored right on
  phones (Main), and placed as in the tablet board from `md` (TabletToday).

  Colours are tokens on `data-scene` (layout.css), so light/dark and
  day/evening are CSS only.
-->
<script lang="ts">
	let { evening }: { evening: boolean } = $props();

	// The evening boards' stars, tiled across the tablet's width.
	const STARS: [number, number, number, number][] = [
		[34, 30, 1.4, 0.8],
		[88, 64, 1, 0.6],
		[150, 26, 1.6, 0.9],
		[196, 80, 1, 0.5],
		[232, 40, 1.3, 0.8],
		[262, 112, 1, 0.5],
		[360, 36, 1.2, 0.7],
		[372, 128, 1, 0.5],
		[120, 112, 1.1, 0.45],
		[20, 120, 1, 0.4]
	];
	const TABLET_STARS = [0, 390, 780].flatMap((dx) =>
		STARS.map(([x, y, r, o]) => [x + dx, y, r, o] as const).filter(
			// Keep the moon's corner of the sky clear.
			([x, y]) => !(x > 540 && x < 650 && y < 130)
		)
	);
</script>

{#snippet cactus(
	x: number,
	y: number,
	w: number,
	h: number,
	kind: 'a' | 'b' | 'c',
	marks?: [number, number]
)}
	<rect
		{x}
		{y}
		width={w}
		height={h}
		rx={w / 2}
		fill="var(--sc-{kind})"
		stroke="var(--sc-{kind}-line)"
		stroke-width="2"
	/>
	{#if marks}
		<rect x={marks[0]} y={marks[1]} width="4" height="10" rx="2" fill="var(--sc-{kind}-mark)" />
		<rect
			x={marks[0] + 10}
			y={marks[1]}
			width="4"
			height="10"
			rx="2"
			fill="var(--sc-{kind}-mark)"
		/>
	{/if}
{/snippet}

{#snippet plant(x: number, y: number)}
	<g transform="translate({x} {y}) scale(0.95)">
		<path
			d="M0 14 C0 6 0 0 0 -8"
			stroke="var(--sc-stem)"
			stroke-width="2.4"
			stroke-linecap="round"
			fill="none"
		/>
		<path d="M0 4 C-8 4 -14 -1 -15 -9 C-6 -10 -1 -5 0 4 Z" fill="var(--sc-leaf-1)" />
		<path d="M0 -1 C8 -1 14 -7 15 -15 C6 -16 1 -10 0 -1 Z" fill="var(--sc-leaf-2)" />
		<path d="M0 10 C6 10 11 7 12 1 C5 0 1 4 0 10 Z" fill="var(--sc-leaf-3)" />
		<path d="M-13 14 H13 L10 31 a3 3 0 0 1 -3 2.4 H-7 a3 3 0 0 1 -3 -2.4 Z" fill="var(--sc-pot)" />
		<rect x="-15" y="12" width="30" height="5.5" rx="2.5" fill="var(--sc-rim)" />
	</g>
{/snippet}

{#snippet sprout(x: number, y: number)}
	<g transform="translate({x} {y})" fill="var(--sc-sprout)">
		<path d="M0 0 V-9" stroke="var(--sc-sprout)" stroke-width="2" stroke-linecap="round" />
		<path d="M0 -6 C-5 -6 -8 -9 -8 -13 C-3 -13 0 -10 0 -6 Z" />
		<path d="M0 -8 C5 -8 8 -11 8 -15 C3 -15 0 -12 0 -8 Z" />
	</g>
{/snippet}

{#snippet sky(cx: number, cy: number)}
	{#if evening}
		<circle cx={cx + 12} cy={cy - 12} r="26" fill="var(--sc-sun)" />
		<circle cx={cx + 24} cy={cy - 20} r="23" fill="var(--sc-sky)" />
	{:else}
		<circle
			{cx}
			{cy}
			r="58"
			fill="var(--sc-halo-fill)"
			stroke="var(--sc-halo-line)"
			stroke-width="10"
		/>
		<circle {cx} {cy} r="40" fill="var(--sc-sun)" />
	{/if}
{/snippet}

<!-- Never narrower than the board, so the plant and sprouts stay on the
     ground line; wider screens stretch it a little, which a gentle curve hides. -->
{#snippet ground(d: string, w: number, h: number, anchor: 'left' | 'right')}
	<svg
		class={['absolute top-0 h-full', anchor === 'left' ? 'left-0' : 'right-0']}
		style:width="max(100%, {w}px)"
		viewBox="0 0 {w} {h}"
		preserveAspectRatio="none"
		aria-hidden="true"
	>
		<path d="{d} V{h} H0 Z" fill="var(--sc-ground)" />
		<path
			{d}
			fill="none"
			stroke="var(--sc-ground-line)"
			stroke-width="2"
			vector-effect="non-scaling-stroke"
		/>
	</svg>
{/snippet}

<div
	class="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden"
	data-scene={evening ? 'evening' : 'day'}
	aria-hidden="true"
>
	<!-- Phone (Main): 270 px, the cluster anchored to the right edge. -->
	<div class="relative h-[270px] md:hidden" style:background="var(--sc-sky)">
		<svg class="absolute top-0 right-0" width="390" height="270" viewBox="0 0 390 270">
			{#if evening}
				{#each STARS as [x, y, r, o] (`${x},${y}`)}
					<circle cx={x} cy={y} {r} fill="var(--sc-star)" opacity={o} />
				{/each}
			{:else}
				<g fill="var(--sc-cloud)" style:opacity="var(--sc-cloud-phone)">
					<rect x="150" y="54" width="70" height="18" rx="9" />
					<circle cx="172" cy="54" r="12" />
					<circle cx="194" cy="50" r="15" />
					<rect x="20" y="128" width="56" height="14" rx="7" />
					<circle cx="38" cy="128" r="9" />
					<circle cx="55" cy="125" r="11" />
				</g>
			{/if}
			{@render sky(300, 92)}
			{@render cactus(236, 120, 74, 220, 'a', [274.88, 153.3])}
			{@render cactus(330, 96, 82, 240, 'b', [373.84, 132.9])}
			{@render cactus(290, 150, 64, 200, 'c')}
		</svg>
		{@render ground('M0 236 C70 214 150 216 220 226 S330 214 390 200', 390, 270, 'right')}
		<svg class="absolute top-0 right-0" width="390" height="270" viewBox="0 0 390 270">
			{@render plant(322, 176)}
			{#if !evening}
				{@render sprout(250, 224)}
				{@render sprout(372, 203)}
			{/if}
		</svg>
	</div>

	<!-- iPad (TabletToday): 250 px, laid out as on the 1084 px board from the
	     content's left edge; the sky and ground carry on past it. -->
	<div class="relative hidden h-[250px] md:block" style:background="var(--sc-sky)">
		<svg class="absolute top-0 left-0" width="1084" height="250" viewBox="0 0 1084 250">
			{#if evening}
				{#each TABLET_STARS as [x, y, r, o] (`${x},${y}`)}
					<circle cx={x} cy={y} {r} fill="var(--sc-star)" opacity={o} />
				{/each}
			{:else}
				<g fill="var(--sc-cloud)" style:opacity="var(--sc-cloud-tablet)">
					<rect x="860" y="58" width="96" height="22" rx="11" />
					<circle cx="890" cy="58" r="15" />
					<circle cx="920" cy="54" r="19" />
				</g>
			{/if}
			{@render sky(580, 88)}
			{@render cactus(516, 116, 74, 220, 'a', [554.88, 149.3])}
			{@render cactus(610, 92, 82, 240, 'b', [653.84, 128.9])}
			{@render cactus(570, 146, 64, 200, 'c')}
			{@render cactus(430, 150, 70, 200, 'b')}
		</svg>
		{@render ground('M0 210 C180 190 360 194 540 204 S840 190 1084 198', 1084, 250, 'left')}
		<svg class="absolute top-0 left-0" width="1084" height="250" viewBox="0 0 1084 250">
			{@render plant(606, 172)}
			{#if !evening}
				{@render sprout(470, 199)}
				{@render sprout(700, 196)}
				{@render sprout(1010, 196)}
			{/if}
		</svg>
	</div>
</div>
