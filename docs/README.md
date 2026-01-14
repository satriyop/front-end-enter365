# Enter365 Frontend Documentation

> Vue 3 SPA for Solar ERP - Sales, Inventory, Projects, and Solar Proposal Management

## Quick Reference

| I want to... | Go to |
|--------------|-------|
| Set up the project | [Getting Started](getting-started/README.md) |
| Understand the architecture | [Architecture](architecture/README.md) |
| Use a UI component | [UI Components](components/UI-COMPONENTS.md) |
| Add an API hook | [API Hooks Pattern](api/HOOKS-PATTERN.md) |
| Understand solar calculations | [Solar Proposals](domain/SOLAR-PROPOSALS.md) |
| Fix a bug | [Troubleshooting](troubleshooting/README.md) |
| See module status | [Current State](reference/CURRENT-STATE.md) |

---

## Tech Stack at a Glance

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Vue 3 + Composition API | 3.5.13 |
| Language | TypeScript | 5.7.2 |
| Build | Vite | 6.0.5 |
| Styling | Tailwind CSS | 3.4.17 |
| UI Primitives | Radix Vue | 1.9.17 |
| Server State | TanStack Vue Query | 5.62.8 |
| Auth State | Pinia | 2.3.0 |
| Routing | Vue Router | 4.5.0 |
| HTTP Client | Axios | 1.7.9 |
| Icons | Lucide Vue Next | 0.562.0 |
| Forms | VeeValidate + Zod | 4.15.1 |
| Charts | Chart.js + vue-chartjs | 4.5.1 |
| Maps | Leaflet + vue-leaflet | 1.9.4 |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vue 3 SPA                                │
├─────────────────────────────────────────────────────────────────┤
│  Pages (route components)                                       │
│    └─→ Components (UI + feature)                                │
│          └─→ Composables (shared logic)                         │
│                └─→ API Hooks (TanStack Query)                   │
│                      └─→ Axios Client                           │
│                            └─→ Laravel API (/api/v1)            │
├─────────────────────────────────────────────────────────────────┤
│  Pinia Store (auth only) ──→ localStorage (token)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
src/
├── api/                    # TanStack Query hooks + Axios client
│   ├── client.ts           # Axios instance with interceptors
│   ├── types.ts            # OpenAPI-generated types (33K+ lines)
│   ├── useQuotations.ts    # Quotation CRUD + business ops
│   ├── useSolarProposals.ts # Solar proposal + calculations
│   └── [20+ hook files]
│
├── components/
│   ├── ui/                 # Design system (30 components)
│   ├── charts/             # Chart.js wrappers
│   ├── solar/              # Solar-specific components
│   └── maps/               # Leaflet map components
│
├── composables/            # Reusable Vue logic (17 files)
│   ├── useBatteryCalculator.ts
│   ├── useFinancingCalculator.ts
│   └── [more...]
│
├── pages/                  # Route-level components
│   ├── quotations/
│   ├── solar-proposals/
│   └── [21 directories]
│
├── stores/                 # Pinia (auth only)
│   └── auth.ts
│
├── layouts/                # App shell
├── router/                 # Vue Router config
├── utils/                  # Formatters, validators
└── styles/                 # Global CSS + print styles
```

See [FILE-STRUCTURE.md](reference/FILE-STRUCTURE.md) for complete listing.

---

## Business Domains

| Domain | Description | Key Routes |
|--------|-------------|------------|
| **Sales** | Quotations, Invoices, Contacts | `/quotations`, `/invoices`, `/contacts` |
| **Purchasing** | Bills, Payments | `/bills`, `/payments` |
| **Inventory** | Products, Stock, BOMs | `/products`, `/inventory`, `/boms` |
| **Projects** | Projects, Work Orders | `/projects`, `/work-orders` |
| **Solar** | Solar Proposals, Calculations | `/solar-proposals` |
| **Reports** | Financial Reports (8 types) | `/reports/*` |
| **Admin** | Users, Company Profiles | `/users`, `/company-profiles` |

---

## Key Patterns

### API Hook Pattern (Level 2)

```typescript
// src/api/useQuotations.ts
export function useQuotations(filters: Ref<QuotationFilters>) {
  return useQuery({
    queryKey: computed(() => ['quotations', filters.value]),
    queryFn: async () => {
      const response = await api.get('/quotations', { params: filters.value })
      return response.data
    },
  })
}
```

See [HOOKS-PATTERN.md](api/HOOKS-PATTERN.md) for complete guide.

### Component Import

```typescript
import { Button, Input, Select, Card, Badge, Modal } from '@/components/ui'
import { Plus, Edit, Trash2 } from 'lucide-vue-next'
```

See [UI-COMPONENTS.md](components/UI-COMPONENTS.md) for all components.

---

## Documentation Index

### Getting Started
- [README.md](getting-started/README.md) - 5-minute quickstart
- [ONBOARDING.md](getting-started/ONBOARDING.md) - Full developer onboarding
- [ENVIRONMENTS.md](getting-started/ENVIRONMENTS.md) - Environment configuration

### Architecture
- [README.md](architecture/README.md) - Architecture overview
- [TECH-STACK.md](architecture/TECH-STACK.md) - Technology decisions
- [STATE-MANAGEMENT.md](architecture/STATE-MANAGEMENT.md) - Pinia + TanStack Query
- [ROUTING.md](architecture/ROUTING.md) - Vue Router patterns
- [ADRs](architecture/adr/) - Architecture Decision Records

### API
- [README.md](api/README.md) - API integration overview
- [HOOKS-PATTERN.md](api/HOOKS-PATTERN.md) - TanStack Query patterns
- [MUTATIONS.md](api/MUTATIONS.md) - Create/Update/Delete patterns
- [ERROR-HANDLING.md](api/ERROR-HANDLING.md) - Error handling
- [AUTHENTICATION.md](api/AUTHENTICATION.md) - Auth flow

### Components
- [README.md](components/README.md) - Component catalog
- [DESIGN-TOKENS.md](components/DESIGN-TOKENS.md) - CSS variables
- [UI-COMPONENTS.md](components/UI-COMPONENTS.md) - Core components
- [FORM-PATTERNS.md](components/FORM-PATTERNS.md) - Form handling
- [DATA-DISPLAY.md](components/DATA-DISPLAY.md) - Tables, cards
- [LAYOUTS.md](components/LAYOUTS.md) - Page layouts

### Domain Knowledge
- [README.md](domain/README.md) - Business overview
- [SOLAR-PROPOSALS.md](domain/SOLAR-PROPOSALS.md) - Solar calculations
- [QUOTATION-WORKFLOW.md](domain/QUOTATION-WORKFLOW.md) - Sales flow
- [INVENTORY.md](domain/INVENTORY.md) - Stock + BOM
- [GLOSSARY.md](domain/GLOSSARY.md) - Indonesian EPC terms

### Testing & Deployment
- [Testing](testing/README.md) - Testing strategy
- [Deployment](deployment/README.md) - Build + CI/CD

### Reference
- [FILE-STRUCTURE.md](reference/FILE-STRUCTURE.md) - Complete file tree
- [CURRENT-STATE.md](reference/CURRENT-STATE.md) - Module status
- [CONTRIBUTING.md](reference/CONTRIBUTING.md) - Contribution guide

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run type-check       # TypeScript check
npm run lint             # ESLint fix

# Testing
npm run test             # Run Vitest
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report

# Types
npm run types:generate   # Regenerate API types from OpenAPI spec
```

---

*Last updated: January 2025*
