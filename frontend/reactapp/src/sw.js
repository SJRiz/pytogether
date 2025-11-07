/* eslint-disable */
import { serviceWorkerFetchListener } from 'sync-message';
import { clientsClaim, skipWaiting } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// 1. Add the sync-message listener
// This is the most important part
addEventListener('fetch', serviceWorkerFetchListener());

clientsClaim();
skipWaiting();

// 2. Add Workbox Precaching
// The 'self.__WB_MANIFEST' will be injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 3. Add your runtime caching (e.g., for Pyodide CDN)
// This is the same logic from your original file
registerRoute(
  ({url}) => {
    const urlString = url.toString();
    return (
      urlString.startsWith('https://cdn.jsdelivr.net/') || // Pyodide
      url.hostname.endsWith('pytogether.org') ||
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