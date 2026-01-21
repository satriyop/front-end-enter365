<script setup lang="ts">
import { formatCurrency, formatDate } from '@/utils/format'

/** Numeric value that may be string from API */
type NumericValue = number | string

export interface DocumentItem {
  id: number | string
  description: string
  notes?: string | null
  quantity: number
  unit?: string | null
  unit_price: NumericValue
  discount_percent?: number | null
  tax_rate?: number | null
  line_total: NumericValue
}

export interface PrintableDocumentProps {
  type: 'invoice' | 'quotation'
  number: string
  status: string
  date: string
  dueDate?: string | null
  validUntil?: string | null
  reference?: string | null
  subject?: string | null

  // Customer/Contact info
  contactName: string
  contactAddress?: string | null
  contactEmail?: string | null
  contactPhone?: string | null

  // Line items
  items: DocumentItem[]

  // Totals (can be string from API)
  subtotal: NumericValue
  discountAmount?: NumericValue | null
  taxRate?: NumericValue | null
  taxAmount: NumericValue
  total: NumericValue

  // For invoices
  paidAmount?: NumericValue | null
  outstandingAmount?: NumericValue | null

  // Notes & terms
  notes?: string | null
  termsConditions?: string | null
}

const props = defineProps<PrintableDocumentProps>()

const documentTitle = props.type === 'invoice' ? 'INVOICE' : 'QUOTATION'

function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'print-status-draft',
    posted: 'print-status-posted',
    approved: 'print-status-approved',
    paid: 'print-status-paid',
    void: 'print-status-void',
    rejected: 'print-status-rejected',
    overdue: 'print-status-overdue',
  }
  return statusMap[status] || 'print-status-draft'
}
</script>

<template>
  <div class="print-document">
    <!-- Document Header -->
    <div class="print-header">
      <div>
        <div class="print-company">Enter365</div>
        <div class="print-company-details">
          Indonesian Solar ERP Solutions<br />
          Jakarta, Indonesia
        </div>
      </div>
      <div>
        <div class="print-document-title">{{ documentTitle }}</div>
        <div class="print-document-number">{{ number }}</div>
        <div class="mt-2">
          <span :class="['print-status', getStatusClass(status)]">
            {{ status }}
          </span>
        </div>
      </div>
    </div>

    <!-- Parties Info -->
    <div class="print-parties">
      <div class="print-party">
        <div class="print-party-label">{{ type === 'invoice' ? 'Bill To' : 'Quotation For' }}</div>
        <div class="print-party-name">{{ contactName }}</div>
        <div v-if="contactAddress" class="print-party-address">{{ contactAddress }}</div>
        <div v-if="contactEmail" class="text-sm text-slate-500">{{ contactEmail }}</div>
        <div v-if="contactPhone" class="text-sm text-slate-500">{{ contactPhone }}</div>
      </div>
      <div class="print-party text-right">
        <div class="print-party-label">Document Details</div>
        <table class="ml-auto text-sm">
          <tr v-if="subject">
            <td class="text-slate-500 pr-4">Subject:</td>
            <td class="font-medium">{{ subject }}</td>
          </tr>
          <tr>
            <td class="text-slate-500 pr-4">Date:</td>
            <td class="font-medium">{{ formatDate(date) }}</td>
          </tr>
          <tr v-if="dueDate">
            <td class="text-slate-500 pr-4">Due Date:</td>
            <td class="font-medium">{{ formatDate(dueDate) }}</td>
          </tr>
          <tr v-if="validUntil">
            <td class="text-slate-500 pr-4">Valid Until:</td>
            <td class="font-medium">{{ formatDate(validUntil) }}</td>
          </tr>
          <tr v-if="reference">
            <td class="text-slate-500 pr-4">Reference:</td>
            <td class="font-medium">{{ reference }}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="print-items-table">
      <thead>
        <tr>
          <th style="width: 45%">Description</th>
          <th class="text-right" style="width: 10%">Qty</th>
          <th class="text-right" style="width: 15%">Unit Price</th>
          <th v-if="items.some(i => i.discount_percent)" class="text-right" style="width: 10%">Disc</th>
          <th v-if="items.some(i => i.tax_rate)" class="text-right" style="width: 10%">Tax</th>
          <th class="text-right" style="width: 15%">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>
            <div class="font-medium">{{ item.description }}</div>
            <div v-if="item.notes" class="text-slate-500 text-xs">{{ item.notes }}</div>
          </td>
          <td class="text-right">{{ item.quantity }} {{ item.unit || '' }}</td>
          <td class="text-right">{{ formatCurrency(item.unit_price) }}</td>
          <td v-if="items.some(i => i.discount_percent)" class="text-right text-slate-500">
            {{ item.discount_percent ? `${item.discount_percent}%` : '-' }}
          </td>
          <td v-if="items.some(i => i.tax_rate)" class="text-right text-slate-500">
            {{ item.tax_rate ? `${item.tax_rate}%` : '-' }}
          </td>
          <td class="text-right font-medium">{{ formatCurrency(item.line_total) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Summary -->
    <div class="print-summary">
      <div class="print-summary-row">
        <span class="print-summary-label">Subtotal</span>
        <span class="print-summary-value">{{ formatCurrency(subtotal) }}</span>
      </div>
      <div v-if="discountAmount" class="print-summary-row">
        <span class="print-summary-label">Discount</span>
        <span class="print-summary-value">-{{ formatCurrency(discountAmount) }}</span>
      </div>
      <div class="print-summary-row">
        <span class="print-summary-label">Tax{{ taxRate ? ` (${taxRate}%)` : '' }}</span>
        <span class="print-summary-value">{{ formatCurrency(taxAmount) }}</span>
      </div>
      <div class="print-summary-row total">
        <span>Total</span>
        <span class="text-orange-600">{{ formatCurrency(total) }}</span>
      </div>

      <!-- Invoice-specific: Paid & Outstanding -->
      <template v-if="type === 'invoice' && (paidAmount !== undefined || outstandingAmount !== undefined)">
        <div v-if="paidAmount" class="print-summary-row" style="border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 8px;">
          <span class="print-summary-label">Paid</span>
          <span class="print-summary-value text-green-600">{{ formatCurrency(paidAmount) }}</span>
        </div>
        <div v-if="outstandingAmount" class="print-summary-row">
          <span class="font-medium">Outstanding</span>
          <span class="font-bold text-orange-600">{{ formatCurrency(outstandingAmount) }}</span>
        </div>
      </template>
    </div>

    <!-- Notes & Terms -->
    <div v-if="notes || termsConditions" class="print-footer">
      <div v-if="notes" class="print-notes">
        <div class="print-notes-title">Notes</div>
        <p class="whitespace-pre-line">{{ notes }}</p>
      </div>
      <div v-if="termsConditions" class="print-terms">
        <div class="print-notes-title">Terms & Conditions</div>
        <p class="whitespace-pre-line">{{ termsConditions }}</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-10 pt-4 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400 dark:text-slate-500">
      Generated by Enter365 - Indonesian Solar ERP
    </div>
  </div>
</template>

<style scoped>
/* Screen styles - these will be overridden by print.css in print mode */
.print-document {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background: white;
}

@media (prefers-color-scheme: dark) {
  .print-document {
    background: rgb(15 23 42); /* slate-900 */
  }
}

.print-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.print-company {
  font-size: 24px;
  font-weight: bold;
  color: #1e293b;
}

.print-company-details {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.print-document-title {
  font-size: 28px;
  font-weight: bold;
  color: #ea580c;
}

.print-document-number {
  font-size: 14px;
  color: #1e293b;
  margin-top: 4px;
}

.print-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.print-status-draft { background: #f1f5f9; color: #475569; }
.print-status-posted, .print-status-approved { background: #dcfce7; color: #166534; }
.print-status-paid { background: #dbeafe; color: #1e40af; }
.print-status-void, .print-status-rejected { background: #fee2e2; color: #991b1b; }
.print-status-overdue { background: #fef3c7; color: #92400e; }

.print-parties {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.print-party-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
  letter-spacing: 0.05em;
}

.print-party-name {
  font-size: 16px;
  font-weight: bold;
  color: #1e293b;
}

.print-party-address {
  font-size: 12px;
  color: #475569;
  white-space: pre-line;
}

.print-items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
  font-size: 13px;
}

.print-items-table th {
  background-color: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.05em;
}

.print-items-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
}

.print-summary {
  margin-left: auto;
  width: 280px;
  font-size: 13px;
}

.print-summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.print-summary-row.total {
  border-top: 2px solid #e2e8f0;
  border-bottom: none;
  padding-top: 12px;
  margin-top: 8px;
  font-weight: bold;
  font-size: 16px;
}

.print-summary-label { color: #64748b; }
.print-summary-value { color: #1e293b; font-weight: 500; }

.print-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
}

.print-notes { margin-bottom: 16px; }
.print-notes-title { font-weight: 600; margin-bottom: 4px; color: #475569; }
.print-terms { font-size: 11px; color: #94a3b8; }
</style>
