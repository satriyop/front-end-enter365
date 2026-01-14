# File Structure

> Complete directory structure for Enter365 frontend

## Root Directory

```
front-end-enter365/
├── docs/                       # Documentation (you are here)
├── public/                     # Static assets
├── src/                        # Source code
├── .env                        # Environment variables (local)
├── .env.example                # Environment template
├── index.html                  # HTML entry point
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite configuration
└── vitest.config.ts            # Vitest configuration
```

---

## Source Directory (`src/`)

### API Layer

```
src/api/
├── client.ts                   # Axios instance with interceptors
├── types.ts                    # OpenAPI-generated types (33K+ lines)
├── useAuth.ts                  # Login, logout, refresh token
├── useBills.ts                 # Bill CRUD
├── useBoms.ts                  # BOM CRUD + variants
├── useBomTemplates.ts          # BOM template CRUD
├── useCompanyProfiles.ts       # Company profile CRUD
├── useComponentStandards.ts    # Component library CRUD
├── useContacts.ts              # Contact CRUD + lookup
├── useDashboard.ts             # Dashboard metrics
├── useInventory.ts             # Stock levels, movements, adjustments
├── useInvoices.ts              # Invoice CRUD + actions
├── usePayments.ts              # Payment CRUD
├── useProducts.ts              # Product CRUD + lookup
├── useProjects.ts              # Project CRUD
├── usePublicSolarCalculator.ts # Public calculator (no auth)
├── useQuotations.ts            # Quotation CRUD + business actions
├── useReports.ts               # Financial reports (8 types)
├── useSolarProposals.ts        # Solar proposal CRUD + calculations
├── useSpecRuleSets.ts          # Validation rule sets
├── useUsers.ts                 # User CRUD + roles
└── useWorkOrders.ts            # Work order CRUD
```

### Components

```
src/components/
├── ui/                         # Design system (30 components)
│   ├── Alert.vue               # Info, warning, error alerts
│   ├── Badge.vue               # Status badges with variants
│   ├── Breadcrumbs.vue         # Navigation breadcrumbs
│   ├── Button.vue              # Button with variants and sizes
│   ├── Card.vue                # Content container
│   ├── Checkbox.vue            # Checkbox input
│   ├── CurrencyInput.vue       # IDR formatted input
│   ├── DataTable.vue           # Data table with slots
│   ├── EmptyState.vue          # No data placeholder
│   ├── FilterBar.vue           # Filter container
│   ├── FilterGroup.vue         # Filter field wrapper
│   ├── FormField.vue           # Label + input + error
│   ├── Input.vue               # Text input
│   ├── LoadingSkeleton.vue     # Loading placeholder
│   ├── Modal.vue               # Dialog component
│   ├── NumberInput.vue         # Number input
│   ├── PageSkeleton.vue        # Full page loading
│   ├── Pagination.vue          # Table pagination
│   ├── PercentageInput.vue     # Percentage input
│   ├── ResponsiveTable.vue     # Mobile-friendly table
│   ├── Select.vue              # Dropdown select
│   ├── StatCard.vue            # Dashboard stat card
│   ├── Switch.vue              # Toggle switch
│   ├── Tabs.vue                # Tab navigation
│   ├── Textarea.vue            # Multi-line input
│   ├── Toast.vue               # Notification toast
│   └── index.ts                # Barrel export
│
├── charts/                     # Data visualization
│   ├── BarChart.vue            # Bar chart (Chart.js)
│   ├── DoughnutChart.vue       # Doughnut chart
│   ├── LineChart.vue           # Line chart
│   ├── MonthlyBillChart.vue    # Electricity consumption
│   └── PaybackChart.vue        # Solar ROI timeline
│
├── solar/                      # Solar-specific components
│   ├── BatteryConfigurator.vue # Battery sizing
│   ├── CapacityCalculatorModal.vue # System sizing
│   ├── FinancingCalculator.vue # Loan projections
│   ├── SolarSettingsPanel.vue  # Global settings
│   ├── WhatIfScenarios.vue     # Scenario modeling
│   └── WizardStepIndicator.vue # Multi-step progress
│
├── maps/                       # Map components
│   └── LocationMapPicker.vue   # Leaflet map picker
│
└── quotations/                 # Quotation-specific
    └── CreateQuotationFromBomModal.vue
```

### Pages

```
src/pages/
├── DashboardPage.vue           # Main dashboard
├── LoginPage.vue               # Login form
├── NotFoundPage.vue            # 404 page
│
├── bills/
│   ├── BillDetailPage.vue
│   ├── BillFormPage.vue
│   └── BillListPage.vue
│
├── boms/
│   ├── BomDetailPage.vue
│   ├── BomFormPage.vue
│   ├── BomListPage.vue
│   ├── CreateBomFromTemplatePage.vue
│   └── VariantGroupsPage.vue
│
├── company-profiles/
│   ├── CompanyProfileFormPage.vue
│   └── CompanyProfileListPage.vue
│
├── contacts/
│   ├── ContactDetailPage.vue
│   ├── ContactFormPage.vue
│   └── ContactListPage.vue
│
├── inventory/
│   ├── InventoryListPage.vue
│   ├── StockAdjustmentPage.vue
│   └── StockMovementsPage.vue
│
├── invoices/
│   ├── InvoiceDetailPage.vue
│   ├── InvoiceFormPage.vue
│   └── InvoiceListPage.vue
│
├── payments/
│   ├── PaymentDetailPage.vue
│   ├── PaymentFormPage.vue
│   └── PaymentListPage.vue
│
├── products/
│   ├── ProductDetailPage.vue
│   ├── ProductFormPage.vue
│   └── ProductListPage.vue
│
├── projects/
│   ├── ProjectDetailPage.vue
│   ├── ProjectFormPage.vue
│   └── ProjectListPage.vue
│
├── public/
│   ├── PublicCompanyProfilePage.vue
│   ├── PublicProposalPage.vue
│   └── SolarCalculatorPage.vue
│
├── quotations/
│   ├── QuotationDetailPage.vue
│   ├── QuotationFormPage.vue
│   └── QuotationListPage.vue
│
├── reports/
│   ├── BalanceSheetPage.vue
│   ├── CashFlowPage.vue
│   ├── IncomeStatementPage.vue
│   ├── PayablesAgingPage.vue
│   ├── ReceivablesAgingPage.vue
│   ├── ReportsPage.vue
│   ├── TrialBalancePage.vue
│   └── VatReportPage.vue
│
├── settings/
│   ├── SettingsPage.vue
│   ├── bom-templates/
│   │   ├── BomTemplateDetailPage.vue
│   │   ├── BomTemplateFormPage.vue
│   │   └── BomTemplatesListPage.vue
│   ├── component-library/
│   │   ├── ComponentLibraryPage.vue
│   │   ├── ComponentStandardDetailPage.vue
│   │   └── ComponentStandardFormPage.vue
│   └── rule-sets/
│       ├── RuleSetDetailPage.vue
│       ├── RuleSetFormPage.vue
│       └── RuleSetsListPage.vue
│
├── solar-proposals/
│   ├── SolarProposalAnalyticsPage.vue
│   ├── SolarProposalDetailPage.vue
│   ├── SolarProposalListPage.vue
│   └── SolarProposalWizard.vue
│
├── users/
│   └── UserListPage.vue
│
└── work-orders/
    ├── WorkOrderDetailPage.vue
    ├── WorkOrderFormPage.vue
    └── WorkOrderListPage.vue
```

### Composables

```
src/composables/
├── useAutosave.ts              # Auto-save form to localStorage
├── useBatteryCalculator.ts     # Battery sizing calculations
├── useBulkSelection.ts         # Multi-select checkbox state
├── useClipboard.ts             # Copy to clipboard
├── useDarkMode.ts              # Theme toggle
├── useDragAndDrop.ts           # File drop handling
├── useFilterPresets.ts         # Save/load filter presets
├── useFinancingCalculator.ts   # Loan calculations
├── useFormShortcuts.ts         # Form keyboard shortcuts
├── useGeocoding.ts             # Address to coordinates
├── useKeyboardShortcuts.ts     # Global shortcuts (Cmd+K)
├── useNotifications.ts         # Toast notifications
├── useOnlineStatus.ts          # Online/offline detection
├── usePullToRefresh.ts         # Mobile pull-to-refresh
├── useRecentlyViewed.ts        # Track viewed items
├── useScenarioCalculator.ts    # What-if scenarios
└── useSolarSettings.ts         # Solar calculation settings
```

### Other Directories

```
src/
├── layouts/
│   ├── AppHeader.vue           # Top navigation
│   ├── AppLayout.vue           # Main app shell
│   └── AppSidebar.vue          # Side navigation
│
├── router/
│   └── index.ts                # Vue Router configuration
│
├── stores/
│   └── auth.ts                 # Pinia auth store
│
├── styles/
│   ├── print.css               # Print styles
│   └── style.css               # Global styles + CSS variables
│
├── utils/
│   ├── cn.ts                   # Tailwind class merge
│   ├── export.ts               # CSV/Excel export
│   ├── format.ts               # Currency, date formatters
│   └── validation.ts           # Zod schemas
│
└── main.ts                     # App entry point
```

---

## File Counts

| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/api/` | 22 | API hooks |
| `src/components/ui/` | 30 | Design system |
| `src/components/` (total) | 40 | All components |
| `src/pages/` | 50+ | Route components |
| `src/composables/` | 17 | Reusable logic |
| **Total** | ~180 | Source files |
