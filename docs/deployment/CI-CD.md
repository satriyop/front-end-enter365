# CI/CD

GitHub Actions in this repo is **Vitest only**. Merging `main` does not deploy the till.

## What runs

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Vitest | `.github/workflows/vitest.yml` | PR, push to `main` | `npm run test:run` |

There is no GitHub deploy, preview, Vercel, or Netlify job.

## Production

Ship from the Laravel repo (`$BE` = `../enter365`):

```bash
cd ../enter365
./scripts/prod.sh deploy
```

That builds this SPA on the laptop (`npx vite build`) and rsyncs `dist/` to aidev (`/var/www/enter365-spa`). Pair FE and BE changes in the same release so the API migrate matches the UI.

See [README.md](README.md) and `$BE/scripts/prod/README.md`.
