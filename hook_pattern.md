# Hook Pattern
## Hook Level 2 Vs Adapter Level 3
  ┌─────────────────────────────────────────────────────────────────┐
  │  IT DEPENDS ON YOUR CONTEXT                                     │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  The adapter pattern I described is:                            │
  │                                                                 │
  │  ✓ Used in enterprise (banks, large SaaS)                       │
  │  ✓ Taught in Clean Architecture / Hexagonal Architecture        │
  │  ✓ Necessary when frontend & backend are separate teams         │
  │                                                                 │
  │  BUT it's OVERENGINEERING for:                                  │
  │                                                                 │
  │  ✗ Solo developer or small team (1-3 people)                    │
  │  ✗ Same person doing frontend + backend                         │
  │  ✗ API that's reasonably well-designed                          │
  │  ✗ Projects that need to ship fast                              │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  The Spectrum of Approaches

  ┌─────────────────────────────────────────────────────────────────┐
  │  SIMPLE ◄────────────────────────────────────────► COMPLEX      │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Level 1          Level 2          Level 3         Level 4     │
  │  Direct Fetch     Hooks Layer      Adapter Layer   Full DDD    │
  │                                                                 │
  │  fetch() in       useQuotations()  Transform +     Domain       │
  │  component        hook             Adapter         Entities     │
  │                                                                 │
  │  ────────────────────────────────────────────────────────────── │
  │  Solo dev         Small team       Separate        Enterprise   │
  │  Prototype        Production       teams           Scale        │
  │  Move fast        Maintainable     Decoupled       Complex      │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  What Most Successful Projects Actually Do

  Level 2: Hooks Layer (RECOMMENDED for you)

  This is the sweet spot for most real-world projects:

  // api/useQuotations.ts
  // Simple, practical, not overengineered

  import { useQuery, useMutation } from '@tanstack/vue-query'
  import { api } from './client'

  // Types match API response (no separate "view" types)
  export interface Quotation {
    id: number
    quotation_number: string
    contact: {
      id: number
      company_name: string
    }
    status: 'draft' | 'submitted' | 'approved' | 'rejected'
    subtotal: number
    discount_percent: number
    tax_amount: number
    grand_total: number
    items: QuotationItem[]
    created_at: string
    valid_until: string
  }

  // Simple hook - no adapter, just fetch and return
  export function useQuotations(filters?: Ref<QuotationFilters>) {
    return useQuery({
      queryKey: ['quotations', filters],
      queryFn: () => api.get<Quotation[]>('/quotations', { params: filters?.value })
    })
  }

  export function useQuotation(id: number | Ref<number>) {
    return useQuery({
      queryKey: ['quotation', unref(id)],
      queryFn: () => api.get<Quotation>(`/quotations/${unref(id)}`)
    })
  }

  export function useCreateQuotation() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: (data: CreateQuotationData) => api.post('/quotations', data),
      onSuccess: () => queryClient.invalidateQueries(['quotations'])
    })
  }

  <!-- pages/quotations/index.vue -->
  <script setup lang="ts">
  import { useQuotations } from '@/api/useQuotations'
  import { formatCurrency, formatDate } from '@/utils/format'

  const filters = ref({ status: 'all' })
  const { data: quotations, isLoading } = useQuotations(filters)

  // Simple computed for derived data - no adapter needed
  const pendingCount = computed(() =>
    quotations.value?.filter(q => q.status === 'pending').length ?? 0
  )
  </script>

  <template>
    <div v-if="isLoading">Loading...</div>
    <div v-else>
      <QuotationTable
        :quotations="quotations"
        @view="router.push(`/quotations/${$event.id}`)"
      />
    </div>
  </template>

  When To Add Complexity

  ┌─────────────────────────────────────────────────────────────────┐
  │  ADD ADAPTER LAYER ONLY WHEN YOU FEEL THE PAIN                  │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Signs you need more abstraction:                               │
  │                                                                 │
  │  □ You're writing the same transformation in 5+ places          │
  │    → Extract to a function                                      │
  │                                                                 │
  │  □ API changes break multiple components frequently             │
  │    → Add adapter for THAT entity                                │
  │                                                                 │
  │  □ Backend returns data in weird shape you keep fighting        │
  │    → Transform at API boundary                                  │
  │                                                                 │
  │  □ You need to combine data from multiple endpoints             │
  │    → Composite hook or adapter                                  │
  │                                                                 │
  │  Key principle: Add complexity when you FEEL the pain,          │
  │  not in anticipation of pain that may never come.               │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  My Revised Recommendation

  ┌─────────────────────────────────────────────────────────────────┐
  │  PRAGMATIC APPROACH FOR YOUR PROJECT                            │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  1. START SIMPLE                                                │
  │     • Vue 3 + TypeScript + TanStack Query                       │
  │     • One hook per entity (useQuotations, useProjects)          │
  │     • Types that match your API responses                       │
  │     • Utility functions for formatting (currency, dates)        │
  │                                                                 │
  │  2. USE MOCKS FOR UNSTABLE ENDPOINTS                            │
  │     • MSW for endpoints not yet ready                           │
  │     • Switch to real API when ready                             │
  │                                                                 │
  │  3. EXTRACT WHEN NEEDED                                         │
  │     • Same calculation in 3+ places? → composable               │
  │     • Complex transformation? → utility function                │
  │     • API keeps changing one entity? → adapter for that one     │
  │                                                                 │
  │  4. DON'T PRE-OPTIMIZE                                          │
  │     • No adapter layer upfront                                  │
  │     • No separate "view" types upfront                          │
  │     • Add them if/when you need them                            │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  Practical Project Structure (Simpler)

  src/
  ├── api/
  │   ├── client.ts              # Axios instance
  │   ├── useAuth.ts             # Auth hooks
  │   ├── useQuotations.ts       # Quotation hooks + types
  │   ├── useProjects.ts         # Project hooks + types
  │   ├── useInventory.ts        # Inventory hooks + types
  │   └── ...
  │
  ├── components/
  │   ├── ui/                    # Design system
  │   └── features/              # Feature components
  │
  ├── composables/
  │   ├── usePermissions.ts      # Permission checking
  │   └── usePagination.ts       # Pagination logic
  │
  ├── utils/
  │   ├── format.ts              # formatCurrency, formatDate
  │   └── validation.ts          # Zod schemas
  │
  ├── pages/                     # Route pages
  │
  └── mocks/                     # MSW mocks (for dev)

