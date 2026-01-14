# Deployment

> Build, deployment, and CI/CD for Enter365 Vue SPA

## Quick Reference

| Environment | URL | Build Command |
|-------------|-----|---------------|
| Development | `http://localhost:3000` | `npm run dev` |
| Production | TBD | `npm run build` |

---

## Overview

```
                         ┌─────────────────────────────────────┐
                         │           CI/CD Pipeline             │
                         └─────────────┬───────────────────────┘
                                       │
                                       ▼
┌─────────────┐   Push    ┌─────────────────────────────────────┐
│  Developer  │ ────────▶ │         GitHub Actions               │
│   (local)   │           │                                       │
└─────────────┘           │  1. Install dependencies              │
                          │  2. Type check                        │
                          │  3. Lint                              │
                          │  4. Test                              │
                          │  5. Build                             │
                          │  6. Deploy                            │
                          │                                       │
                          └─────────────┬─────────────────────────┘
                                        │
                                        ▼
                          ┌─────────────────────────────────────┐
                          │         Static Hosting               │
                          │  (Vercel / Netlify / Nginx)         │
                          └─────────────────────────────────────┘
```

---

## Build Process

### Development

```bash
# Start dev server with hot reload
npm run dev

# Server runs at http://localhost:3000
# API proxied to https://enter365.test/api
```

### Production Build

```bash
# Type check + build
npm run build

# Output: dist/
# - index.html
# - assets/
#   - index-[hash].js
#   - index-[hash].css
#   - vendor-[hash].js
```

### Preview Production Build

```bash
# Build and preview
npm run build
npm run preview

# Preview server at http://localhost:4173
```

---

## Environment Configuration

### Development (.env.development)

```bash
VITE_API_URL=https://enter365.test/api
VITE_APP_NAME=Enter365
VITE_DEBUG=true
```

### Production (.env.production)

```bash
VITE_API_URL=https://api.enter365.com
VITE_APP_NAME=Enter365
VITE_DEBUG=false
```

### Using Environment Variables

```typescript
// In code
const apiUrl = import.meta.env.VITE_API_URL
const appName = import.meta.env.VITE_APP_NAME
const isDebug = import.meta.env.VITE_DEBUG === 'true'
```

---

## Deployment Options

### Option 1: Static File Hosting

Build and upload `dist/` to any static hosting:

| Provider | Notes |
|----------|-------|
| Vercel | Zero-config for Vite apps |
| Netlify | Auto-deploys from Git |
| Cloudflare Pages | Global CDN |
| AWS S3 + CloudFront | Scalable, cost-effective |
| Nginx | Self-hosted |

### Option 2: Nginx Configuration

```nginx
server {
    listen 80;
    server_name app.enter365.com;
    root /var/www/enter365-frontend/dist;

    # SPA fallback - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass https://api.enter365.com;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### Option 3: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf for Docker
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## PWA Support

The app includes PWA configuration via `vite-plugin-pwa`:

### Features

| Feature | Status |
|---------|--------|
| Service Worker | Auto-generated |
| Offline Support | Configured |
| App Manifest | Custom in `public/` |
| Auto Update | Enabled |

### Cache Strategies

| Resource | Strategy | Max Age |
|----------|----------|---------|
| API responses | Network First | 24 hours |
| Images | Cache First | 30 days |
| Fonts | Cache First | 1 year |
| JS/CSS | Stale While Revalidate | 7 days |

---

## Pre-deployment Checklist

### Code Quality

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] No console.log statements in production code

### Configuration

- [ ] `.env.production` configured
- [ ] API URL correct for production
- [ ] Error tracking configured (Sentry, etc.)

### Performance

- [ ] Bundle size acceptable (`npm run build` output)
- [ ] Images optimized
- [ ] Lazy loading configured for routes

### Security

- [ ] No secrets in client code
- [ ] HTTPS configured
- [ ] CSP headers configured (if applicable)

---

## Related Documentation

- [BUILD.md](BUILD.md) - Detailed build configuration
- [CI-CD.md](CI-CD.md) - GitHub Actions setup
- [../getting-started/ENVIRONMENTS.md](../getting-started/ENVIRONMENTS.md) - Environment configuration
