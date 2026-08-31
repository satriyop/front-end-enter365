export interface NavItem {
  name: string
  path: string
  icon: string
  permission?: string
  feature?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

/**
 * Sidebar keys must match Permission::getDefaultPermissions() names.
 */
export const navigation: NavGroup[] = [
  {
    label: 'Menu',
    items: [
      { name: 'Dashboard', path: '/', icon: '🏠' },
      { name: 'Kasir', path: '/kasir', icon: '🖥️', permission: 'pos.sale.checkout', feature: 'pos' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { name: 'Quotations', path: '/quotations', icon: '📋', permission: 'quotations.view', feature: 'quotations' },
      { name: 'Follow-Up', path: '/sales/follow-up', icon: '📞', permission: 'quotations.view', feature: 'quotations' },
      { name: 'Solar Proposals', path: '/solar-proposals', icon: '☀️', permission: 'solar_proposals.view', feature: 'solar_proposals' },
      { name: 'Invoices', path: '/invoices', icon: '📄', permission: 'invoices.view', feature: 'invoices' },
      { name: 'Delivery Orders', path: '/sales/delivery-orders', icon: '🚚', permission: 'delivery_orders.view', feature: 'delivery_orders' },
      { name: 'Sales Returns', path: '/sales/sales-returns', icon: '↩️', permission: 'sales_returns.view', feature: 'sales_returns' },
      { name: 'Contacts', path: '/contacts', icon: '👥', permission: 'contacts.view' },
    ],
  },
  {
    label: 'Purchasing',
    items: [
      { name: 'Purchase Orders', path: '/purchasing/purchase-orders', icon: '🛒', permission: 'purchase_orders.view', feature: 'purchase_orders' },
      { name: 'Goods Receipt', path: '/purchasing/goods-receipt-notes', icon: '📥', permission: 'goods_receipt_notes.view', feature: 'goods_receipt_notes' },
      { name: 'Purchase Returns', path: '/purchasing/purchase-returns', icon: '↩️', permission: 'purchase_returns.view', feature: 'purchase_returns' },
    ],
  },
  {
    label: 'Projects',
    items: [
      { name: 'Projects', path: '/projects', icon: '🏗️', permission: 'projects.view', feature: 'projects' },
      { name: 'Work Orders', path: '/work-orders', icon: '🔧', permission: 'work_orders.view', feature: 'work_orders' },
    ],
  },
  {
    label: 'Manufacturing',
    items: [
      { name: 'MRP', path: '/manufacturing/mrp', icon: '🧮', permission: 'mrp.view', feature: 'mrp' },
      { name: 'Material Requisitions', path: '/manufacturing/material-requisitions', icon: '📋', permission: 'material_requisitions.view', feature: 'material_requisitions' },
      { name: 'Subcontractor WO', path: '/manufacturing/subcontractor-work-orders', icon: '🔨', permission: 'subcontractor_work_orders.view', feature: 'subcontracting' },
      { name: 'SC Invoices', path: '/manufacturing/subcontractor-invoices', icon: '📄', permission: 'subcontractor_invoices.view', feature: 'subcontracting' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { name: 'Stock', path: '/inventory', icon: '📦', permission: 'inventory.view', feature: 'inventory' },
      { name: 'Stock Opname', path: '/inventory/opnames', icon: '⚖️', permission: 'inventory.view', feature: 'stock_opname' },
      { name: 'Stock Transfer', path: '/inventory/transfer', icon: '🔄', permission: 'inventory.view', feature: 'inventory' },
      { name: 'Products', path: '/products', icon: '🏷️', permission: 'products.view', feature: 'products' },
      { name: 'BOMs', path: '/boms', icon: '📐', permission: 'boms.view', feature: 'bom' },
      { name: 'Variant Groups', path: '/boms/variant-groups', icon: '🔄', permission: 'boms.view', feature: 'bom' },
    ],
  },
  {
    label: 'Accounting',
    items: [
      { name: 'Chart of Accounts', path: '/accounting/accounts', icon: '📒', permission: 'accounts.view' },
      { name: 'Journal Entries', path: '/accounting/journal-entries', icon: '📝', permission: 'journals.view' },
      { name: 'Fiscal Periods', path: '/accounting/fiscal-periods', icon: '📅', permission: 'fiscal_periods.view' },
      { name: 'Budgets', path: '/accounting/budgets', icon: '📊', permission: 'budgets.view', feature: 'budgeting' },
      { name: 'Bank Reconciliation', path: '/accounting/bank-reconciliation', icon: '🏦', permission: 'journals.view', feature: 'bank_reconciliation' },
      { name: 'Recurring Templates', path: '/accounting/recurring-templates', icon: '🔄', permission: 'journals.view', feature: 'recurring' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Payments', path: '/payments', icon: '💳', permission: 'payments.view', feature: 'payments' },
      { name: 'Down Payments', path: '/finance/down-payments', icon: '💰', permission: 'payments.view', feature: 'down_payments' },
      { name: 'Reminders', path: '/finance/reminders', icon: '🔔', permission: 'invoices.view', feature: 'invoices' },
      { name: 'Overdue Management', path: '/sales/overdue-dashboard', icon: '⚠️', permission: 'invoices.view', feature: 'invoices' },
      { name: 'Bills', path: '/bills', icon: '📑', permission: 'bills.view' },
      { name: 'Reports', path: '/reports', icon: '📊', permission: 'reports.financial' },
    ],
  },
  {
    label: 'Add-ons',
    items: [
      { name: 'Component Library', path: '/addons/electrical-panel/component-library', icon: '🔌', permission: 'products.view', feature: 'electrical_panel' },
      { name: 'Rule Sets', path: '/addons/electrical-panel/rule-sets', icon: '⚙️', permission: 'products.view', feature: 'electrical_panel' },
      { name: 'Cost Optimization', path: '/addons/electrical-panel/cost-optimization', icon: '💡', permission: 'boms.view', feature: 'electrical_panel' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Company Profiles', path: '/company-profiles', icon: '🏢', permission: 'settings.company_profile' },
      { name: 'Warehouses', path: '/settings/warehouses', icon: '🏭', permission: 'warehouses.view', feature: 'warehouses' },
      { name: 'Roles', path: '/settings/roles', icon: '🔐', permission: 'users.manage_roles' },
      { name: 'Product Categories', path: '/settings/product-categories', icon: '📂', permission: 'products.view' },
      { name: 'BOM Templates', path: '/settings/bom-templates', icon: '📋', permission: 'boms.view', feature: 'bom' },
      { name: 'Accounting Policies', path: '/settings/accounting-policies', icon: '📒', permission: 'settings.fiscal_periods' },
      { name: 'NSFP Ranges', path: '/settings/nsfp-ranges', icon: '🔢', permission: 'reports.tax' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Users', path: '/users', icon: '👤', permission: 'users.view' },
    ],
  },
]

export function navItemVisible(
  item: NavItem,
  ctx: { featureEnabled: (name: string) => boolean; hasPermission: (name: string) => boolean },
): boolean {
  if (item.feature && !ctx.featureEnabled(item.feature)) {
    return false
  }
  if (!item.permission) {
    return true
  }
  return ctx.hasPermission(item.permission)
}

export function flattenNav(groups: NavGroup[] = navigation): NavItem[] {
  return groups.flatMap((group) => group.items)
}

/** POS pack chrome only — solar / electrical packs keep English names. */
export const POS_NAV_ID: Record<string, string> = {
  Dashboard: 'Dasbor',
  Kasir: 'Kasir',
  Contacts: 'Kontak',
  Stock: 'Stok',
  'Stock Opname': 'Stok Opname',
  'Stock Transfer': 'Pindah Stok',
  Products: 'Produk',
  'Chart of Accounts': 'Bagan Akun',
  'Journal Entries': 'Jurnal',
  'Fiscal Periods': 'Periode Fiskal',
  Payments: 'Pembayaran',
  Bills: 'Tagihan',
  Reports: 'Laporan',
  'Company Profiles': 'Profil Perusahaan',
  Warehouses: 'Gudang',
  Roles: 'Peran',
  'Product Categories': 'Kategori Produk',
  'Accounting Policies': 'Kebijakan Akuntansi',
  Users: 'Pengguna',
  Settings: 'Pengaturan',
}

export const POS_GROUP_ID: Record<string, string> = {
  Menu: 'Menu',
  Sales: 'Penjualan',
  Inventory: 'Inventori',
  Accounting: 'Akuntansi',
  Finance: 'Keuangan',
  Settings: 'Pengaturan',
  Admin: 'Admin',
}

export const POS_BREADCRUMB_ID: Record<string, string> = {
  Home: 'Beranda',
  Dashboard: 'Dasbor',
  'Journal Entries': 'Jurnal',
  'New Entry': 'Jurnal baru',
  Inventory: 'Inventori',
  Stock: 'Stok',
  Products: 'Produk',
  'Chart of Accounts': 'Bagan Akun',
  'Fiscal Periods': 'Periode Fiskal',
  Reports: 'Laporan',
  Warehouses: 'Gudang',
  Users: 'Pengguna',
  'Stock Adjustment': 'Penyesuaian stok',
}

export const POS_UI_ID: Record<string, string> = {
  'Entry #': 'No.',
  Date: 'Tanggal',
  Description: 'Uraian',
  Debit: 'Debit',
  Credit: 'Kredit',
  Status: 'Status',
  Posted: 'Diposting',
  Reversed: 'Dibalik',
  Draft: 'Draft',
  'All Status': 'Semua status',
  View: 'Lihat',
  Search: 'Cari',
  'Search...': 'Cari...',
  'Search or type a command...': 'Cari atau ketik perintah...',
  Delete: 'Hapus',
  Cancel: 'Batal',
  Loading: 'Memuat...',
  'Failed to load journal entries': 'Gagal memuat jurnal',
  'No journal entries found': 'Belum ada jurnal',
  'Create Entry': 'Buat jurnal',
  Product: 'Produk',
  Warehouse: 'Gudang',
  Quantity: 'Jumlah',
  'Avg Cost': 'Hpp rata-rata',
  Value: 'Nilai',
  Level: 'Status',
  Out: 'Habis',
  Low: 'Menipis',
  OK: 'Aman',
  Name: 'Nama',
  Type: 'Jenis',
  Price: 'Harga',
  'All Types': 'Semua jenis',
  'All Categories': 'Semua kategori',
  Products: 'Produk',
  Services: 'Tidak distok',
  'New Product': 'Produk baru',
  'Export Price List': 'Unduh daftar harga',
  'Stock Movements': 'Mutasi stok',
  'Adjust Stock': 'Penyesuaian stok',
  'Stock Adjustment': 'Penyesuaian stok',
  'Stock In (+)': 'Stok masuk (+)',
  'Stock Out (-)': 'Stok keluar (-)',
  'Set Quantity': 'Set jumlah',
  'Record Stock In': 'Catat stok masuk',
  'Record Stock Out': 'Catat stok keluar',
  'New Account': 'Akun baru',
  'Expand All': 'Bentangkan',
  'Collapse All': 'Tutup semua',
  'Chart of Accounts': 'Bagan Akun',
}

export const POS_CHROME: Record<string, string> = {
  ...POS_NAV_ID,
  ...POS_GROUP_ID,
  ...POS_BREADCRUMB_ID,
  ...POS_UI_ID,
}

export function posChrome(english: string, posPack: boolean, table: Record<string, string> = POS_CHROME): string {
  if (!posPack) {
    return english
  }
  return table[english] ?? english
}
