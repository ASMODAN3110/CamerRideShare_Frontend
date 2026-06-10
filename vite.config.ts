import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En Docker, localhost = le conteneur lui-même ; l'API host est joignable via host.docker.internal.
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    // React Compiler désactivé : provoquait "Invalid hook call" / useMemoCache null
    // avec certaines pages (ex. DashboardPage) en dev Docker.
    react(),
  ],
  resolve: {
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
    },
  },
})
