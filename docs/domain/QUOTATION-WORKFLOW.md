# Quotation Workflow

> Sales process from quotation to payment

## Workflow Overview

```
                    ┌─────────────────────────────────────────┐
                    │              CONTACT                     │
                    │     (Customer or Supplier)               │
                    └───────────────┬─────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────┐
│                         QUOTATION                              │
│   Status: draft → submitted → approved/rejected                │
├───────────────────────────────────────────────────────────────┤
│   • Line items (products, quantities, prices)                  │
│   • Discounts, taxes                                           │
│   • Validity period                                            │
│   • Terms and conditions                                       │
└───────────────────┬───────────────────────────────────────────┘
                    │ (if approved)
                    ▼
┌───────────────────────────────────────────────────────────────┐
│                          INVOICE                               │
│   Status: draft → posted → paid/void                           │
├───────────────────────────────────────────────────────────────┤
│   • Copied from quotation                                      │
│   • Invoice number                                             │
│   • Due date                                                   │
│   • Payment terms                                              │
└───────────────────┬───────────────────────────────────────────┘
                    │ (when payment received)
                    ▼
┌───────────────────────────────────────────────────────────────┐
│                          PAYMENT                               │
├───────────────────────────────────────────────────────────────┤
│   • Amount paid                                                │
│   • Payment method                                             │
│   • Reference number                                           │
│   • Payment date                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Quotation

### Status Flow

```
draft ──▶ submitted ──▶ approved ──▶ converted (to invoice)
              │
              └──▶ rejected
```

| Status | Description | Actions Available |
|--------|-------------|-------------------|
| `draft` | Being created/edited | Edit, Delete, Submit |
| `submitted` | Awaiting approval | Approve, Reject |
| `approved` | Ready to convert | Convert to Invoice, Duplicate |
| `rejected` | Declined | Duplicate, Revise |

### Actions

| Action | Description | API Endpoint |
|--------|-------------|--------------|
| Submit | Send for approval | `POST /quotations/{id}/submit` |
| Approve | Mark as approved | `POST /quotations/{id}/approve` |
| Reject | Mark as rejected | `POST /quotations/{id}/reject` |
| Convert | Create invoice | `POST /quotations/{id}/convert-to-invoice` |
| Duplicate | Copy quotation | `POST /quotations/{id}/duplicate` |
| Revise | Create revision | `POST /quotations/{id}/revise` |

### Data Model

```typescript
interface Quotation {
  id: number
  quotation_number: string      // e.g., "Q-2024-001"
  contact_id: number
  contact: Contact
  status: 'draft' | 'submitted' | 'approved' | 'rejected'

  // Line items
  items: QuotationItem[]

  // Totals
  subtotal: number              // Sum of line totals
  discount_percent: number      // Overall discount
  discount_amount: number
  tax_percent: number           // VAT (11%)
  tax_amount: number
  grand_total: number           // Final amount

  // Dates
  quotation_date: string
  valid_until: string

  // Metadata
  notes: string
  terms: string
  created_at: string
  updated_at: string
}

interface QuotationItem {
  id: number
  product_id: number
  product: Product
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  line_total: number
}
```

---

## Invoice

### Status Flow

```
draft ──▶ posted ──▶ paid
              │
              └──▶ void
```

| Status | Description | Actions Available |
|--------|-------------|-------------------|
| `draft` | Being created | Edit, Delete, Post |
| `posted` | Sent to customer | Record Payment, Send, Void |
| `paid` | Fully paid | View only |
| `void` | Cancelled | View only |

### Actions

| Action | Description | API Endpoint |
|--------|-------------|--------------|
| Post | Finalize invoice | `POST /invoices/{id}/post` |
| Void | Cancel invoice | `POST /invoices/{id}/void` |
| Send | Email to customer | `POST /invoices/{id}/send` |
| Duplicate | Copy invoice | `POST /invoices/{id}/duplicate` |

### Data Model

```typescript
interface Invoice {
  id: number
  invoice_number: string        // e.g., "INV-2024-001"
  contact_id: number
  contact: Contact
  quotation_id?: number         // Link to source quotation
  status: 'draft' | 'posted' | 'paid' | 'void'

  // Line items
  items: InvoiceItem[]

  // Totals
  subtotal: number
  tax_amount: number
  grand_total: number

  // Payment tracking
  amount_paid: number
  amount_due: number

  // Dates
  invoice_date: string
  due_date: string

  created_at: string
  updated_at: string
}
```

---

## Payment

### Data Model

```typescript
interface Payment {
  id: number
  payment_number: string        // e.g., "PAY-2024-001"
  invoice_id: number
  invoice: Invoice

  amount: number
  payment_method: 'cash' | 'transfer' | 'check' | 'credit_card'
  payment_date: string
  reference: string             // Bank reference, check number

  notes: string
  created_at: string
}
```

---

## API Hooks

### Quotations

```typescript
import {
  useQuotations,              // List with filters
  useQuotation,               // Single quotation
  useCreateQuotation,         // Create
  useUpdateQuotation,         // Update
  useDeleteQuotation,         // Delete
  useSubmitQuotation,         // Submit for approval
  useApproveQuotation,        // Approve
  useRejectQuotation,         // Reject
  useConvertToInvoice,        // Convert to invoice
  useDuplicateQuotation,      // Duplicate
  useQuotationStats,          // Statistics
} from '@/api/useQuotations'
```

### Invoices

```typescript
import {
  useInvoices,
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  usePostInvoice,
  useVoidInvoice,
  useSendInvoice,
  useInvoiceStats,
} from '@/api/useInvoices'
```

### Payments

```typescript
import {
  usePayments,
  usePayment,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from '@/api/usePayments'
```

---

## Code Examples

### Create Quotation from Solar Proposal

```typescript
const { mutate: convertProposal } = useConvertProposalToQuotation()

function handleConvert(proposalId: number) {
  convertProposal(proposalId, {
    onSuccess: (quotation) => {
      toast.success('Quotation created')
      router.push(`/quotations/${quotation.id}`)
    },
  })
}
```

### Submit and Approve Flow

```vue
<script setup lang="ts">
const { mutate: submit, isPending: isSubmitting } = useSubmitQuotation()
const { mutate: approve, isPending: isApproving } = useApproveQuotation()

function handleSubmit() {
  submit(quotation.id, {
    onSuccess: () => toast.success('Submitted for approval'),
  })
}

function handleApprove() {
  approve(quotation.id, {
    onSuccess: () => toast.success('Quotation approved'),
  })
}
</script>

<template>
  <Button
    v-if="quotation.status === 'draft'"
    @click="handleSubmit"
    :disabled="isSubmitting"
  >
    Submit
  </Button>

  <Button
    v-if="quotation.status === 'submitted'"
    variant="success"
    @click="handleApprove"
    :disabled="isApproving"
  >
    Approve
  </Button>
</template>
```

### Convert to Invoice

```typescript
const { mutate: convert, isPending } = useConvertToInvoice()

function handleConvert() {
  convert(quotation.id, {
    onSuccess: (invoice) => {
      toast.success('Invoice created')
      router.push(`/invoices/${invoice.id}`)
    },
  })
}
```

---

## Related Documentation

- [SOLAR-PROPOSALS.md](SOLAR-PROPOSALS.md) - Solar proposal to quotation
- [INVENTORY.md](INVENTORY.md) - Products and BOMs
- [MUTATIONS.md](../api/MUTATIONS.md) - Mutation patterns
