# shadcn-svelte components

Copied in by the shadcn-svelte CLI (1.8.1, manual install — `init` was not
used, because it overwrites `layout.css`). We own this code; edit it freely.

**After every `pnpm dlx shadcn-svelte@1.8.1 add <name>`, apply the same two
local changes to the new files:**

1. Replace `bg-muted` with `bg-secondary`. shadcn's `muted` is a background;
   ours is a text colour, so upstream's class would paint surfaces dark grey.
2. Delete every `dark:` class. Our tokens already switch with the phone's
   theme, and those classes were tuned for shadcn's own palette.

```sh
find src/lib/components/ui -name "*.svelte" -exec sed -i -E 's/ ?dark:[^ "]+//g; s/\bbg-muted\b/bg-secondary/g' {} +
```

shadcn's colour names (`background`, `primary-foreground`, `input`, `ring`, …)
are mapped onto the app's tokens in `src/routes/layout.css`. App code outside
this folder uses the app's own token names, never shadcn's.
