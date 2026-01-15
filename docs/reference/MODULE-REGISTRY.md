# Module Registry

> Complete mapping of modules, ownership, and file locations

---

## Module Overview

| Module | Domain | Routes | Status |
|--------|--------|--------|--------|
| **Solar Proposals** | Solar | `/solar-proposals/*` | Active |
| **Quotations** | Sales | `/quotations/*` | Active |
| **Invoices** | Sales | `/invoices/*` | Active |
| **Contacts** | CRM | `/contacts/*` | Active |
| **Products** | Inventory | `/products/*` | Active |
| **BOMs** | Inventory | `/boms/*` | Active |
| **Inventory** | Inventory | `/inventory/*` | Active |
| **Bills** | Purchasing | `/bills/*` | Active |
| **Payments** | Purchasing | `/payments/*` | Active |
| **Projects** | Projects | `/projects/*` | Active |
| **Work Orders** | Projects | `/work-orders/*` | Active |
| **Reports** | Finance | `/reports/*` | Active |
| **Settings** | Admin | `/settings/*` | Active |
| **Users** | Admin | `/users/*` | Active |
| **Company Profiles** | Admin | `/company-profiles/*` | Active |

---

## Detailed Module Mapping

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
  ├── SolarSettingsPanel.vue       # Global solar settings
  ├── BatteryConfigurator.vue      # Battery sizing calculator
  ├── FinancingCalculator.vue      # Loan/lease projections
  ├── WhatIfScenarios.vue          # Scenario analysis
  ├── CapacityCalculatorModal.vue  # System capacity modal
  ├── StatsCard.vue                # Solar statistics display
  └── WizardStepIndicator.vue      # Wizard progress indicator

Composables:
  src/composables/
  ├── useSolarSettings.ts          # Settings management
  ├── useBatteryCalculator.ts      # Battery calculations
  ├── useFinancingCalculator.ts    # Financing calculations
  └── useScenarioCalculator.ts     # What-if scenarios

API Hooks:
  src/api/useSolarProposals.ts
  ├── useSolarProposals()          # List with filters
  ├── useSolarProposal()           # Single proposal
  ├── useCreateSolarProposal()     # Create
  ├── useUpdateSolarProposal()     # Update
  ├── useDeleteSolarProposal()     # Delete
  ├── useCalculateSolarData()      # Location solar data
  ├── usePlnTariffs()              # PLN tariff options
  └── useSolarProposalStats()      # Statistics

Public Routes:
  /p/:token                        # Public proposal view
  /solar-calculator                # Public solar calculator
```

---

### Quotations Module

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
  └── CreateQuotationFromBomModal.vue

API Hooks:
  src/api/useQuotations.ts
  ├── useQuotations()              # List with filters
  ├── useQuotation()               # Single quotation
  ├── useCreateQuotation()         # Create
  ├── useUpdateQuotation()         # Update
  ├── useDeleteQuotation()         # Delete
  ├── useSubmitQuotation()         # Submit for approval
  ├── useApproveQuotation()        # Approve
  ├── useRejectQuotation()         # Reject
  ├── useDuplicateQuotation()      # Clone
  ├── useReviseQuotation()         # Create revision
  └── useConvertToInvoice()        # Convert to invoice

Status Flow:
  draft → submitted → approved → converted
                   ↘ rejected
```

---

### Invoices Module

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

API Hooks:
  src/api/useInvoices.ts
  ├── useInvoices()                # List with filters
  ├── useInvoice()                 # Single invoice
  ├── useCreateInvoice()           # Create
  ├── useUpdateInvoice()           # Update
  ├── useDeleteInvoice()           # Delete
  ├── useSendInvoice()             # Send to customer
  └── useRecordPayment()           # Record payment

Status Flow:
  draft → sent → partial → paid
              ↘ overdue
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
  └── useContactLookup()           # Autocomplete search
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
  ├── useProducts()                # List with filters
  ├── useProduct()                 # Single product
  ├── useCreateProduct()           # Create
  ├── useUpdateProduct()           # Update
  ├── useDeleteProduct()           # Delete
  └── useProductLookup()           # Autocomplete search
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
  ├── useBoms()                    # List with filters
  ├── useBom()                     # Single BOM
  ├── useCreateBom()               # Create
  ├── useUpdateBom()               # Update
  ├── useDeleteBom()               # Delete
  ├── useDuplicateBom()            # Clone
  ├── useActivateBom()             # Activate
  └── useActiveBoms()              # Active BOMs for dropdown
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

Pages:
  src/pages/reports/
  ├── ReportsPage.vue              # Reports dashboard
  ├── BalanceSheetPage.vue
  ├── IncomeStatementPage.vue
  ├── CashFlowPage.vue
  ├── TrialBalancePage.vue
  ├── ReceivablesAgingPage.vue
  ├── PayablesAgingPage.vue
  └── VatReportPage.vue

API Hooks:
  src/api/useReports.ts
  ├── useBalanceSheet()
  ├── useIncomeStatement()
  ├── useCashFlow()
  ├── useTrialBalance()
  ├── useReceivablesAging()
  ├── usePayablesAging()
  └── useVatReport()
```

---

### Settings Module

**Domain:** Admin - system configuration

```
Routes:
  /settings                                → SettingsPage.vue
  /settings/component-library              → ComponentLibraryPage.vue
  /settings/component-library/new          → ComponentStandardFormPage.vue
  /settings/component-library/:id          → ComponentStandardDetailPage.vue
  /settings/rule-sets                      → RuleSetsListPage.vue
  /settings/rule-sets/new                  → RuleSetFormPage.vue
  /settings/rule-sets/:id                  → RuleSetDetailPage.vue
  /settings/bom-templates                  → BomTemplatesListPage.vue
  /settings/bom-templates/new              → BomTemplateFormPage.vue
  /settings/bom-templates/:id              → BomTemplateDetailPage.vue

Pages:
  src/pages/settings/
  ├── SettingsPage.vue
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
└── Uses: Products (line items)

Invoices
├── Uses: Contacts (customer)
├── Uses: Products (line items)
├── Creates: Payments (records)
└── Updates: Inventory (stock levels)

BOMs
├── Uses: Products (components)
├── Uses: BOM Templates
├── Uses: Component Standards
└── Used by: Solar Proposals, Quotations
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
| Add formatting utils | `src/utils/format.ts` |
| Add validation | `src/utils/validation.ts` |

### Finding Files by Query

```bash
# Find component files
find src/components -name "*.vue" | grep -i "solar"

# Find API hooks
ls src/api/use*.ts

# Find composables
ls src/composables/use*.ts

# Find page files
find src/pages -name "*.vue"
```

---

## Module Statistics

| Metric | Count |
|--------|-------|
| Total Routes | 55+ |
| Total Pages | 63 |
| Total Components | 50+ |
| Total Composables | 22 |
| Total API Hooks | 22 files |
| UI Components | 30+ |

---

*Last updated: January 2025*
