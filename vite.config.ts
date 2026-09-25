import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: '/Sadam-BMA/',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
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
          scope: '/Sadam-BMA/',
          start_url: '/Sadam-BMA/',
          icons: [
            { src: '/Sadam-BMA/android-icon-36x36.png', sizes: '36x36', type: 'image/png' },
            { src: '/Sadam-BMA/android-icon-48x48.png', sizes: '48x48', type: 'image/png' },
            { src: '/Sadam-BMA/android-icon-72x72.png', sizes: '72x72', type: 'image/png' },
            { src: '/Sadam-BMA/android-icon-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: '/Sadam-BMA/android-icon-144x144.png', sizes: '144x144', type: 'image/png' },
            { src: '/Sadam-BMA/android-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/Sadam-BMA/android-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/Sadam-BMA/android-icon-192x192.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
          cleanupOutdatedCaches: true,
          navigateFallback: '/Sadam-BMA/index.html',
          navigateFallbackDenylist: [/^\/Sadam-BMA\/api/],
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