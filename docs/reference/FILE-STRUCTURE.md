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
├── useAccountingPolicies.ts    # Accounting policy get/update
├── useAccounts.ts              # Account CRUD + balance + ledger + lookup
├── useAttachments.ts           # Attachment CRUD + upload + download
├── useAuth.ts                  # Login, logout, refresh token
├── useBankTransactions.ts      # Bank transaction CRUD + reconciliation
├── useBills.ts                 # Bill CRUD + multi-currency
├── useBoms.ts                  # BOM CRUD + variants
├── useBomTemplates.ts          # BOM template CRUD
├── useBudgets.ts               # Budget CRUD + line items
├── useCompanyProfiles.ts       # Company profile CRUD
├── useComponentStandards.ts    # Component library CRUD
├── useContacts.ts              # Contact CRUD + lookup + balances + credit
├── useDashboard.ts             # Dashboard metrics
├── useDeliveryOrders.ts        # Delivery order CRUD + workflow
├── useDownPayments.ts          # Down payment CRUD + apply + refund
├── useExports.ts               # Financial report exports (blob)
├── useFiscalPeriods.ts         # Fiscal period CRUD + lock/close
├── useGlobalSearch.ts          # Cross-module search
├── useGoodsReceiptNotes.ts     # GRN CRUD + receiving
├── useInventory.ts             # Stock levels, movements, adjustments
├── useInvoices.ts              # Invoice CRUD + actions + statistics
├── useJournalEntries.ts        # Journal entry CRUD + post + reverse
├── useMaterialRequisitions.ts  # Material requisition CRUD + approve + issue
├── useMrp.ts                   # MRP runs + demands + suggestions
├── useNsfpRanges.ts            # NSFP range CRUD
├── usePaymentReminders.ts      # Payment reminder list + send
├── usePayments.ts              # Payment CRUD + multi-currency + PPh
├── useProductCategories.ts     # Product category CRUD + tree
├── useProducts.ts              # Product CRUD + lookup
├── useProjects.ts              # Project CRUD + tasks + costs + revenue
├── useProjectTasks.ts          # Project task CRUD (modal-based)
├── usePublicSolarCalculator.ts # Public calculator (no auth)
├── usePurchaseOrders.ts        # PO CRUD + workflow + convert
├── usePurchaseReturns.ts       # Purchase return CRUD + workflow
├── useQuotationFollowUp.ts     # Follow-up pipeline + activities
├── useQuotations.ts            # Quotation CRUD + business actions
├── useRecurringTemplates.ts    # Recurring template CRUD + generate
├── useReports.ts               # Financial reports (8 types)
├── useRoles.ts                 # Role CRUD + sync permissions
├── useSalesReturns.ts          # Sales return CRUD + workflow
├── useSolarProposals.ts        # Solar proposal CRUD + calculations
├── useSpecRuleSets.ts          # Validation rule sets
├── useStockOpnames.ts          # Stock opname CRUD + counting + variance
├── useSubcontractorInvoices.ts # Subcontractor invoice list + approve
├── useSubcontractorWorkOrders.ts # Subcontractor WO CRUD + workflow
├── useUsers.ts                 # User CRUD + roles
├── useWarehouses.ts            # Warehouse CRUD + stock summary
└── useWorkOrders.ts            # Work order CRUD + production tracking
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
│   ├── ConfirmationModal.vue   # Confirmation dialog with actions
│   ├── ConfirmDialog.vue       # Simple confirm/cancel dialog
│   ├── CopyButton.vue          # Copy-to-clipboard button
│   ├── CurrencyInput.vue       # IDR formatted input
│   ├── DataTable.vue           # Data table with slots
│   ├── EmptyState.vue          # No data placeholder
│   ├── ExportButton.vue        # File export trigger
│   ├── FilterBar.vue           # Filter container
│   ├── FilterGroup.vue         # Filter field wrapper
│   ├── FilterPresetDropdown.vue # Save/load filter presets
│   ├── FormField.vue           # Label + input + error
│   ├── Input.vue               # Text input
│   ├── LoadingSkeleton.vue     # Loading placeholder
│   ├── Modal.vue               # Dialog component
│   ├── PageSkeleton.vue        # Full page loading
│   ├── Pagination.vue          # Table pagination
│   ├── PullToRefresh.vue       # Mobile pull-to-refresh
│   ├── ResponsiveTable.vue     # Mobile-friendly table
│   ├── Select.vue              # Dropdown select
│   ├── StatCard.vue            # Dashboard stat card
│   ├── StatusBadge.vue         # Status-aware badge
│   ├── Textarea.vue            # Multi-line input
│   ├── ThemeToggle.vue         # Dark/light mode toggle
│   ├── Toast/                  # Notification toast system
│   ├── VirtualList.vue         # Virtualized scrolling list
│   ├── VirtualTable.vue        # Virtualized scrolling table
│   ├── __tests__/              # 26 component test files
│   └── index.ts                # Barrel export
│
├── document/                   # Reusable document page patterns
│   ├── DocumentDetailLayout.vue # Document detail page layout
│   ├── DocumentFormLayout.vue   # Document form page layout
│   ├── LineItemsTable.vue       # Editable line items table
│   ├── ListPageContainer.vue    # List page container
│   ├── TotalsSummary.vue        # Document totals display
│   ├── WorkflowActions.vue      # Status-based action buttons
│   ├── __tests__/               # 3 test files
│   └── index.ts                 # Barrel export
│
├── charts/                     # Data visualization
│   ├── BarChart.vue            # Bar chart (Chart.js)
│   ├── DoughnutChart.vue       # Doughnut chart
│   ├── LineChart.vue           # Line chart
│   ├── MonthlyBillChart.vue    # Electricity consumption
│   ├── PaybackChart.vue        # Solar ROI timeline
│   └── index.ts                # Barrel export
│
├── solar/                      # Solar-specific components
│   ├── BatteryConfigurator.vue # Battery sizing
│   ├── CapacityCalculatorModal.vue # System sizing
│   ├── FinancingCalculator.vue # Loan projections
│   ├── SolarSettingsPanel.vue  # Global settings
│   ├── WhatIfScenarios.vue     # Scenario modeling
│   └── WizardStepIndicator.vue # Multi-step progress
│
├── projects/                   # Project-specific components
│   ├── ProjectTaskModal.vue    # Task CRUD modal
│   ├── ProjectTasksList.vue    # Task list
│   ├── ProjectCostModal.vue    # Cost CRUD modal
│   ├── ProjectCostsList.vue    # Cost list
│   ├── ProjectRevenueModal.vue # Revenue CRUD modal
│   └── ProjectRevenuesList.vue # Revenue list
│
├── invoices/                   # Invoice-specific components
│   ├── ScheduleReminderModal.vue
│   └── SendReminderModal.vue
│
├── quotations/                 # Quotation-specific components
│   ├── CreateQuotationFromBomModal.vue
│   ├── LogActivityModal.vue
│   └── ScheduleFollowUpModal.vue
│
├── maps/                       # Map components
│   └── LocationMapPicker.vue   # Leaflet map picker
│
├── AttachmentCard.vue          # Attachment display/upload
├── BulkActionsBar.vue          # Bulk selection action bar
├── CommandPalette.vue          # Global search (Cmd+K)
├── ErrorBoundary.vue           # Vue error boundary
├── GlobalSearch.vue            # Search across modules
├── KeyboardShortcutsModal.vue  # Shortcuts help modal
├── MobileBottomNav.vue         # Mobile navigation
├── NotificationDropdown.vue    # Notification dropdown
├── OfflineBanner.vue           # Offline status banner
├── PrintableDocument.vue       # Print-friendly wrapper
├── PwaUpdatePrompt.vue         # PWA update notification
├── RecentlyViewed.vue          # Recently viewed items
└── SessionTimeoutModal.vue     # Session expiry warning
```

### Pages

```
src/pages/
├── DashboardPage.vue           # Main dashboard
├── LoginPage.vue               # Login form
├── NotFoundPage.vue            # 404 page
│
├── accounting/
│   ├── accounts/
│   │   ├── AccountListPage.vue
│   │   ├── AccountFormPage.vue
│   │   ├── AccountDetailPage.vue
│   │   └── AccountTreeNode.vue
│   ├── journal-entries/
│   │   ├── JournalEntryListPage.vue
│   │   ├── JournalEntryFormPage.vue
│   │   └── JournalEntryDetailPage.vue
│   ├── fiscal-periods/
│   │   ├── FiscalPeriodListPage.vue
│   │   ├── FiscalPeriodFormPage.vue
│   │   ├── FiscalPeriodDetailPage.vue
│   │   └── FiscalPeriodCloseWizardPage.vue
│   ├── budgets/
│   │   ├── BudgetListPage.vue
│   │   ├── BudgetFormPage.vue
│   │   └── BudgetDetailPage.vue
│   ├── recurring-templates/
│   │   ├── RecurringTemplateListPage.vue
│   │   ├── RecurringTemplateFormPage.vue
│   │   └── RecurringTemplateDetailPage.vue
│   └── bank-reconciliation/
│       ├── BankReconciliationPage.vue
│       ├── BankTransactionDetailPage.vue
│       └── BankTransactionFormPage.vue
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
│   ├── CompanyProfileDetailPage.vue
│   ├── CompanyProfileFormPage.vue
│   └── CompanyProfileListPage.vue
│
├── contacts/
│   ├── ContactDetailPage.vue
│   ├── ContactFormPage.vue
│   └── ContactListPage.vue
│
├── finance/
│   ├── down-payments/
│   │   ├── DownPaymentListPage.vue
│   │   ├── DownPaymentFormPage.vue
│   │   └── DownPaymentDetailPage.vue
│   └── reminders/
│       ├── PaymentReminderListPage.vue
│       └── PaymentReminderDetailPage.vue
│
├── inventory/
│   ├── InventoryListPage.vue
│   ├── StockMovementsPage.vue
│   ├── StockAdjustmentPage.vue
│   ├── StockTransferPage.vue
│   ├── StockCardPage.vue
│   ├── MovementSummaryPage.vue
│   ├── StockOpnameListPage.vue
│   ├── StockOpnameFormPage.vue
│   ├── StockOpnameDetailPage.vue
│   └── VarianceReportPage.vue
│
├── invoices/
│   ├── InvoiceDetailPage.vue
│   ├── InvoiceFormPage.vue
│   └── InvoiceListPage.vue
│
├── manufacturing/
│   ├── MaterialStatusPage.vue
│   ├── material-requisitions/
│   │   ├── MaterialRequisitionListPage.vue
│   │   ├── MaterialRequisitionFormPage.vue
│   │   └── MaterialRequisitionDetailPage.vue
│   ├── mrp/
│   │   ├── MrpRunListPage.vue
│   │   ├── MrpRunFormPage.vue
│   │   ├── MrpRunDetailPage.vue
│   │   └── ShortageReportPage.vue
│   ├── cost-optimization/
│   │   └── CostOptimizationPage.vue
│   ├── subcontractor-work-orders/
│   │   ├── SubcontractorWorkOrderListPage.vue
│   │   ├── SubcontractorWorkOrderFormPage.vue
│   │   └── SubcontractorWorkOrderDetailPage.vue
│   └── subcontractor-invoices/
│       ├── SubcontractorInvoiceListPage.vue
│       └── SubcontractorInvoiceDetailPage.vue
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
├── purchasing/
│   ├── purchase-orders/
│   │   ├── PurchaseOrderListPage.vue
│   │   ├── PurchaseOrderFormPage.vue
│   │   └── PurchaseOrderDetailPage.vue
│   ├── goods-receipt-notes/
│   │   ├── GoodsReceiptNoteListPage.vue
│   │   ├── GoodsReceiptNoteFormPage.vue
│   │   └── GoodsReceiptNoteDetailPage.vue
│   └── purchase-returns/
│       ├── PurchaseReturnListPage.vue
│       ├── PurchaseReturnFormPage.vue
│       └── PurchaseReturnDetailPage.vue
│
├── quotations/
│   ├── QuotationDetailPage.vue
│   ├── QuotationFormPage.vue
│   └── QuotationListPage.vue
│
├── reports/
│   ├── ReportsPage.vue
│   ├── BalanceSheetPage.vue
│   ├── IncomeStatementPage.vue
│   ├── CashFlowPage.vue
│   ├── TrialBalancePage.vue
│   ├── ReceivablesAgingPage.vue
│   ├── PayablesAgingPage.vue
│   └── VatReportPage.vue
│
├── sales/
│   ├── delivery-orders/
│   │   ├── DeliveryOrderListPage.vue
│   │   ├── DeliveryOrderFormPage.vue
│   │   └── DeliveryOrderDetailPage.vue
│   ├── sales-returns/
│   │   ├── SalesReturnListPage.vue
│   │   ├── SalesReturnFormPage.vue
│   │   └── SalesReturnDetailPage.vue
│   ├── follow-up/
│   │   └── FollowUpDashboardPage.vue
│   └── overdue/
│       └── OverdueDashboardPage.vue
│
├── settings/
│   ├── SettingsPage.vue
│   ├── roles/
│   │   ├── RoleListPage.vue
│   │   ├── RoleFormPage.vue
│   │   └── RoleDetailPage.vue
│   ├── product-categories/
│   │   ├── ProductCategoryListPage.vue
│   │   ├── ProductCategoryFormPage.vue
│   │   └── ProductCategoryDetailPage.vue
│   ├── warehouses/
│   │   ├── WarehouseListPage.vue
│   │   ├── WarehouseFormPage.vue
│   │   └── WarehouseDetailPage.vue
│   ├── nsfp-ranges/
│   │   ├── NsfpRangeListPage.vue
│   │   ├── NsfpRangeFormPage.vue
│   │   └── NsfpRangeDetailPage.vue
│   ├── accounting-policies/
│   │   └── AccountingPoliciesPage.vue
│   ├── bom-templates/
│   │   ├── BomTemplatesListPage.vue
│   │   ├── BomTemplateFormPage.vue
│   │   └── BomTemplateDetailPage.vue
│   ├── component-library/
│   │   ├── ComponentLibraryPage.vue
│   │   ├── ComponentStandardFormPage.vue
│   │   └── ComponentStandardDetailPage.vue
│   └── rule-sets/
│       ├── RuleSetsListPage.vue
│       ├── RuleSetFormPage.vue
│       └── RuleSetDetailPage.vue
│
├── solar-proposals/
│   ├── SolarProposalAnalyticsPage.vue
│   ├── SolarProposalDetailPage.vue
│   ├── SolarProposalListPage.vue
│   └── SolarProposalWizard.vue
│
├── users/
│   ├── UserListPage.vue
│   ├── UserFormPage.vue
│   └── UserDetailPage.vue
│
└── work-orders/
    ├── WorkOrderListPage.vue
    ├── WorkOrderFormPage.vue
    ├── WorkOrderDetailPage.vue
    ├── SubWorkOrdersPage.vue
    └── WorkOrderCostSummaryPage.vue
```

### Services (Strategy Pattern)

```
src/services/
├── index.ts                    # Service barrel export
│
├── calculation/                # Line item calculation engine
│   ├── CalculationService.ts   # Main service (DI-enabled)
│   ├── useCalculation.ts       # Vue composable wrapper
│   ├── strategies/
│   │   ├── discount/           # AmountDiscount, PercentDiscount, TieredDiscount
│   │   ├── rounding/           # Standard, Indonesian, RoundUp
│   │   └── tax/                # PPN, InclusiveTax, NoTax
│   └── __tests__/
│
├── document-number/            # Document numbering
│   ├── DocumentNumberService.ts
│   ├── strategies/             # Sequential, MonthlyReset
│   └── __tests__/
│
├── export/                     # File export
│   ├── ExportService.ts
│   ├── useExport.ts
│   ├── strategies/             # CSV, Excel
│   └── __tests__/
│
├── line-items/                 # Line item management
│   ├── LineItemsService.ts
│   └── __tests__/
│
├── notification/               # Notification dispatch
│   ├── NotificationService.ts
│   └── strategies/             # Toast, BrowserNotification
│
├── pricing/                    # Price calculation
│   ├── PricingService.ts
│   ├── usePricing.ts
│   ├── strategies/             # Standard, VolumeDiscount, Contract
│   └── __tests__/
│
├── state-machine/              # Workflow state management
│   ├── StateMachine.ts
│   ├── useStateMachine.ts
│   ├── visualization.ts        # State machine visualization
│   ├── workflows/              # quotation, invoice, purchaseOrder machines
│   └── __tests__/
│
└── status/                     # Status display/mapping
    ├── StatusService.ts
    ├── statusRegistry.ts
    ├── useStatus.ts
    └── __tests__/
```

### Infrastructure (Cross-Cutting)

```
src/infrastructure/
├── index.ts                    # Infrastructure barrel export
├── bootstrap.ts                # Application bootstrap
│
├── container/                  # Dependency injection
│   ├── Container.ts            # DI container implementation
│   ├── useService.ts           # Vue composable for DI
│   └── types.ts
│
├── errors/                     # Error handling
│   ├── guards.ts               # Error type guards
│   ├── types.ts                # Typed error definitions
│   └── __tests__/
│
├── events/                     # Event system
│   ├── EventBus.ts             # Publish/subscribe bus
│   ├── useEventBus.ts          # Vue composable wrapper
│   └── __tests__/
│
├── features/                   # Feature flags
│   ├── FeatureFlags.ts         # Flag manager
│   ├── useFeatureFlag.ts       # Vue composable wrapper
│   └── __tests__/
│
├── logger/                     # Structured logging
│   ├── Logger.ts               # Logger with levels
│   ├── useLogger.ts            # Vue composable wrapper
│   ├── transports/             # ConsoleTransport
│   └── __tests__/
│
├── performance/                # Performance monitoring
│   ├── PerformanceMonitor.ts
│   └── usePerformance.ts
│
└── types/                      # Shared type generics
    ├── generics.ts
    └── index.ts
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
├── usePrint.ts                 # Print functionality
├── usePullToRefresh.ts         # Mobile pull-to-refresh
├── useRecentlyViewed.ts        # Track viewed items
├── useScenarioCalculator.ts    # What-if scenarios
├── useSessionTimeout.ts        # Session timeout management
├── useSolarSettings.ts         # Solar calculation settings
├── useUnsavedChanges.ts        # Unsaved changes warning
├── useValidatedForm.ts         # VeeValidate + Zod form helper
└── useWebSocket.ts             # WebSocket connection
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
│   ├── asyncComponent.ts       # Async component loader
│   ├── calculations.ts         # Shared calculation utils
│   ├── cn.ts                   # Tailwind class merge
│   ├── deprecation.ts          # Deprecation warnings
│   ├── export.ts               # CSV/Excel export
│   ├── format.ts               # Currency, date formatters
│   └── validation.ts           # Zod schemas
│
├── test/
│   ├── setup.ts                # Global test setup
│   └── utils.ts                # Test utilities (renderWithProviders)
│
└── main.ts                     # App entry point
```

---

## File Counts

| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/api/` | 47 | API hooks |
| `src/components/ui/` | 30 | Design system |
| `src/components/` (total) | 76 | All components |
| `src/pages/` | 173 | Route components |
| `src/composables/` | 22 | Reusable logic |
| `src/services/` | 30+ | Domain services + strategies |
| `src/infrastructure/` | 20+ | Cross-cutting concerns |
| `src/**/__tests__/` | 65 | Test files |
| **Total** | ~400+ | Source files |
