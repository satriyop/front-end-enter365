# Architecture Overview

> System design and architectural patterns for Enter365 frontend

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         VUE 3 SPA                                │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │    │
│  │  │    Pages     │───▶│  Components  │───▶│    UI Kit    │       │    │
│  │  │ (routes)     │    │  (features)  │    │   (radix)    │       │    │
│  │  └──────┬───────┘    └──────┬───────┘    └──────────────┘       │    │
│  │         │                   │                                    │    │
│  │         ▼                   ▼                                    │    │
│  │  ┌──────────────────────────────────────────────────────┐       │    │
│  │  │              COMPOSABLES + API HOOKS                  │       │    │
│  │  │         (useQuotations, useSolarProposals)            │       │    │
│  │  └──────────────────────────┬───────────────────────────┘       │    │
│  │                             │                                    │    │
│  │                             ▼                                    │    │
│  │  ┌─────────────────┐  ┌─────────────────┐                       │    │
│  │  │  TanStack Query │  │     Pinia       │                       │    │
│  │  │  (server state) │  │   (auth only)   │                       │    │
│  │  └────────┬────────┘  └────────┬────────┘                       │    │
│  │           │                    │                                 │    │
│  │           ▼                    ▼                                 │    │
│  │  ┌─────────────────────────────────────────────────────┐        │    │
│  │  │                   AXIOS CLIENT                       │        │    │
│  │  │          (interceptors, token refresh)               │        │    │
│  │  └─────────────────────────┬───────────────────────────┘        │    │
│  │                            │                                     │    │
│  └────────────────────────────┼─────────────────────────────────────┘    │
│                               │                                          │
└───────────────────────────────┼──────────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          LARAVEL API                                     │
│                         /api/v1/*                                        │
│                    (Sanctum Auth)                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Pages** | Route handling, layout orchestration | `QuotationListPage.vue` |
| **Components** | UI rendering, user interaction | `DataTable.vue`, `QuotationForm.vue` |
| **Composables** | Reusable stateful logic | `useAutosave()`, `useBatteryCalculator()` |
| **API Hooks** | Data fetching, caching, mutations | `useQuotations()`, `useCreateQuotation()` |
| **Stores** | Client-side global state (auth only) | `useAuthStore()` |
| **Utils** | Pure functions, formatters | `formatCurrency()`, `formatDate()` |

---

## Data Flow

### Read Flow (Query)

```
Component              API Hook              TanStack Query        Axios           API
    │                      │                       │                 │              │
    │  useQuotations()     │                       │                 │              │
    ├─────────────────────▶│                       │                 │              │
    │                      │   useQuery()          │                 │              │
    │                      ├──────────────────────▶│                 │              │
    │                      │                       │   Check cache   │              │
    │                      │                       │                 │              │
    │                      │                       │   api.get()     │              │
    │                      │                       ├────────────────▶│              │
    │                      │                       │                 │  GET /api/v1 │
    │                      │                       │                 ├─────────────▶│
    │                      │                       │                 │◀─────────────┤
    │                      │                       │◀────────────────┤              │
    │                      │◀──────────────────────┤                 │              │
    │  { data, isLoading } │                       │                 │              │
    │◀─────────────────────┤                       │                 │              │
```

### Write Flow (Mutation)

```
Component              API Hook              TanStack Query        Axios           API
    │                      │                       │                 │              │
    │  mutate(data)        │                       │                 │              │
    ├─────────────────────▶│                       │                 │              │
    │                      │   useMutation()       │                 │              │
    │                      ├──────────────────────▶│                 │              │
    │                      │                       │   api.post()    │              │
    │                      │                       ├────────────────▶│              │
    │                      │                       │                 │ POST /api/v1 │
    │                      │                       │                 ├─────────────▶│
    │                      │                       │                 │◀─────────────┤
    │                      │                       │◀────────────────┤              │
    │                      │   invalidateQueries() │                 │              │
    │                      │   (refetch list)      │                 │              │
    │                      │◀──────────────────────┤                 │              │
    │  onSuccess callback  │                       │                 │              │
    │◀─────────────────────┤                       │                 │              │
```

---

## State Management Strategy

### Server State (TanStack Query)

| What | Where | Why |
|------|-------|-----|
| Entity data | TanStack Query cache | Automatic caching, background refetch |
| List filters | Component `ref()` | Local to component, passed to query |
| Pagination | TanStack Query (via query key) | Cache per page |

### Client State (Pinia)

| What | Where | Why |
|------|-------|-----|
| Auth token | Pinia + localStorage | Global, persisted |
| Current user | Pinia | Global access for permissions |
| UI state | Component `ref()` | Local, not global |

### Form State

| What | Where | Why |
|------|-------|-----|
| Form fields | Component `ref()` | Local to form |
| Validation | VeeValidate + Zod | Schema-based |
| Autosave | `useAutosave()` composable | Optional persistence |

---

## Component Architecture

### Component Categories

```
src/components/
├── ui/                 # Design system primitives (stateless)
│   ├── Button.vue      # No business logic
│   ├── Input.vue       # Controlled inputs
│   └── DataTable.vue   # Render props pattern
│
├── features/           # Feature-specific (stateful)
│   └── quotations/
│       └── CreateQuotationFromBomModal.vue
│
├── charts/             # Data visualization
│   └── BarChart.vue    # Chart.js wrappers
│
├── solar/              # Domain-specific
│   └── BatteryConfigurator.vue
│
└── maps/               # Map components
    └── LocationMapPicker.vue
```

### Component Rules

| Type | Has State? | Calls API? | Example |
|------|-----------|------------|---------|
| UI Primitives | No | No | `Button`, `Input` |
| Feature Components | Yes | Sometimes | `CreateQuotationModal` |
| Page Components | Yes | Via hooks | `QuotationListPage` |

---

## Routing Architecture

### Route Structure

```typescript
// Protected routes (require auth)
{
  path: '/',
  component: AppLayout,
  meta: { requiresAuth: true },
  children: [
    { path: 'quotations', component: QuotationListPage },
    { path: 'quotations/:id', component: QuotationDetailPage },
  ]
}

// Public routes (no auth)
{
  path: '/p/:token',
  component: PublicProposalPage,
  meta: { guest: true }
}
```

### Navigation Guards

```typescript
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && auth.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})
```

---

## Error Handling Architecture

### Error Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  App Root                                                    │
│  ├─ Global Error Boundary                                    │
│  │   └─ AppLayout                                            │
│  │       ├─ Page Components                                  │
│  │       │   └─ Try/catch in event handlers                  │
│  │       └─ API Hooks                                        │
│  │           └─ TanStack Query error state                   │
└─────────────────────────────────────────────────────────────┘
```

### Error Types

| Error Type | Handling | UI Feedback |
|------------|----------|-------------|
| 401 Unauthorized | Token refresh or redirect to login | Toast + redirect |
| 422 Validation | Extract field errors | Inline field errors |
| 500 Server Error | Log, show generic message | Toast error |
| Network Error | Retry or show offline state | Toast + retry button |

---

## Documentation Index

- [TECH-STACK.md](TECH-STACK.md) - Technology decisions and rationale
- [STATE-MANAGEMENT.md](STATE-MANAGEMENT.md) - Pinia + TanStack Query patterns
- [ROUTING.md](ROUTING.md) - Vue Router configuration
- [ADRs](adr/) - Architecture Decision Records

---

## Architecture Decision Records

| ADR | Decision |
|-----|----------|
| [0001](adr/0001-vue3-composition-api.md) | Vue 3 Composition API |
| [0002](adr/0002-tanstack-query-server-state.md) | TanStack Query for server state |
| [0003](adr/0003-hooks-over-adapters.md) | Hooks pattern over adapters |
| [0004](adr/0004-shadcn-vue-design-system.md) | Shadcn-vue design system |
| [0005](adr/0005-pinia-auth-only.md) | Pinia for auth only |
