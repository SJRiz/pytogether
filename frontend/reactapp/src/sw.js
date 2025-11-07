/* eslint-disable */
import { serviceWorkerFetchListener } from 'sync-message';
import { clientsClaim, skipWaiting } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

clientsClaim();
skipWaiting();

// precache Vite assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept Pyodide/CDN requests and IDE pages
  if (
    url.pathname.startsWith('/ide/') || // IDE
    url.origin.startsWith('https://cdn.jsdelivr.net') // Pyodide CDN
  ) {
    event.respondWith(serviceWorkerFetchListener()(event));
  }
});

// Runtime caching for Pyodide/CDN and IDE assets
registerRoute(
  ({url}) => {
    return (
      url.pathname.startsWith('/ide/') ||
      url.origin.startsWith('https://cdn.jsdelivr.net')
    );
  },
  new StaleWhileRevalidate({
    cacheName: 'pyodide-ide',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);
