# Enter365 Frontend Architecture

## Overview
Enter365 is a Vue 3 SPA (Single Page Application) for an ERP system. It follows SOLID principles with a layered architecture.

## Project Structure

```
src/
├── api/                    # TanStack Query hooks for API calls
│   ├── factory/            # CRUD hook factory
│   ├── queryClient.ts      # Query client configuration
│   ├── queryKeys.ts        # Cache key factory
│   └── use*.ts             # Module-specific hooks
│
├── components/
│   ├── document/           # Document-specific components
│   │   ├── LineItemsTable.vue
│   │   ├── DocumentFormLayout.vue
│   │   ├── DocumentDetailLayout.vue
│   │   └── TotalsSummary.vue
│   └── ui/                 # Reusable UI primitives
│       ├── Button.vue
│       ├── Input.vue
│       ├── Select.vue
│       ├── Card.vue
│       ├── Badge.vue
│       ├── Modal.vue
│       ├── VirtualList.vue
│       └── ResponsiveTable.vue
│
├── composables/            # Vue composition functions
│   ├── useDocumentForm/    # Form state & validation
│   ├── useLineItems/       # Line item management
│   ├── useDocumentWorkflow/# State machine integration
│   ├── useResourceList/    # List page patterns
│   └── useResourceDetail/  # Detail page patterns
│
├── config/                 # Application configuration
│   └── featureFlags.ts     # Feature flag definitions
│
├── infrastructure/         # Core infrastructure
│   ├── events/             # Event bus (pub/sub)
│   ├── logger/             # Structured logging
│   ├── container/          # Dependency injection
│   ├── errors/             # Custom error types
│   ├── features/           # Feature flag system
│   ├── performance/        # Performance monitoring
│   └── types/              # Generic type utilities
│
├── layouts/                # App layout components
│   ├── AppLayout.vue
│   └── AppSidebar.vue
│
├── pages/                  # Route page components
│   ├── accounting/
│   ├── bills/
│   ├── contacts/
│   ├── finance/
│   ├── invoices/
│   ├── manufacturing/
│   ├── products/
│   ├── purchasing/
│   ├── quotations/
│   ├── reports/
│   ├── sales/
│   ├── settings/
│   └── solar-proposals/
│
├── services/               # Domain services
│   ├── calculation/        # Tax, discount, rounding strategies
│   ├── document-number/    # Document numbering
│   ├── export/             # PDF, Excel, CSV export
│   ├── line-items/         # Line item operations
│   ├── notification/       # Toast, browser notifications
│   ├── pricing/            # Price calculations
│   ├── state-machine/      # Workflow state machines
│   └── status/             # Status management
│
├── stores/                 # Pinia stores (minimal use)
│   └── auth.ts
│
├── test/                   # Test utilities
│   ├── factories/          # Test data factories
│   └── mocks/              # API mock utilities
│
└── utils/                  # Utility functions
    ├── asyncComponent.ts   # Lazy loading
    ├── deprecation.ts      # Migration helpers
    ├── format.ts           # Formatters
    └── validation.ts       # Validation rules
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

## Backend API
- Path: `/Users/satriyo/dev/laravel-project/enter365`
- Laravel API with Sanctum authentication
- REST endpoints at `/api/*`
