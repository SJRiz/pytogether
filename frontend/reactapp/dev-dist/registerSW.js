if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/dev-sw.js?dev-sw', {
    scope: '/ide/',
    type: 'module',
  }).then((registration) => {
    console.log('Service Worker registered with scope:', registration.scope);
  }).catch((err) => {
    console.error('Service Worker registration failed:', err);
  });
}
