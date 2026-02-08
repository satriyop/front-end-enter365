# Enter365 Frontend Documentation

> Vue 3 SPA for Solar ERP - Sales, Inventory, Projects, and Solar Proposal Management

---

## Start Here

| You are... | Start with |
|------------|------------|
| **AI Agent (Claude, GPT, etc.)** | [AGENT.md](AGENT.md) - Essential rules and patterns |
| **New Developer** | [Getting Started](getting-started/README.md) - 5-minute setup |
| **Working Developer** | [Quick Reference](QUICK-REFERENCE.md) - Daily cheat sheet |
| **Debugging an Issue** | [Runbook](troubleshooting/RUNBOOK.md) - Diagnostic procedures |

---

## Quick Reference

| I want to... | Go to |
|--------------|-------|
| Set up the project | [Getting Started](getting-started/README.md) |
| Understand the architecture | [Architecture](architecture/README.md) |
| Use a UI component | [UI Components](components/UI-COMPONENTS.md) |
| Add an API hook | [API Hooks Pattern](api/HOOKS-PATTERN.md) |
| Understand solar calculations | [Solar Proposals](domain/SOLAR-PROPOSALS.md) |
| Fix a bug | [Troubleshooting](troubleshooting/README.md) |
| Find which module owns a feature | [Module Registry](reference/MODULE-REGISTRY.md) |
| Contribute code | [Contributing](reference/CONTRIBUTING.md) |
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
├── api/                    # TanStack Query hooks + Axios client (47 hook files)
│   ├── client.ts           # Axios instance with interceptors
│   ├── types.ts            # OpenAPI-generated types (33K+ lines)
│   └── use*.ts             # CRUD + business action hooks
│
├── components/             # 76 total components
│   ├── ui/                 # Design system (30 components)
│   ├── document/           # Reusable document page patterns
│   ├── charts/             # Chart.js wrappers
│   ├── solar/              # Solar-specific components
│   ├── projects/           # Project task/cost/revenue modals
│   └── [more...]
│
├── services/               # Strategy-pattern domain services (8 modules)
│   ├── calculation/        # Tax, discount, rounding strategies
│   ├── state-machine/      # Workflow machines (quotation, invoice, PO)
│   ├── pricing/            # Pricing strategies
│   └── [more...]
│
├── infrastructure/         # Cross-cutting concerns (6 modules)
│   ├── container/          # Dependency injection
│   ├── events/             # Publish/subscribe event bus
│   ├── features/           # Feature flags
│   └── logger/             # Structured logging
│
├── composables/            # Reusable Vue logic (22 files)
│
├── pages/                  # Route-level components (173 pages)
│   ├── accounting/         # Accounts, JE, fiscal periods, budgets
│   ├── purchasing/         # POs, GRNs, purchase returns
│   ├── sales/              # DOs, sales returns, follow-up
│   ├── manufacturing/      # MR, MRP, subcontracting
│   ├── finance/            # Down payments, reminders
│   └── [more...]
│
├── stores/                 # Pinia (auth only)
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
| **Accounting** | Chart of Accounts, Journal Entries, Fiscal Periods, Budgets, Bank Reconciliation | `/accounting/*` |
| **Sales** | Quotations, Invoices, Contacts, Delivery Orders, Sales Returns, Follow-Up | `/quotations`, `/invoices`, `/contacts`, `/sales/*` |
| **Purchasing** | Purchase Orders, Goods Receipt Notes, Bills, Payments, Purchase Returns | `/purchasing/*`, `/bills`, `/payments` |
| **Finance** | Down Payments, Payment Reminders | `/finance/*` |
| **Inventory** | Products, Stock, BOMs, Stock Opname, Warehouses | `/products`, `/inventory`, `/boms` |
| **Manufacturing** | Work Orders, Material Requisitions, MRP, Subcontracting | `/work-orders`, `/manufacturing/*` |
| **Projects** | Projects with Tasks, Costs, Revenue | `/projects` |
| **Solar** | Solar Proposals, Calculations | `/solar-proposals` |
| **Reports** | Financial Reports (8 types) + Exports | `/reports/*` |
| **Admin** | Users, Roles, Warehouses, Categories, NSFP Ranges | `/users`, `/settings/*` |

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

### Quick Access (NEW)
- [AGENT.md](AGENT.md) - AI Agent onboarding (Claude, GPT)
- [QUICK-REFERENCE.md](QUICK-REFERENCE.md) - Developer cheat sheet

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

### Troubleshooting
- [README.md](troubleshooting/README.md) - Quick diagnostic
- [RUNBOOK.md](troubleshooting/RUNBOOK.md) - Operational debugging procedures

### Reference
- [MODULE-REGISTRY.md](reference/MODULE-REGISTRY.md) - Module ownership map
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

*Last updated: February 2025*
