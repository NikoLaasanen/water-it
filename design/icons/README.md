# App icons

Source art for the PWA icons. **Nothing in this folder is deployed** — it sits
outside `static/` on purpose: the full-size source would otherwise be served
and precached by the service worker alongside a ~115 KB app, for no reason.

`app-icon.png` (1024×1024) is the source every published icon is generated
from. The six generated files also land here when you run the generator; they
are gitignored, because the copies that ship live in `static/`.

## The one rule for replacing it

New art must be **square, full-bleed and at least 512×512** — no rounded
corners, no margin, background colour running right to all four edges.

iOS and Android apply their _own_ rounded mask to an app icon. Art that is
already rounded and surrounded by white renders as a rounded card inside a
visible frame, and Android's maskable crop eats into the artwork on top of
that. Let the platform do the rounding.

The current `app-icon.png` was derived from a supplied reference that had
exactly that problem — a rounded green card with a white margin. It was made
full-bleed by flood-filling the white surround inward from the image borders
with the card's own green (`#316C4D`), then flattening near-green pixels to
exactly that green to remove the card's soft drop shadow, which otherwise
survived as a faint arc. The fill started only at the borders, so the
near-white droplet, enclosed by green, was untouched.

## Regenerating

```
pnpm generate-pwa-assets
```

That runs `pwa-assets-generator` (configured in `pwa-assets.config.ts`), which
writes the sized icons next to `app-icon.png` here, then
`scripts/copy-pwa-icons.mjs` copies the six published ones into `static/`.
