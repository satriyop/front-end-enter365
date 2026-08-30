import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Bundle analyzer available via: npm i -D rollup-plugin-visualizer
// Then run: ANALYZE=true npm run build
// Or add to plugins manually when analyzing

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: false, // Use our custom manifest.json in public/
      workbox: {
        cleanupOutdatedCaches: true,
        // Hashed JS/CSS are precached. Do not SWR them — a waiting SW plus
        // a cached index.html is how kasir/akuntan/gudang kept running old click handlers.
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
        navigateFallbackDenylist: [/^\/api/],
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: false, // Disable PWA in development
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://enter365.test',
        changeOrigin: true,
        secure: false, // Accept self-signed SSL from Valet
      },
      '/pos': {
        target: 'https://enter365.test',
        changeOrigin: true,
        secure: false,
      },
    }
  },

  build: {
    // Target modern browsers
    target: 'es2020',

    // Chunk size warnings at 500KB
    chunkSizeWarningLimit: 500,

    // Rollup options for bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Core Vue chunks - loaded immediately
          'vue-core': ['vue', 'vue-router', 'pinia'],

          // Data layer - TanStack Query and validation
          'data-layer': ['@tanstack/vue-query', 'zod'],

          // UI primitives - Radix and styling utilities
          'ui-primitives': ['radix-vue', 'class-variance-authority', 'clsx', 'tailwind-merge'],

          // Icons - tree-shaking doesn't work well, separate chunk
          'icons': ['lucide-vue-next'],

          // Charts - heavy, lazy loaded on demand
          'charts': ['chart.js', 'vue-chartjs'],
        },
      },
    },
  },

  // Dependency pre-bundling optimization
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@tanstack/vue-query',
      'radix-vue',
      'zod',
      'clsx',
      'tailwind-merge',
    ],
    exclude: [
      // Heavy libraries that should be lazy loaded
      'chart.js',
      'xlsx',
      'jspdf',
      'jspdf-autotable',
    ],
  },
})
