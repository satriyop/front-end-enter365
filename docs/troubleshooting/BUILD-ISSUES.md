# Build Issues

> Troubleshooting TypeScript, Vite, and build problems

## Quick Reference

| Issue | Solution |
|-------|----------|
| TypeScript error | Fix type, add type assertion |
| Module not found | Check import path, install package |
| Build fails | Clear cache, reinstall node_modules |
| HMR not working | Restart Vite |

---

## TypeScript Errors

### "Cannot find module"

```
Cannot find module '@/components/ui/Button.vue' or its corresponding type declarations.
```

**Solutions:**

1. Check file exists at that path
2. Check path alias in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```
3. Restart VS Code / TypeScript server

### "Type 'X' is not assignable to type 'Y'"

```typescript
// Error
const contact: Contact = { name: 'Test' }
// Type '{ name: string; }' is missing properties: id, email, phone

// Fix: Provide all required properties
const contact: Contact = {
  id: 1,
  name: 'Test',
  email: 'test@example.com',
  phone: '08123456789',
}

// Or use Partial for optional
const partial: Partial<Contact> = { name: 'Test' }
```

### "Property does not exist on type"

```typescript
// Error
const data = response.data
console.log(data.contacts)  // Property 'contacts' does not exist

// Fix 1: Define the type
interface ApiResponse {
  contacts: Contact[]
}
const data: ApiResponse = response.data

// Fix 2: Type assertion (use carefully)
const data = response.data as { contacts: Contact[] }
```

### "Object is possibly undefined"

```typescript
// Error
const name = contact.company.name  // Object is possibly 'undefined'

// Fix 1: Optional chaining
const name = contact.company?.name

// Fix 2: Type guard
if (contact.company) {
  const name = contact.company.name
}

// Fix 3: Non-null assertion (use when you're sure)
const name = contact.company!.name
```

---

## Import Errors

### "Module not found"

```
[vite] Internal server error: Failed to resolve import "@/components/Missing.vue"
```

**Checklist:**
1. File exists? Check spelling, case sensitivity
2. Correct extension? `.vue`, `.ts`, `.tsx`
3. Path alias working? Check `vite.config.ts`
4. Node modules installed? Run `npm install`

### Circular Dependency

```
[vite] Circular dependency detected
```

**Fix:** Restructure imports to avoid cycles

```typescript
// Before (circular)
// a.ts imports b.ts
// b.ts imports a.ts

// After (fixed)
// Create c.ts with shared code
// a.ts imports c.ts
// b.ts imports c.ts
```

---

## Build Failures

### "FATAL ERROR: Ineffective mark-compacts near heap limit"

JavaScript heap out of memory.

```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or in package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}
```

### "Cannot find name 'defineProps'"

Vue macros not recognized.

```typescript
// Check vue-tsc version matches Vue version
npm list vue vue-tsc

// Update if needed
npm update vue-tsc
```

### "Unexpected token"

Syntax error in code.

```typescript
// Check for:
// - Missing commas in objects/arrays
// - Missing closing brackets
// - Invalid ES syntax for target
```

---

## Vite Issues

### HMR Not Working

Hot Module Replacement not updating.

1. **Check terminal for errors**
2. **Restart Vite:** `Ctrl+C`, then `npm run dev`
3. **Clear cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```
4. **Check file is saved** (some editors have delayed save)

### Port Already in Use

```
Error: Port 3000 is already in use
```

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3001
```

### Proxy Not Working

API requests going directly to backend instead of proxy.

```typescript
// Check you're using relative URLs
// Good:
api.get('/api/contacts')

// Bad:
api.get('https://enter365.test/api/contacts')
```

---

## Dependency Issues

### Version Conflicts

```
npm ERR! ERESOLVE could not resolve
```

```bash
# Option 1: Use legacy peer deps
npm install --legacy-peer-deps

# Option 2: Use force (careful!)
npm install --force

# Option 3: Clean install
rm -rf node_modules package-lock.json
npm install
```

### Missing Peer Dependencies

```
npm WARN @tanstack/vue-query requires a peer of vue@^3.0.0
```

```bash
# Install the peer dependency
npm install vue@^3
```

---

## VS Code Issues

### IntelliSense Not Working

1. **Check Volar extension installed** (not Vetur)
2. **Restart TypeScript server:**
   - `Cmd+Shift+P` → "TypeScript: Restart TS Server"
3. **Check Vue Language Features enabled**

### Type Errors in .vue Files

```bash
# Ensure you have:
npm install -D @vue/language-core vue-tsc
```

### Import Suggestions Not Working

1. Check `jsconfig.json` or `tsconfig.json` paths
2. Restart VS Code
3. Disable and re-enable Volar

---

## Common Fixes

### Nuclear Option (Fresh Install)

```bash
# Remove all generated files
rm -rf node_modules
rm -rf dist
rm -rf .vite
rm -rf tsconfig.tsbuildinfo
rm package-lock.json

# Fresh install
npm install

# Rebuild
npm run dev
```

### Regenerate Types

```bash
# Regenerate OpenAPI types
npm run types:generate

# Rebuild tsbuildinfo
rm tsconfig.tsbuildinfo
npm run type-check
```

---

## CI/CD Build Failures

### Works Locally, Fails in CI

| Difference | Solution |
|------------|----------|
| Node version | Match CI Node version locally |
| npm vs npm ci | Use `npm ci` in CI |
| Environment variables | Check CI secrets |
| Case sensitivity | Linux is case-sensitive |

### Check Before Pushing

```bash
# Run same commands as CI
npm ci
npm run type-check
npm run lint
npm run test
npm run build
```

---

## Performance Issues

### Build Too Slow

1. Enable build caching
2. Use `esbuild` for TypeScript (default in Vite)
3. Minimize dependencies
4. Check for large imports

### Dev Server Slow

```typescript
// Check for heavy dependencies
// Move to dynamic imports
const Chart = defineAsyncComponent(() =>
  import('@/components/Chart.vue')
)
```

---

## Related Documentation

- [README.md](README.md) - Troubleshooting overview
- [../deployment/BUILD.md](../deployment/BUILD.md) - Build configuration
- [STATE-ISSUES.md](STATE-ISSUES.md) - Runtime state issues
