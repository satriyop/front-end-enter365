

# Strategy for Moving Target API

  ┌─────────────────────────────────────────────────────────────────┐
  │  THE PROBLEM                                                    │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Backend Team                    Frontend Team                  │
  │  ────────────                    ─────────────                  │
  │  • Adding endpoints              • Waiting for endpoints        │
  │  • Changing response shapes      • Breaking when API changes    │
  │  • Refactoring models            • Rewriting integration code   │
  │  • "It works on my machine"      • "API returned something else"│
  │                                                                 │
  │  Result: Frustration, bugs, wasted time                         │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  Recommended Approach: Contract-First + Adapter Layer

  1. The Adapter Pattern (Key Insight)

  ┌─────────────────────────────────────────────────────────────────┐
  │  ADAPTER LAYER - Your Safety Net                                │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
  │  │             │     │             │     │             │        │
  │  │  Backend    │────▶│  Adapter    │────▶│  Frontend   │        │
  │  │  API        │     │  Layer      │     │  Components │        │
  │  │             │     │             │     │             │        │
  │  └─────────────┘     └─────────────┘     └─────────────┘        │
  │                             │                                   │
  │  API can change       Only this        UI stays stable          │
  │  (moving target)      layer changes    (your investment)        │
  │                                                                 │
  │  Benefits:                                                      │
  │  • API changes? Update ONE file, not 50 components              │
  │  • Can mock adapter for testing                                 │
  │  • Frontend defines what it NEEDS, not what API GIVES           │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  2. Practical Implementation

  // ============================================
  // LAYER 1: What the Frontend NEEDS (stable)
  // ============================================

  // types/quotation.ts - YOUR contract, not the API's
  interface QuotationView {
    id: number
    number: string
    customerName: string
    customerEmail: string
    totalAmount: number        // Already calculated
    totalWithTax: number       // Already calculated
    status: QuotationStatus
    statusLabel: string        // Human readable
    canEdit: boolean           // Permission already resolved
    canSubmit: boolean
    canApprove: boolean
    createdAt: Date
    validUntil: Date
    isExpired: boolean         // Already calculated
    items: QuotationItemView[]
  }

  // ============================================
  // LAYER 2: Adapter - Transform API → Frontend
  // ============================================

  // api/adapters/quotation.adapter.ts
  import type { ApiQuotation } from '../generated'  // From API
  import type { QuotationView } from '@/types'      // What we need

  export function toQuotationView(
    api: ApiQuotation,
    permissions: UserPermissions
  ): QuotationView {
    const subtotal = api.items?.reduce((sum, i) => sum + i.amount, 0) ?? 0
    const discount = subtotal * (api.discount_percent / 100)
    const beforeTax = subtotal - discount
    const tax = beforeTax * 0.11  // PPN

    return {
      id: api.id,
      number: api.quotation_number,

      // Flatten nested data
      customerName: api.contact?.company_name ?? api.contact?.name ?? 'Unknown',
      customerEmail: api.contact?.email ?? '',

      // Pre-calculate values
      totalAmount: beforeTax,
      totalWithTax: beforeTax + tax,

      // Normalize status
      status: api.status as QuotationStatus,
      statusLabel: getStatusLabel(api.status),

      // Pre-resolve permissions
      canEdit: api.status === 'draft' && permissions.has('quotations.edit'),
      canSubmit: api.status === 'draft' && permissions.has('quotations.submit'),
      canApprove: api.status === 'submitted' && permissions.has('quotations.approve'),

      // Parse dates
      createdAt: new Date(api.created_at),
      validUntil: new Date(api.valid_until),
      isExpired: new Date(api.valid_until) < new Date(),

      // Transform items
      items: api.items?.map(toQuotationItemView) ?? [],
    }
  }

  // ============================================
  // LAYER 3: Hook uses adapter
  // ============================================

  // api/hooks/useQuotations.ts
  export function useQuotation(id: Ref<number>) {
    const { permissions } = useAuth()

    return useQuery({
      queryKey: ['quotation', id],
      queryFn: async () => {
        const response = await api.get(`/quotations/${id.value}`)
        // Transform here - components never see raw API
        return toQuotationView(response.data, permissions.value)
      },
    })
  }

  3. When API Changes

  ┌─────────────────────────────────────────────────────────────────┐
  │  SCENARIO: Backend changes quotation response                   │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Before: { discount_percent: 10 }                               │
  │  After:  { discount: { type: 'percent', value: 10 } }           │
  │                                                                 │
  │  WITHOUT Adapter:                                               │
  │  ─────────────────────────────────────────────────────────────  │
  │  • Find all 23 places using discount_percent                    │
  │  • Update each component                                        │
  │  • Hope you didn't miss any                                     │
  │  • Tests break everywhere                                       │
  │                                                                 │
  │  WITH Adapter:                                                  │
  │  ─────────────────────────────────────────────────────────────  │
  │  • Update ONE line in adapter:                                  │
  │                                                                 │
  │    // Before                                                    │
  │    const discount = subtotal * (api.discount_percent / 100)     │
  │                                                                 │
  │    // After                                                     │
  │    const discountValue = api.discount?.type === 'percent'       │
  │      ? subtotal * (api.discount.value / 100)                    │
  │      : api.discount?.value ?? 0                                 │
  │                                                                 │
  │  • All 23 components work unchanged                             │
  │  • Tests still pass                                             │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  4. Mock-First Development

  // ============================================
  // Develop UI before API is ready
  // ============================================

  // mocks/quotations.mock.ts
  export const mockQuotations: QuotationView[] = [
    {
      id: 1,
      number: 'QT-2024-001',
      customerName: 'PT Matahari Solar',
      totalAmount: 892_500_000,
      totalWithTax: 990_675_000,
      status: 'pending',
      statusLabel: 'Pending Approval',
      canEdit: false,
      canSubmit: false,
      canApprove: true,
      // ... complete mock data
    },
  ]

  // api/hooks/useQuotations.ts
  export function useQuotations(filters: Ref<QuotationFilters>) {
    const config = useRuntimeConfig()

    return useQuery({
      queryKey: ['quotations', filters],
      queryFn: async () => {
        // Use mocks in development if API not ready
        if (config.useMocks) {
          await delay(300) // Simulate network
          return filterMockQuotations(mockQuotations, filters.value)
        }

        // Real API call
        const response = await api.get('/quotations', { params: filters.value })
        return response.data.map(q => toQuotationView(q, permissions.value))
      },
    })
  }

  5. Folder Structure for Moving API

  src/
  ├── api/
  │   ├── adapters/              # 🔑 Transformation layer
  │   │   ├── quotation.adapter.ts
  │   │   ├── project.adapter.ts
  │   │   ├── invoice.adapter.ts
  │   │   └── __tests__/         # Test adapters heavily!
  │   │       └── quotation.adapter.spec.ts
  │   │
  │   ├── hooks/                 # Data fetching hooks
  │   │   ├── useQuotations.ts
  │   │   └── useProjects.ts
  │   │
  │   ├── client.ts              # Axios config
  │   │
  │   └── generated/             # Auto-generated (when stable)
  │       └── types.ts
  │
  ├── mocks/                     # Mock data for development
  │   ├── handlers.ts            # MSW handlers
  │   ├── fixtures/
  │   │   ├── quotations.ts
  │   │   └── projects.ts
  │   └── server.ts
  │
  ├── types/                     # 🔑 Frontend's contract
  │   ├── quotation.ts           # What UI needs
  │   ├── project.ts
  │   └── common.ts

  6. API Stability Levels

  ┌─────────────────────────────────────────────────────────────────┐
  │  TREAT ENDPOINTS DIFFERENTLY BY STABILITY                       │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  🟢 STABLE (Auth, Core CRUD)                                    │
  │  ─────────────────────────────────────────────────────────────  │
  │  • POST /auth/login                                             │
  │  • GET /quotations                                              │
  │  • GET /invoices                                                │
  │  → Can generate types, use directly                             │
  │                                                                 │
  │  🟡 EVOLVING (New features, complex queries)                    │
  │  ─────────────────────────────────────────────────────────────  │
  │  • GET /mrp-runs/{id}/suggestions                               │
  │  • GET /reports/project-profitability                           │
  │  • POST /work-orders/{id}/record-consumption                    │
  │  → Use adapter layer, expect changes                            │
  │                                                                 │
  │  🔴 EXPERIMENTAL (Not yet implemented)                          │
  │  ─────────────────────────────────────────────────────────────  │
  │  • Dashboard KPIs                                               │
  │  • Real-time notifications                                      │
  │  → Use mocks, define contract from UI needs                     │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  7. Communication Pattern

  ┌─────────────────────────────────────────────────────────────────┐
  │  FRONTEND-BACKEND CONTRACT                                      │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Create a shared document (or use GitHub issues):               │
  │                                                                 │
  │  ## Quotation List Endpoint                                     │
  │                                                                 │
  │  **Endpoint:** GET /api/v1/quotations                           │
  │  **Status:** 🟡 In Development                                  │
  │                                                                 │
  │  **Frontend Needs:**                                            │
  │  - [ ] Pagination (page, per_page)                              │
  │  - [ ] Filter by status                                         │
  │  - [ ] Filter by date range                                     │
  │  - [ ] Filter by customer                                       │
  │  - [ ] Sort by date, amount, customer                           │
  │  - [ ] Include customer name (avoid N+1)                        │
  │  - [ ] Include item count                                       │
  │                                                                 │
  │  **Response Shape (agreed):**                                   │
  │  ```json                                                        │
  │  {                                                              │
  │    "data": [...],                                               │
  │    "meta": { "current_page": 1, "total": 100 }                  │
  │  }                                                              │
  │  ```                                                            │
  │                                                                 │
  │  **Breaking Changes:**                                          │
  │  - 2024-12-20: Changed discount to object (migration needed)    │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  ---
  My Practical Recommendation

  ┌─────────────────────────────────────────────────────────────────┐
  │  ACTION PLAN FOR MOVING API                                     │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  1. START WITH MOCKS (Don't wait for API)                       │
  │     • Define what UI needs first                                │
  │     • Build complete mock data                                  │
  │     • Develop full UI flow                                      │
  │                                                                 │
  │  2. CREATE ADAPTER LAYER (Before connecting)                    │
  │     • Transform API → Frontend types                            │
  │     • Handle nulls, defaults, calculations                      │
  │     • Test adapters thoroughly                                  │
  │                                                                 │
  │  3. CONNECT INCREMENTALLY                                       │
  │     • Replace mocks with real API one endpoint at a time        │
  │     • Keep mocks as fallback                                    │
  │     • Adapter absorbs API quirks                                │
  │                                                                 │
  │  4. ACCEPT SOME DUPLICATION                                     │
  │     • It's OK if frontend types differ from API                 │
  │     • Better than tight coupling                                │
  │     • Adapter is the translation layer                          │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  ★ Insight ─────────────────────────────────────
  The Core Principle: Your frontend components should never know the shape of the API response. They only know the shape of QuotationView, ProjectView, etc. When API changes, you update the adapter, not 50 components.

  Trade-off: Slight duplication (API types vs Frontend types) in exchange for massive decoupling and stability.
  ─────────────────────────────────────────────────

  ---