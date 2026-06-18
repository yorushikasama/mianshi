const CACHE_NAME = "mianshi-shell-v1";
const APP_SHELL = ["/", "/offline.html", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (shouldCacheRequest(event.request, response)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || caches.match("/offline.html");
      }),
  );
});

function shouldCacheRequest(request, response) {
  const { origin, pathname } = new URL(request.url);

  if (!response.ok || origin !== self.location.origin) {
    return false;
  }

  if (pathname.startsWith("/api/") || request.headers.has("authorization")) {
    return false;
  }

  return APP_SHELL.includes(pathname) || pathname.startsWith("/_next/static/") || pathname.startsWith("/assets/");
}
