# Enter365 Frontend Architecture

## Overview
Enter365 is a Vue 3 SPA (Single Page Application) for an ERP system. It follows SOLID principles with a layered architecture.

## Project Structure

```
src/
├── api/                    # TanStack Query hooks for API calls
│   ├── factory/            # CRUD hook factory (createCrudHooks)
│   ├── queryClient.ts      # Query client configuration
│   ├── queryKeys.ts        # Cache key factory
│   └── use*.ts             # 47 module-specific hooks
│
├── components/
│   ├── charts/             # Data visualization (Bar, Doughnut, Line, etc.)
│   ├── document/           # Document layouts & shared components
│   │   ├── DocumentFormLayout.vue
│   │   ├── DocumentDetailLayout.vue
│   │   ├── ListPageContainer.vue
│   │   ├── LineItemsTable.vue
│   │   ├── TotalsSummary.vue
│   │   └── WorkflowActions.vue
│   ├── invoices/           # Invoice-specific (reminders, scheduling)
│   ├── maps/               # LocationMapPicker
│   ├── projects/           # Project tasks, costs, revenues
│   ├── quotations/         # Follow-up, activity logging, BOM creation
│   ├── solar/              # Solar proposal components
│   └── ui/                 # 30+ reusable UI primitives
│       ├── Button, Input, Select, Textarea, CurrencyInput
│       ├── Card, StatCard, Badge, StatusBadge, Alert
│       ├── Modal, ConfirmDialog, ConfirmationModal
│       ├── DataTable, ResponsiveTable, VirtualTable, VirtualList
│       ├── FilterBar, FilterGroup, FilterPresetDropdown
│       ├── FormField, Pagination, Breadcrumbs
│       ├── EmptyState, LoadingSkeleton, PageSkeleton
│       ├── CopyButton, ExportButton, ThemeToggle, PullToRefresh
│       └── Toast/          # Toast notification system
│
├── composables/            # Vue composition functions
│   ├── useDocumentForm/    # Form state & validation
│   ├── useLineItems/       # Line item management
│   ├── useDocumentWorkflow/# State machine integration (6 workflows)
│   ├── useResourceList/    # List page patterns
│   ├── useResourceDetail/  # Detail page patterns
│   └── 21 root-level composables (autosave, bulk, clipboard, etc.)
│
├── config/                 # Application configuration
│   └── featureFlags.ts     # Feature flag definitions
│
├── infrastructure/         # Core infrastructure
│   ├── events/             # Event bus (24 events, 8 categories)
│   ├── logger/             # Structured logging with transports
│   ├── container/          # Dependency injection
│   ├── errors/             # 8 custom error types + 11 guards
│   ├── features/           # Feature flag system
│   ├── performance/        # Performance monitoring
│   ├── types/              # Generic type utilities
│   └── bootstrap.ts        # Infrastructure initialization
│
├── layouts/                # App layout components
│   ├── AppLayout.vue
│   └── AppSidebar.vue
│
├── pages/                  # Route page components (26 directories)
│   ├── accounting/         # accounts, bank-reconciliation, budgets,
│   │                       # fiscal-periods, journal-entries, recurring-templates
│   ├── bills/
│   ├── boms/
│   ├── company-profiles/
│   ├── contacts/
│   ├── finance/            # down-payments, reminders
│   ├── inventory/
│   ├── invoices/
│   ├── manufacturing/      # cost-optimization, material-requisitions,
│   │                       # mrp, subcontractor-invoices, subcontractor-work-orders
│   ├── payments/
│   ├── products/
│   ├── projects/
│   ├── public/
│   ├── purchasing/         # goods-receipt-notes, purchase-orders, purchase-returns
│   ├── quotations/
│   ├── reports/            # 30+ report pages
│   ├── sales/              # delivery-orders, follow-up, overdue, sales-returns
│   ├── settings/           # accounting-policies, bom-templates, component-library,
│   │                       # nsfp-ranges, product-categories, roles, rule-sets, warehouses
│   ├── solar-proposals/
│   ├── users/
│   └── work-orders/
│
├── router/                 # Vue Router (250+ named routes)
│   └── index.ts
│
├── services/               # Domain services (9 services)
│   ├── calculation/        # Tax, discount, rounding strategies
│   ├── document-number/    # Document numbering strategies
│   ├── export/             # CSV, Excel export strategies
│   ├── line-items/         # Line item operations
│   ├── notification/       # Toast, browser push strategies
│   ├── pricing/            # Price calculation strategies
│   ├── state-machine/      # Workflow state machines (3 machines)
│   └── status/             # Status management registry
│
├── stores/                 # Pinia stores (minimal use)
│   └── auth.ts
│
├── test/                   # Test utilities
│   ├── factories/          # 5 test data factories
│   └── mocks/              # API mock utilities
│
└── utils/                  # Utility functions
    ├── asyncComponent.ts   # Lazy loading
    ├── deprecation.ts      # Migration helpers
    ├── format.ts           # Formatters
    └── validation.ts       # Zod validation schemas
```

## Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                      Pages                          │
│  (Route components - orchestrate everything)        │
├─────────────────────────────────────────────────────┤
│                   Composables                       │
│  (Reusable logic - forms, lists, workflows)         │
├─────────────────────────────────────────────────────┤
│                    Services                         │
│  (Domain logic - calculations, status, exports)     │
├─────────────────────────────────────────────────────┤
│                  Infrastructure                     │
│  (Cross-cutting - events, logging, DI, errors)      │
├─────────────────────────────────────────────────────┤
│                   API Layer                         │
│  (TanStack Query hooks - data fetching & caching)   │
└─────────────────────────────────────────────────────┘
```

## SOLID Principles Applied

### Single Responsibility (S)
- Each service handles ONE domain concept
- `CalculationService` - only calculations
- `StatusService` - only status management
- `ExportService` - only exports

### Open/Closed (O)
- Services use Strategy Pattern for extension
- Add new tax strategy without modifying CalculationService
- Add new export format without modifying ExportService

### Liskov Substitution (L)
- All strategies implement common interfaces
- `TaxStrategy` interface works for PPN, inclusive, no-tax

### Interface Segregation (I)
- Small, focused interfaces
- `TaxStrategy` only has `calculate()` method
- `ExportStrategy` only has `export()` method

### Dependency Inversion (D)
- Services depend on abstractions (interfaces)
- DI Container provides concrete implementations
- Easy to swap implementations for testing

## Key Conventions

### File Naming
- Components: `PascalCase.vue` (e.g., `QuotationFormPage.vue`)
- Composables: `camelCase.ts` with `use` prefix (e.g., `useDocumentForm.ts`)
- Services: `PascalCase.ts` (e.g., `CalculationService.ts`)
- Types: `types.ts` in each module folder
- Tests: `*.test.ts` in `__tests__/` folder

### Import Aliases
```typescript
import { Button } from '@/components/ui'
import { DocumentFormLayout } from '@/components/document'
import { useDocumentForm } from '@/composables'
import { calculationService } from '@/services'
import { eventBus, logger } from '@/infrastructure'
import { useQuotations } from '@/api/useQuotations'
```

### Module Index Pattern
Every module has an `index.ts` barrel export:
```typescript
// src/services/calculation/index.ts
export { calculationService, CalculationService } from './CalculationService'
export { useCalculation } from './useCalculation'
export * from './strategies'
export type * from './types'
```

### Page Naming Convention
Resources follow consistent naming:
- `{Entity}ListPage.vue` - List view
- `{Entity}FormPage.vue` - Create/Edit form
- `{Entity}DetailPage.vue` - Detail view
- Special: `{Entity}WizardPage.vue`, `{Entity}DashboardPage.vue`

## Backend API
- Path: `/Users/satriyo/dev/laravel-project/enter365`
- Laravel API with Sanctum authentication
- REST endpoints at `/api/*`
- Types auto-generated from Dedoc Scramble in `src/api/types.ts`
