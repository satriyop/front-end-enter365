# E2E Task Tracker — Frontend (Playwright)

> **Reference:** See `../enter365/plans/E2E_TEST_PLAN.md` for full test scenarios and objectives.
>
> **Objective:** Validate SPA UI flows, form validation, navigation, error handling, and visual correctness using Playwright.
>
> **Location:** `tests/e2e/`

## Status Key
- `[ ]` Pending
- `[>]` In Progress
- `[x]` Done
- `[!]` Blocked (note reason)

---

## Phase 1: Foundation

- [ ] **SETUP-01**: Install and configure Playwright
  - [ ] Install `@playwright/test` and browsers
  - [ ] Configure `playwright.config.ts` (baseURL, auth state)
  - [ ] Create test helpers: login fixture, API seeding utilities
  - [ ] Create `tests/e2e/` directory structure
  - [ ] Write smoke test that visits login page

- [ ] **SETUP-02**: Auth fixture for Playwright
  - [ ] Create `auth.setup.ts` that logs in and saves storage state
  - [ ] All authenticated tests reuse saved state (fast)
  - [ ] Create API helper to seed test data via backend endpoints

---

## Phase 2: Auth & Navigation

- [ ] **AUTH-PW-01**: Login flow
  - [ ] Login page renders correctly
  - [ ] Valid login → redirect to dashboard
  - [ ] Invalid login → error message visible
  - [ ] Empty fields → client-side validation
  - [ ] Logout → redirected to login

- [ ] **NAV-PW-01**: Navigation and routing
  - [ ] Sidebar navigation works for all modules
  - [ ] Breadcrumbs show correct path
  - [ ] Direct URL access to protected routes (with auth)
  - [ ] 404 page renders for unknown routes

---

## Phase 3: Sales Module UI

- [ ] **QUO-PW-01**: Quotation pages
  - [ ] List page: renders table, pagination, filters work
  - [ ] Create form: all fields render, line items add/remove
  - [ ] Create form: validation errors display correctly
  - [ ] Detail page: all data renders, action buttons visible
  - [ ] Edit form: populates existing data correctly
  - [ ] Status badge shows correct color/label

- [ ] **INV-PW-01**: Invoice pages
  - [ ] List page: renders, filters, search works
  - [ ] Create form: fields, line items, calculations
  - [ ] Detail page: status, amounts, journal link
  - [ ] Post action: confirmation dialog, status update
  - [ ] Overdue indicator shows correctly

- [ ] **DO-PW-01**: Delivery order pages
  - [ ] List page renders
  - [ ] Detail page: items, status, actions
  - [ ] Status transitions via action buttons

- [ ] **SR-PW-01**: Sales return pages
  - [ ] List page renders
  - [ ] Detail page: items, status, linked invoice
  - [ ] Workflow action buttons

---

## Phase 4: Purchasing Module UI

- [ ] **PO-PW-01**: Purchase order pages
  - [ ] List page: renders, filters work
  - [ ] Create form: fields, line items, vendor selection
  - [ ] Create form: validation errors
  - [ ] Detail page: status, amounts, action buttons
  - [ ] Workflow: submit, approve, reject buttons work

- [ ] **GRN-PW-01**: Goods receipt note pages
  - [ ] List page renders
  - [ ] Detail page: items, quantities, status

- [ ] **BILL-PW-01**: Bill pages
  - [ ] List page renders
  - [ ] Create form works
  - [ ] Detail page: status, journal link
  - [ ] Post and pay actions

- [ ] **PR-PW-01**: Purchase return pages
  - [ ] List page renders
  - [ ] Detail page: items, workflow actions

---

## Phase 5: Inventory UI

- [ ] **INV-PW-S01**: Inventory pages
  - [ ] Stock levels page: table with quantities
  - [ ] Movements page: history with filters
  - [ ] Adjustment form: fields, submission
  - [ ] Stock opname list and detail pages
  - [ ] Opname form: item counting interface

---

## Phase 6: Accounting & Reports UI

- [ ] **ACC-PW-01**: Accounting pages
  - [ ] Chart of accounts: tree/list view
  - [ ] Account detail: ledger entries
  - [ ] Journal entry form: debit/credit lines, balance indicator
  - [ ] Fiscal period management

- [ ] **RPT-PW-01**: Report pages
  - [ ] Trial Balance page renders with data
  - [ ] Balance Sheet page renders
  - [ ] Income Statement page renders
  - [ ] Cash Flow page renders
  - [ ] Receivables Aging: correct grouping columns
  - [ ] Payables Aging: correct grouping columns
  - [ ] VAT Report renders
  - [ ] Tax Summary renders
  - [ ] Stock Summary renders
  - [ ] Stock Movement report renders
  - [ ] Stock Valuation renders
  - [ ] Customer Statement renders
  - [ ] Vendor Statement renders
  - [ ] Date range filtering works on all reports

---

## Phase 7: Payments, Manufacturing, Projects UI

- [ ] **PAY-PW-01**: Payment pages
  - [ ] Payment list renders
  - [ ] Create payment form
  - [ ] Payment detail page
  - [ ] Down payment pages

- [ ] **MFG-PW-01**: Manufacturing pages
  - [ ] BOM list and detail
  - [ ] BOM create/edit form (complex line items)
  - [ ] Work order pages
  - [ ] Material requisition pages
  - [ ] Subcontractor pages

- [ ] **PRJ-PW-01**: Project pages
  - [ ] Project list, create, detail, edit
  - [ ] Cost and revenue tabs
  - [ ] Progress update

---

## Phase 8: Master Data & Settings UI

- [ ] **CON-PW-01**: Contact pages
  - [ ] List with customer/vendor filter
  - [ ] Create form (customer vs vendor fields)
  - [ ] Detail page: balances, credit status

- [ ] **PRD-PW-01**: Product pages
  - [ ] List with search and category filter
  - [ ] Create form (inventory tracking toggle)
  - [ ] Detail page: stock levels, pricing

- [ ] **SET-PW-01**: Settings pages
  - [ ] Settings page renders
  - [ ] Component library pages
  - [ ] Rule sets pages
  - [ ] BOM templates pages
  - [ ] User management page

---

## Phase 9: Solar & Public Pages

- [ ] **SOL-PW-01**: Solar proposal pages
  - [ ] Proposal wizard: multi-step form
  - [ ] Proposal detail page
  - [ ] Proposal analytics page
  - [ ] Public proposal page (no auth)
  - [ ] Solar calculator (no auth)

---

## Phase 10: Form Validation & Edge Cases

- [ ] **VAL-PW-01**: Form validation across modules
  - [ ] Required field validation on all create forms
  - [ ] Number field validation (negative, zero, too large)
  - [ ] Date field validation
  - [ ] Server-side validation messages display
  - [ ] Duplicate submission prevention

- [ ] **EDGE-PW-01**: Edge cases
  - [ ] Empty state pages (no data)
  - [ ] Loading states and skeleton screens
  - [ ] Error state (API 500) handling
  - [ ] Network timeout handling
  - [ ] Session expiry (401) handling

---

## Current Progress

| Phase | Total Tasks | Done | Remaining |
|-------|:-----------:|:----:|:---------:|
| 1. Foundation | 2 | 0 | 2 |
| 2. Auth & Navigation | 2 | 0 | 2 |
| 3. Sales UI | 4 | 0 | 4 |
| 4. Purchasing UI | 4 | 0 | 4 |
| 5. Inventory UI | 1 | 0 | 1 |
| 6. Accounting & Reports | 2 | 0 | 2 |
| 7. Payments/Mfg/Projects | 3 | 0 | 3 |
| 8. Master Data & Settings | 3 | 0 | 3 |
| 9. Solar & Public | 1 | 0 | 1 |
| 10. Validation & Edge | 2 | 0 | 2 |
| **Total** | **24** | **0** | **24** |
