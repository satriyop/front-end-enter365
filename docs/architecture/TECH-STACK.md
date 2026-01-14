# Tech Stack

> Technology choices and rationale for Enter365 frontend

## Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  ENTER365 FRONTEND STACK                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Framework:     Vue 3 + Composition API + TypeScript             │
│  Build:         Vite                                             │
│  Styling:       Tailwind CSS                                     │
│  State:         Pinia (auth) + TanStack Query (server)           │
│  Routing:       Vue Router                                       │
│  Forms:         VeeValidate + Zod                                │
│  Components:    Radix Vue (headless) + Custom UI                 │
│  Testing:       Vitest + Vue Test Utils + Playwright             │
│  API Client:    Axios + OpenAPI-generated types                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Technologies

### Framework: Vue 3 + Composition API

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Version | Vue 3.5.13 | Latest stable, best TypeScript support |
| API Style | Composition API | Better TypeScript, code reuse via composables |
| Script Setup | `<script setup>` | Less boilerplate, better IDE support |

**Why Vue 3 over React/Angular:**
- Gentler learning curve for the team
- Excellent TypeScript support (Vue 3)
- Composition API provides React-like flexibility
- Strong ecosystem (Vite, Pinia, VueUse)

### Build: Vite

| Aspect | Value |
|--------|-------|
| Version | 6.0.5 |
| Dev Server | ~300ms startup |
| HMR | Instant (<100ms) |
| Build | Rollup-based, optimized |

**Why Vite over Webpack:**
- 10-100x faster dev server startup
- Instant hot module replacement
- Native ES modules support
- Better Vue 3 integration

### Language: TypeScript

| Config | Value | Why |
|--------|-------|-----|
| `strict` | `true` | Catch errors early |
| `noImplicitAny` | `true` | Force explicit types |

**Type Safety Benefits:**
- 59+ API models = 59+ potential type mismatches → Generated types eliminate this
- Compile-time errors when API changes
- Auto-complete for all API responses
- Self-documenting code

---

## State Management

### Server State: TanStack Query

| Feature | Benefit |
|---------|---------|
| Automatic caching | Reduced API calls |
| Background refetch | Fresh data without loading states |
| Query invalidation | Automatic list refresh after mutations |
| Request deduplication | No duplicate requests |
| Optimistic updates | Instant UI feedback |

**Why TanStack Query over manual state:**
- Complex workflows (Quotation → Invoice → Payment) need smart cache invalidation
- Background refetching keeps data fresh
- Built-in loading/error states

### Client State: Pinia

**Used only for authentication:**
- User object
- JWT token
- Permissions/roles
- Login/logout actions

**Why Pinia over Vuex:**
- Simpler composition-based API
- Better TypeScript support
- Smaller bundle size
- No mutations boilerplate

**Why not Pinia for everything:**
- Server data belongs in TanStack Query (cache, refetch, invalidation)
- Most "global state" is actually derived from server data

---

## Styling

### Tailwind CSS

| Aspect | Value |
|--------|-------|
| Version | 3.4.17 |
| Approach | Utility-first |
| Theming | CSS variables |
| Plugins | tailwindcss-animate |

**Design Token System:**
```css
--primary: 32 95% 44%           /* Orange */
--destructive: 0 84% 60%        /* Red */
--success: 120 75% 40%          /* Green */
--muted-foreground: 215 20% 65% /* Gray text */
```

### UI Primitives: Radix Vue

| Aspect | Value |
|--------|-------|
| Version | 1.9.17 |
| Style | Headless (unstyled) |
| Accessibility | WCAG compliant |

**Why Radix Vue:**
- Accessible by default (ARIA, keyboard navigation)
- Unstyled = full Tailwind control
- Complex behaviors handled (dropdowns, modals, popovers)
- Same API as React's Radix UI

---

## API Integration

### HTTP Client: Axios

| Feature | Implementation |
|---------|----------------|
| Base URL | `/api/v1` |
| Auth | Bearer token in header |
| Token refresh | Automatic on 401 |
| Error handling | Interceptors |

### Type Generation: openapi-typescript

```bash
npm run types:generate
# Generates src/api/types.ts from Laravel OpenAPI spec
```

**Benefits:**
- Types always match API responses
- Auto-complete for all endpoints
- Compile-time errors when API changes
- Zero manual type maintenance

---

## Forms & Validation

### VeeValidate + Zod

| Tool | Purpose |
|------|---------|
| VeeValidate | Form state management |
| Zod | Schema validation |

**Why Zod:**
- TypeScript-first
- Composable schemas
- Runtime + type-time validation
- Same schemas for forms and API responses

---

## Testing Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│  TESTING PYRAMID                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: UNIT TESTS (Vitest)                      ~60%         │
│  ─────────────────────────────────────────────────────────────  │
│  • Utility functions (formatCurrency, daysRemaining)             │
│  • Composables (usePermissions, usePagination)                   │
│  • Pinia stores                                                  │
│  • Zod validation schemas                                        │
│                                                                  │
│  Layer 2: COMPONENT TESTS (Vitest + Vue Test Utils) ~30%         │
│  ─────────────────────────────────────────────────────────────  │
│  • UI components in isolation (Button, Card, Table)              │
│  • Feature components with mocked API                            │
│  • Form validation behavior                                      │
│                                                                  │
│  Layer 3: E2E TESTS (Playwright)                     ~10%        │
│  ─────────────────────────────────────────────────────────────  │
│  • Critical user journeys only:                                  │
│    - Login flow                                                  │
│    - Create quotation → Submit → Approve                         │
│    - Create solar proposal → Calculate → Send                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Additional Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `lucide-vue-next` | 0.562.0 | Icons |
| `chart.js` + `vue-chartjs` | 4.5.1 | Charts |
| `leaflet` + `vue-leaflet` | 1.9.4 | Maps |
| `xlsx` | 0.18.5 | Excel export |
| `@vueuse/core` | 12.4.0 | Vue utilities |
| `class-variance-authority` | 0.7.1 | Component variants |
| `tailwind-merge` | 3.4.0 | Class merging |
| `clsx` | 2.1.1 | Conditional classes |

---

## Development Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  SAFE DEVELOPMENT WORKFLOW                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: Backend adds/changes endpoint                           │
│          ↓                                                       │
│  STEP 2: Regenerate OpenAPI spec                                 │
│          php artisan openapi:generate                            │
│          ↓                                                       │
│  STEP 3: Regenerate frontend types                               │
│          npm run types:generate                                  │
│          ↓                                                       │
│  STEP 4: TypeScript shows errors where API changed               │
│          (Compile-time safety!)                                  │
│          ↓                                                       │
│  STEP 5: Fix affected code                                       │
│          ↓                                                       │
│  STEP 6: Run tests                                               │
│          npm run test                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Debt Prevention Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  RULES TO FOLLOW                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. NO INLINE API CALLS                                          │
│     ✗ fetch('/api/quotations') in components                     │
│     ✓ useQuotations() hook with typed response                   │
│                                                                  │
│  2. NO DUPLICATED TYPES                                          │
│     ✗ Manually defining Quotation interface                      │
│     ✓ Import from generated types or hook file                   │
│                                                                  │
│  3. NO BUSINESS LOGIC IN COMPONENTS                              │
│     ✗ Complex calculations in template                           │
│     ✓ Composables or utility functions                           │
│                                                                  │
│  4. SINGLE SOURCE OF TRUTH FOR UI STATE                          │
│     ✗ Multiple places tracking sidebar open/closed               │
│     ✓ One Pinia store or component state                         │
│                                                                  │
│  5. STRICT TYPESCRIPT                                            │
│     tsconfig: "strict": true, "noImplicitAny": true              │
│                                                                  │
│  6. COMPONENT BOUNDARIES                                         │
│     • UI components: No API calls, receive props                 │
│     • Feature components: Use hooks, handle data                 │
│     • Page components: Orchestrate features, handle routing      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [State Management](STATE-MANAGEMENT.md) - Detailed patterns
- [API Hooks](../api/HOOKS-PATTERN.md) - Hook patterns
- [ADR 0002](adr/0002-tanstack-query-server-state.md) - Why TanStack Query
