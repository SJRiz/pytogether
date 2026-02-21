/* eslint-disable */
import { serviceWorkerFetchListener } from 'sync-message';
import { clientsClaim, skipWaiting } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';

addEventListener('fetch', serviceWorkerFetchListener());

clientsClaim();
skipWaiting();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ url }) => 
    url.pathname.includes('/auth/') ||
    url.pathname.startsWith('/socket.io/') ||
    url.pathname.startsWith('/ws/'),
  new NetworkOnly()
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/groups/') || url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'live-api-data',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  ({url}) => {
    const urlString = url.toString();
    return (
      urlString.startsWith('https://cdn.jsdelivr.net/') ||
      url.pathname.startsWith('/ide/') ||
      url.pathname.startsWith('/playground/') ||
      url.pathname.startsWith('/snippet/') ||
      (url.hostname.includes('pytogether.org') && !url.pathname.startsWith('/api/')) || 
      url.hostname.includes('localhost') ||
      url.hostname.includes('127.0.0.1') ||
      url.hostnaame.includes(import.meta.env.VITE_DOMAIN)
    );
  },
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({maxEntries: 50}),
      new CacheableResponsePlugin({statuses: [0, 200]}),
    ],
  }),
);