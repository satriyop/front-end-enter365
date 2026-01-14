# Troubleshooting

> Common issues and solutions for Enter365 Vue SPA

## Quick Diagnostic

| Symptom | Likely Cause | Go To |
|---------|--------------|-------|
| 401 errors | Auth token expired | [API-ISSUES.md](API-ISSUES.md#401-unauthorized) |
| 422 errors | Validation failed | [API-ISSUES.md](API-ISSUES.md#422-validation-error) |
| CORS errors | Proxy misconfigured | [API-ISSUES.md](API-ISSUES.md#cors-errors) |
| TypeScript errors | Type mismatch | [BUILD-ISSUES.md](BUILD-ISSUES.md#typescript-errors) |
| Build fails | Missing dependencies | [BUILD-ISSUES.md](BUILD-ISSUES.md#build-failures) |
| Data not updating | Cache stale | [STATE-ISSUES.md](STATE-ISSUES.md#stale-data) |
| Infinite loops | Query re-fetching | [STATE-ISSUES.md](STATE-ISSUES.md#infinite-refetch) |

---

## First Steps

### 1. Clear Cache

```bash
# Clear node_modules
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### 2. Check Console

```typescript
// Browser console
// Look for red errors and warnings

// Network tab
// Check for failed requests (red entries)
```

### 3. Check Version Compatibility

```bash
# Check Node version
node -v  # Should be 18+ or 20+

# Check npm version
npm -v

# Check package versions
npm list vue @tanstack/vue-query pinia
```

---

## Common Scenarios

### "It worked yesterday"

1. **Pull latest changes**
   ```bash
   git pull
   npm install
   ```

2. **Check for breaking changes**
   ```bash
   git log --oneline -10
   ```

3. **Clear all caches**
   ```bash
   rm -rf node_modules node_modules/.vite
   npm install
   npm run dev
   ```

### "It works locally but not in CI"

| Check | Command |
|-------|---------|
| Node version matches | Check `.nvmrc` or CI config |
| Environment variables | Check secrets in CI |
| Build command | Ensure `npm ci` not `npm install` |

### "Page loads but no data"

1. Check Network tab for API calls
2. Verify auth token exists
3. Check API URL in environment
4. Verify backend is running

---

## Debugging Tools

### Vue DevTools

Install browser extension for:
- Component tree inspection
- Pinia store state
- Vue Query cache
- Event tracking

### TanStack Query DevTools

```typescript
// Already included in development
// Look for floating button in bottom-right
```

### Network Tab Filters

| Filter | Purpose |
|--------|---------|
| `XHR` | API calls only |
| `Fetch` | Fetch API calls |
| `/api/` | Filter by URL pattern |

---

## Log Levels

### Development

```typescript
// API client logs all requests
// Vue Query logs cache operations
// Console shows Vue warnings
```

### Production

```typescript
// Console output minimized
// Errors sent to Sentry (if configured)
// Network errors logged
```

---

## Getting Help

### Information to Gather

1. **Error message** - Exact text
2. **Steps to reproduce** - How to trigger
3. **Expected behavior** - What should happen
4. **Actual behavior** - What happens instead
5. **Environment** - Browser, Node version
6. **Console output** - Errors and warnings
7. **Network requests** - Failed API calls

### Where to Look

| Resource | Location |
|----------|----------|
| Vue docs | https://vuejs.org/guide/ |
| Vue Query docs | https://tanstack.com/query/latest |
| Pinia docs | https://pinia.vuejs.org/ |
| Radix Vue | https://www.radix-vue.com/ |

---

## Related Documentation

- [API-ISSUES.md](API-ISSUES.md) - API and network problems
- [BUILD-ISSUES.md](BUILD-ISSUES.md) - Build and TypeScript problems
- [STATE-ISSUES.md](STATE-ISSUES.md) - State management problems
