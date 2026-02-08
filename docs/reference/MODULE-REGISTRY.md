# Module Registry

> Complete mapping of modules, ownership, and file locations

---

## Module Overview

| Module | Domain | Routes | Status |
|--------|--------|--------|--------|
| **Accounts** | Accounting | `/accounting/accounts/*` | Active |
| **Journal Entries** | Accounting | `/accounting/journal-entries/*` | Active |
| **Fiscal Periods** | Accounting | `/accounting/fiscal-periods/*` | Active |
| **Budgets** | Accounting | `/accounting/budgets/*` | Active |
| **Recurring Templates** | Accounting | `/accounting/recurring-templates/*` | Active |
| **Bank Reconciliation** | Accounting | `/accounting/bank-reconciliation/*` | Active |
| **Solar Proposals** | Solar | `/solar-proposals/*` | Active |
| **Quotations** | Sales | `/quotations/*` | Active |
| **Invoices** | Sales | `/invoices/*` | Active |
| **Contacts** | CRM | `/contacts/*` | Active |
| **Delivery Orders** | Sales | `/sales/delivery-orders/*` | Active |
| **Sales Returns** | Sales | `/sales/sales-returns/*` | Active |
| **Quotation Follow-Up** | Sales | `/sales/follow-up` | Active |
| **Purchase Orders** | Purchasing | `/purchasing/purchase-orders/*` | Active |
| **Goods Receipt Notes** | Purchasing | `/purchasing/goods-receipt-notes/*` | Active |
| **Purchase Returns** | Purchasing | `/purchasing/purchase-returns/*` | Active |
| **Bills** | Purchasing | `/bills/*` | Active |
| **Payments** | Purchasing | `/payments/*` | Active |
| **Down Payments** | Finance | `/finance/down-payments/*` | Active |
| **Payment Reminders** | Finance | `/finance/reminders/*` | Active |
| **Products** | Inventory | `/products/*` | Active |
| **BOMs** | Inventory | `/boms/*` | Active |
| **Inventory** | Inventory | `/inventory/*` | Active |
| **Stock Opname** | Inventory | `/inventory/stock-opname/*` | Active |
| **Warehouses** | Admin | `/settings/warehouses/*` | Active |
| **Projects** | Projects | `/projects/*` | Active |
| **Work Orders** | Manufacturing | `/work-orders/*` | Active |
| **Material Requisitions** | Manufacturing | `/manufacturing/material-requisitions/*` | Active |
| **MRP** | Manufacturing | `/manufacturing/mrp/*` | Active |
| **Subcontractor WOs** | Manufacturing | `/manufacturing/subcontractor-work-orders/*` | Active |
| **Subcontractor Invoices** | Manufacturing | `/manufacturing/subcontractor-invoices/*` | Active |
| **Reports** | Finance | `/reports/*` | Active |
| **Roles** | Admin | `/settings/roles/*` | Active |
| **Product Categories** | Admin | `/settings/product-categories/*` | Active |
| **NSFP Ranges** | Admin | `/settings/nsfp-ranges/*` | Active |
| **Settings** | Admin | `/settings/*` | Active |
| **Users** | Admin | `/users/*` | Active |
| **Company Profiles** | Admin | `/company-profiles/*` | Active |

---

## Detailed Module Mapping

### Accounting: Chart of Accounts

**Domain:** Core accounting backbone

```
Routes:
  /accounting/accounts              → AccountListPage.vue
  /accounting/accounts/new          → AccountFormPage.vue
  /accounting/accounts/:id          → AccountDetailPage.vue
  /accounting/accounts/:id/edit     → AccountFormPage.vue

Pages:
  src/pages/accounting/accounts/
  ├── AccountListPage.vue
  ├── AccountFormPage.vue
  ├── AccountDetailPage.vue
  └── AccountTreeNode.vue

API Hooks:
  src/api/useAccounts.ts
  ├── useAccounts()                  # List with filters
  ├── useAccount()                   # Single account
  ├── useCreateAccount()             # Create
  ├── useUpdateAccount()             # Update
  ├── useDeleteAccount()             # Delete
  ├── useAccountBalance()            # Account balance
  ├── useAccountLedger()             # Ledger entries
  └── useAccountsLookup()            # Lookup by type (asset, expense, revenue)
```

---

### Accounting: Journal Entries

**Domain:** General ledger entries

```
Routes:
  /accounting/journal-entries              → JournalEntryListPage.vue
  /accounting/journal-entries/new          → JournalEntryFormPage.vue
  /accounting/journal-entries/:id          → JournalEntryDetailPage.vue

Pages:
  src/pages/accounting/journal-entries/
  ├── JournalEntryListPage.vue
  ├── JournalEntryFormPage.vue
  └── JournalEntryDetailPage.vue

API Hooks:
  src/api/useJournalEntries.ts
  ├── useJournalEntries()              # List
  ├── useJournalEntry()                # Single entry
  ├── useCreateJournalEntry()          # Create
  ├── usePostJournalEntry()            # Post
  └── useReverseJournalEntry()         # Reverse

Status Flow:
  draft → posted
           ↘ reversed (creates new entry)
```

---

### Accounting: Fiscal Periods

**Domain:** Period management and year-end closing

```
Routes:
  /accounting/fiscal-periods              → FiscalPeriodListPage.vue
  /accounting/fiscal-periods/new          → FiscalPeriodFormPage.vue
  /accounting/fiscal-periods/:id          → FiscalPeriodDetailPage.vue
  /accounting/fiscal-periods/:id/close    → FiscalPeriodCloseWizardPage.vue

Pages:
  src/pages/accounting/fiscal-periods/
  ├── FiscalPeriodListPage.vue
  ├── FiscalPeriodFormPage.vue
  ├── FiscalPeriodDetailPage.vue
  └── FiscalPeriodCloseWizardPage.vue

API Hooks:
  src/api/useFiscalPeriods.ts
  ├── useFiscalPeriods()               # List
  ├── useFiscalPeriod()                # Single
  ├── useCreateFiscalPeriod()          # Create
  ├── useLockFiscalPeriod()            # Lock
  ├── useUnlockFiscalPeriod()          # Unlock
  ├── useCloseFiscalPeriod()           # Close
  ├── useReopenFiscalPeriod()          # Reopen
  └── useFiscalPeriodChecklist()       # Closing checklist

Status Flow:
  open → locked → closed
         ↲ unlock   ↲ reopen
```

---

### Accounting: Budgets

**Domain:** Budget planning and tracking

```
Routes:
  /accounting/budgets              → BudgetListPage.vue
  /accounting/budgets/new          → BudgetFormPage.vue
  /accounting/budgets/:id          → BudgetDetailPage.vue

Pages:
  src/pages/accounting/budgets/
  ├── BudgetListPage.vue
  ├── BudgetFormPage.vue
  └── BudgetDetailPage.vue

API Hooks:
  src/api/useBudgets.ts
```

---

### Accounting: Recurring Templates

**Domain:** Auto-generate recurring documents

```
Routes:
  /accounting/recurring-templates              → RecurringTemplateListPage.vue
  /accounting/recurring-templates/new          → RecurringTemplateFormPage.vue
  /accounting/recurring-templates/:id          → RecurringTemplateDetailPage.vue

Pages:
  src/pages/accounting/recurring-templates/
  ├── RecurringTemplateListPage.vue
  ├── RecurringTemplateFormPage.vue
  └── RecurringTemplateDetailPage.vue

API Hooks:
  src/api/useRecurringTemplates.ts
  ├── useRecurringTemplates()          # List
  ├── useRecurringTemplate()           # Single
  ├── useCreateRecurringTemplate()     # Create
  ├── useUpdateRecurringTemplate()     # Update
  ├── useDeleteRecurringTemplate()     # Delete
  ├── useGenerateRecurring()           # Generate document
  ├── usePauseRecurring()              # Pause
  └── useResumeRecurring()             # Resume
```

---

### Accounting: Bank Reconciliation

**Domain:** Match bank transactions with payments

```
Routes:
  /accounting/bank-reconciliation              → BankReconciliationPage.vue
  /accounting/bank-reconciliation/:id          → BankTransactionDetailPage.vue
  /accounting/bank-reconciliation/:id/new      → BankTransactionFormPage.vue

Pages:
  src/pages/accounting/bank-reconciliation/
  ├── BankReconciliationPage.vue
  ├── BankTransactionDetailPage.vue
  └── BankTransactionFormPage.vue

API Hooks:
  src/api/useBankTransactions.ts
  ├── useBankTransactions()            # List
  ├── useBankTransaction()             # Single
  ├── useCreateBankTransaction()       # Create
  ├── useMatchPayment()                # Match to payment
  ├── useUnmatch()                     # Unmatch
  ├── useReconcile()                   # Reconcile
  ├── useBulkReconcile()               # Bulk reconcile
  └── useSuggestMatches()              # AI-suggested matches
```

---

### Sales: Quotations Module

**Domain:** Sales - price quotes for customers

```
Routes:
  /quotations                   → QuotationListPage.vue
  /quotations/new               → QuotationFormPage.vue
  /quotations/:id               → QuotationDetailPage.vue
  /quotations/:id/edit          → QuotationFormPage.vue

Pages:
  src/pages/quotations/
  ├── QuotationListPage.vue
  ├── QuotationFormPage.vue
  └── QuotationDetailPage.vue

Components:
  src/components/quotations/
  ├── CreateQuotationFromBomModal.vue
  ├── LogActivityModal.vue
  └── ScheduleFollowUpModal.vue

API Hooks:
  src/api/useQuotations.ts
  src/api/useQuotationFollowUp.ts

Status Flow:
  draft → submitted → approved → converted
                   ↘ rejected
```

---

### Sales: Invoices Module

**Domain:** Sales - billing documents

```
Routes:
  /invoices                     → InvoiceListPage.vue
  /invoices/new                 → InvoiceFormPage.vue
  /invoices/:id                 → InvoiceDetailPage.vue
  /invoices/:id/edit            → InvoiceFormPage.vue

Pages:
  src/pages/invoices/
  ├── InvoiceListPage.vue
  ├── InvoiceFormPage.vue
  └── InvoiceDetailPage.vue

Components:
  src/components/invoices/
  ├── ScheduleReminderModal.vue
  └── SendReminderModal.vue

API Hooks:
  src/api/useInvoices.ts

Status Flow:
  draft → sent → partial → paid
              ↘ overdue
```

---

### Sales: Delivery Orders

**Domain:** Shipment tracking

```
Routes:
  /sales/delivery-orders              → DeliveryOrderListPage.vue
  /sales/delivery-orders/new          → DeliveryOrderFormPage.vue
  /sales/delivery-orders/:id          → DeliveryOrderDetailPage.vue

Pages:
  src/pages/sales/delivery-orders/
  ├── DeliveryOrderListPage.vue
  ├── DeliveryOrderFormPage.vue
  └── DeliveryOrderDetailPage.vue

API Hooks:
  src/api/useDeliveryOrders.ts

Status Flow:
  draft → confirmed → shipped → delivered
                              ↘ cancelled
```

---

### Sales: Sales Returns

**Domain:** Customer returns

```
Routes:
  /sales/sales-returns              → SalesReturnListPage.vue
  /sales/sales-returns/new          → SalesReturnFormPage.vue
  /sales/sales-returns/:id          → SalesReturnDetailPage.vue

Pages:
  src/pages/sales/sales-returns/
  ├── SalesReturnListPage.vue
  ├── SalesReturnFormPage.vue
  └── SalesReturnDetailPage.vue

API Hooks:
  src/api/useSalesReturns.ts
```

---

### Sales: Follow-Up & Overdue Dashboards

**Domain:** CRM-like pipeline tracking

```
Routes:
  /sales/follow-up              → FollowUpDashboardPage.vue
  /sales/overdue                → OverdueDashboardPage.vue

API Hooks:
  src/api/useQuotationFollowUp.ts
  src/api/usePaymentReminders.ts
```

---

### Contacts Module

**Domain:** CRM - customer/vendor management

```
Routes:
  /contacts                     → ContactListPage.vue
  /contacts/new                 → ContactFormPage.vue
  /contacts/:id                 → ContactDetailPage.vue
  /contacts/:id/edit            → ContactFormPage.vue

Pages:
  src/pages/contacts/
  ├── ContactListPage.vue
  ├── ContactFormPage.vue
  └── ContactDetailPage.vue

API Hooks:
  src/api/useContacts.ts
  ├── useContacts()                # List with filters
  ├── useContact()                 # Single contact
  ├── useCreateContact()           # Create
  ├── useUpdateContact()           # Update
  ├── useDeleteContact()           # Delete
  ├── useContactLookup()           # Autocomplete search
  ├── useContactBalances()         # Outstanding balances
  └── useContactCreditStatus()     # Credit status
```

---

### Purchasing: Purchase Orders

**Domain:** Purchase-to-pay cycle

```
Routes:
  /purchasing/purchase-orders              → PurchaseOrderListPage.vue
  /purchasing/purchase-orders/new          → PurchaseOrderFormPage.vue
  /purchasing/purchase-orders/:id          → PurchaseOrderDetailPage.vue
  /purchasing/purchase-orders/:id/edit     → PurchaseOrderFormPage.vue

Pages:
  src/pages/purchasing/purchase-orders/
  ├── PurchaseOrderListPage.vue
  ├── PurchaseOrderFormPage.vue
  └── PurchaseOrderDetailPage.vue

API Hooks:
  src/api/usePurchaseOrders.ts

Status Flow:
  draft → submitted → approved → received → billed
                   ↘ rejected
```

---

### Purchasing: Goods Receipt Notes

**Domain:** Receiving goods from vendors

```
Routes:
  /purchasing/goods-receipt-notes              → GoodsReceiptNoteListPage.vue
  /purchasing/goods-receipt-notes/new          → GoodsReceiptNoteFormPage.vue
  /purchasing/goods-receipt-notes/:id          → GoodsReceiptNoteDetailPage.vue

Pages:
  src/pages/purchasing/goods-receipt-notes/
  ├── GoodsReceiptNoteListPage.vue
  ├── GoodsReceiptNoteFormPage.vue
  └── GoodsReceiptNoteDetailPage.vue

API Hooks:
  src/api/useGoodsReceiptNotes.ts
```

---

### Purchasing: Purchase Returns

**Domain:** Returning goods to vendors

```
Routes:
  /purchasing/purchase-returns              → PurchaseReturnListPage.vue
  /purchasing/purchase-returns/new          → PurchaseReturnFormPage.vue
  /purchasing/purchase-returns/:id          → PurchaseReturnDetailPage.vue
  /purchasing/purchase-returns/:id/edit     → PurchaseReturnFormPage.vue

Pages:
  src/pages/purchasing/purchase-returns/
  ├── PurchaseReturnListPage.vue
  ├── PurchaseReturnFormPage.vue
  └── PurchaseReturnDetailPage.vue

API Hooks:
  src/api/usePurchaseReturns.ts
```

---

### Finance: Down Payments

**Domain:** Advance payments tracking

```
Routes:
  /finance/down-payments              → DownPaymentListPage.vue
  /finance/down-payments/new          → DownPaymentFormPage.vue
  /finance/down-payments/:id          → DownPaymentDetailPage.vue

Pages:
  src/pages/finance/down-payments/
  ├── DownPaymentListPage.vue
  ├── DownPaymentFormPage.vue
  └── DownPaymentDetailPage.vue

API Hooks:
  src/api/useDownPayments.ts
```

---

### Finance: Payment Reminders

**Domain:** Overdue payment tracking

```
Routes:
  /finance/reminders              → PaymentReminderListPage.vue
  /finance/reminders/:id          → PaymentReminderDetailPage.vue

Pages:
  src/pages/finance/reminders/
  ├── PaymentReminderListPage.vue
  └── PaymentReminderDetailPage.vue

API Hooks:
  src/api/usePaymentReminders.ts
```

---

### Products Module

**Domain:** Inventory - product catalog

```
Routes:
  /products                     → ProductListPage.vue
  /products/new                 → ProductFormPage.vue
  /products/:id                 → ProductDetailPage.vue
  /products/:id/edit            → ProductFormPage.vue

Pages:
  src/pages/products/
  ├── ProductListPage.vue
  ├── ProductFormPage.vue
  └── ProductDetailPage.vue

API Hooks:
  src/api/useProducts.ts
  src/api/useProductCategories.ts
```

---

### Inventory Module

**Domain:** Stock management, transfers, opname

```
Routes:
  /inventory                    → InventoryListPage.vue
  /inventory/movements          → StockMovementsPage.vue
  /inventory/adjust             → StockAdjustmentPage.vue
  /inventory/transfer           → StockTransferPage.vue
  /inventory/stock-card         → StockCardPage.vue
  /inventory/movement-summary   → MovementSummaryPage.vue
  /inventory/stock-opname       → StockOpnameListPage.vue
  /inventory/stock-opname/new   → StockOpnameFormPage.vue
  /inventory/stock-opname/:id   → StockOpnameDetailPage.vue
  /inventory/stock-opname/:id/variance → VarianceReportPage.vue

Pages:
  src/pages/inventory/
  ├── InventoryListPage.vue
  ├── StockMovementsPage.vue
  ├── StockAdjustmentPage.vue
  ├── StockTransferPage.vue
  ├── StockCardPage.vue
  ├── MovementSummaryPage.vue
  ├── StockOpnameListPage.vue
  ├── StockOpnameFormPage.vue
  ├── StockOpnameDetailPage.vue
  └── VarianceReportPage.vue

API Hooks:
  src/api/useInventory.ts
  src/api/useStockOpnames.ts
  src/api/useWarehouses.ts
```

---

### BOMs Module

**Domain:** Inventory - Bill of Materials

```
Routes:
  /boms                         → BomListPage.vue
  /boms/new                     → BomFormPage.vue
  /boms/:id                     → BomDetailPage.vue
  /boms/:id/edit                → BomFormPage.vue
  /boms/from-template           → CreateBomFromTemplatePage.vue
  /boms/variant-groups          → VariantGroupsPage.vue

Pages:
  src/pages/boms/
  ├── BomListPage.vue
  ├── BomFormPage.vue
  ├── BomDetailPage.vue
  ├── CreateBomFromTemplatePage.vue
  └── VariantGroupsPage.vue

API Hooks:
  src/api/useBoms.ts
  src/api/useBomTemplates.ts
```

---

### Projects Module

**Domain:** Project management with tasks, costs, revenue

```
Routes:
  /projects                     → ProjectListPage.vue
  /projects/new                 → ProjectFormPage.vue
  /projects/:id                 → ProjectDetailPage.vue
  /projects/:id/edit            → ProjectFormPage.vue

Pages:
  src/pages/projects/
  ├── ProjectListPage.vue
  ├── ProjectFormPage.vue
  └── ProjectDetailPage.vue

Components:
  src/components/projects/
  ├── ProjectTaskModal.vue           # Task CRUD modal
  ├── ProjectTasksList.vue           # Task list on detail
  ├── ProjectCostModal.vue           # Cost CRUD modal
  ├── ProjectCostsList.vue           # Cost list on detail
  ├── ProjectRevenueModal.vue        # Revenue CRUD modal
  └── ProjectRevenuesList.vue        # Revenue list on detail

API Hooks:
  src/api/useProjects.ts
  src/api/useProjectTasks.ts
```

---

### Work Orders Module

**Domain:** Manufacturing execution

```
Routes:
  /work-orders                  → WorkOrderListPage.vue
  /work-orders/new              → WorkOrderFormPage.vue
  /work-orders/:id              → WorkOrderDetailPage.vue
  /work-orders/:id/edit         → WorkOrderFormPage.vue
  /work-orders/:id/sub-work-orders → SubWorkOrdersPage.vue
  /work-orders/:id/cost-summary → WorkOrderCostSummaryPage.vue

Pages:
  src/pages/work-orders/
  ├── WorkOrderListPage.vue
  ├── WorkOrderFormPage.vue
  ├── WorkOrderDetailPage.vue
  ├── SubWorkOrdersPage.vue
  └── WorkOrderCostSummaryPage.vue

API Hooks:
  src/api/useWorkOrders.ts
```

---

### Manufacturing: Material Requisitions

**Domain:** Material request and issuance

```
Routes:
  /manufacturing/material-requisitions              → MaterialRequisitionListPage.vue
  /manufacturing/material-requisitions/new          → MaterialRequisitionFormPage.vue
  /manufacturing/material-requisitions/:id          → MaterialRequisitionDetailPage.vue
  /manufacturing/material-requisitions/:id/edit     → MaterialRequisitionFormPage.vue

Pages:
  src/pages/manufacturing/material-requisitions/
  ├── MaterialRequisitionListPage.vue
  ├── MaterialRequisitionFormPage.vue
  └── MaterialRequisitionDetailPage.vue

API Hooks:
  src/api/useMaterialRequisitions.ts
```

---

### Manufacturing: MRP

**Domain:** Material Requirements Planning

```
Routes:
  /manufacturing/mrp              → MrpRunListPage.vue
  /manufacturing/mrp/new          → MrpRunFormPage.vue
  /manufacturing/mrp/:id          → MrpRunDetailPage.vue
  /manufacturing/mrp/shortage     → ShortageReportPage.vue

Pages:
  src/pages/manufacturing/mrp/
  ├── MrpRunListPage.vue
  ├── MrpRunFormPage.vue
  ├── MrpRunDetailPage.vue
  └── ShortageReportPage.vue

Additional Pages:
  src/pages/manufacturing/
  ├── MaterialStatusPage.vue
  └── cost-optimization/CostOptimizationPage.vue

API Hooks:
  src/api/useMrp.ts
```

---

### Manufacturing: Subcontracting

**Domain:** Outsourced manufacturing

```
Routes:
  /manufacturing/subcontractor-work-orders              → SubcontractorWorkOrderListPage.vue
  /manufacturing/subcontractor-work-orders/new          → SubcontractorWorkOrderFormPage.vue
  /manufacturing/subcontractor-work-orders/:id          → SubcontractorWorkOrderDetailPage.vue
  /manufacturing/subcontractor-invoices                 → SubcontractorInvoiceListPage.vue
  /manufacturing/subcontractor-invoices/:id             → SubcontractorInvoiceDetailPage.vue

Pages:
  src/pages/manufacturing/subcontractor-work-orders/
  ├── SubcontractorWorkOrderListPage.vue
  ├── SubcontractorWorkOrderFormPage.vue
  └── SubcontractorWorkOrderDetailPage.vue

  src/pages/manufacturing/subcontractor-invoices/
  ├── SubcontractorInvoiceListPage.vue
  └── SubcontractorInvoiceDetailPage.vue

API Hooks:
  src/api/useSubcontractorWorkOrders.ts
  src/api/useSubcontractorInvoices.ts
```

---

### Solar Proposals Module

**Domain:** Solar ERP core feature - pre-sales solar system proposals

```
Routes:
  /solar-proposals              → SolarProposalListPage.vue
  /solar-proposals/new          → SolarProposalWizard.vue
  /solar-proposals/:id          → SolarProposalDetailPage.vue
  /solar-proposals/:id/edit     → SolarProposalWizard.vue
  /solar-proposals/analytics    → SolarProposalAnalyticsPage.vue

Pages:
  src/pages/solar-proposals/
  ├── SolarProposalListPage.vue
  ├── SolarProposalWizard.vue
  ├── SolarProposalDetailPage.vue
  └── SolarProposalAnalyticsPage.vue

Components:
  src/components/solar/
  ├── SolarSettingsPanel.vue
  ├── BatteryConfigurator.vue
  ├── FinancingCalculator.vue
  ├── WhatIfScenarios.vue
  ├── CapacityCalculatorModal.vue
  ├── StatsCard.vue
  └── WizardStepIndicator.vue

Public Routes:
  /p/:token                     # Public proposal view
  /solar-calculator             # Public solar calculator
```

---

### Reports Module

**Domain:** Finance - financial reporting

```
Routes:
  /reports                      → ReportsPage.vue
  /reports/balance-sheet        → BalanceSheetPage.vue
  /reports/income-statement     → IncomeStatementPage.vue
  /reports/cash-flow            → CashFlowPage.vue
  /reports/trial-balance        → TrialBalancePage.vue
  /reports/receivables-aging    → ReceivablesAgingPage.vue
  /reports/payables-aging       → PayablesAgingPage.vue
  /reports/vat                  → VatReportPage.vue

API Hooks:
  src/api/useReports.ts
  src/api/useExports.ts
```

---

### Settings Module

**Domain:** Admin - system configuration

```
Routes:
  /settings                                              → SettingsPage.vue
  /settings/roles/*                                      → Role CRUD pages
  /settings/product-categories/*                         → Product Category CRUD pages
  /settings/warehouses/*                                 → Warehouse CRUD pages
  /settings/nsfp-ranges/*                                → NSFP Range CRUD pages
  /settings/accounting-policies                          → AccountingPoliciesPage.vue
  /settings/component-library/*                          → Component Standard CRUD pages
  /settings/rule-sets/*                                  → Rule Set CRUD pages
  /settings/bom-templates/*                              → BOM Template CRUD pages

Pages:
  src/pages/settings/
  ├── SettingsPage.vue
  ├── roles/
  │   ├── RoleListPage.vue
  │   ├── RoleFormPage.vue
  │   └── RoleDetailPage.vue
  ├── product-categories/
  │   ├── ProductCategoryListPage.vue
  │   ├── ProductCategoryFormPage.vue
  │   └── ProductCategoryDetailPage.vue
  ├── warehouses/
  │   ├── WarehouseListPage.vue
  │   ├── WarehouseFormPage.vue
  │   └── WarehouseDetailPage.vue
  ├── nsfp-ranges/
  │   ├── NsfpRangeListPage.vue
  │   ├── NsfpRangeFormPage.vue
  │   └── NsfpRangeDetailPage.vue
  ├── accounting-policies/
  │   └── AccountingPoliciesPage.vue
  ├── component-library/
  │   ├── ComponentLibraryPage.vue
  │   ├── ComponentStandardFormPage.vue
  │   └── ComponentStandardDetailPage.vue
  ├── rule-sets/
  │   ├── RuleSetsListPage.vue
  │   ├── RuleSetFormPage.vue
  │   └── RuleSetDetailPage.vue
  └── bom-templates/
      ├── BomTemplatesListPage.vue
      ├── BomTemplateFormPage.vue
      └── BomTemplateDetailPage.vue

API Hooks:
  src/api/useRoles.ts
  src/api/useProductCategories.ts
  src/api/useWarehouses.ts
  src/api/useNsfpRanges.ts
  src/api/useAccountingPolicies.ts
  src/api/useComponentStandards.ts
  src/api/useSpecRuleSets.ts
  src/api/useBomTemplates.ts
```

---

## Cross-Module Dependencies

```
Solar Proposals
├── Uses: BOMs (variant groups for system selection)
├── Uses: Contacts (customer information)
├── Converts to: Quotations
└── Uses: Products (panel/inverter specifications)

Quotations
├── Uses: BOMs (pricing from BOM)
├── Uses: Contacts (customer)
├── Converts to: Invoices
├── Uses: Products (line items)
└── Uses: Follow-Up pipeline (activities, scheduling)

Invoices
├── Uses: Contacts (customer)
├── Uses: Products (line items)
├── Creates: Payments (records)
├── Creates: Delivery Orders
├── Creates: Sales Returns
├── Creates: Recurring Templates
└── Links to: Journal Entries

Bills
├── Uses: Contacts (vendor)
├── Uses: Products (line items)
├── Created from: Purchase Orders
├── Creates: Purchase Returns
├── Creates: Payments
└── Links to: Journal Entries

Purchase Orders
├── Uses: Contacts (vendor)
├── Uses: Products (line items)
├── Creates: Goods Receipt Notes
└── Converts to: Bills

Work Orders
├── Uses: BOMs (material list)
├── Uses: Products (components)
├── Creates: Material Requisitions
├── Creates: Sub Work Orders
└── Uses: Projects (parent project)

MRP
├── Analyzes: Work Orders (demand)
├── Analyzes: Purchase Orders (supply)
├── Analyzes: Inventory (stock levels)
├── Creates: Purchase Order suggestions
└── Creates: Work Order suggestions

Projects
├── Uses: Contacts (customer)
├── Has: Project Tasks
├── Has: Project Costs
├── Has: Project Revenue
└── Creates: Work Orders

Accounts
├── Used by: Journal Entries (debit/credit lines)
├── Used by: Reports (financial statements)
├── Used by: Budgets (budget lines)
└── Used by: Bank Reconciliation (account matching)
```

---

## File Finder

### Finding Files by Feature

| I want to... | Look in |
|--------------|---------|
| Add a new page | `src/pages/{module}/` |
| Add a component | `src/components/{module}/` |
| Add API calls | `src/api/use{Entity}.ts` |
| Add shared logic | `src/composables/use{Feature}.ts` |
| Add a route | `src/router/index.ts` |
| Add UI component | `src/components/ui/` |
| Add domain service | `src/services/{service}/` |
| Add infrastructure | `src/infrastructure/{module}/` |
| Add formatting utils | `src/utils/format.ts` |
| Add validation | `src/utils/validation.ts` |
| Add a workflow | `src/services/state-machine/workflows/` |

---

## Module Statistics

| Metric | Count |
|--------|-------|
| Total Routes | 170+ |
| Total Pages | 173 |
| Total Components | 76 |
| Total Composables | 22 |
| Total API Hooks | 47 files |
| UI Components | 30 |
| Service Modules | 8 |

---

*Last updated: February 2025*
