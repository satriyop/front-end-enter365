# Build Configuration

> Vite build configuration and optimization

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run type-check` | TypeScript validation |

---

## Vite Configuration

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: false,
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/enter365\.test\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 2592000 },
            },
          },
        ],
        navigateFallback: 'index.html',
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
        secure: false,
      }
    }
  }
})
```

---

## Path Aliases

| Alias | Path |
|-------|------|
| `@/` | `src/` |

### Usage

```typescript
// Instead of
import Button from '../../../components/ui/Button.vue'

// Use
import Button from '@/components/ui/Button.vue'
```

---

## Development Server

### Proxy Configuration

API requests are proxied to the Laravel backend:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'https://enter365.test',
      changeOrigin: true,
      secure: false,  // Accept self-signed SSL
    }
  }
}
```

### CORS

Since we use a proxy in development, CORS is not an issue. In production, ensure the backend allows the frontend origin.

---

## Production Build

### Output Structure

```
dist/
├── index.html              # Entry HTML
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker
├── assets/
│   ├── index-[hash].js     # Main bundle
│   ├── index-[hash].css    # Main styles
│   ├── vendor-[hash].js    # Vendor bundle
│   └── [component]-[hash].js  # Code-split chunks
├── icons/
│   └── *.png               # PWA icons
└── favicon.ico
```

### Bundle Analysis

Check bundle size:

```bash
npm run build

# Output shows:
# dist/assets/index-xxx.js    150.23 kB │ gzip: 45.67 kB
# dist/assets/vendor-xxx.js   280.45 kB │ gzip: 89.12 kB
```

---

## Code Splitting

### Route-based Splitting

Routes are automatically code-split:

```typescript
// src/router/index.ts
const routes = [
  {
    path: '/contacts',
    component: () => import('@/pages/contacts/ContactListPage.vue'),
  },
  {
    path: '/quotations',
    component: () => import('@/pages/quotations/QuotationListPage.vue'),
  },
]
```

### Manual Chunks

Configure manual chunks in vite.config.ts:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vue-vendor': ['vue', 'vue-router', 'pinia'],
        'chart': ['chart.js', 'vue-chartjs'],
        'leaflet': ['leaflet', '@vue-leaflet/vue-leaflet'],
      },
    },
  },
}
```

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Type Checking

```bash
# Check types without building
npm run type-check

# Or directly
npx vue-tsc --noEmit
```

---

## Environment Variables

### Defining Variables

```bash
# .env.production
VITE_API_URL=https://api.enter365.com
VITE_APP_NAME=Enter365
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Type Definitions

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### Usage

```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

---

## Optimization Tips

### 1. Tree Shaking

Import only what you need:

```typescript
// Good - tree-shakeable
import { format, parseISO } from 'date-fns'

// Bad - imports entire library
import * as dateFns from 'date-fns'
```

### 2. Lazy Load Heavy Components

```typescript
// Lazy load Chart components
const ChartComponent = defineAsyncComponent(() =>
  import('@/components/charts/SalesChart.vue')
)
```

### 3. Image Optimization

Use appropriate image formats:
- WebP for photos
- SVG for icons
- PNG for screenshots with text

### 4. Preload Critical Assets

```html
<!-- index.html -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

---

## Build Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| TypeScript errors | Run `npm run type-check` |
| Missing env variable | Check `.env.production` |
| Large bundle size | Check imports, add code splitting |
| Asset not found | Check `public/` folder |

### Debug Build

```bash
# Verbose build output
DEBUG=vite:* npm run build
```

---

## Related Documentation

- [README.md](README.md) - Deployment overview
- [CI-CD.md](CI-CD.md) - Automated builds
- [../getting-started/ENVIRONMENTS.md](../getting-started/ENVIRONMENTS.md) - Environment setup
