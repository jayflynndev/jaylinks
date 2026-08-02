// Jay's Links service worker: caches the app *shell* only (Next's hashed
// static build assets + the generated icons) — never HTML documents, and
// never /api/, /play, or /account. Puzzle content is deliberately never
// shipped in the client bundle (see CLAUDE.md) and must always be fetched
// fresh, so this worker is careful to stay out of the way of anything
// that could go stale and show a player an outdated puzzle or auth state.
// Bump CACHE_NAME on any change here to invalidate old caches on the next
// visit — the activate handler below cleans up anything with a different name.
const CACHE_NAME = "jayslinks-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/** True only for same-origin, safe-to-cache-forever static assets — Next's build output is content-hashed, so a new deploy is a new URL, never stale content under an old one. */
function isCacheableAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon-192") || url.pathname.startsWith("/icon-512");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.mode === "navigate") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !isCacheableAsset(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return response;
      });
    })
  );
});
