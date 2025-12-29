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
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && auth.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
