# CI/CD

> GitHub Actions configuration for automated testing and deployment

## Quick Reference

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| CI | Push, PR | Lint, type check, test |
| Deploy | Push to main | Build and deploy |
| Preview | PR | Deploy preview |

---

## Recommended Workflows

### 1. Continuous Integration

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7
```

---

### 2. Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      # Option A: Deploy to Vercel
      - name: Deploy to Vercel
        uses: vercel/action@v26
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      # Option B: Deploy to Netlify
      # - name: Deploy to Netlify
      #   uses: nwtgck/actions-netlify@v2
      #   with:
      #     publish-dir: './dist'
      #     production-branch: main
      #     github-token: ${{ secrets.GITHUB_TOKEN }}
      #     deploy-message: "Deploy from GitHub Actions"
      #   env:
      #     NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
      #     NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

      # Option C: Deploy to S3
      # - name: Deploy to S3
      #   uses: jakejarvis/s3-sync-action@master
      #   with:
      #     args: --delete
      #   env:
      #     AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
      #     AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      #     AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      #     SOURCE_DIR: 'dist'
```

---

### 3. Preview Deployments

```yaml
# .github/workflows/preview.yml
name: Preview

on:
  pull_request:
    branches: [main]

jobs:
  preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL_STAGING }}

      - name: Deploy Preview
        uses: vercel/action@v26
        id: vercel-deploy
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed to: ${{ steps.vercel-deploy.outputs.preview-url }}'
            })
```

---

## Required Secrets

### GitHub Repository Secrets

| Secret | Description |
|--------|-------------|
| `VITE_API_URL` | Production API URL |
| `VITE_API_URL_STAGING` | Staging API URL |

### Vercel Secrets

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

### Netlify Secrets

| Secret | Description |
|--------|-------------|
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token |
| `NETLIFY_SITE_ID` | Netlify site ID |

### AWS Secrets (for S3)

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_S3_BUCKET` | S3 bucket name |

---

## Workflow Status Badges

Add to README.md:

```markdown
![CI](https://github.com/your-org/enter365-frontend/workflows/CI/badge.svg)
![Deploy](https://github.com/your-org/enter365-frontend/workflows/Deploy/badge.svg)
```

---

## Branch Protection

Recommended settings for `main` branch:

| Setting | Value |
|---------|-------|
| Require status checks | lint, type-check, test, build |
| Require branches to be up to date | Yes |
| Require pull request reviews | 1 |
| Dismiss stale reviews | Yes |
| Require signed commits | Optional |

---

## Caching

### npm Cache

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'  # Automatically caches node_modules
```

### Custom Cache

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v3
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
```

---

## Environment Separation

```yaml
jobs:
  deploy-staging:
    environment: staging
    # Uses staging secrets

  deploy-production:
    environment: production
    # Uses production secrets
    needs: [deploy-staging]  # Deploy to staging first
```

---

## Notifications

### Slack Notification

```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    fields: repo,message,commit,author,ref,workflow
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Discord Notification

```yaml
- name: Notify Discord
  if: always()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| npm ci fails | Clear cache, check package-lock.json |
| Type check fails | Check import paths, run locally first |
| Build timeout | Increase timeout, check for infinite loops |
| Deploy fails | Check secrets, verify deployment target |

### Debug Mode

```yaml
- name: Debug
  run: |
    echo "Node version: $(node -v)"
    echo "npm version: $(npm -v)"
    echo "Working directory: $(pwd)"
    ls -la
```

---

## Related Documentation

- [README.md](README.md) - Deployment overview
- [BUILD.md](BUILD.md) - Build configuration
- [../testing/E2E-TESTS.md](../testing/E2E-TESTS.md) - E2E tests in CI
