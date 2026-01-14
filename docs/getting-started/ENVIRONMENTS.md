# Environment Configuration

> All environment variables and their usage

## Environment Files

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env` | Local development | No |
| `.env.example` | Template for `.env` | Yes |
| `.env.production` | Production build | No |

---

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |

---

## Development Setup

```env
# .env (local development)
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Production Setup

```env
# .env.production
VITE_API_URL=https://api.enter365.com/api/v1
```

---

## Usage in Code

### Accessing Environment Variables

```typescript
// In Vue components or TypeScript files
const apiUrl = import.meta.env.VITE_API_URL

// In vite.config.ts
export default defineConfig({
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL),
  },
})
```

### Type Safety

Environment variables are typed in `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## API Client Configuration

The API base URL is configured in `src/api/client.ts`:

```typescript
export const api = axios.create({
  baseURL: '/api/v1',  // Proxied through Vite
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})
```

### Vite Proxy (Development)

In `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## Backend Requirements

The frontend expects the Laravel backend to:

1. Serve API at `/api/v1/*`
2. Use Laravel Sanctum for authentication
3. Return JSON responses with standard structure:

```json
{
  "data": { },
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 10,
    "total": 100
  }
}
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| API returns 404 | Wrong VITE_API_URL | Check `.env` matches backend URL |
| CORS errors | Missing proxy config | Check `vite.config.ts` proxy |
| 401 on all requests | Token not sent | Check `localStorage.getItem('token')` |
| Env vars undefined | Missing VITE_ prefix | Vite only exposes `VITE_*` vars |
