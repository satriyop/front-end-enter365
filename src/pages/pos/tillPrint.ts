import type { PosCatalogProduct, PosSale } from '@/api/usePos'

function rp(amount: number): string {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID')
}

export function tillReceiptHtml(sale: PosSale, catalog: PosCatalogProduct[], shopName = 'Kopitiam 57'): string {
  const lines = (sale.items ?? []).map((item) => {
    const product = catalog.find((row) => row.id === item.product_id)
    const name = product?.name ?? `SKU ${item.product_id}`
    return `<tr><td>${item.quantity}× ${name}</td><td style="text-align:right">${rp(item.payable_amount)}</td></tr>`
  }).join('')

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
  <table>${lines}</table>
  <div class="total">Total ${rp(sale.payable_amount)}</div>
  ${sale.change_amount > 0 ? `<div>Kembalian ${rp(sale.change_amount)}</div>` : '<div>Uang pas</div>'}
  <p class="muted">Terima kasih</p>
</body></html>`
}

export function printTillReceipt(sale: PosSale, catalog: PosCatalogProduct[]): void {
  const html = tillReceiptHtml(sale, catalog)
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
