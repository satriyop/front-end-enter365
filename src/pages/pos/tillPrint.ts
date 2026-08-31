import type { PosCatalogProduct, PosSale } from '@/api/usePos'

function rp(amount: number): string {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID')
}

export interface TillReceiptMeta {
  shopName?: string
  cashier?: string
  taxName?: string
  serviceRate?: number
  taxRate?: number
}

export function formatStrukWaktu(soldAt: string, now = soldAt): string {
  const date = new Date(now)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const stamp = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  return `${stamp} WIB`
}

export function tillReceiptHtml(
  sale: PosSale,
  catalog: PosCatalogProduct[],
  meta: TillReceiptMeta = {},
): string {
  const shopName = meta.shopName ?? 'Kopitiam 57'
  const cashier = meta.cashier ?? ''
  const taxName = meta.taxName ?? 'PBJT'
  const serviceRate = meta.serviceRate ?? 5
  const taxRate = meta.taxRate ?? 10
  const subtotal = sale.subtotal_amount ?? sale.payable_amount
  const service = sale.service_amount ?? 0
  const tax = sale.tax_amount ?? 0
  const lines = (sale.items ?? []).map((item) => {
    const product = catalog.find((row) => row.id === item.product_id)
    const name = product?.name ?? `SKU ${item.product_id}`
    return `<tr><td>${item.quantity}× ${name}</td><td style="text-align:right">${rp(item.payable_amount)}</td></tr>`
  }).join('')

  const extras = [
    `<tr><td>Subtotal</td><td style="text-align:right">${rp(subtotal)}</td></tr>`,
    service > 0 ? `<tr><td>Service ${serviceRate}%</td><td style="text-align:right">${rp(service)}</td></tr>` : '',
    tax > 0 ? `<tr><td>${taxName} ${taxRate}%</td><td style="text-align:right">${rp(tax)}</td></tr>` : '',
  ].join('')

  const waktu = formatStrukWaktu(sale.sold_at)
  const bayar = sale.change_amount > 0
    ? `<div>Bayar ${rp(sale.cash_received_amount)}</div><div>Kembalian ${rp(sale.change_amount)}</div>`
    : '<div>Uang pas</div>'

  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>${sale.sale_number}</title>
<style>
  body { font: 14px/1.4 ui-monospace, Menlo, monospace; padding: 16px; color: #111; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  td { padding: 2px 0; }
  .muted { color: #555; font-size: 12px; }
  .total { font-weight: 800; font-size: 16px; }
</style></head><body>
  <h1>${shopName}</h1>
  <div class="muted">${sale.sale_number}</div>
  <div class="muted">${waktu}</div>
  ${cashier ? `<div class="muted">Kasir ${cashier}</div>` : ''}
  <table>${lines}${extras}</table>
  <div class="total">Total ${rp(sale.payable_amount)}</div>
  ${bayar}
  <p class="muted">Terima kasih</p>
</body></html>`
}

export function printTillReceipt(
  sale: PosSale,
  catalog: PosCatalogProduct[],
  meta: TillReceiptMeta = {},
): void {
  const html = tillReceiptHtml(sale, catalog, meta)
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  if (!doc) {
    frame.remove()
    return
  }
  doc.open()
  doc.write(html)
  doc.close()
  frame.contentWindow?.focus()
  frame.contentWindow?.print()
  window.setTimeout(() => frame.remove(), 1000)
}
