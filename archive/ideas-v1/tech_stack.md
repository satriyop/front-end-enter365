# Tech Stack

Recommended Tech Stack & Architecture

  1. Core Stack

  ┌─────────────────────────────────────────────────────────────────┐
  │  RECOMMENDED STACK                                              │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Framework:     Vue 3 + Composition API + TypeScript            │
  │  Build:         Vite                                            │
  │  Styling:       Tailwind CSS                                    │
  │  State:         Pinia + TanStack Query (Vue Query)              │
  │  Routing:       Vue Router                                      │
  │  Forms:         VeeValidate + Zod                               │
  │  Components:    Headless UI + Custom components                 │
  │  Testing:       Vitest + Vue Test Utils + Playwright            │
  │  API Client:    Generated from OpenAPI spec                     │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  2. Key Architectural Decisions

  A. API Type Safety (Critical for 59 models)

  ┌─────────────────────────────────────────────────────────────────┐
  │  OPTION 1: Generate Types from Laravel (Recommended)            │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Backend: Install laravel-openapi or scramble                   │
  │           → Generates OpenAPI spec from your API                │
  │                                                                 │
  │  Frontend: Use openapi-typescript-codegen                       │
  │           → Generates TypeScript types + API client             │
  │                                                                 │
  │  Benefits:                                                      │
  │  ✓ Types always match API responses                             │
  │  ✓ Auto-complete for all endpoints                              │
  │  ✓ Compile-time errors when API changes                         │
  │  ✓ Zero manual type maintenance                                 │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  B. Folder Structure

  src/
  ├── api/                    # Generated API client + custom hooks
  │   ├── generated/          # Auto-generated from OpenAPI
  │   ├── hooks/              # useQuotations(), useProjects(), etc.
  │   └── client.ts           # Axios instance with interceptors
  │
  ├── components/
  │   ├── ui/                 # Design system primitives
  │   │   ├── Button/
  │   │   ├── Card/
  │   │   ├── Input/
  │   │   └── ...
  │   ├── features/           # Feature-specific components
  │   │   ├── quotations/
  │   │   ├── projects/
  │   │   └── inventory/
  │   └── layouts/            # App shell, sidebar, etc.
  │
  ├── composables/            # Shared Vue composables
  │   ├── useAuth.ts
  │   ├── useCurrency.ts
  │   └── usePermissions.ts
  │
  ├── pages/                  # Route-level components
  │   ├── dashboard/
  │   ├── quotations/
  │   └── projects/
  │
  ├── stores/                 # Pinia stores (minimal - for UI state)
  │   ├── auth.ts
  │   ├── ui.ts               # Sidebar state, theme, etc.
  │   └── notifications.ts
  │
  ├── types/                  # Additional TypeScript types
  │   ├── index.ts
  │   └── status.ts
  │
  ├── utils/                  # Pure utility functions
  │   ├── format.ts           # Currency, date formatting
  │   └── validation.ts       # Zod schemas
  │
  └── __tests__/              # Test files (mirror src structure)

  3. Testing Strategy

  ┌─────────────────────────────────────────────────────────────────┐
  │  TESTING PYRAMID                                                │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Layer 1: UNIT TESTS (Vitest)                     ~60% coverage │
  │  ─────────────────────────────────────────────────────────────  │
  │  • Utility functions (formatCurrency, daysRemaining)            │
  │  • Composables (usePermissions, usePagination)                  │
  │  • Pinia stores                                                 │
  │  • Zod validation schemas                                       │
  │                                                                 │
  │  Layer 2: COMPONENT TESTS (Vitest + Vue Test Utils) ~30%        │
  │  ─────────────────────────────────────────────────────────────  │
  │  • UI components in isolation (Button, Card, Table)             │
  │  • Feature components with mocked API                           │
  │  • Form validation behavior                                     │
  │                                                                 │
  │  Layer 3: E2E TESTS (Playwright)                    ~10%        │
  │  ─────────────────────────────────────────────────────────────  │
  │  • Critical user journeys only:                                 │
  │    - Login flow                                                 │
  │    - Create quotation → Submit → Approve                        │
  │    - Create PO → Receive goods                                  │
  │    - Record payment                                             │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  4. API Layer Design (Minimize Coupling)

  // api/hooks/useQuotations.ts
  // Using TanStack Query for caching, refetching, optimistic updates

  import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
  import { quotationsApi } from '../generated'
  import type { Quotation, CreateQuotationRequest } from '../generated'

  // Query keys factory - prevents key typos, enables invalidation
  export const quotationKeys = {
    all: ['quotations'] as const,
    lists: () => [...quotationKeys.all, 'list'] as const,
    list: (filters: QuotationFilters) => [...quotationKeys.lists(), filters] as const,
    details: () => [...quotationKeys.all, 'detail'] as const,
    detail: (id: number) => [...quotationKeys.details(), id] as const,
  }

  // Fetch list with filters
  export function useQuotations(filters: Ref<QuotationFilters>) {
    return useQuery({
      queryKey: computed(() => quotationKeys.list(filters.value)),
      queryFn: () => quotationsApi.getQuotations(filters.value),
      staleTime: 30_000, // 30 seconds
    })
  }

  // Fetch single quotation
  export function useQuotation(id: Ref<number>) {
    return useQuery({
      queryKey: computed(() => quotationKeys.detail(id.value)),
      queryFn: () => quotationsApi.getQuotation(id.value),
      enabled: computed(() => !!id.value),
    })
  }

  // Create mutation with optimistic update
  export function useCreateQuotation() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: (data: CreateQuotationRequest) => quotationsApi.createQuotation(data),
      onSuccess: () => {
        // Invalidate list to refetch
        queryClient.invalidateQueries({ queryKey: quotationKeys.lists() })
      },
    })
  }

  5. Avoiding Tech Debt: Key Rules

  ┌─────────────────────────────────────────────────────────────────┐
  │  TECH DEBT PREVENTION RULES                                     │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  1. NO INLINE API CALLS                                         │
  │     ✗ fetch('/api/quotations') in components                    │
  │     ✓ useQuotations() hook with typed response                  │
  │                                                                 │
  │  2. NO DUPLICATED TYPES                                         │
  │     ✗ Manually defining Quotation interface                     │
  │     ✓ Import from generated types                               │
  │                                                                 │
  │  3. NO BUSINESS LOGIC IN COMPONENTS                             │
  │     ✗ Complex calculations in template                          │
  │     ✓ Composables or utility functions                          │
  │                                                                 │
  │  4. SINGLE SOURCE OF TRUTH FOR UI STATE                         │
  │     ✗ Multiple places tracking sidebar open/closed              │
  │     ✓ One Pinia store for UI state                              │
  │                                                                 │
  │  5. COLOCATE TESTS WITH CODE                                    │
  │     ✗ tests/components/Button.spec.ts                           │
  │     ✓ components/ui/Button/Button.spec.ts                       │
  │                                                                 │
  │  6. STRICT TYPESCRIPT                                           │
  │     tsconfig: "strict": true, "noImplicitAny": true             │
  │                                                                 │
  │  7. COMPONENT BOUNDARIES                                        │
  │     • UI components: No API calls, receive props                │
  │     • Feature components: Use hooks, handle data                │
  │     • Page components: Orchestrate features, handle routing     │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  6. Development Workflow

  ┌─────────────────────────────────────────────────────────────────┐
  │  SAFE DEVELOPMENT WORKFLOW                                      │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  STEP 1: Backend adds/changes endpoint                          │
  │          ↓                                                      │
  │  STEP 2: Regenerate OpenAPI spec                                │
  │          php artisan openapi:generate                           │
  │          ↓                                                      │
  │  STEP 3: Regenerate frontend types                              │
  │          npm run generate:api                                   │
  │          ↓                                                      │
  │  STEP 4: TypeScript shows errors where API changed              │
  │          (Compile-time safety!)                                 │
  │          ↓                                                      │
  │  STEP 5: Fix affected code                                      │
  │          ↓                                                      │
  │  STEP 6: Run tests                                              │
  │          npm run test                                           │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  7. Mock Server for Safe Development

  // Use MSW (Mock Service Worker) for development without backend

  // mocks/handlers.ts
  import { rest } from 'msw'
  import { quotationsFixtures } from './fixtures/quotations'

  export const handlers = [
    rest.get('/api/v1/quotations', (req, res, ctx) => {
      return res(ctx.json(quotationsFixtures))
    }),

    rest.post('/api/v1/quotations', async (req, res, ctx) => {
      const body = await req.json()
      return res(ctx.json({ id: 999, ...body, status: 'draft' }))
    }),
  ]

  // Benefits:
  // ✓ Frontend devs can work without backend running
  // ✓ Consistent test data
  // ✓ Test edge cases (errors, slow responses)
  // ✓ Works in tests AND development

  ---
  My Recommendation: Start With

  ┌─────────────────────────────────────────────────────────────────┐
  │  IMPLEMENTATION ORDER                                           │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Phase 1: Foundation (Week 1)                                   │
  │  ─────────────────────────────────────────────────────────────  │
  │  □ Set up Vue 3 + TypeScript + Vite project                     │
  │  □ Install & configure Tailwind with design tokens              │
  │  □ Set up Laravel OpenAPI generation (scramble package)         │
  │  □ Generate TypeScript types from API                           │
  │  □ Configure TanStack Query                                     │
  │  □ Set up MSW for mocking                                       │
  │  □ Configure Vitest                                             │
  │                                                                 │
  │  Phase 2: Core UI (Week 2)                                      │
  │  ─────────────────────────────────────────────────────────────  │
  │  □ Build design system components (Button, Input, Card, Table)  │
  │  □ Build app shell (Sidebar, Header, Layout)                    │
  │  □ Implement auth flow                                          │
  │  □ Write component tests                                        │
  │                                                                 │
  │  Phase 3: First Feature (Week 3)                                │
  │  ─────────────────────────────────────────────────────────────  │
  │  □ Dashboard page                                               │
  │  □ Quotation list + detail + create                             │
  │  □ Integration tests                                            │
  │                                                                 │
  │  Phase 4: Expand (Week 4+)                                      │
  │  ─────────────────────────────────────────────────────────────  │
  │  □ Projects, Invoices, Inventory modules                        │
  │  □ E2E tests for critical paths                                 │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  ★ Insight ─────────────────────────────────────
  Why This Approach Works for Your API:
  1. 59 models = 59+ potential type mismatches - Generated types eliminate this
  2. Complex workflows (Quotation → Invoice → Payment) - TanStack Query handles cache invalidation
  3. Multiple user roles - Composable usePermissions() centralizes auth logic
  4. Indonesian localization - Utility functions tested once, used everywhere
  ─────────────────────────────────────────────────