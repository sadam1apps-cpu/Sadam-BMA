import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

// Auto version: uses build date + short git-ish timestamp
const BUILD_VERSION = new Date().toISOString().slice(0, 16).replace('T', ' ');

export default defineConfig(() => {
  return {
    base: '/',
    define: {
      __APP_VERSION__: JSON.stringify(BUILD_VERSION),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null,
        includeAssets: [
          'favicon.ico',
          'apple-icon-180x180.png',
          'android-icon-192x192.png',
        ],
        manifest: {
          name: 'STech GLOBAL LDA',
          short_name: 'STech',
          description: 'Business Management App - sales, expenses, inventory, customers, suppliers, employees, and reports.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            { src: '/android-icon-36x36.png', sizes: '36x36', type: 'image/png' },
            { src: '/android-icon-48x48.png', sizes: '48x48', type: 'image/png' },
            { src: '/android-icon-72x72.png', sizes: '72x72', type: 'image/png' },
            { src: '/android-icon-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: '/android-icon-144x144.png', sizes: '144x144', type: 'image/png' },
            { src: '/android-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/android-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/android-icon-192x192.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              urlPattern: ({url}) => url.hostname.includes('script.google.com'),
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});