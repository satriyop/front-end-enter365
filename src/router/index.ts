import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Type for breadcrumb meta
type BreadcrumbMeta = string | ((route: RouteLocationNormalized) => string)

// Extend RouteMeta to include breadcrumb
declare module 'vue-router' {
  interface RouteMeta {
    breadcrumb?: BreadcrumbMeta
    requiresAuth?: boolean
    guest?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { guest: true }
    },
    // Public routes (no authentication required)
    {
      path: '/p/:token',
      name: 'public-proposal',
      component: () => import('@/pages/public/PublicProposalPage.vue'),
      meta: { guest: true }
    },
    {
      path: '/solar-calculator',
      name: 'solar-calculator',
      component: () => import('@/pages/public/SolarCalculatorPage.vue'),
      meta: { guest: true }
    },
    {
      path: '/profile/:slug',
      name: 'public-profile',
      component: () => import('@/pages/public/PublicCompanyProfilePage.vue'),
      meta: { guest: true }
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/pages/DashboardPage.vue'),
          meta: { breadcrumb: 'Dashboard' }
        },
        // Quotation routes
        {
          path: 'quotations',
          name: 'quotations',
          component: () => import('@/pages/quotations/QuotationListPage.vue'),
          meta: { breadcrumb: 'Quotations' }
        },
        {
          path: 'quotations/new',
          name: 'quotation-new',
          component: () => import('@/pages/quotations/QuotationFormPage.vue'),
          meta: { breadcrumb: 'New Quotation' }
        },
        {
          path: 'quotations/:id',
          name: 'quotation-detail',
          component: () => import('@/pages/quotations/QuotationDetailPage.vue'),
          meta: { breadcrumb: (route) => `Quotation #${route.params.id}` }
        },
        {
          path: 'quotations/:id/edit',
          name: 'quotation-edit',
          component: () => import('@/pages/quotations/QuotationFormPage.vue'),
          meta: { breadcrumb: 'Edit Quotation' }
        },
        // Invoice routes
        {
          path: 'invoices',
          name: 'invoices',
          component: () => import('@/pages/invoices/InvoiceListPage.vue'),
          meta: { breadcrumb: 'Invoices' }
        },
        {
          path: 'invoices/new',
          name: 'invoice-new',
          component: () => import('@/pages/invoices/InvoiceFormPage.vue'),
          meta: { breadcrumb: 'New Invoice' }
        },
        {
          path: 'invoices/:id',
          name: 'invoice-detail',
          component: () => import('@/pages/invoices/InvoiceDetailPage.vue'),
          meta: { breadcrumb: (route) => `Invoice #${route.params.id}` }
        },
        {
          path: 'invoices/:id/edit',
          name: 'invoice-edit',
          component: () => import('@/pages/invoices/InvoiceFormPage.vue'),
          meta: { breadcrumb: 'Edit Invoice' }
        },
        // Sales - Delivery Orders routes
        {
          path: 'sales/delivery-orders',
          name: 'delivery-orders',
          component: () => import('@/pages/sales/delivery-orders/DeliveryOrderListPage.vue'),
          meta: { breadcrumb: 'Delivery Orders' }
        },
        {
          path: 'sales/delivery-orders/new',
          name: 'delivery-order-new',
          component: () => import('@/pages/sales/delivery-orders/DeliveryOrderListPage.vue'),
          meta: { breadcrumb: 'New Delivery Order' }
        },
        {
          path: 'sales/delivery-orders/:id',
          name: 'delivery-order-detail',
          component: () => import('@/pages/sales/delivery-orders/DeliveryOrderDetailPage.vue'),
          meta: { breadcrumb: (route) => `DO #${route.params.id}` }
        },
        // Sales - Sales Returns routes
        {
          path: 'sales/sales-returns',
          name: 'sales-returns',
          component: () => import('@/pages/sales/sales-returns/SalesReturnListPage.vue'),
          meta: { breadcrumb: 'Sales Returns' }
        },
        {
          path: 'sales/sales-returns/new',
          name: 'sales-return-new',
          component: () => import('@/pages/sales/sales-returns/SalesReturnListPage.vue'),
          meta: { breadcrumb: 'New Sales Return' }
        },
        {
          path: 'sales/sales-returns/:id',
          name: 'sales-return-detail',
          component: () => import('@/pages/sales/sales-returns/SalesReturnDetailPage.vue'),
          meta: { breadcrumb: (route) => `Return #${route.params.id}` }
        },
        // Contact routes
        {
          path: 'contacts',
          name: 'contacts',
          component: () => import('@/pages/contacts/ContactListPage.vue'),
          meta: { breadcrumb: 'Contacts' }
        },
        {
          path: 'contacts/new',
          name: 'contact-new',
          component: () => import('@/pages/contacts/ContactFormPage.vue'),
          meta: { breadcrumb: 'New Contact' }
        },
        {
          path: 'contacts/:id',
          name: 'contact-detail',
          component: () => import('@/pages/contacts/ContactDetailPage.vue'),
          meta: { breadcrumb: (route) => `Contact #${route.params.id}` }
        },
        {
          path: 'contacts/:id/edit',
          name: 'contact-edit',
          component: () => import('@/pages/contacts/ContactFormPage.vue'),
          meta: { breadcrumb: 'Edit Contact' }
        },
        // Product routes
        {
          path: 'products',
          name: 'products',
          component: () => import('@/pages/products/ProductListPage.vue'),
          meta: { breadcrumb: 'Products' }
        },
        {
          path: 'products/new',
          name: 'product-new',
          component: () => import('@/pages/products/ProductFormPage.vue'),
          meta: { breadcrumb: 'New Product' }
        },
        {
          path: 'products/:id',
          name: 'product-detail',
          component: () => import('@/pages/products/ProductDetailPage.vue'),
          meta: { breadcrumb: (route) => `Product #${route.params.id}` }
        },
        {
          path: 'products/:id/edit',
          name: 'product-edit',
          component: () => import('@/pages/products/ProductFormPage.vue'),
          meta: { breadcrumb: 'Edit Product' }
        },
        // Bill routes
        {
          path: 'bills',
          name: 'bills',
          component: () => import('@/pages/bills/BillListPage.vue'),
          meta: { breadcrumb: 'Bills' }
        },
        {
          path: 'bills/new',
          name: 'bill-new',
          component: () => import('@/pages/bills/BillFormPage.vue'),
          meta: { breadcrumb: 'New Bill' }
        },
        {
          path: 'bills/:id',
          name: 'bill-detail',
          component: () => import('@/pages/bills/BillDetailPage.vue'),
          meta: { breadcrumb: (route) => `Bill #${route.params.id}` }
        },
        {
          path: 'bills/:id/edit',
          name: 'bill-edit',
          component: () => import('@/pages/bills/BillFormPage.vue'),
          meta: { breadcrumb: 'Edit Bill' }
        },
        // Payment routes
        {
          path: 'payments',
          name: 'payments',
          component: () => import('@/pages/payments/PaymentListPage.vue'),
          meta: { breadcrumb: 'Payments' }
        },
        {
          path: 'payments/new',
          name: 'payment-new',
          component: () => import('@/pages/payments/PaymentFormPage.vue'),
          meta: { breadcrumb: 'New Payment' }
        },
        {
          path: 'payments/:id',
          name: 'payment-detail',
          component: () => import('@/pages/payments/PaymentDetailPage.vue'),
          meta: { breadcrumb: (route) => `Payment #${route.params.id}` }
        },
        // Finance - Down Payments routes
        {
          path: 'finance/down-payments',
          name: 'down-payments',
          component: () => import('@/pages/finance/down-payments/DownPaymentListPage.vue'),
          meta: { breadcrumb: 'Down Payments' }
        },
        {
          path: 'finance/down-payments/new',
          name: 'down-payment-new',
          component: () => import('@/pages/finance/down-payments/DownPaymentListPage.vue'),
          meta: { breadcrumb: 'New Down Payment' }
        },
        {
          path: 'finance/down-payments/:id',
          name: 'down-payment-detail',
          component: () => import('@/pages/finance/down-payments/DownPaymentDetailPage.vue'),
          meta: { breadcrumb: (route) => `DP #${route.params.id}` }
        },
        // Project routes
        {
          path: 'projects',
          name: 'projects',
          component: () => import('@/pages/projects/ProjectListPage.vue'),
          meta: { breadcrumb: 'Projects' }
        },
        {
          path: 'projects/new',
          name: 'project-new',
          component: () => import('@/pages/projects/ProjectFormPage.vue'),
          meta: { breadcrumb: 'New Project' }
        },
        {
          path: 'projects/:id',
          name: 'project-detail',
          component: () => import('@/pages/projects/ProjectDetailPage.vue'),
          meta: { breadcrumb: (route) => `Project #${route.params.id}` }
        },
        {
          path: 'projects/:id/edit',
          name: 'project-edit',
          component: () => import('@/pages/projects/ProjectFormPage.vue'),
          meta: { breadcrumb: 'Edit Project' }
        },
        // Work Order routes
        {
          path: 'work-orders',
          name: 'work-orders',
          component: () => import('@/pages/work-orders/WorkOrderListPage.vue'),
          meta: { breadcrumb: 'Work Orders' }
        },
        {
          path: 'work-orders/new',
          name: 'work-order-new',
          component: () => import('@/pages/work-orders/WorkOrderFormPage.vue'),
          meta: { breadcrumb: 'New Work Order' }
        },
        {
          path: 'work-orders/:id',
          name: 'work-order-detail',
          component: () => import('@/pages/work-orders/WorkOrderDetailPage.vue'),
          meta: { breadcrumb: (route) => `Work Order #${route.params.id}` }
        },
        {
          path: 'work-orders/:id/edit',
          name: 'work-order-edit',
          component: () => import('@/pages/work-orders/WorkOrderFormPage.vue'),
          meta: { breadcrumb: 'Edit Work Order' }
        },
        // Inventory routes
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('@/pages/inventory/InventoryListPage.vue'),
          meta: { breadcrumb: 'Inventory' }
        },
        {
          path: 'inventory/opnames',
          name: 'stock-opnames',
          component: () => import('@/pages/inventory/StockOpnameListPage.vue'),
          meta: { breadcrumb: 'Stock Opname' }
        },
        {
          path: 'inventory/opnames/new',
          name: 'stock-opname-new',
          component: () => import('@/pages/inventory/StockOpnameFormPage.vue'),
          meta: { breadcrumb: 'New Opname' }
        },
        {
          path: 'inventory/opnames/:id',
          name: 'stock-opname-detail',
          component: () => import('@/pages/inventory/StockOpnameDetailPage.vue'),
          meta: { breadcrumb: (route) => `Opname #${route.params.id}` }
        },
        {
          path: 'inventory/movements',
          name: 'inventory-movements',
          component: () => import('@/pages/inventory/StockMovementsPage.vue'),
          meta: { breadcrumb: 'Stock Movements' }
        },
        {
          path: 'inventory/adjust',
          name: 'inventory-adjust',
          component: () => import('@/pages/inventory/StockAdjustmentPage.vue'),
          meta: { breadcrumb: 'Stock Adjustment' }
        },
        // Accounting - Chart of Accounts routes
        {
          path: 'accounting/accounts',
          name: 'accounts',
          component: () => import('@/pages/accounting/accounts/AccountListPage.vue'),
          meta: { breadcrumb: 'Chart of Accounts' }
        },
        {
          path: 'accounting/accounts/new',
          name: 'account-new',
          component: () => import('@/pages/accounting/accounts/AccountFormPage.vue'),
          meta: { breadcrumb: 'New Account' }
        },
        {
          path: 'accounting/accounts/:id',
          name: 'account-detail',
          component: () => import('@/pages/accounting/accounts/AccountDetailPage.vue'),
          meta: { breadcrumb: (route) => `Account #${route.params.id}` }
        },
        {
          path: 'accounting/accounts/:id/edit',
          name: 'account-edit',
          component: () => import('@/pages/accounting/accounts/AccountFormPage.vue'),
          meta: { breadcrumb: 'Edit Account' }
        },
        // Accounting - Journal Entries routes
        {
          path: 'accounting/journal-entries',
          name: 'journal-entries',
          component: () => import('@/pages/accounting/journal-entries/JournalEntryListPage.vue'),
          meta: { breadcrumb: 'Journal Entries' }
        },
        {
          path: 'accounting/journal-entries/new',
          name: 'journal-entry-new',
          component: () => import('@/pages/accounting/journal-entries/JournalEntryFormPage.vue'),
          meta: { breadcrumb: 'New Entry' }
        },
        {
          path: 'accounting/journal-entries/:id',
          name: 'journal-entry-detail',
          component: () => import('@/pages/accounting/journal-entries/JournalEntryDetailPage.vue'),
          meta: { breadcrumb: (route) => `Entry #${route.params.id}` }
        },
        // Accounting - Fiscal Periods routes
        {
          path: 'accounting/fiscal-periods',
          name: 'fiscal-periods',
          component: () => import('@/pages/accounting/fiscal-periods/FiscalPeriodListPage.vue'),
          meta: { breadcrumb: 'Fiscal Periods' }
        },
        {
          path: 'accounting/fiscal-periods/new',
          name: 'fiscal-period-new',
          component: () => import('@/pages/accounting/fiscal-periods/FiscalPeriodFormPage.vue'),
          meta: { breadcrumb: 'New Period' }
        },
        {
          path: 'accounting/fiscal-periods/:id',
          name: 'fiscal-period-detail',
          component: () => import('@/pages/accounting/fiscal-periods/FiscalPeriodDetailPage.vue'),
          meta: { breadcrumb: (route) => `Period #${route.params.id}` }
        },
        // Purchasing - Purchase Orders routes
        {
          path: 'purchasing/purchase-orders',
          name: 'purchase-orders',
          component: () => import('@/pages/purchasing/purchase-orders/PurchaseOrderListPage.vue'),
          meta: { breadcrumb: 'Purchase Orders' }
        },
        {
          path: 'purchasing/purchase-orders/new',
          name: 'purchase-order-new',
          component: () => import('@/pages/purchasing/purchase-orders/PurchaseOrderFormPage.vue'),
          meta: { breadcrumb: 'New Purchase Order' }
        },
        {
          path: 'purchasing/purchase-orders/:id',
          name: 'purchase-order-detail',
          component: () => import('@/pages/purchasing/purchase-orders/PurchaseOrderDetailPage.vue'),
          meta: { breadcrumb: (route) => `PO #${route.params.id}` }
        },
        {
          path: 'purchasing/purchase-orders/:id/edit',
          name: 'purchase-order-edit',
          component: () => import('@/pages/purchasing/purchase-orders/PurchaseOrderFormPage.vue'),
          meta: { breadcrumb: 'Edit Purchase Order' }
        },
        // Purchasing - Goods Receipt Notes routes
        {
          path: 'purchasing/goods-receipt-notes',
          name: 'goods-receipt-notes',
          component: () => import('@/pages/purchasing/goods-receipt-notes/GoodsReceiptNoteListPage.vue'),
          meta: { breadcrumb: 'Goods Receipt Notes' }
        },
        {
          path: 'purchasing/goods-receipt-notes/:id',
          name: 'goods-receipt-note-detail',
          component: () => import('@/pages/purchasing/goods-receipt-notes/GoodsReceiptNoteDetailPage.vue'),
          meta: { breadcrumb: (route) => `GRN #${route.params.id}` }
        },
        // Purchasing - Purchase Returns routes
        {
          path: 'purchasing/purchase-returns',
          name: 'purchase-returns',
          component: () => import('@/pages/purchasing/purchase-returns/PurchaseReturnListPage.vue'),
          meta: { breadcrumb: 'Purchase Returns' }
        },
        {
          path: 'purchasing/purchase-returns/:id',
          name: 'purchase-return-detail',
          component: () => import('@/pages/purchasing/purchase-returns/PurchaseReturnDetailPage.vue'),
          meta: { breadcrumb: (route) => `Return #${route.params.id}` }
        },
        // Manufacturing - Material Requisitions routes
        {
          path: 'manufacturing/material-requisitions',
          name: 'material-requisitions',
          component: () => import('@/pages/manufacturing/material-requisitions/MaterialRequisitionListPage.vue'),
          meta: { breadcrumb: 'Material Requisitions' }
        },
        {
          path: 'manufacturing/material-requisitions/new',
          name: 'material-requisition-new',
          component: () => import('@/pages/manufacturing/material-requisitions/MaterialRequisitionFormPage.vue'),
          meta: { breadcrumb: 'New Requisition' }
        },
        {
          path: 'manufacturing/material-requisitions/:id',
          name: 'material-requisition-detail',
          component: () => import('@/pages/manufacturing/material-requisitions/MaterialRequisitionDetailPage.vue'),
          meta: { breadcrumb: (route) => `MR #${route.params.id}` }
        },
        // Manufacturing - Subcontractor Work Orders routes
        {
          path: 'manufacturing/subcontractor-work-orders',
          name: 'subcontractor-work-orders',
          component: () => import('@/pages/manufacturing/subcontractor-work-orders/SubcontractorWorkOrderListPage.vue'),
          meta: { breadcrumb: 'Subcontractor Work Orders' }
        },
        {
          path: 'manufacturing/subcontractor-work-orders/new',
          name: 'subcontractor-work-order-new',
          component: () => import('@/pages/manufacturing/subcontractor-work-orders/SubcontractorWorkOrderFormPage.vue'),
          meta: { breadcrumb: 'New Work Order' }
        },
        {
          path: 'manufacturing/subcontractor-work-orders/:id',
          name: 'subcontractor-work-order-detail',
          component: () => import('@/pages/manufacturing/subcontractor-work-orders/SubcontractorWorkOrderDetailPage.vue'),
          meta: { breadcrumb: (route) => `SCWO #${route.params.id}` }
        },
        {
          path: 'manufacturing/subcontractor-work-orders/:id/edit',
          name: 'subcontractor-work-order-edit',
          component: () => import('@/pages/manufacturing/subcontractor-work-orders/SubcontractorWorkOrderFormPage.vue'),
          meta: { breadcrumb: 'Edit Work Order' }
        },
        // Manufacturing - Subcontractor Invoices routes
        {
          path: 'manufacturing/subcontractor-invoices',
          name: 'subcontractor-invoices',
          component: () => import('@/pages/manufacturing/subcontractor-invoices/SubcontractorInvoiceListPage.vue'),
          meta: { breadcrumb: 'Subcontractor Invoices' }
        },
        {
          path: 'manufacturing/subcontractor-invoices/:id',
          name: 'subcontractor-invoice-detail',
          component: () => import('@/pages/manufacturing/subcontractor-invoices/SubcontractorInvoiceDetailPage.vue'),
          meta: { breadcrumb: (route) => `Invoice #${route.params.id}` }
        },
        // Reports routes
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/pages/reports/ReportsPage.vue'),
          meta: { breadcrumb: 'Reports' }
        },
        {
          path: 'reports/balance-sheet',
          name: 'report-balance-sheet',
          component: () => import('@/pages/reports/BalanceSheetPage.vue'),
          meta: { breadcrumb: 'Balance Sheet' }
        },
        {
          path: 'reports/income-statement',
          name: 'report-income-statement',
          component: () => import('@/pages/reports/IncomeStatementPage.vue'),
          meta: { breadcrumb: 'Income Statement' }
        },
        {
          path: 'reports/cash-flow',
          name: 'report-cash-flow',
          component: () => import('@/pages/reports/CashFlowPage.vue'),
          meta: { breadcrumb: 'Cash Flow' }
        },
        {
          path: 'reports/trial-balance',
          name: 'report-trial-balance',
          component: () => import('@/pages/reports/TrialBalancePage.vue'),
          meta: { breadcrumb: 'Trial Balance' }
        },
        {
          path: 'reports/receivables-aging',
          name: 'report-receivables-aging',
          component: () => import('@/pages/reports/ReceivablesAgingPage.vue'),
          meta: { breadcrumb: 'Receivables Aging' }
        },
        {
          path: 'reports/payables-aging',
          name: 'report-payables-aging',
          component: () => import('@/pages/reports/PayablesAgingPage.vue'),
          meta: { breadcrumb: 'Payables Aging' }
        },
        {
          path: 'reports/vat',
          name: 'report-vat',
          component: () => import('@/pages/reports/VatReportPage.vue'),
          meta: { breadcrumb: 'VAT Report' }
        },
        {
          path: 'reports/tax-summary',
          name: 'report-tax-summary',
          component: () => import('@/pages/reports/TaxSummaryPage.vue'),
          meta: { breadcrumb: 'Tax Summary' }
        },
        {
          path: 'reports/stock-summary',
          name: 'report-stock-summary',
          component: () => import('@/pages/reports/StockSummaryPage.vue'),
          meta: { breadcrumb: 'Stock Summary' }
        },
        {
          path: 'reports/stock-movement',
          name: 'report-stock-movement',
          component: () => import('@/pages/reports/StockMovementPage.vue'),
          meta: { breadcrumb: 'Stock Movement' }
        },
        {
          path: 'reports/stock-valuation',
          name: 'report-stock-valuation',
          component: () => import('@/pages/reports/StockValuationPage.vue'),
          meta: { breadcrumb: 'Stock Valuation' }
        },
        {
          path: 'reports/customer-statement',
          name: 'report-customer-statement',
          component: () => import('@/pages/reports/CustomerStatementPage.vue'),
          meta: { breadcrumb: 'Customer Statement' }
        },
        {
          path: 'reports/vendor-statement',
          name: 'report-vendor-statement',
          component: () => import('@/pages/reports/VendorStatementPage.vue'),
          meta: { breadcrumb: 'Vendor Statement' }
        },
        // Settings route
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/pages/settings/SettingsPage.vue'),
          meta: { breadcrumb: 'Settings' }
        },
        // Component Library routes (under settings)
        {
          path: 'settings/component-library',
          name: 'component-library',
          component: () => import('@/pages/settings/component-library/ComponentLibraryPage.vue'),
          meta: { breadcrumb: 'Component Library' }
        },
        {
          path: 'settings/component-library/new',
          name: 'component-standard-new',
          component: () => import('@/pages/settings/component-library/ComponentStandardFormPage.vue'),
          meta: { breadcrumb: 'New Component' }
        },
        {
          path: 'settings/component-library/:id',
          name: 'component-standard-detail',
          component: () => import('@/pages/settings/component-library/ComponentStandardDetailPage.vue'),
          meta: { breadcrumb: (route) => `Component #${route.params.id}` }
        },
        {
          path: 'settings/component-library/:id/edit',
          name: 'component-standard-edit',
          component: () => import('@/pages/settings/component-library/ComponentStandardFormPage.vue'),
          meta: { breadcrumb: 'Edit Component' }
        },
        // Validation Rule Sets routes (under settings)
        {
          path: 'settings/rule-sets',
          name: 'rule-sets',
          component: () => import('@/pages/settings/rule-sets/RuleSetsListPage.vue'),
          meta: { breadcrumb: 'Validation Rule Sets' }
        },
        {
          path: 'settings/rule-sets/new',
          name: 'rule-set-new',
          component: () => import('@/pages/settings/rule-sets/RuleSetFormPage.vue'),
          meta: { breadcrumb: 'New Rule Set' }
        },
        {
          path: 'settings/rule-sets/:id',
          name: 'rule-set-detail',
          component: () => import('@/pages/settings/rule-sets/RuleSetDetailPage.vue'),
          meta: { breadcrumb: (route) => `Rule Set #${route.params.id}` }
        },
        {
          path: 'settings/rule-sets/:id/edit',
          name: 'rule-set-edit',
          component: () => import('@/pages/settings/rule-sets/RuleSetFormPage.vue'),
          meta: { breadcrumb: 'Edit Rule Set' }
        },
        // BOM Templates routes (under settings)
        {
          path: 'settings/bom-templates',
          name: 'bom-templates',
          component: () => import('@/pages/settings/bom-templates/BomTemplatesListPage.vue'),
          meta: { breadcrumb: 'BOM Templates' }
        },
        {
          path: 'settings/bom-templates/new',
          name: 'bom-template-new',
          component: () => import('@/pages/settings/bom-templates/BomTemplateFormPage.vue'),
          meta: { breadcrumb: 'New Template' }
        },
        {
          path: 'settings/bom-templates/:id',
          name: 'bom-template-detail',
          component: () => import('@/pages/settings/bom-templates/BomTemplateDetailPage.vue'),
          meta: { breadcrumb: (route) => `Template #${route.params.id}` }
        },
        {
          path: 'settings/bom-templates/:id/edit',
          name: 'bom-template-edit',
          component: () => import('@/pages/settings/bom-templates/BomTemplateFormPage.vue'),
          meta: { breadcrumb: 'Edit Template' }
        },
        // BOM routes
        {
          path: 'boms',
          name: 'boms',
          component: () => import('@/pages/boms/BomListPage.vue'),
          meta: { breadcrumb: 'BOMs' }
        },
        {
          path: 'boms/new',
          name: 'bom-new',
          component: () => import('@/pages/boms/BomFormPage.vue'),
          meta: { breadcrumb: 'New BOM' }
        },
        {
          path: 'boms/from-template',
          name: 'bom-from-template',
          component: () => import('@/pages/boms/CreateBomFromTemplatePage.vue'),
          meta: { breadcrumb: 'Create from Template' }
        },
        {
          path: 'boms/variant-groups',
          name: 'variant-groups',
          component: () => import('@/pages/boms/VariantGroupsPage.vue'),
          meta: { breadcrumb: 'Variant Groups' }
        },
        {
          path: 'boms/:id',
          name: 'bom-detail',
          component: () => import('@/pages/boms/BomDetailPage.vue'),
          meta: { breadcrumb: (route) => `BOM #${route.params.id}` }
        },
        {
          path: 'boms/:id/edit',
          name: 'bom-edit',
          component: () => import('@/pages/boms/BomFormPage.vue'),
          meta: { breadcrumb: 'Edit BOM' }
        },
        // Solar Proposal routes
        {
          path: 'solar-proposals',
          name: 'solar-proposals',
          component: () => import('@/pages/solar-proposals/SolarProposalListPage.vue'),
          meta: { breadcrumb: 'Solar Proposals' }
        },
        {
          path: 'solar-proposals/analytics',
          name: 'solar-proposal-analytics',
          component: () => import('@/pages/solar-proposals/SolarProposalAnalyticsPage.vue'),
          meta: { breadcrumb: 'Analytics' }
        },
        {
          path: 'solar-proposals/new',
          name: 'solar-proposal-new',
          component: () => import('@/pages/solar-proposals/SolarProposalWizard.vue'),
          meta: { breadcrumb: 'New Solar Proposal' }
        },
        {
          path: 'solar-proposals/:id',
          name: 'solar-proposal-detail',
          component: () => import('@/pages/solar-proposals/SolarProposalDetailPage.vue'),
          meta: { breadcrumb: (route) => `Solar Proposal #${route.params.id}` }
        },
        {
          path: 'solar-proposals/:id/edit',
          name: 'solar-proposal-edit',
          component: () => import('@/pages/solar-proposals/SolarProposalWizard.vue'),
          meta: { breadcrumb: 'Edit Solar Proposal' }
        },
        // User Management routes
        {
          path: 'users',
          name: 'users',
          component: () => import('@/pages/users/UserListPage.vue'),
          meta: { breadcrumb: 'Users' }
        },
        // Company Profile routes
        {
          path: 'company-profiles',
          name: 'company-profiles',
          component: () => import('@/pages/company-profiles/CompanyProfileListPage.vue'),
          meta: { breadcrumb: 'Company Profiles' }
        },
        {
          path: 'company-profiles/new',
          name: 'company-profile-new',
          component: () => import('@/pages/company-profiles/CompanyProfileFormPage.vue'),
          meta: { breadcrumb: 'New Profile' }
        },
        {
          path: 'company-profiles/:id/edit',
          name: 'company-profile-edit',
          component: () => import('@/pages/company-profiles/CompanyProfileFormPage.vue'),
          meta: { breadcrumb: 'Edit Profile' }
        },
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue')
    }
  ]
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  
  // Check both store and localStorage for token (store might not be reactive in guard)
  const hasToken = !!auth.token || !!localStorage.getItem('token')
  const isAuthenticated = auth.isAuthenticated || hasToken
  
  console.log('[Router Guard] Navigation:', {
    to: to.path,
    toName: to.name,
    from: from.path,
    fromName: from.name,
    requiresAuth: to.meta.requiresAuth,
    guest: to.meta.guest,
    isAuthenticated: isAuthenticated,
    storeIsAuthenticated: auth.isAuthenticated,
    hasToken: hasToken,
    localStorageToken: !!localStorage.getItem('token'),
    query: to.query
  })

  // If route requires auth but user is not authenticated
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('[Router Guard] Route requires auth but user not authenticated, redirecting to login')
    // Only redirect to login if we're not already there
    if (to.name !== 'login') {
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
    return
  }

  // If user is authenticated and trying to access guest route (like login)
  if (to.meta.guest && isAuthenticated) {
    console.log('[Router Guard] User authenticated on guest route, redirecting')
    // If we're on login page and authenticated, redirect to dashboard or redirect target
    if (to.name === 'login') {
      const redirect = to.query.redirect as string
      if (redirect) {
        console.log('[Router Guard] Redirecting to:', redirect)
        next(redirect)
      } else {
        console.log('[Router Guard] Redirecting to dashboard')
        next({ name: 'dashboard' })
      }
      return
    }
    // For other guest routes, allow access if authenticated
    next()
    return
  }

  console.log('[Router Guard] Allowing navigation')
  next()
})

export default router
