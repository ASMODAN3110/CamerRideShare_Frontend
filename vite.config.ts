import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// En Docker, localhost = le conteneur lui-même ; l'API host est joignable via host.docker.internal.
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    // React Compiler désactivé : provoquait "Invalid hook call" / useMemoCache null
    // avec certaines pages (ex. DashboardPage) en dev Docker.
    react(),
    // PWA : application installable (mobile et ordinateur) et mise à jour automatique.
    // Le service worker ne met en cache que l'application elle-même (HTML, JS, CSS, polices, icônes) : jamais les appels à l'API,
    // qui contiennent les données financières et le jeton de connexion. Désactivé en développement (voir main.tsx).
    VitePWA({
      // « prompt » : la nouvelle version attend en coulisses ; src/lib/pwa.ts l'active au bon moment (voir applyWhenSafe)
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon-48.png', 'favicon-256.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'CamerRideShare',
        short_name: 'CamerRideShare',
        description: "Plateforme d'investissement participatif pour motos-taxis au Cameroun.",
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        theme_color: '#148664',
        background_color: '#f4f5f7',
        categories: ['finance', 'business'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: '/screenshot-wide.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide', label: 'Connexion à CamerRideShare' },
          { src: '/screenshot-narrow.png', sizes: '540x960', type: 'image/png', form_factor: 'narrow', label: 'Connexion à CamerRideShare' },
        ],
      },
      workbox: {
        // l'ancienne version est retirée dès que la nouvelle est active : pas d'accumulation de caches
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // toute navigation (rafraîchir /driver-payments, ouvrir un lien…) retombe sur l'application ; pas les fichiers ni l'API
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/uploads\//, /^\/api\//, /^\/(auth|admin|driver|investor|users|transactions|payments|incidents|invitations|motos|notifications|payouts|share-requests)\//],
        runtimeCaching: [
          // polices Google : feuille de styles rafraîchie en tâche de fond, fichiers de police gardés un an
          { urlPattern: /^https:\/\/fonts\.googleapis\.com\//, handler: 'StaleWhileRevalidate', options: { cacheName: 'google-fonts-css' } },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-files', expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } },
          },
          // photos des véhicules : jamais les preuves de paiement (documents personnels), qui ne sont donc pas gardées sur l'appareil
          {
            urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) => sameOrigin && url.pathname.startsWith('/uploads/') && !url.pathname.startsWith('/uploads/proofs/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'uploads', expiration: { maxEntries: 80, maxAgeSeconds: 7 * 24 * 3600 } },
          },
          // avatars et images de démonstration externes
          {
            urlPattern: /^https:\/\/(i\.pravatar\.cc|picsum\.photos|fastly\.picsum\.photos)\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'external-images', expiration: { maxEntries: 60, maxAgeSeconds: 7 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
    // Une seule instance de React dans le bundle (évite Invalid hook call)
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: { usePolling: true, interval: 100 },
    headers: {
      'Cache-Control': 'no-store',
    },
    // Accès via docker compose (8081:5173) : le HMR WebSocket doit utiliser 8081
    hmr: {
      clientPort: 8081,
    },
    proxy: {
      '/auth': { target: API_PROXY_TARGET, changeOrigin: true },
      '/users': { target: API_PROXY_TARGET, changeOrigin: true },
      '/admin': { target: API_PROXY_TARGET, changeOrigin: true },
      '/transactions': { target: API_PROXY_TARGET, changeOrigin: true },
      '/payments': { target: API_PROXY_TARGET, changeOrigin: true },
      '/incidents': { target: API_PROXY_TARGET, changeOrigin: true },
      '/invitations': { target: API_PROXY_TARGET, changeOrigin: true },
      '/motos': { target: API_PROXY_TARGET, changeOrigin: true },
      '/driver/': { target: API_PROXY_TARGET, changeOrigin: true },
      // `/investor/` avec le `/` final : les pages du portail s'appellent /investor-market, /investor-fleet…
      '/investor/': { target: API_PROXY_TARGET, changeOrigin: true },
      '/notifications': { target: API_PROXY_TARGET, changeOrigin: true },
      '/payouts': { target: API_PROXY_TARGET, changeOrigin: true },
      '/share-requests': { target: API_PROXY_TARGET, changeOrigin: true },
      '/uploads': { target: API_PROXY_TARGET, changeOrigin: true },
    },
  },
})
