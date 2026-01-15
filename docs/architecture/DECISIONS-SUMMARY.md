# Architecture Decisions Summary

> Quick reference for all architectural decisions and their rationale

---

## Decision Overview

| # | Decision | Choice | Status |
|---|----------|--------|--------|
| 0001 | Frontend Framework | Vue 3 + Composition API | Accepted |
| 0002 | Server State Management | TanStack Query | Accepted |
| 0003 | API Abstraction Layer | Hooks Pattern (Level 2) | Accepted |
| 0004 | UI Component System | Shadcn-Vue (Radix + Tailwind) | Accepted |
| 0005 | Client State Management | Pinia (auth only) | Accepted |

---

## ADR 0001: Vue 3 with Composition API

**Decision:** Use Vue 3 with Composition API and `<script setup>` syntax

**Context:**
- Building 50+ page SPA with complex forms
- Need real-time calculations (solar)
- Integration with Laravel REST API

**Why Vue 3:**
- Gentle learning curve for team
- Excellent TypeScript support
- Composition API enables logic reuse via composables
- `<script setup>` reduces boilerplate

**Alternatives Considered:**
| Option | Pros | Cons |
|--------|------|------|
| React | Large ecosystem | More boilerplate, different paradigm |
| Angular | Enterprise features | Heavy, steep learning curve |
| Vue 2 Options API | Familiar | Poor TypeScript, no composables |

**Consequences:**
- Use composables for shared logic
- All components use `<script setup lang="ts">`
- No mixins allowed

**Full ADR:** [adr/0001-vue3-composition-api.md](adr/0001-vue3-composition-api.md)

---

## ADR 0002: TanStack Query for Server State

**Decision:** Use TanStack Query (Vue Query) for all server state management

**Context:**
- 20+ API endpoints
- Complex cache invalidation needs
- Pagination, filtering, sorting requirements

**Why TanStack Query:**
- Automatic caching and background refetch
- Smart cache invalidation
- Request deduplication
- Built-in loading/error states

**Alternatives Considered:**
| Option | Pros | Cons |
|--------|------|------|
| Pinia only | Simple | Manual cache, manual loading states |
| Plain Axios | No dependencies | No caching, no deduplication |
| SWR | Simple API | Less features than TanStack |

**Key Patterns:**
```typescript
// Computed query keys for reactivity
queryKey: computed(() => ['items', filters.value])

// Automatic invalidation on mutations
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['items'] })
}
```

**Consequences:**
- All API calls go through TanStack Query hooks
- Pinia is NOT used for server data
- Derived state uses `computed()`, not `ref()`

**Full ADR:** [adr/0002-tanstack-query-server-state.md](adr/0002-tanstack-query-server-state.md)

---

## ADR 0003: Hooks Pattern (Level 2)

**Decision:** Use direct TanStack Query hooks returning API types (no adapter layer)

**Context:**
- Small team (same devs on frontend + backend)
- Well-designed Laravel API
- Priority: ship fast, iterate

**Why Level 2 (Hooks):**
- No type duplication
- Minimal boilerplate
- Fast development
- Simple mental model

**Levels Explained:**
| Level | Description | When to Use |
|-------|-------------|-------------|
| Level 1 | Raw Axios | Never (no caching) |
| Level 2 | Hooks (chosen) | Small team, good API |
| Level 3 | Adapters | Large team, unstable API |

**Upgrade Path:**
Add adapters incrementally when:
- 5+ places need same transformation
- API changes frequently
- Team grows significantly

**Consequences:**
- Components receive API types directly
- Transformations done in components if needed
- Can add adapters later without rewriting

**Full ADR:** [adr/0003-hooks-over-adapters.md](adr/0003-hooks-over-adapters.md)

---

## ADR 0004: Shadcn-Vue Design System

**Decision:** Use Radix Vue headless primitives with custom Tailwind styling

**Context:**
- 50+ pages needing consistent styling
- Brand customization (orange primary)
- Accessibility requirements (WCAG)

**Why Shadcn-Vue Pattern:**
- Full design control
- Small bundle (tree-shakeable)
- Built-in accessibility
- Works with Tailwind

**Architecture:**
```
Radix Vue (accessibility/behavior)
    ↓
Custom Components (Tailwind styling)
    ↓
Design Tokens (CSS variables)
```

**Components Used:**
- Radix primitives: SelectRoot, DialogRoot, DropdownMenuRoot, TabsRoot
- Our components: Button, Input, Select, Card, Badge, Modal

**Alternatives Considered:**
| Option | Pros | Cons |
|--------|------|------|
| Vuetify | Full-featured | Opinionated styling, large bundle |
| PrimeVue | Comprehensive | Hard to customize |
| From scratch | Full control | Time-consuming |

**Consequences:**
- Use only `@/components/ui/*` components
- Use CSS variables for colors (`text-muted-foreground`)
- No hardcoded colors (`text-gray-500`)

**Full ADR:** [adr/0004-shadcn-vue-design-system.md](adr/0004-shadcn-vue-design-system.md)

---

## ADR 0005: Pinia for Authentication Only

**Decision:** Use Pinia exclusively for authentication state

**Context:**
- Need clear separation of state types
- TanStack Query handles server data
- Avoid confusion about where state lives

**State Categories:**

| Type | Store | Examples |
|------|-------|----------|
| **Auth** | Pinia | User, token, permissions |
| **Server** | TanStack Query | Quotations, invoices, products |
| **UI** | Component state | Modal open, form fields |

**Why This Split:**
- Auth state: globally needed, rarely changes, no cache invalidation
- Server data: TanStack Query automates everything
- UI state: local to components

**Consequences:**
- Only 1 Pinia store: `auth.ts`
- No new Pinia stores allowed
- Server data MUST use TanStack Query

**Full ADR:** [adr/0005-pinia-auth-only.md](adr/0005-pinia-auth-only.md)

---

## Decision Tree

When making new architectural decisions:

```
1. Is this a framework/major library choice?
   └─→ Write new ADR in docs/architecture/adr/

2. Is this a pattern/convention choice?
   └─→ Document in relevant section (api/, components/, etc.)

3. Is this a one-off implementation?
   └─→ Document in code comments
```

---

## Quick Rules from ADRs

| Topic | Rule |
|-------|------|
| Components | Use `<script setup lang="ts">` |
| Server data | Always TanStack Query |
| Client state | Only Pinia for auth |
| UI components | Only from `@/components/ui/` |
| Colors | Use semantic tokens |
| Query keys | Always `computed()` |
| API hooks | Filter empty parameters |

---

## Adding New ADRs

Use the template at [adr/TEMPLATE.md](adr/TEMPLATE.md):

```markdown
# ADR {NUMBER}: {TITLE}

## Status
Proposed | Accepted | Deprecated | Superseded

## Date
YYYY-MM-DD

## Context
[Problem and current state]

## Decision
[What we're doing]

## Rationale
[Why this choice over alternatives]

## Consequences
[Positive, negative, risks]
```

---

*Last updated: January 2025*
