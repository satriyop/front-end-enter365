# Current State

> Module implementation status and feature matrix

*Last updated: February 2025*

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

### Accounting Module

| Feature | Routes | Status |
|---------|--------|--------|
| Chart of Accounts | `/accounting/accounts`, `/accounting/accounts/new`, `/accounting/accounts/:id`, `/accounting/accounts/:id/edit` | Complete |
| Journal Entries | `/accounting/journal-entries`, `/accounting/journal-entries/new`, `/accounting/journal-entries/:id` | Complete |
| Fiscal Periods | `/accounting/fiscal-periods`, `/accounting/fiscal-periods/new`, `/accounting/fiscal-periods/:id`, `/accounting/fiscal-periods/:id/close` | Complete |
| Budgets | `/accounting/budgets`, `/accounting/budgets/new`, `/accounting/budgets/:id` | Complete |
| Recurring Templates | `/accounting/recurring-templates`, `/accounting/recurring-templates/new`, `/accounting/recurring-templates/:id` | Complete |
| Bank Reconciliation | `/accounting/bank-reconciliation`, `/accounting/bank-reconciliation/:id/new` | Complete |
| Accounting Policies | `/settings/accounting-policies` | Complete |

### Sales Module

| Feature | Routes | Status |
|---------|--------|--------|
| Quotations | `/quotations`, `/quotations/new`, `/quotations/:id`, `/quotations/:id/edit` | Complete |
| Invoices | `/invoices`, `/invoices/new`, `/invoices/:id`, `/invoices/:id/edit` | Complete |
| Contacts | `/contacts`, `/contacts/new`, `/contacts/:id`, `/contacts/:id/edit` | Complete |
| Delivery Orders | `/sales/delivery-orders`, `/sales/delivery-orders/new`, `/sales/delivery-orders/:id` | Complete |
| Sales Returns | `/sales/sales-returns`, `/sales/sales-returns/new`, `/sales/sales-returns/:id` | Complete |
| Quotation Follow-Up | `/sales/follow-up` | Complete |
| Overdue Dashboard | `/sales/overdue` | Complete |

**Quotation Actions**: CRUD, Submit, Approve, Reject, Convert to Invoice, Duplicate, Print, Revise, Create from BOM, Schedule Follow-Up, Log Activity, Mark Won/Lost

**Invoice Actions**: CRUD, Post, Void, Send, Duplicate, Schedule Reminder, Make Recurring, Create Sales Return, Create Delivery Order

### Purchasing Module

| Feature | Routes | Status |
|---------|--------|--------|
| Purchase Orders | `/purchasing/purchase-orders`, `/purchasing/purchase-orders/new`, `/purchasing/purchase-orders/:id`, `/purchasing/purchase-orders/:id/edit` | Complete |
| Goods Receipt Notes | `/purchasing/goods-receipt-notes`, `/purchasing/goods-receipt-notes/new`, `/purchasing/goods-receipt-notes/:id` | Complete |
| Purchase Returns | `/purchasing/purchase-returns`, `/purchasing/purchase-returns/new`, `/purchasing/purchase-returns/:id`, `/purchasing/purchase-returns/:id/edit` | Complete |
| Bills | `/bills`, `/bills/new`, `/bills/:id`, `/bills/:id/edit` | Complete |
| Payments | `/payments`, `/payments/new`, `/payments/:id` | Complete |

**Payment Features**: Multi-currency support, exchange rate UI, PPh withholding tax

### Finance Module

| Feature | Routes | Status |
|---------|--------|--------|
| Down Payments | `/finance/down-payments`, `/finance/down-payments/new`, `/finance/down-payments/:id` | Complete |
| Payment Reminders | `/finance/reminders`, `/finance/reminders/:id` | Complete |

### Inventory Module

| Feature | Routes | Status |
|---------|--------|--------|
| Products | `/products`, `/products/new`, `/products/:id`, `/products/:id/edit` | Complete |
| Inventory Levels | `/inventory` | Complete |
| Stock Movements | `/inventory/movements` | Complete |
| Stock Adjustments | `/inventory/adjust` | Complete |
| Stock Transfers | `/inventory/transfer` | Complete |
| Stock Card | `/inventory/stock-card` | Complete |
| Movement Summary | `/inventory/movement-summary` | Complete |
| Stock Opname | `/inventory/stock-opname`, `/inventory/stock-opname/new`, `/inventory/stock-opname/:id` | Complete |
| Variance Report | `/inventory/stock-opname/:id/variance` | Complete |
| BOMs | `/boms`, `/boms/new`, `/boms/:id`, `/boms/:id/edit` | Complete |
| Variant Groups | `/boms/variant-groups` | Complete |
| BOM Templates | `/settings/bom-templates/*` | Complete |

### Projects & Manufacturing

| Feature | Routes | Status |
|---------|--------|--------|
| Projects | `/projects`, `/projects/new`, `/projects/:id`, `/projects/:id/edit` | Complete |
| Project Tasks | Modal-based CRUD on project detail | Complete |
| Project Costs | Modal-based CRUD on project detail | Complete |
| Project Revenue | Modal-based CRUD on project detail | Complete |
| Work Orders | `/work-orders`, `/work-orders/new`, `/work-orders/:id`, `/work-orders/:id/edit` | Complete |
| Sub Work Orders | `/work-orders/:id/sub-work-orders` | Complete |
| Work Order Cost Summary | `/work-orders/:id/cost-summary` | Complete |
| Material Requisitions | `/manufacturing/material-requisitions`, `/manufacturing/material-requisitions/new`, `/manufacturing/material-requisitions/:id`, `/manufacturing/material-requisitions/:id/edit` | Complete |
| MRP Runs | `/manufacturing/mrp`, `/manufacturing/mrp/new`, `/manufacturing/mrp/:id` | Complete |
| MRP Shortage Report | `/manufacturing/mrp/shortage` | Complete |
| Material Status | `/manufacturing/material-status` | Complete |
| Cost Optimization | `/manufacturing/cost-optimization` | Complete |
| Subcontractor Work Orders | `/manufacturing/subcontractor-work-orders`, `/manufacturing/subcontractor-work-orders/new`, `/manufacturing/subcontractor-work-orders/:id` | Complete |
| Subcontractor Invoices | `/manufacturing/subcontractor-invoices`, `/manufacturing/subcontractor-invoices/:id` | Complete |

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
| User Management | `/users`, `/users/new`, `/users/:id` | Complete (CRUD, roles, password reset) |
| Company Profiles | `/company-profiles/*` | Complete |
| Roles & Permissions | `/settings/roles`, `/settings/roles/new`, `/settings/roles/:id` | Complete |
| Product Categories | `/settings/product-categories`, `/settings/product-categories/new`, `/settings/product-categories/:id` | Complete |
| Warehouses | `/settings/warehouses`, `/settings/warehouses/new`, `/settings/warehouses/:id` | Complete |
| NSFP Ranges | `/settings/nsfp-ranges`, `/settings/nsfp-ranges/new`, `/settings/nsfp-ranges/:id` | Complete |
| Component Library | `/settings/component-library/*` | Complete |
| Validation Rules | `/settings/rule-sets/*` | Complete |
| Accounting Policies | `/settings/accounting-policies` | Complete |

---

## API Hooks

| Hook File | Entity | Operations |
|-----------|--------|------------|
| `useAccounts.ts` | Account | CRUD, balance, ledger, lookup by type |
| `useAccountingPolicies.ts` | Accounting Policy | Get, update |
| `useAttachments.ts` | Attachment | CRUD, upload, download |
| `useBankTransactions.ts` | Bank Transaction | CRUD, reconcile, match, suggest |
| `useBills.ts` | Bill | CRUD, multi-currency, create purchase return |
| `useBoms.ts` | BOM | CRUD, activate, deactivate, duplicate, variants, cost calculation |
| `useBomTemplates.ts` | BOM Template | CRUD |
| `useBudgets.ts` | Budget | CRUD, line items |
| `useCompanyProfiles.ts` | Company Profile | CRUD |
| `useComponentStandards.ts` | Component Standard | CRUD, lookup |
| `useContacts.ts` | Contact | CRUD, lookup, balances, credit status |
| `useDashboard.ts` | Dashboard | Stats, recent activity |
| `useDeliveryOrders.ts` | Delivery Order | CRUD, confirm, ship, deliver, cancel |
| `useDownPayments.ts` | Down Payment | CRUD, apply, refund, cancel |
| `useExports.ts` | Exports | Financial report exports (blob download) |
| `useFiscalPeriods.ts` | Fiscal Period | CRUD, lock, unlock, close, reopen, checklist |
| `useGlobalSearch.ts` | Global Search | Cross-module search |
| `useGoodsReceiptNotes.ts` | GRN | CRUD, receive, complete, cancel |
| `useInventory.ts` | Stock | Levels, movements, adjustments, transfers |
| `useInvoices.ts` | Invoice | CRUD, post, void, duplicate, send, make recurring, statistics |
| `useJournalEntries.ts` | Journal Entry | CRUD, post, reverse |
| `useMaterialRequisitions.ts` | Material Requisition | CRUD, approve, issue, cancel |
| `useMrp.ts` | MRP | Runs CRUD, execute, demands, suggestions, accept/reject, convert |
| `useNsfpRanges.ts` | NSFP Range | CRUD |
| `usePaymentReminders.ts` | Payment Reminder | List, detail, send |
| `usePayments.ts` | Payment | CRUD, multi-currency, PPh withholding |
| `useProductCategories.ts` | Product Category | CRUD, tree |
| `useProducts.ts` | Product | CRUD, lookup, low stock, price list |
| `useProjects.ts` | Project | CRUD, tasks, costs, revenue, progress |
| `useProjectTasks.ts` | Project Task | CRUD (modal-based) |
| `usePublicSolarCalculator.ts` | Public Calculator | Solar calculation (no auth) |
| `usePurchaseOrders.ts` | Purchase Order | CRUD, submit, approve, reject, receive, convert to bill |
| `usePurchaseReturns.ts` | Purchase Return | CRUD, submit, approve, reject, complete, cancel |
| `useQuotationFollowUp.ts` | Quotation Follow-Up | List, statistics, schedule, assign, won/lost |
| `useQuotations.ts` | Quotation | CRUD, submit, approve, reject, convert, duplicate, revise, from-bom, statistics |
| `useRecurringTemplates.ts` | Recurring Template | CRUD, generate, pause, resume |
| `useReports.ts` | Reports | All financial reports |
| `useRoles.ts` | Role | CRUD, sync permissions |
| `useSalesReturns.ts` | Sales Return | CRUD, submit, approve, reject, complete, cancel |
| `useSolarProposals.ts` | Solar Proposal | CRUD, calculate, attach-variants, select-bom, statistics, pln-tariffs, solar-data |
| `useSpecRuleSets.ts` | Spec Rule Set | CRUD |
| `useStockOpnames.ts` | Stock Opname | CRUD, generate items, counting, submit, approve, reject, variance |
| `useSubcontractorInvoices.ts` | Subcontractor Invoice | List, detail, approve, reject, convert to bill |
| `useSubcontractorWorkOrders.ts` | Subcontractor WO | CRUD, assign, start, progress, complete, cancel |
| `useUsers.ts` | User | CRUD, toggle active, password, roles |
| `useWarehouses.ts` | Warehouse | CRUD, set default, stock summary |
| `useWorkOrders.ts` | Work Order | CRUD, record output/consumption, cost summary, material status, sub WOs |

---

## Architecture Layers

### Services Layer (`src/services/`)

Strategy-pattern based domain services:

| Service | Purpose | Strategies |
|---------|---------|------------|
| `CalculationService` | Line item calculations | Discount (Amount, Percent, Tiered), Rounding (Standard, Indonesian, RoundUp), Tax (PPN, Inclusive, NoTax) |
| `DocumentNumberService` | Document numbering | Sequential, MonthlyReset |
| `ExportService` | File exports | CSV, Excel |
| `LineItemsService` | Line item management | Add, remove, reorder, calculate totals |
| `NotificationService` | Notification dispatch | Toast, Browser notification |
| `PricingService` | Price calculation | Standard, Volume discount, Contract pricing |
| `StateMachine` | Workflow state management | Quotation, Invoice, Purchase Order workflows |
| `StatusService` | Status display/mapping | Registry-based status resolution |

### Infrastructure Layer (`src/infrastructure/`)

Cross-cutting concerns:

| Module | Purpose |
|--------|---------|
| `Container` | Dependency injection container |
| `EventBus` | Publish/subscribe event system |
| `FeatureFlags` | Runtime feature flag management |
| `Logger` | Structured logging with transports |
| `PerformanceMonitor` | Performance measurement |
| `errors/` | Error type guards and typed errors |

---

## UI Components

| Component | Description | Status |
|-----------|-------------|--------|
| `Alert` | Info, warning, error alerts | Complete |
| `Badge` | Status badges with variants | Complete |
| `Breadcrumbs` | Navigation breadcrumbs | Complete |
| `Button` | Primary, secondary, ghost, destructive, success, warning | Complete |
| `Card` | Container with optional padding | Complete |
| `ConfirmationModal` | Confirmation dialog with actions | Complete |
| `ConfirmDialog` | Simple confirm/cancel dialog | Complete |
| `CopyButton` | Copy-to-clipboard button | Complete |
| `CurrencyInput` | IDR formatted input | Complete |
| `DataTable` | Sortable table with slots | Complete |
| `EmptyState` | No data placeholder | Complete |
| `ExportButton` | File export trigger | Complete |
| `FilterBar` | Filter container | Complete |
| `FilterGroup` | Filter field wrapper | Complete |
| `FilterPresetDropdown` | Save/load filter presets | Complete |
| `FormField` | Label + input + error wrapper | Complete |
| `Input` | Text input with error states | Complete |
| `LoadingSkeleton` | Loading placeholder | Complete |
| `Modal` | Dialog (sm, md, lg, xl, 2xl) | Complete |
| `PageSkeleton` | Full page loading | Complete |
| `Pagination` | Page navigation | Complete |
| `PullToRefresh` | Mobile pull-to-refresh | Complete |
| `ResponsiveTable` | Mobile-friendly table | Complete |
| `Select` | Dropdown with empty string support | Complete |
| `StatCard` | Dashboard stat display | Complete |
| `StatusBadge` | Status-aware badge with color mapping | Complete |
| `Textarea` | Multi-line input | Complete |
| `ThemeToggle` | Dark/light mode toggle | Complete |
| `VirtualList` | Virtualized scrolling list | Complete |
| `VirtualTable` | Virtualized scrolling table | Complete |

### Shared Components

| Component | Directory | Description |
|-----------|-----------|-------------|
| `DocumentDetailLayout` | `document/` | Reusable document detail page layout |
| `DocumentFormLayout` | `document/` | Reusable document form page layout |
| `LineItemsTable` | `document/` | Editable line items table |
| `ListPageContainer` | `document/` | Reusable list page container |
| `TotalsSummary` | `document/` | Document totals display |
| `WorkflowActions` | `document/` | Status-based action buttons |
| `AttachmentCard` | root | Attachment display/upload card |
| `CommandPalette` | root | Global search (Cmd+K) |
| `GlobalSearch` | root | Search across modules |
| `ErrorBoundary` | root | Vue error boundary |
| `PrintableDocument` | root | Print-friendly wrapper |
| `SessionTimeoutModal` | root | Session expiry warning |

---

## Test Coverage

| Category | Test Files | Description |
|----------|-----------|-------------|
| UI Components | 26 | Alert, Badge, Button, Card, DataTable, etc. |
| Document Components | 3 | LineItemsTable, TotalsSummary, WorkflowActions |
| Services | 8 | CalculationService, PricingService, StateMachine, etc. |
| Infrastructure | 4 | EventBus, Logger, FeatureFlags, Error Guards |
| Composables | ~10 | useValidatedForm, useCalculation, etc. |
| Workflows | 3 | Quotation, Invoice, Purchase Order machines |
| Utils | ~11 | format, validation, calculations, etc. |
| **Total** | **65** | |

---

## Module Statistics

| Metric | Count |
|--------|-------|
| Total Pages | 173 |
| Total Components | 76 |
| Total API Hooks | 47 files |
| Total Composables | 22 |
| UI Components | 30 |
| Service Modules | 8 |
| Infrastructure Modules | 6 |
| Test Files | 65 |
| Total Source Files | ~400+ |

---

## Recent Changes

| Date | Change |
|------|--------|
| Feb 2025 | PPh withholding tax UI for vendor payments |
| Feb 2025 | NSFP Range management UI |
| Feb 2025 | Exchange rate UI for multi-currency payments |
| Feb 2025 | 112 infrastructure tests (error guards, logger, feature flags) |
| Feb 2025 | 232 tests for strategies, composables, and workflow machines |
| Feb 2025 | Edit routes for Material Requisition and Fiscal Period |
| Feb 2025 | 254 tests for utils and composables |
| Feb 2025 | 297 tests for UI components (4 batches) |
| Feb 2025 | Auto-fill currency from contact's default |
| Feb 2025 | Project Tasks UI with modal components |
| Feb 2025 | Multi-currency support for Bill, Invoice, Quotation forms |
| Feb 2025 | Stock Opname detail page completion |
| Feb 2025 | Reusable attachment management on 6 detail pages |
| Feb 2025 | Purchase Return create/edit form |
| Feb 2025 | Warehouse settings pages with CRUD |
| Feb 2025 | Credit status and enhanced contact detail/form pages |
| Feb 2025 | Work Order actions, Project indicators, Budget line management |
| Feb 2025 | Manufacturing execution actions on Work Order detail |
| Feb 2025 | Make-recurring, purchase return, and JE link on Bill detail |
| Jan 2025 | Solar proposal analytics page |
| Jan 2025 | Battery configurator |
| Jan 2025 | Financing calculator |
| Jan 2025 | What-if scenarios |

---

## Not Yet Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| Notification Bell (live) | Medium | Static dropdown exists |
| Email Templates | Low | |
| Dark Mode (full) | Low | ThemeToggle component exists, CSS variables ready |
| Multi-company Switching | Future | |

---

*Last updated: February 2025*
