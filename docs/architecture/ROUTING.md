# Routing

> Vue Router configuration and patterns

## Overview

| Aspect | Value |
|--------|-------|
| Library | Vue Router 4.5.0 |
| History Mode | HTML5 History (`createWebHistory`) |
| Guards | Global navigation guard |
| Lazy Loading | All routes use dynamic imports |

---

## Route Structure

### Protected Routes (Auth Required)

```typescript
{
  path: '/',
  component: () => import('@/layouts/AppLayout.vue'),
  meta: { requiresAuth: true },
  children: [
    // All authenticated routes here
  ]
}
```

### Public Routes (No Auth)

```typescript
{
  path: '/login',
  component: () => import('@/pages/LoginPage.vue'),
  meta: { guest: true }  // Redirects to dashboard if logged in
}

{
  path: '/p/:token',  // Public proposal sharing
  component: () => import('@/pages/public/PublicProposalPage.vue'),
  meta: { guest: true }
}
```

---

## Route Configuration

### Complete Route Map

| Module | Routes |
|--------|--------|
| **Auth** | `/login` |
| **Dashboard** | `/` |
| **Quotations** | `/quotations`, `/quotations/new`, `/quotations/:id`, `/quotations/:id/edit` |
| **Invoices** | `/invoices`, `/invoices/new`, `/invoices/:id`, `/invoices/:id/edit` |
| **Contacts** | `/contacts`, `/contacts/new`, `/contacts/:id`, `/contacts/:id/edit` |
| **Products** | `/products`, `/products/new`, `/products/:id`, `/products/:id/edit` |
| **Bills** | `/bills`, `/bills/new`, `/bills/:id`, `/bills/:id/edit` |
| **Payments** | `/payments`, `/payments/new`, `/payments/:id` |
| **Projects** | `/projects`, `/projects/new`, `/projects/:id`, `/projects/:id/edit` |
| **Work Orders** | `/work-orders/*` |
| **Inventory** | `/inventory`, `/inventory/movements`, `/inventory/adjust` |
| **BOMs** | `/boms/*`, `/boms/variant-groups`, `/boms/from-template` |
| **Solar** | `/solar-proposals/*`, `/solar-proposals/analytics` |
| **Reports** | `/reports`, `/reports/balance-sheet`, `/reports/income-statement`, etc. |
| **Settings** | `/settings`, `/settings/component-library/*`, `/settings/rule-sets/*`, `/settings/bom-templates/*` |
| **Users** | `/users` |
| **Company** | `/company-profiles/*` |
| **Public** | `/p/:token`, `/solar-calculator`, `/profile/:slug` |

---

## Navigation Guards

### Global Auth Guard

```typescript
// src/router/index.ts
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Save intended destination
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && auth.isAuthenticated) {
    // Already logged in, go to dashboard
    next({ name: 'dashboard' })
  } else {
    next()
  }
})
```

### Route Meta Types

```typescript
declare module 'vue-router' {
  interface RouteMeta {
    breadcrumb?: string | ((route: RouteLocationNormalized) => string)
    requiresAuth?: boolean
    guest?: boolean
  }
}
```

---

## Breadcrumbs

### Static Breadcrumb

```typescript
{
  path: 'quotations',
  name: 'quotations',
  component: () => import('@/pages/quotations/QuotationListPage.vue'),
  meta: { breadcrumb: 'Quotations' }
}
```

### Dynamic Breadcrumb

```typescript
{
  path: 'quotations/:id',
  name: 'quotation-detail',
  component: () => import('@/pages/quotations/QuotationDetailPage.vue'),
  meta: { breadcrumb: (route) => `Quotation #${route.params.id}` }
}
```

### Breadcrumb Component

```vue
<!-- src/components/ui/Breadcrumbs.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  return route.matched
    .filter(r => r.meta.breadcrumb)
    .map(r => ({
      path: r.path,
      label: typeof r.meta.breadcrumb === 'function'
        ? r.meta.breadcrumb(route)
        : r.meta.breadcrumb
    }))
})
</script>
```

---

## Lazy Loading

All routes use dynamic imports for code splitting:

```typescript
// Each route becomes a separate chunk
component: () => import('@/pages/quotations/QuotationListPage.vue')
```

Benefits:
- Smaller initial bundle
- Faster first load
- Routes loaded on demand

---

## Navigation Patterns

### Programmatic Navigation

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

// Navigate to route
router.push('/quotations')

// Navigate with params
router.push({ name: 'quotation-detail', params: { id: 123 } })

// Navigate with query
router.push({ path: '/quotations', query: { status: 'approved' } })

// Replace (no history entry)
router.replace('/quotations')

// Go back
router.back()
```

### RouterLink Component

```vue
<router-link to="/quotations">Quotations</router-link>

<router-link :to="{ name: 'quotation-detail', params: { id: 123 } }">
  View
</router-link>
```

### Button as Link

```vue
<Button as="router-link" to="/quotations/new">
  Create Quotation
</Button>
```

---

## Route Params

### Access in Component

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

// As string
const id = route.params.id as string

// As number (common pattern)
const numericId = computed(() => Number(route.params.id))
</script>
```

### Pass to Query Hook

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuotation } from '@/api/useQuotations'

const route = useRoute()
const id = computed(() => Number(route.params.id))

const { data: quotation, isLoading } = useQuotation(id)
</script>
```

---

## Query Parameters

### Read Query Params

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

// Single value
const status = route.query.status as string

// Sync with filters
const filters = ref({
  page: Number(route.query.page) || 1,
  status: route.query.status as string || '',
})
</script>
```

### Update Query Params

```typescript
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

function updateFilters() {
  router.push({
    query: {
      ...route.query,
      page: filters.value.page,
      status: filters.value.status || undefined,
    }
  })
}
```

---

## Route Guards (Component Level)

### Before Route Enter

```vue
<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'

// Warn before leaving unsaved changes
onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('Leave without saving?')
    if (!answer) return false
  }
})
</script>
```

---

## 404 Handling

```typescript
// Catch-all route (must be last)
{
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('@/pages/NotFoundPage.vue')
}
```

---

## Related Documentation

- [Architecture Overview](README.md)
- [Authentication](../api/AUTHENTICATION.md)
