/**
 * Shared classes for form controls, so every field looks the same
 * (docs/mockups/add-plant.dc.html): 48 px tall, 1.5 px `field-border` (3:1),
 * 16 px text — under 16 px iOS zooms the page on focus.
 */
export const fieldInput =
	'min-h-12 w-full rounded-xl border-[1.5px] border-field-border bg-field px-3.5 text-base text-ink placeholder:text-placeholder aria-[invalid=true]:border-[var(--danger-border)]';

export const fieldTextarea = `${fieldInput} min-h-24 py-3 leading-[1.4]`;

/** A white form card, as in the mockups. */
export const formCard =
	'flex flex-col gap-4 rounded-[18px] border border-card-edge bg-surface p-4 shadow-[0_1px_2px_rgba(20,40,30,0.06)]';

export const sectionHeading = 'text-[13px] font-bold tracking-[0.08em] text-muted-2 uppercase';
