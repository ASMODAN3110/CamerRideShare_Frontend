/* Self-destruct worker: clears stale Vite dev caches (incl. React Compiler bundles)
   then unregisters. Production builds should register a different worker later. */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      await Promise.all(clients.map((client) => client.navigate(client.url)))
      await self.registration.unregister()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
