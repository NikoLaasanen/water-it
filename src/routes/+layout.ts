// SPA mode: no SSR anywhere. Every route is rendered in the browser and served
// from the `200.html` fallback (design.md §7.1 — static hosting, no app server
// of our own). Firestore and Firebase Auth are browser-only here, so there is
// nothing to render on a server.
export const ssr = false;
