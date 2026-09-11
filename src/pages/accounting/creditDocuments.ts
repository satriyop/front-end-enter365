export type CreditDocumentCopy = {
  listTitle: string
  listHint: string
  newTitle: string
  editTitle: string
  createCta: string
  emptyTitle: string
  emptyHint: string
  listPath: string
  newPath: string
  detailPath: (id: number | string) => string
  editPath: (id: number | string) => string
  saveCreate: string
  saveUpdate: string
}

export function isCustomerCreditNotePath(path: string): boolean {
  return path.includes('/credit-notes')
}

export function isVendorRefundPath(path: string): boolean {
  return path.includes('/vendor-refunds')
}

export function customerCreditNoteJourney(path: string): CreditDocumentCopy {
  if (isCustomerCreditNotePath(path)) {
    return {
      listTitle: 'Credit Notes',
      listHint: 'Customer credit notes that reverse accounts receivable',
      newTitle: 'New Credit Note',
      editTitle: 'Edit Credit Note',
      createCta: 'New Credit Note',
      emptyTitle: 'No credit notes found',
      emptyHint: 'Create a credit note against a customer invoice',
      listPath: '/accounting/credit-notes',
      newPath: '/accounting/credit-notes/new',
      detailPath: (id) => `/accounting/credit-notes/${id}`,
      editPath: (id) => `/accounting/credit-notes/${id}/edit`,
      saveCreate: 'Create Credit Note',
      saveUpdate: 'Update Credit Note',
    }
  }

  return {
    listTitle: 'Sales Returns',
    listHint: 'Manage returns from customers',
    newTitle: 'New Sales Return',
    editTitle: 'Edit Sales Return',
    createCta: 'New Return',
    emptyTitle: 'No sales returns found',
    emptyHint: 'Create a return when a customer returns goods',
    listPath: '/sales/sales-returns',
    newPath: '/sales/sales-returns/new',
    detailPath: (id) => `/sales/sales-returns/${id}`,
    editPath: (id) => `/sales/sales-returns/${id}/edit`,
    saveCreate: 'Create Sales Return',
    saveUpdate: 'Update Sales Return',
  }
}

export function vendorRefundJourney(path: string): CreditDocumentCopy {
  if (isVendorRefundPath(path)) {
    return {
      listTitle: 'Vendor Refunds',
      listHint: 'Vendor refunds that reverse accounts payable',
      newTitle: 'New Vendor Refund',
      editTitle: 'Edit Vendor Refund',
      createCta: 'New Vendor Refund',
      emptyTitle: 'No vendor refunds found',
      emptyHint: 'Create a refund against a vendor bill',
      listPath: '/accounting/vendor-refunds',
      newPath: '/accounting/vendor-refunds/new',
      detailPath: (id) => `/accounting/vendor-refunds/${id}`,
      editPath: (id) => `/accounting/vendor-refunds/${id}/edit`,
      saveCreate: 'Create Vendor Refund',
      saveUpdate: 'Update Vendor Refund',
    }
  }

  return {
    listTitle: 'Purchase Returns',
    listHint: 'Manage returns to vendors',
    newTitle: 'New Purchase Return',
    editTitle: 'Edit Purchase Return',
    createCta: 'New Return',
    emptyTitle: 'No purchase returns found',
    emptyHint: 'Create a return when you need to send goods back to a vendor',
    listPath: '/purchasing/purchase-returns',
    newPath: '/purchasing/purchase-returns/new',
    detailPath: (id) => `/purchasing/purchase-returns/${id}`,
    editPath: (id) => `/purchasing/purchase-returns/${id}/edit`,
    saveCreate: 'Create Purchase Return',
    saveUpdate: 'Update Purchase Return',
  }
}
