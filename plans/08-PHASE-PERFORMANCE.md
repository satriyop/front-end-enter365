# Phase 8: Performance & Optimization

## Overview

This phase focuses on optimizing the application for production use. A well-architected codebase (from previous phases) makes performance optimization easier and more effective.

**Prerequisites:** Phases 1-7 should be substantially complete

**Deliverables:**
1. Route-based code splitting
2. Bundle optimization
3. API caching strategies
4. Component lazy loading
5. Performance monitoring

---

## 8.1 Route-Based Code Splitting

### Current State

The router file is 780+ lines with all routes defined inline. Lazy imports are used, but modules aren't grouped logically.

### Optimized Route Structure

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Eagerly load critical routes
import LoginPage from '@/pages/auth/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'

// Lazy load route modules
const accountingRoutes = () => import('./modules/accounting')
const purchasingRoutes = () => import('./modules/purchasing')
const salesRoutes = () => import('./modules/sales')
const inventoryRoutes = () => import('./modules/inventory')
const manufacturingRoutes = () => import('./modules/manufacturing')
const settingsRoutes = () => import('./modules/settings')
const reportsRoutes = () => import('./modules/reports')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public routes - eagerly loaded
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { guest: true },
    },

    // Protected routes
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardPage,
        },

        // Module routes - lazy loaded
        {
          path: 'accounting',
          children: accountingRoutes,
        },
        {
          path: 'purchasing',
          children: purchasingRoutes,
        },
        {
          path: 'sales',
          children: salesRoutes,
        },
        {
          path: 'inventory',
          children: inventoryRoutes,
        },
        {
          path: 'manufacturing',
          children: manufacturingRoutes,
        },
        {
          path: 'settings',
          children: settingsRoutes,
        },
        {
          path: 'reports',
          children: reportsRoutes,
        },
      ],
    },
  ],
})

// Navigation guards
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && auth.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
```

### Route Module Example

```typescript
// src/router/modules/sales.ts
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // Quotations
  {
    path: 'quotations',
    name: 'quotations',
    component: () => import('@/pages/quotations/QuotationListPage.vue'),
    meta: { breadcrumb: 'Quotations' },
  },
  {
    path: 'quotations/new',
    name: 'quotation-new',
    component: () => import('@/pages/quotations/QuotationFormPage.vue'),
    meta: { breadcrumb: 'New Quotation' },
  },
  {
    path: 'quotations/:id',
    name: 'quotation-detail',
    component: () => import('@/pages/quotations/QuotationDetailPage.vue'),
  },
  {
    path: 'quotations/:id/edit',
    name: 'quotation-edit',
    component: () => import('@/pages/quotations/QuotationFormPage.vue'),
  },

  // Invoices
  {
    path: 'invoices',
    name: 'invoices',
    component: () => import('@/pages/invoices/InvoiceListPage.vue'),
    meta: { breadcrumb: 'Invoices' },
  },
  // ... more invoice routes

  // Delivery Orders
  {
    path: 'delivery-orders',
    name: 'delivery-orders',
    component: () => import('@/pages/sales/DeliveryOrderListPage.vue'),
  },
  // ... more routes
]

export default routes
```

---

## 8.2 Bundle Optimization

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  build: {
    // Target modern browsers
    target: 'es2020',

    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Split chunks intelligently
    rollupOptions: {
      output: {
        manualChunks: {
          // Core Vue chunks
          'vue-core': ['vue', 'vue-router', 'pinia'],

          // Query and forms
          'data-layer': ['@tanstack/vue-query', 'vee-validate', 'zod'],

          // UI primitives
          'ui-primitives': ['radix-vue', 'class-variance-authority'],

          // Charts (heavy, lazy load)
          'charts': ['chart.js', 'vue-chartjs'],

          // PDF/Excel (heavy, lazy load)
          'exports': ['jspdf', 'jspdf-autotable', 'xlsx'],

          // Icons (tree-shake doesn't work well)
          'icons': ['lucide-vue-next'],
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 500,
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@tanstack/vue-query',
      'radix-vue',
    ],
    exclude: [
      // Heavy libraries that should be lazy loaded
      'chart.js',
      'jspdf',
      'xlsx',
    ],
  },
})
```

### Dynamic Import for Heavy Libraries

```typescript
// src/services/export/strategies/PDFExportStrategy.ts
export class PDFExportStrategy<T extends Record<string, any>>
  implements DocumentExportStrategy<T> {

  private jsPDF: typeof import('jspdf').jsPDF | null = null
  private autoTable: typeof import('jspdf-autotable').default | null = null

  async export(data: T[], options?: ExportOptions): Promise<Blob> {
    // Lazy load jsPDF only when needed
    if (!this.jsPDF) {
      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])
      this.jsPDF = jsPDF
      this.autoTable = autoTableModule.default
    }

    const doc = new this.jsPDF(/* ... */)
    // ... rest of export logic
  }
}
```

```typescript
// src/services/export/strategies/ExcelExportStrategy.ts
export class ExcelExportStrategy<T extends Record<string, any>>
  implements ExportStrategy<T> {

  private XLSX: typeof import('xlsx') | null = null

  async export(data: T[], options?: ExportOptions): Promise<Blob> {
    // Lazy load xlsx only when needed
    if (!this.XLSX) {
      this.XLSX = await import('xlsx')
    }

    const ws = this.XLSX.utils.json_to_sheet(/* ... */)
    // ... rest of export logic
  }
}
```

---

## 8.3 API Caching Strategies

### TanStack Query Configuration

```typescript
// src/api/queryClient.ts
import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,

      // Keep cache for 30 minutes
      gcTime: 30 * 60 * 1000,

      // Don't refetch on window focus for most queries
      refetchOnWindowFocus: false,

      // Retry failed requests 1 time
      retry: 1,

      // Don't retry on 4xx errors
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
```

### Query Key Factory

```typescript
// src/api/queryKeys.ts
export const queryKeys = {
  // Contacts
  contacts: {
    all: ['contacts'] as const,
    list: (filters: ContactFilters) => ['contacts', 'list', filters] as const,
    detail: (id: number) => ['contacts', 'detail', id] as const,
    lookup: (params?: LookupParams) => ['contacts', 'lookup', params] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    list: (filters: ProductFilters) => ['products', 'list', filters] as const,
    detail: (id: number) => ['products', 'detail', id] as const,
    lookup: (params?: LookupParams) => ['products', 'lookup', params] as const,
  },

  // Quotations
  quotations: {
    all: ['quotations'] as const,
    list: (filters: QuotationFilters) => ['quotations', 'list', filters] as const,
    detail: (id: number) => ['quotations', 'detail', id] as const,
    statistics: () => ['quotations', 'statistics'] as const,
  },

  // ... more query keys
}
```

### Optimistic Updates

```typescript
// src/api/useQuotations.ts
export function useUpdateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateQuotationData) => {
      const response = await api.patch(`/quotations/${id}`, data)
      return response.data.data
    },

    // Optimistic update
    onMutate: async ({ id, ...data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.quotations.detail(id) })

      // Snapshot previous value
      const previousQuotation = queryClient.getQueryData(queryKeys.quotations.detail(id))

      // Optimistically update
      queryClient.setQueryData(queryKeys.quotations.detail(id), (old: any) => ({
        ...old,
        ...data,
      }))

      return { previousQuotation }
    },

    // Rollback on error
    onError: (_err, { id }, context) => {
      if (context?.previousQuotation) {
        queryClient.setQueryData(
          queryKeys.quotations.detail(id),
          context.previousQuotation
        )
      }
    },

    // Sync with server
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.list })
    },
  })
}
```

### Prefetching

```typescript
// src/composables/usePrefetch.ts
import { useQueryClient } from '@tanstack/vue-query'
import { onMounted } from 'vue'

export function usePrefetch() {
  const queryClient = useQueryClient()

  /**
   * Prefetch data on hover
   */
  function prefetchOnHover(queryKey: readonly unknown[], queryFn: () => Promise<any>) {
    return {
      onMouseEnter: () => {
        queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: 60 * 1000, // Consider fresh for 1 minute
        })
      },
    }
  }

  /**
   * Prefetch common lookup data on mount
   */
  function prefetchLookups() {
    onMounted(() => {
      // Prefetch commonly used lookups
      queryClient.prefetchQuery({
        queryKey: queryKeys.contacts.lookup(),
        queryFn: () => api.get('/contacts/lookup').then((r) => r.data),
        staleTime: 5 * 60 * 1000,
      })

      queryClient.prefetchQuery({
        queryKey: queryKeys.products.lookup(),
        queryFn: () => api.get('/products/lookup').then((r) => r.data),
        staleTime: 5 * 60 * 1000,
      })
    })
  }

  return {
    prefetchOnHover,
    prefetchLookups,
  }
}
```

---

## 8.4 Component Lazy Loading

### Lazy Load Heavy Components

```vue
<!-- src/pages/reports/ReportsPage.vue -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// Lazy load chart components
const SalesChart = defineAsyncComponent({
  loader: () => import('@/components/charts/SalesChart.vue'),
  loadingComponent: ChartSkeleton,
  delay: 200,
})

const RevenueChart = defineAsyncComponent({
  loader: () => import('@/components/charts/RevenueChart.vue'),
  loadingComponent: ChartSkeleton,
  delay: 200,
})
</script>
```

### Async Component Wrapper

```typescript
// src/utils/asyncComponent.ts
import { defineAsyncComponent, h, type Component } from 'vue'
import { Loader2 } from 'lucide-vue-next'

interface AsyncComponentOptions {
  loader: () => Promise<Component>
  loadingText?: string
  errorText?: string
  delay?: number
  timeout?: number
}

export function createAsyncComponent(options: AsyncComponentOptions) {
  const {
    loader,
    loadingText = 'Loading...',
    errorText = 'Failed to load component',
    delay = 200,
    timeout = 30000,
  } = options

  return defineAsyncComponent({
    loader,
    delay,
    timeout,

    loadingComponent: {
      render() {
        return h('div', { class: 'flex items-center justify-center p-8' }, [
          h(Loader2, { class: 'h-6 w-6 animate-spin mr-2' }),
          h('span', { class: 'text-muted-foreground' }, loadingText),
        ])
      },
    },

    errorComponent: {
      render() {
        return h('div', { class: 'p-8 text-center text-destructive' }, errorText)
      },
    },
  })
}
```

---

## 8.5 Virtual Scrolling for Large Lists

### Virtual List Component

```vue
<!-- src/components/ui/VirtualList.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  items: any[]
  itemHeight: number
  containerHeight?: number
  overscan?: number
}

const props = withDefaults(defineProps<Props>(), {
  containerHeight: 400,
  overscan: 5,
})

const containerRef = ref<HTMLDivElement | null>(null)
const scrollTop = ref(0)

const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight)
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)

  return {
    start: Math.max(0, start - props.overscan),
    end: Math.min(props.items.length, start + visibleCount + props.overscan),
  }
})

const visibleItems = computed(() => {
  return props.items.slice(visibleRange.value.start, visibleRange.value.end).map((item, index) => ({
    item,
    index: visibleRange.value.start + index,
    style: {
      position: 'absolute' as const,
      top: `${(visibleRange.value.start + index) * props.itemHeight}px`,
      height: `${props.itemHeight}px`,
      width: '100%',
    },
  }))
})

const totalHeight = computed(() => props.items.length * props.itemHeight)

function handleScroll(event: Event) {
  const target = event.target as HTMLDivElement
  scrollTop.value = target.scrollTop
}
</script>

<template>
  <div
    ref="containerRef"
    :style="{ height: `${containerHeight}px`, overflow: 'auto' }"
    @scroll="handleScroll"
  >
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <div
        v-for="{ item, index, style } in visibleItems"
        :key="index"
        :style="style"
      >
        <slot :item="item" :index="index" />
      </div>
    </div>
  </div>
</template>
```

### Usage

```vue
<VirtualList
  :items="largeList"
  :item-height="48"
  :container-height="500"
>
  <template #default="{ item, index }">
    <div class="flex items-center px-4 border-b">
      <span>{{ index + 1 }}. {{ item.name }}</span>
    </div>
  </template>
</VirtualList>
```

---

## 8.6 Performance Monitoring

### Performance Observer

```typescript
// src/infrastructure/performance/PerformanceMonitor.ts
import { eventBus } from '@/infrastructure/events'
import { logger } from '@/infrastructure/logger'

interface PerformanceMetrics {
  name: string
  duration: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private marks = new Map<string, number>()

  /**
   * Start a performance measurement
   */
  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * End a performance measurement
   */
  measure(name: string): number | null {
    const startTime = this.marks.get(name)
    if (!startTime) return null

    const duration = performance.now() - startTime
    this.marks.delete(name)

    const metric: PerformanceMetrics = {
      name,
      duration,
      timestamp: Date.now(),
    }

    this.metrics.push(metric)

    // Log slow operations
    if (duration > 1000) {
      logger.warn('Slow operation detected', { name, duration })
    }

    return duration
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    this.mark(name)
    try {
      const result = await operation()
      this.measure(name)
      return result
    } catch (error) {
      this.measure(name)
      throw error
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get metrics summary
   */
  getSummary(): Record<string, { count: number; avg: number; max: number }> {
    const summary: Record<string, { count: number; total: number; max: number }> = {}

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { count: 0, total: 0, max: 0 }
      }
      summary[metric.name].count++
      summary[metric.name].total += metric.duration
      summary[metric.name].max = Math.max(summary[metric.name].max, metric.duration)
    }

    const result: Record<string, { count: number; avg: number; max: number }> = {}
    for (const [name, data] of Object.entries(summary)) {
      result[name] = {
        count: data.count,
        avg: data.total / data.count,
        max: data.max,
      }
    }

    return result
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.marks.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

### Web Vitals Tracking

```typescript
// src/infrastructure/performance/webVitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals'
import { logger } from '@/infrastructure/logger'

export function initWebVitals(): void {
  onCLS((metric) => {
    logger.info('CLS', { value: metric.value, rating: metric.rating })
  })

  onFID((metric) => {
    logger.info('FID', { value: metric.value, rating: metric.rating })
  })

  onLCP((metric) => {
    logger.info('LCP', { value: metric.value, rating: metric.rating })
  })

  onFCP((metric) => {
    logger.info('FCP', { value: metric.value, rating: metric.rating })
  })

  onTTFB((metric) => {
    logger.info('TTFB', { value: metric.value, rating: metric.rating })
  })
}
```

---

## 8.7 Performance Checklist

### Bundle Size Targets

| Chunk | Target Size (gzipped) |
|-------|----------------------|
| Initial (vendor + app) | < 150 KB |
| Vue core | < 50 KB |
| Route chunks (each) | < 50 KB |
| Charts | < 100 KB (lazy) |
| Exports (PDF/Excel) | < 150 KB (lazy) |

### Runtime Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| First Input Delay (FID) | < 100ms |

---

## 8.8 File Structure

```
src/
├── router/
│   ├── index.ts                # Main router
│   └── modules/
│       ├── accounting.ts
│       ├── purchasing.ts
│       ├── sales.ts
│       ├── inventory.ts
│       ├── manufacturing.ts
│       ├── settings.ts
│       └── reports.ts
│
├── infrastructure/
│   └── performance/
│       ├── index.ts
│       ├── PerformanceMonitor.ts
│       └── webVitals.ts
│
└── components/
    └── ui/
        └── VirtualList.vue
```

---

## Checklist

- [ ] Split routes into modules
- [ ] Configure Vite build optimization
- [ ] Implement manual chunks
- [ ] Lazy load heavy libraries (jsPDF, xlsx)
- [ ] Configure TanStack Query caching
- [ ] Implement query key factory
- [ ] Add optimistic updates
- [ ] Implement prefetching
- [ ] Create VirtualList component
- [ ] Add performance monitoring
- [ ] Integrate Web Vitals
- [ ] Run bundle analyzer
- [ ] Verify size targets

---

## Next Phase

Once Phase 8 is complete, proceed to [Phase 9: Migration & Cleanup](./09-PHASE-MIGRATION.md) for the final migration strategy.
