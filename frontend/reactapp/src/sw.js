/* eslint-disable */
import { serviceWorkerFetchListener } from 'sync-message';
import { clientsClaim, skipWaiting } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

addEventListener('fetch', serviceWorkerFetchListener());

clientsClaim();
skipWaiting();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({url}) => {
    const urlString = url.toString();
    return (
      urlString.startsWith('https://cdn.jsdelivr.net/') || // Pyodide
      url.pathname.startsWith('/ide/') ||
      url.hostname.includes('localhost') ||
      url.hostname.includes('127.0.0.1')
    );
  },
  new StaleWhileRevalidate({
    cacheName: 'everything',
    plugins: [
      new ExpirationPlugin({maxEntries: 30}),
      new CacheableResponsePlugin({statuses: [0, 200]}),
    ],
  }),
);