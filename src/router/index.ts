import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
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
          component: () => import('@/pages/DashboardPage.vue')
        },
        {
          path: 'quotations',
          name: 'quotations',
          component: () => import('@/pages/quotations/QuotationListPage.vue')
        },
        {
          path: 'quotations/new',
          name: 'quotation-new',
          component: () => import('@/pages/quotations/QuotationFormPage.vue')
        },
        {
          path: 'quotations/:id',
          name: 'quotation-detail',
          component: () => import('@/pages/quotations/QuotationDetailPage.vue')
        },
        {
          path: 'quotations/:id/edit',
          name: 'quotation-edit',
          component: () => import('@/pages/quotations/QuotationFormPage.vue')
        },
        // Invoice routes
        {
          path: 'invoices',
          name: 'invoices',
          component: () => import('@/pages/invoices/InvoiceListPage.vue')
        },
        {
          path: 'invoices/new',
          name: 'invoice-new',
          component: () => import('@/pages/invoices/InvoiceFormPage.vue')
        },
        {
          path: 'invoices/:id',
          name: 'invoice-detail',
          component: () => import('@/pages/invoices/InvoiceDetailPage.vue')
        },
        {
          path: 'invoices/:id/edit',
          name: 'invoice-edit',
          component: () => import('@/pages/invoices/InvoiceFormPage.vue')
        },
        // Contact routes
        {
          path: 'contacts',
          name: 'contacts',
          component: () => import('@/pages/contacts/ContactListPage.vue')
        },
        {
          path: 'contacts/new',
          name: 'contact-new',
          component: () => import('@/pages/contacts/ContactFormPage.vue')
        },
        {
          path: 'contacts/:id',
          name: 'contact-detail',
          component: () => import('@/pages/contacts/ContactDetailPage.vue')
        },
        {
          path: 'contacts/:id/edit',
          name: 'contact-edit',
          component: () => import('@/pages/contacts/ContactFormPage.vue')
        },
        // Product routes
        {
          path: 'products',
          name: 'products',
          component: () => import('@/pages/products/ProductListPage.vue')
        },
        {
          path: 'products/new',
          name: 'product-new',
          component: () => import('@/pages/products/ProductFormPage.vue')
        },
        {
          path: 'products/:id',
          name: 'product-detail',
          component: () => import('@/pages/products/ProductDetailPage.vue')
        },
        {
          path: 'products/:id/edit',
          name: 'product-edit',
          component: () => import('@/pages/products/ProductFormPage.vue')
        },
        // Bill routes
        {
          path: 'bills',
          name: 'bills',
          component: () => import('@/pages/bills/BillListPage.vue')
        },
        {
          path: 'bills/new',
          name: 'bill-new',
          component: () => import('@/pages/bills/BillFormPage.vue')
        },
        {
          path: 'bills/:id',
          name: 'bill-detail',
          component: () => import('@/pages/bills/BillDetailPage.vue')
        },
        {
          path: 'bills/:id/edit',
          name: 'bill-edit',
          component: () => import('@/pages/bills/BillFormPage.vue')
        },
        // Payment routes
        {
          path: 'payments',
          name: 'payments',
          component: () => import('@/pages/payments/PaymentListPage.vue')
        },
        {
          path: 'payments/new',
          name: 'payment-new',
          component: () => import('@/pages/payments/PaymentFormPage.vue')
        },
        {
          path: 'payments/:id',
          name: 'payment-detail',
          component: () => import('@/pages/payments/PaymentDetailPage.vue')
        },
        // Project routes
        {
          path: 'projects',
          name: 'projects',
          component: () => import('@/pages/projects/ProjectListPage.vue')
        },
        {
          path: 'projects/new',
          name: 'project-new',
          component: () => import('@/pages/projects/ProjectFormPage.vue')
        },
        {
          path: 'projects/:id',
          name: 'project-detail',
          component: () => import('@/pages/projects/ProjectDetailPage.vue')
        },
        {
          path: 'projects/:id/edit',
          name: 'project-edit',
          component: () => import('@/pages/projects/ProjectFormPage.vue')
        },
        // Work Order routes
        {
          path: 'work-orders',
          name: 'work-orders',
          component: () => import('@/pages/work-orders/WorkOrderListPage.vue')
        },
        {
          path: 'work-orders/new',
          name: 'work-order-new',
          component: () => import('@/pages/work-orders/WorkOrderFormPage.vue')
        },
        {
          path: 'work-orders/:id',
          name: 'work-order-detail',
          component: () => import('@/pages/work-orders/WorkOrderDetailPage.vue')
        },
        {
          path: 'work-orders/:id/edit',
          name: 'work-order-edit',
          component: () => import('@/pages/work-orders/WorkOrderFormPage.vue')
        },
        // Inventory routes
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('@/pages/inventory/InventoryListPage.vue')
        },
        // Reports routes
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/pages/reports/ReportsPage.vue')
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
