 # Enter365 Frontend Implementation Plan

 Overview

 Implement a complete Vue 3 SPA for the Enter365 Indonesian Solar ERP system following the Level 2 Hooks Pattern - simple, testable, mockable, no overengineering.

 ---
 Architecture Principles

 Level 2 Hooks Pattern (from hook_pattern.md)

 src/
 ├── api/
 │   ├── client.ts              # Axios instance (already exists)
 │   ├── useAuth.ts             # Auth hooks (already exists)
 │   ├── useQuotations.ts       # Quotation hooks + types (already exists)
 │   ├── useContacts.ts         # Contact hooks + types
 │   ├── useProducts.ts         # Product hooks + types
 │   ├── useInvoices.ts         # Invoice hooks + types
 │   └── ...
 ├── components/ui/             # Design system components
 ├── composables/               # Shared logic
 ├── utils/                     # Formatters (already exists)
 ├── pages/                     # Route pages
 └── mocks/                     # MSW handlers for development

 Key Decisions

 1. Types match API response - No separate "view" types
 2. One hook file per entity - Types + queries + mutations together
 3. MSW for unstable endpoints - Switch to real API when ready
 4. Extract when needed - Add complexity only when pain is felt

 ---
 Phase 1: Infrastructure Setup (Foundation)

 1.1 Testing Infrastructure

 - Configure Vitest with Vue Test Utils
 - Set up component testing patterns
 - Create test utilities (render helpers, mocks)

 1.2 MSW Mock Server

 - Install and configure MSW for browser + node
 - Create mock handlers structure
 - Set up mock data factories

 1.3 Environment Configuration

 - Create .env.example with all variables
 - Document local development setup
 - Configure feature flag system

 1.4 ESLint Configuration

 - Set up ESLint flat config for Vue 3 + TypeScript
 - Add auto-fix on save rules

 ---
 Phase 2: UI Component Library

 Build components following /design_system/ specifications exactly.

 2.1 Core Components (Priority 1)

 - Button (variants: primary, secondary, ghost, danger, success)
 - Input (text, with addons, currency, error states)
 - Select (native + searchable dropdown)
 - Textarea
 - Checkbox, Radio, Toggle
 - Card (basic, stat, list)
 - Badge (status colors)

 2.2 Feedback Components (Priority 2)

 - Alert (info, success, warning, error)
 - Toast/Notification system
 - Modal (sizes: sm, md, lg, xl, 2xl)
 - Tooltip

 2.3 Data Components (Priority 3)

 - DataTable (sortable, filterable, paginated)
 - Pagination
 - EmptyState
 - LoadingSkeleton
 - DescriptionList

 2.4 Form Components (Priority 4)

 - FormField (label + input + error wrapper)
 - DatePicker
 - CurrencyInput (IDR formatting)
 - SearchableSelect (with create option)

 ---
 Phase 3: API Hooks Layer

 Create hooks following existing useQuotations.ts pattern.

 3.1 Core Entities

 // Pattern for each entity:
 // - Types matching API response
 // - useEntity(id) - single record
 // - useEntities(filters) - paginated list
 // - useCreateEntity() - mutation
 // - useUpdateEntity() - mutation
 // - useDeleteEntity() - mutation
 // - Custom actions (submit, approve, etc.)

 3.2 Module Priority Order

 1. Contacts - Foundation for all transactions
 2. Products - Foundation for line items
 3. Invoices - Core revenue module
 4. Bills - Core expense module
 5. Payments - Cash flow
 6. Dashboard - Aggregated data
 7. Projects - EPC workflow
 8. Work Orders - Manufacturing
 9. Inventory - Stock management
 10. Reports - Read-only views

 ---
 Phase 4: Feature Pages

 4.1 Complete Quotations Module (Polish existing)

 - QuotationForm (New/Edit) - line items, totals, validation
 - Quotation actions (submit, approve, reject, convert)
 - Quotation PDF preview
 - Quotation follow-up features

 4.2 Contacts Module

 - ContactListPage - filter by type, search
 - ContactDetailPage - info, balances, history
 - ContactForm (modal or page)

 4.3 Invoices Module

 - InvoiceListPage - status filters, search
 - InvoiceDetailPage - items, payments, journal entry
 - InvoiceForm - from quotation or standalone

 4.4 Continue with remaining modules...

 ---
 Phase 5: Cross-Cutting Features

 5.1 Feature Flags Integration

 - Fetch features from /api/v1/features
 - Conditionally render sidebar items
 - Guard routes for disabled features

 5.2 Global Search (Cmd+K)

 - Command palette component
 - Quick navigation actions
 - Entity search results

 5.3 Notifications

 - Notification bell in header
 - Notification dropdown
 - Mark as read functionality

 ---
 Testing Strategy

 Unit Tests

 - Component tests with Vue Test Utils
 - Hook tests with renderHook pattern
 - Utility function tests

 Integration Tests

 - Page-level tests with MSW
 - Form submission flows
 - Navigation guards

 E2E Tests (Future)

 - Critical paths: Login, Create Quotation, Convert to Invoice
 - Playwright or Cypress

 ---
 File Structure After Implementation

 src/
 ├── api/
 │   ├── client.ts
 │   ├── types.ts                    # Shared API types
 │   ├── useAuth.ts
 │   ├── useQuotations.ts
 │   ├── useContacts.ts
 │   ├── useProducts.ts
 │   ├── useInvoices.ts
 │   ├── useBills.ts
 │   ├── usePayments.ts
 │   ├── useProjects.ts
 │   ├── useWorkOrders.ts
 │   ├── useInventory.ts
 │   ├── useDashboard.ts
 │   └── useReports.ts
 ├── components/
 │   └── ui/
 │       ├── Button.vue
 │       ├── Input.vue
 │       ├── Select.vue
 │       ├── Card.vue
 │       ├── Badge.vue
 │       ├── Modal.vue
 │       ├── DataTable.vue
 │       ├── Toast/
 │       │   ├── Toast.vue
 │       │   ├── ToastProvider.vue
 │       │   └── useToast.ts
 │       └── ...
 ├── composables/
 │   ├── usePermissions.ts
 │   ├── usePagination.ts
 │   ├── useFeatureFlags.ts
 │   └── useKeyboardShortcuts.ts
 ├── layouts/
 │   ├── AppLayout.vue
 │   ├── AppHeader.vue
 │   └── AppSidebar.vue
 ├── pages/
 │   ├── LoginPage.vue
 │   ├── DashboardPage.vue
 │   ├── quotations/
 │   ├── contacts/
 │   ├── invoices/
 │   ├── bills/
 │   ├── projects/
 │   └── ...
 ├── mocks/
 │   ├── browser.ts
 │   ├── server.ts
 │   ├── handlers/
 │   │   ├── auth.ts
 │   │   ├── quotations.ts
 │   │   ├── contacts.ts
 │   │   └── ...
 │   └── factories/
 │       ├── quotation.ts
 │       ├── contact.ts
 │       └── ...
 ├── utils/
 │   ├── format.ts
 │   ├── validation.ts
 │   └── cn.ts                       # classNames utility
 └── router/
     └── index.ts

 ---
 Implementation Order (Recommended)

 Sprint 1: Foundation

 1. Vitest + MSW setup
 2. Core UI components (Button, Input, Card, Badge, Modal)
 3. Toast notification system

 Sprint 2: Quotations Complete

 1. QuotationForm component
 2. All quotation actions
 3. Quotation tests with MSW

 Sprint 3: Contacts + Products

 1. useContacts hook + mock
 2. Contact pages
 3. useProducts hook + mock
 4. Product search/lookup

 Sprint 4: Invoices + Bills

 1. useInvoices hook + mock
 2. Invoice pages
 3. useBills hook + mock
 4. Bill pages

 Sprint 5: Dashboard + Reports

 1. Real dashboard API integration
 2. Report pages (read-only)

 Sprint 6+: Advanced Features

 1. Projects + Work Orders
 2. Inventory management
 3. MRP features

 ---
 User Decisions

 | Decision        | Choice                           | Rationale                                          |
 |-----------------|----------------------------------|----------------------------------------------------|
 | Module Priority | Quotations → Invoices → Contacts | Complete sales flow first, builds on existing code |
 | API State       | Most endpoints ready             | Minimal mocking, focus on real integration         |
 | UI Components   | Build from scratch               | Full design system control, no dependencies        |
 | Testing         | Critical paths only              | Test forms, mutations, auth - faster development   |

 ---
 Final Implementation Sequence

 Step 1: Infrastructure (Day 1)

 Files to create/modify:
 - vitest.config.ts - Test runner configuration
 - src/test/setup.ts - Global test setup
 - src/test/utils.ts - Render helpers
 - .env.example - Environment template

 Step 2: Core UI Components (Day 2-3)

 Files to create:
 src/components/ui/
 ├── Button.vue          # 5 variants, 5 sizes, loading state
 ├── Input.vue           # Text, error, disabled, addons
 ├── Badge.vue           # Status colors from design system
 ├── Card.vue            # Basic, stat, list variants
 ├── Modal.vue           # Sizes, backdrop, transitions
 ├── Alert.vue           # 4 variants (info, success, warning, error)
 └── index.ts            # Barrel export

 Step 3: Toast System (Day 3)

 Files to create:
 src/components/ui/Toast/
 ├── Toast.vue
 ├── ToastProvider.vue
 └── useToast.ts

 Step 4: Form Components (Day 4)

 Files to create:
 src/components/ui/
 ├── FormField.vue       # Label + input + error wrapper
 ├── Textarea.vue
 ├── Checkbox.vue
 ├── Select.vue          # Native with styling
 ├── CurrencyInput.vue   # IDR formatting
 └── DatePicker.vue      # Simple date input

 Step 5: Data Components (Day 5)

 Files to create:
 src/components/ui/
 ├── DataTable.vue       # Sortable, slots for columns
 ├── Pagination.vue      # With per-page selector
 ├── EmptyState.vue      # Icon + message + CTA
 └── LoadingSkeleton.vue # Placeholder while loading

 Step 6: Complete Quotation Module (Day 6-7)

 Files to modify/create:
 - src/pages/quotations/QuotationFormPage.vue - Create/Edit form
 - src/pages/quotations/QuotationListPage.vue - Polish with new components
 - src/pages/quotations/QuotationDetailPage.vue - Add actions
 - src/api/useQuotations.ts - Add missing mutations (submit, approve, reject)

 Tests:
 - src/pages/quotations/__tests__/QuotationForm.spec.ts

 Step 7: Invoice Module (Day 8-9)

 Files to create:
 src/api/useInvoices.ts
 src/pages/invoices/
 ├── InvoiceListPage.vue
 ├── InvoiceDetailPage.vue
 └── InvoiceFormPage.vue

 Tests:
 - src/api/__tests__/useInvoices.spec.ts

 Step 8: Contact Module (Day 10)

 Files to create:
 src/api/useContacts.ts
 src/pages/contacts/
 ├── ContactListPage.vue
 ├── ContactDetailPage.vue
 └── ContactFormModal.vue

 Step 9: Products & Dashboard (Day 11-12)

 Files to create:
 src/api/useProducts.ts
 src/api/useDashboard.ts
 - Wire up real dashboard APIs
 - Product lookup for forms

 Step 10: Router & Navigation Polish

 - Add all new routes
 - Update sidebar with real permission checks
 - Feature flag integration

 ---
 Critical Files Reference

 Existing (modify)

 - src/router/index.ts - Add new routes
 - src/layouts/AppSidebar.vue - Update navigation items
 - src/api/useQuotations.ts - Add missing actions
 - src/pages/DashboardPage.vue - Connect to real APIs

 Design System Reference

 - /design_system/02-components-core.md - Button, Input, Card, Badge specs
 - /design_system/03-components-data.md - Table, Pagination specs
 - /design_system/06-patterns.md - Page layouts, modal patterns
 - /design_system/07-tokens.md - CSS variables, TypeScript types

 Backend API Reference

 - Auth: POST /api/v1/auth/login, GET /api/v1/auth/me
 - Quotations: Full CRUD + actions at /api/v1/quotations
 - Invoices: Full CRUD + post at /api/v1/invoices
 - Contacts: Full CRUD at /api/v1/contacts
 - Products: Full CRUD + lookup at /api/v1/products
 - Dashboard: /api/v1/dashboard/*

 ---