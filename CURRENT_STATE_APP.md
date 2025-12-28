# Enter365 Frontend - Current State

> Last updated: December 28, 2024

## Tech Stack
- **Framework**: Vue 3 + TypeScript + Vite
- **State Management**: TanStack Vue Query (server state), Pinia (auth)
- **Routing**: Vue Router with auth guards
- **Styling**: TailwindCSS
- **API**: Axios with typed OpenAPI schemas

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
| Quotations | `/quotations`, `/quotations/new`, `/quotations/:id`, `/quotations/:id/edit` | Complete (CRUD, submit, approve, reject, convert to invoice, duplicate, print) |
| Invoices | `/invoices`, `/invoices/new`, `/invoices/:id`, `/invoices/:id/edit` | Complete (CRUD, post, void, send) |
| Contacts | `/contacts`, `/contacts/new`, `/contacts/:id`, `/contacts/:id/edit` | Complete (CRUD, customer/supplier types) |

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

### Projects & Manufacturing
| Feature | Routes | Status |
|---------|--------|--------|
| Projects | `/projects`, `/projects/new`, `/projects/:id`, `/projects/:id/edit` | Complete |
| Work Orders | `/work-orders`, `/work-orders/new`, `/work-orders/:id`, `/work-orders/:id/edit` | Complete |

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

---

## API Hooks (`src/api/`)

| Hook File | Entities | Operations |
|-----------|----------|------------|
| `useQuotations.ts` | Quotation | CRUD, submit, approve, reject, convert, duplicate, revise, from-bom |
| `useInvoices.ts` | Invoice | CRUD, post, void, duplicate, send, statistics |
| `useContacts.ts` | Contact | CRUD, lookup |
| `useProducts.ts` | Product | CRUD, lookup |
| `useBills.ts` | Bill | CRUD |
| `usePayments.ts` | Payment | CRUD |
| `useProjects.ts` | Project | CRUD |
| `useWorkOrders.ts` | WorkOrder | CRUD |
| `useInventory.ts` | Stock | Levels, movements, adjustments, transfers |
| `useBoms.ts` | BOM | CRUD, activate, deactivate, duplicate, cost calculation |
| `useUsers.ts` | User | CRUD, toggle active, password, roles |
| `useDashboard.ts` | Dashboard | Stats, recent activity |
| `useReports.ts` | Reports | All financial reports |

---

## UI Components (`src/components/ui/`)

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, ghost, danger, success variants |
| `Input` | Text input with error states |
| `Select` | Dropdown select |
| `Textarea` | Multi-line input |
| `CurrencyInput` | IDR formatted input |
| `FormField` | Label + input + error wrapper |
| `Card` | Basic card container |
| `StatCard` | Dashboard stat display |
| `Badge` | Status badges with colors |
| `Modal` | Dialog with sizes (sm, md, lg, xl, 2xl) |
| `Alert` | Info, success, warning, error alerts |
| `Toast` | Notification system |
| `DataTable` | Sortable table with slots |
| `Pagination` | Page navigation |
| `EmptyState` | No data placeholder |
| `LoadingSkeleton` | Loading placeholder |

---

## Known Issues & Recent Fixes

1. **Filter Bug (Fixed)**: Empty string filters caused "All Status" to show no results. Fixed by filtering out empty/null/undefined params before API calls.

2. **Convert to Invoice (Fixed)**: Response format mismatch between frontend expectation and backend response. Fixed hook to normalize response.

---

## Not Yet Implemented

- Global Search (Cmd+K)
- Notification Bell
- Email Templates
- Export to Excel
- Dark Mode
- Feature Flags UI
- Multi-company Support
