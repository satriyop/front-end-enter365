# Enter365 Frontend Major Refactoring Plan

## Vision Statement

Transform Enter365's Vue 3 frontend from a functional but duplicative codebase into a **clean, testable, and extensible** application by applying SOLID principles, design patterns (Strategy, State Machine, Event-Driven), and modern software engineering practices.

---

## Executive Summary

### Current State Assessment

| Metric | Current | Target |
|--------|---------|--------|
| Code Duplication | High (~40% in form pages) | < 10% |
| Test Coverage | ~5% | > 70% |
| Type Safety | Partial (many `as any` casts) | Full coverage |
| Component Reusability | Medium | High |
| Observability | Minimal | Full event tracing |
| Extensibility | Low (hardcoded flows) | Plugin-like strategies |

### Key Pain Points Identified

1. **15+ form pages** with nearly identical line item tables and totals calculation
2. **20+ list pages** with duplicated loading/error/empty states
3. **Status workflows** (submit/approve/reject) reimplemented per module
4. **No event system** for cross-cutting concerns (analytics, audit logging)
5. **No state machine** for document lifecycle management
6. **Limited testability** due to tightly coupled components

### Refactoring Goals

| Goal | How We'll Achieve It |
|------|---------------------|
| **Minimize Tech Debt** | Extract common patterns into reusable abstractions |
| **Improve Stability** | Type safety + comprehensive tests + error boundaries |
| **Testability** | Dependency injection + mockable services |
| **Extensibility** | Strategy pattern for pluggable behaviors |
| **Flexibility** | State machines for configurable workflows |
| **Observability** | Event-driven architecture with logging hooks |

---

## Phased Implementation Plan

### [Phase 1: Foundation & Core Infrastructure](./01-PHASE-FOUNDATION.md)
**Duration Focus:** Core systems that everything else builds upon

- Error handling infrastructure
- Event bus system (publish/subscribe)
- Logging & observability foundation
- Type system improvements
- Service container / DI setup

### [Phase 2: Domain Services & Business Logic](./02-PHASE-DOMAIN-SERVICES.md)
**Duration Focus:** Extract and centralize business logic

- Document calculations service (Strategy pattern)
- Status workflow service (State Machine pattern)
- Line items management service
- Validation service with Zod refinements

### [Phase 3: Composables Consolidation](./03-PHASE-COMPOSABLES.md)
**Duration Focus:** Create powerful, reusable composables

- `useDocumentForm` - unified form lifecycle
- `useLineItems` - line item CRUD with calculations
- `useDocumentWorkflow` - status transitions
- `useResourceDetail` - detail page abstraction
- Enhanced `useResourceList` with states

### [Phase 4: Component Architecture](./04-PHASE-COMPONENTS.md)
**Duration Focus:** Reduce component duplication

- `LineItemsTable` - universal line items component
- `DocumentDetailLayout` - standard detail page layout
- `DocumentFormLayout` - standard form page layout
- `ResponsiveTable` enhancements (built-in states)
- `StatusBadge` with centralized mappings

### [Phase 5: Strategy Pattern Implementation](./05-PHASE-STRATEGY-PATTERN.md)
**Duration Focus:** Pluggable behaviors for flexibility

- Export strategies (PDF, Excel, CSV)
- Calculation strategies (tax, discount, rounding)
- Validation strategies (per-document rules)
- Notification strategies (toast, email, webhook)

### [Phase 6: State Machine Implementation](./06-PHASE-STATE-MACHINE.md)
**Duration Focus:** Formal document lifecycle management

- XState/custom state machine for documents
- Workflow configuration per document type
- Transition guards and side effects
- Visual state diagrams generation

### [Phase 7: Testing Infrastructure](./07-PHASE-TESTING.md)
**Duration Focus:** Comprehensive test coverage

- Test utilities and factories
- Unit tests for services
- Component tests for UI
- Integration tests for workflows
- E2E test setup

### [Phase 8: Performance & Optimization](./08-PHASE-PERFORMANCE.md)
**Duration Focus:** Speed and efficiency

- Route splitting and lazy loading
- Bundle optimization
- API request caching strategies
- Virtual scrolling for large lists

### [Phase 9: Migration & Cleanup](./09-PHASE-MIGRATION.md)
**Duration Focus:** Safe migration of existing code

- Gradual migration strategy
- Feature flags for new components
- Deprecation workflow
- Documentation updates

---

## Architecture Diagrams

### Target Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vue Components                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ ListPage │  │ FormPage │  │DetailPage│  │ Domain Components│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼─────────────┼──────────────────┼──────────┘
        │             │             │                  │
        ▼             ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Composables                              │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │useResourceList│  │useDocumentForm│  │useDocumentWorkflow│  │
│  └──────┬───────┘  └──────┬──────┘  └──────────┬─────────────┘  │
└─────────┼─────────────────┼────────────────────┼────────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Domain Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │CalculationSvc│  │ ValidationSvc│  │ WorkflowStateMachine│    │
│  │ (Strategy)   │  │ (Strategy)   │  │ (State Machine)     │    │
│  └──────────────┘  └──────────────┘  └─────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Infrastructure                              │
│  ┌───────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ Event Bus │  │ Logger     │  │ API Client │  │ DI Container│ │
│  │ (Pub/Sub) │  │ (Observ.)  │  │ (TanStack) │  │ (Services) │  │
│  └───────────┘  └────────────┘  └────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Dependency Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    QuotationFormPage                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Uses:                                                   ││
│  │   - useDocumentForm('quotation')                        ││
│  │   - useLineItems(calculationStrategy)                   ││
│  │   - useDocumentWorkflow('quotation-workflow')           ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Components:                                             ││
│  │   - DocumentFormLayout                                  ││
│  │   - LineItemsTable                                      ││
│  │   - ContactSelect, ProductSelect                        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              useDocumentForm Composable                      │
│  - Form state management (VeeValidate + Zod)                │
│  - Create/Edit mode detection                               │
│  - Server error handling                                    │
│  - Auto-save (optional)                                     │
│  - Event emission: form:loaded, form:saved, form:error      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CalculationService (Strategy)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Strategies:                                            │ │
│  │   - StandardTaxStrategy (PPN 11%)                      │ │
│  │   - InclusiveTaxStrategy                               │ │
│  │   - PercentDiscountStrategy                            │ │
│  │   - AmountDiscountStrategy                             │ │
│  │   - IndonesianRoundingStrategy                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## SOLID Principles Application

| Principle | How We Apply It |
|-----------|-----------------|
| **S**ingle Responsibility | Each service/composable does ONE thing well |
| **O**pen/Closed | Strategy pattern allows extension without modification |
| **L**iskov Substitution | All strategies implement common interface |
| **I**nterface Segregation | Small, focused interfaces per concern |
| **D**ependency Inversion | Depend on abstractions (interfaces), not concretions |

### Example: Calculation Service

```typescript
// Interface (abstraction)
interface CalculationStrategy {
  calculateLineTotal(item: LineItem): number
  calculateSubtotal(items: LineItem[]): number
  calculateTax(subtotal: number): number
  calculateGrandTotal(subtotal: number, tax: number): number
}

// Concrete strategies
class StandardPPNStrategy implements CalculationStrategy { ... }
class InclusiveTaxStrategy implements CalculationStrategy { ... }

// Usage - depends on abstraction, not concretion
class DocumentCalculationService {
  constructor(private strategy: CalculationStrategy) {}

  calculate(document: Document) {
    return {
      subtotal: this.strategy.calculateSubtotal(document.items),
      tax: this.strategy.calculateTax(...),
      grandTotal: this.strategy.calculateGrandTotal(...)
    }
  }
}
```

---

## Design Patterns Summary

| Pattern | Use Case | Benefits |
|---------|----------|----------|
| **Strategy** | Calculations, exports, validations | Swap algorithms without changing code |
| **State Machine** | Document workflow (draft→submitted→approved) | Clear transitions, guards, side effects |
| **Observer/Event Bus** | Cross-cutting concerns (logging, analytics) | Loose coupling, easy to add new listeners |
| **Factory** | API hooks, form configs | Consistent creation, reduce boilerplate |
| **Composite** | Line items with nested calculations | Treat single/groups uniformly |
| **Template Method** | Form page lifecycle | Define skeleton, let subclasses customize |

---

## Files to Read (Dependencies)

Before starting any phase, ensure you understand:

| File | Purpose |
|------|---------|
| `/docs/AGENT.md` | Development conventions |
| `/docs/architecture/DECISIONS-SUMMARY.md` | Past architectural decisions |
| `/docs/api/HOOKS-PATTERN.md` | TanStack Query patterns |
| `/src/api/factory/createCrudHooks.ts` | Current factory pattern |
| `/src/composables/useResourceList/` | Current list composable |
| `/src/utils/validation.ts` | Current Zod schemas |
| `/src/utils/format.ts` | Indonesian formatting |

---

## Success Metrics

| Metric | How to Measure | Target |
|--------|----------------|--------|
| Code Reduction | Lines of code in form pages | -50% |
| Test Coverage | Vitest coverage report | > 70% |
| Type Safety | No `as any` in codebase | 0 occurrences |
| Bundle Size | Vite build output | < 500KB gzipped |
| Event Coverage | All critical flows emit events | 100% |
| Documentation | All public APIs documented | 100% |

---

## Quick Navigation

| Phase | Focus | Primary Patterns | Estimated LOC Change |
|-------|-------|------------------|---------------------|
| [Phase 1](./01-PHASE-FOUNDATION.md) | Infrastructure | Event Bus, DI | +500 new |
| [Phase 2](./02-PHASE-DOMAIN-SERVICES.md) | Business Logic | Strategy, Factory | +800 new |
| [Phase 3](./03-PHASE-COMPOSABLES.md) | Composables | Template Method | +600 new, -2000 old |
| [Phase 4](./04-PHASE-COMPONENTS.md) | Components | Composite | +400 new, -3000 old |
| [Phase 5](./05-PHASE-STRATEGY-PATTERN.md) | Strategies | Strategy | +400 new |
| [Phase 6](./06-PHASE-STATE-MACHINE.md) | State Machines | State Machine | +500 new |
| [Phase 7](./07-PHASE-TESTING.md) | Testing | Factory (test data) | +2000 new |
| [Phase 8](./08-PHASE-PERFORMANCE.md) | Performance | Lazy Loading | Refactor only |
| [Phase 9](./09-PHASE-MIGRATION.md) | Migration | Feature Flags | Cleanup |

---

## Getting Started

1. **Read this index** to understand the overall plan
2. **Start with Phase 1** - it's the foundation
3. **Each phase has clear deliverables** - don't skip ahead
4. **Tests are written alongside code** - not as an afterthought
5. **Events are emitted** - observability from day one

---

*Last Updated: January 2026*
*Author: Senior Frontend Architect*
