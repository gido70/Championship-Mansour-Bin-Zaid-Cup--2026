const CACHE_NAME = 'mansour-cup-cache-v2';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {

  const url = new URL(event.request.url);

  // منع الكاش لملف المباريات
  if (url.pathname.includes('matches.csv')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {

        const clone = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });

        return response;

      })
      .catch(() => caches.match(event.request))
  );

});
