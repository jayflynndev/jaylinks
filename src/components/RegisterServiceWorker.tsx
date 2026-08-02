"use client";

import { useEffect } from "react";

/**
 * Registers the shell-caching service worker (public/sw.js) — see that
 * file's doc comment for exactly what it does and doesn't cache. Renders
 * nothing; mounted once in the root layout. Guarded on the API existing
 * (older browsers, or contexts like a sandboxed iframe) so it never throws.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability/offline-shell caching is a progressive enhancement
      // — the site works fine without it, so a failed registration is
      // silently ignored rather than surfaced to the player.
    });
  }, []);

  return null;
}
