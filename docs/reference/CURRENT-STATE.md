# Current State

> Module implementation status and feature matrix

*Last updated: January 2025*

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue 3 | 3.5.13 | Framework |
| TypeScript | 5.7.2 | Language |
| Vite | 6.0.5 | Build tool |
| TanStack Vue Query | 5.62.8 | Server state |
| Pinia | 2.3.0 | Auth state |
| Tailwind CSS | 3.4.17 | Styling |
| Radix Vue | 1.9.17 | UI primitives |

---

## Implemented Modules

### Core Pages

| Page | Route | Status |
|------|-------|--------|
| Login | `/login` | Complete |
| Dashboard | `/` | Complete (stats, charts, recent activity) |
| Settings | `/settings` | Complete |
| 404 | `/*` | Complete |

### Sales Module

| Feature | Routes | Status |
|---------|--------|--------|
| Quotations | `/quotations`, `/quotations/new`, `/quotations/:id`, `/quotations/:id/edit` | Complete |
| Invoices | `/invoices`, `/invoices/new`, `/invoices/:id`, `/invoices/:id/edit` | Complete |
| Contacts | `/contacts`, `/contacts/new`, `/contacts/:id`, `/contacts/:id/edit` | Complete |

**Quotation Actions**: CRUD, Submit, Approve, Reject, Convert to Invoice, Duplicate, Print, Revise, Create from BOM

**Invoice Actions**: CRUD, Post, Void, Send, Duplicate

### Purchasing Module

| Feature | Routes | Status |
|---------|--------|--------|
| Bills | `/bills`, `/bills/new`, `/bills/:id`, `/bills/:id/edit` | Complete |
| Payments | `/payments`, `/payments/new`, `/payments/:id` | Complete |

### Inventory Module

| Feature | Routes | Status |
|---------|--------|--------|
| Products | `/products`, `/products/new`, `/products/:id`, `/products/:id/edit` | Complete |
| Inventory | `/inventory`, `/inventory/movements`, `/inventory/adjust` | Complete |
| BOMs | `/boms`, `/boms/new`, `/boms/:id`, `/boms/:id/edit` | Complete |
| Variant Groups | `/boms/variant-groups` | Complete |
| BOM Templates | `/settings/bom-templates/*` | Complete |

### Projects & Manufacturing

| Feature | Routes | Status |
|---------|--------|--------|
| Projects | `/projects`, `/projects/new`, `/projects/:id`, `/projects/:id/edit` | Complete |
| Work Orders | `/work-orders`, `/work-orders/new`, `/work-orders/:id`, `/work-orders/:id/edit` | Complete |

### Solar Module

| Feature | Routes | Status |
|---------|--------|--------|
| Solar Proposals | `/solar-proposals`, `/solar-proposals/new`, `/solar-proposals/:id`, `/solar-proposals/:id/edit` | Complete |
| Analytics | `/solar-proposals/analytics` | Complete |
| Public Proposal | `/p/:token` | Complete |
| Solar Calculator | `/solar-calculator` | Complete |

**Solar Features**: Multi-step wizard, BOM variant selection, Battery configurator, Financing calculator, What-if scenarios, Public sharing

### Reports Module

| Report | Route | Status |
|--------|-------|--------|
| Reports Hub | `/reports` | Complete |
| Balance Sheet | `/reports/balance-sheet` | Complete |
| Income Statement | `/reports/income-statement` | Complete |
| Cash Flow | `/reports/cash-flow` | Complete |
| Trial Balance | `/reports/trial-balance` | Complete |
| Receivables Aging | `/reports/receivables-aging` | Complete |
| Payables Aging | `/reports/payables-aging` | Complete |
| VAT Report | `/reports/vat` | Complete |

### Admin Module

| Feature | Routes | Status |
|---------|--------|--------|
| User Management | `/users` | Complete (CRUD, roles, password reset) |
| Company Profiles | `/company-profiles/*` | Complete |
| Component Library | `/settings/component-library/*` | Complete |
| Validation Rules | `/settings/rule-sets/*` | Complete |

---

## API Hooks

| Hook File | Entity | Operations |
|-----------|--------|------------|
| `useQuotations.ts` | Quotation | CRUD, submit, approve, reject, convert, duplicate, revise, from-bom, statistics |
| `useInvoices.ts` | Invoice | CRUD, post, void, duplicate, send, statistics |
| `useContacts.ts` | Contact | CRUD, lookup |
| `useProducts.ts` | Product | CRUD, lookup |
| `useBills.ts` | Bill | CRUD |
| `usePayments.ts` | Payment | CRUD |
| `useProjects.ts` | Project | CRUD |
| `useWorkOrders.ts` | WorkOrder | CRUD |
| `useInventory.ts` | Stock | Levels, movements, adjustments, transfers |
| `useBoms.ts` | BOM | CRUD, activate, deactivate, duplicate, variants, cost calculation |
| `useBomTemplates.ts` | BomTemplate | CRUD |
| `useComponentStandards.ts` | ComponentStandard | CRUD, lookup |
| `useSpecRuleSets.ts` | SpecRuleSet | CRUD |
| `useSolarProposals.ts` | SolarProposal | CRUD, calculate, attach-variants, select-bom, statistics, pln-tariffs, solar-data |
| `useUsers.ts` | User | CRUD, toggle active, password, roles |
| `useCompanyProfiles.ts` | CompanyProfile | CRUD |
| `useDashboard.ts` | Dashboard | Stats, recent activity |
| `useReports.ts` | Reports | All financial reports |

---

## UI Components

| Component | Description | Status |
|-----------|-------------|--------|
| `Button` | Primary, secondary, ghost, destructive, success, warning | Complete |
| `Input` | Text input with error states | Complete |
| `Select` | Dropdown with empty string support | Complete |
| `Textarea` | Multi-line input | Complete |
| `CurrencyInput` | IDR formatted input | Complete |
| `NumberInput` | Numeric input | Complete |
| `PercentageInput` | Percentage input | Complete |
| `FormField` | Label + input + error wrapper | Complete |
| `Card` | Container with optional padding | Complete |
| `StatCard` | Dashboard stat display | Complete |
| `Badge` | Status badges with variants | Complete |
| `Modal` | Dialog (sm, md, lg, xl, 2xl) | Complete |
| `Alert` | Info, warning, error alerts | Complete |
| `Toast` | Notification system | Complete |
| `DataTable` | Sortable table with slots | Complete |
| `Pagination` | Page navigation | Complete |
| `FilterBar` | Filter container | Complete |
| `FilterGroup` | Filter field wrapper | Complete |
| `EmptyState` | No data placeholder | Complete |
| `LoadingSkeleton` | Loading placeholder | Complete |
| `Breadcrumbs` | Navigation breadcrumbs | Complete |
| `Tabs` | Tab navigation | Complete |

---

## Known Issues & Fixes

### Fixed Issues

| Issue | Solution | Date |
|-------|----------|------|
| Empty filter shows no results | Filter out empty/null/undefined params before API calls | Dec 2024 |
| Convert to Invoice fails | Normalize response format in hook | Dec 2024 |

### Open Issues

None currently tracked.

---

## Not Yet Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| Global Search (Cmd+K) | Medium | Command palette exists |
| Notification Bell | Low | |
| Email Templates | Low | |
| Excel Export | Medium | xlsx package installed |
| Dark Mode | Low | CSS variables ready |
| Feature Flags UI | Low | |
| Multi-company | Future | |

---

## Recent Changes

| Date | Change |
|------|--------|
| Jan 2025 | Solar proposal analytics page |
| Jan 2025 | Battery configurator |
| Jan 2025 | Financing calculator |
| Jan 2025 | What-if scenarios |
| Dec 2024 | Company profiles |
| Dec 2024 | Solar proposal wizard |
| Dec 2024 | Command palette |
