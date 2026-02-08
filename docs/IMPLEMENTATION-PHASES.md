# Frontend Implementation Phases

> Master plan for implementing remaining backend APIs in the frontend.
> **Total: ~230+ endpoints across 11 phases**
>
> *Updated February 2025: All 11 phases are now **COMPLETE**.*

---

## Phase Overview

| Phase | Module | Endpoints | Priority | Status |
|-------|--------|-----------|----------|--------|
| 1 | Core Accounting Foundation | ~25 | 🔥 Critical | ✅ Complete |
| 2 | Purchasing Module | ~30 | 🔥 Critical | ✅ Complete |
| 3 | Sales Fulfillment | ~35 | 🔥 Critical | ✅ Complete |
| 4 | Quotation Pipeline Enhancement | ~15 | 🟡 High | ✅ Complete |
| 5 | Warehouse & Inventory | ~25 | 🟡 High | ✅ Complete |
| 6 | Product Management | ~10 | 🟡 Medium | ✅ Complete |
| 7 | Manufacturing Enhancement | ~35 | 🟡 Medium | ✅ Complete |
| 8 | Subcontracting | ~20 | 🟢 Lower | ✅ Complete |
| 9 | Bank & Reconciliation | ~15 | 🟡 High | ✅ Complete |
| 10 | Reports & Exports | ~40 | 🟢 Lower | ✅ Partial (core reports done, some export/manufacturing reports pending) |
| 11 | Administration | ~20 | 🟢 Lower | ✅ Complete |

---

## Phase 1: Core Accounting Foundation

**Goal:** Establish the accounting backbone - Chart of Accounts, Journal Entries, and Fiscal Period management.

### 1.1 Chart of Accounts (Bagan Akun)

**API Endpoints:**
- `GET /v1/accounts` - List accounts with filters
- `POST /v1/accounts` - Create account
- `GET /v1/accounts/{id}` - Get account details
- `PUT /v1/accounts/{id}` - Update account
- `DELETE /v1/accounts/{id}` - Delete account
- `GET /v1/accounts/{id}/balance` - Get account balance
- `GET /v1/accounts/{id}/ledger` - Get ledger entries

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useAccounts.ts` | API Hook | TanStack Query hooks for all account endpoints |
| `src/types/account.ts` | Types | TypeScript interfaces for Account, AccountBalance, LedgerEntry |
| `src/pages/accounting/accounts/index.vue` | Page | Account list with tree view and filters |
| `src/pages/accounting/accounts/[id].vue` | Page | Account detail with balance and ledger |
| `src/components/accounts/AccountForm.vue` | Component | Create/Edit account form |
| `src/components/accounts/AccountTree.vue` | Component | Hierarchical account tree display |
| `src/components/accounts/LedgerTable.vue` | Component | Ledger entries table with date range |

**Business Logic Considerations:**
- Account codes follow Indonesian COA standards (1xxx = Assets, 2xxx = Liabilities, etc.)
- Parent-child relationships for sub-accounts
- Account types: Asset, Liability, Equity, Revenue, Expense
- Balance calculation: Debit vs Credit nature based on account type

---

### 1.2 Journal Entries (Jurnal Umum)

**API Endpoints:**
- `GET /v1/journal-entries` - List journal entries
- `POST /v1/journal-entries` - Create journal entry
- `GET /v1/journal-entries/{id}` - Get entry details
- `POST /v1/journal-entries/{id}/post` - Post entry
- `POST /v1/journal-entries/{id}/reverse` - Reverse entry

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useJournalEntries.ts` | API Hook | TanStack Query hooks |
| `src/types/journal-entry.ts` | Types | JournalEntry, JournalLine interfaces |
| `src/pages/accounting/journal-entries/index.vue` | Page | Journal entry list |
| `src/pages/accounting/journal-entries/create.vue` | Page | Create journal entry |
| `src/pages/accounting/journal-entries/[id].vue` | Page | View/Post/Reverse entry |
| `src/components/journal/JournalEntryForm.vue` | Component | Multi-line debit/credit form |
| `src/components/journal/JournalLinesTable.vue` | Component | Editable lines with account picker |

**Business Logic Considerations:**
- Debits must equal Credits (balanced entry)
- Posted entries cannot be edited, only reversed
- Reversal creates a new entry with opposite signs
- Reference to source documents (Invoice, Bill, Payment)

---

### 1.3 Fiscal Periods (Periode Fiskal)

**API Endpoints:**
- `GET /v1/fiscal-periods` - List periods
- `POST /v1/fiscal-periods` - Create period
- `GET /v1/fiscal-periods/{id}` - Get period details
- `POST /v1/fiscal-periods/{id}/lock` - Lock period
- `POST /v1/fiscal-periods/{id}/unlock` - Unlock period
- `POST /v1/fiscal-periods/{id}/close` - Close period
- `POST /v1/fiscal-periods/{id}/reopen` - Reopen period
- `GET /v1/fiscal-periods/{id}/closing-checklist` - Get checklist

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useFiscalPeriods.ts` | API Hook | TanStack Query hooks |
| `src/types/fiscal-period.ts` | Types | FiscalPeriod, ClosingChecklist interfaces |
| `src/pages/accounting/fiscal-periods/index.vue` | Page | Period list with status badges |
| `src/pages/accounting/fiscal-periods/[id].vue` | Page | Period detail with actions |
| `src/components/fiscal/PeriodForm.vue` | Component | Create period form |
| `src/components/fiscal/ClosingChecklist.vue` | Component | Checklist before closing |
| `src/components/fiscal/PeriodStatusBadge.vue` | Component | Visual status indicator |

**Business Logic Considerations:**
- Periods: Open → Locked → Closed
- Locked = no new transactions, but can unlock
- Closed = permanent, affects retained earnings
- Checklist ensures all transactions are posted before closing

---

## Phase 2: Purchasing Module

**Goal:** Complete purchase-to-pay cycle with Purchase Orders, Goods Receipt, and Purchase Returns.

### 2.1 Purchase Orders (Pesanan Pembelian)

**API Endpoints:**
- `GET /v1/purchase-orders` - List POs
- `POST /v1/purchase-orders` - Create PO
- `GET /v1/purchase-orders/{id}` - Get PO details
- `PUT /v1/purchase-orders/{id}` - Update PO
- `DELETE /v1/purchase-orders/{id}` - Delete PO
- `POST /v1/purchase-orders/{id}/submit` - Submit for approval
- `POST /v1/purchase-orders/{id}/approve` - Approve PO
- `POST /v1/purchase-orders/{id}/reject` - Reject PO
- `POST /v1/purchase-orders/{id}/cancel` - Cancel PO
- `POST /v1/purchase-orders/{id}/receive` - Mark as received
- `POST /v1/purchase-orders/{id}/convert-to-bill` - Convert to bill
- `POST /v1/purchase-orders/{id}/duplicate` - Duplicate PO
- `GET /v1/purchase-orders-outstanding` - Outstanding POs
- `GET /v1/purchase-orders-statistics` - PO statistics

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/usePurchaseOrders.ts` | API Hook | TanStack Query hooks |
| `src/types/purchase-order.ts` | Types | PurchaseOrder, POLine, POStatistics |
| `src/pages/purchasing/purchase-orders/index.vue` | Page | PO list with filters and stats |
| `src/pages/purchasing/purchase-orders/create.vue` | Page | Create PO |
| `src/pages/purchasing/purchase-orders/[id].vue` | Page | PO detail with workflow actions |
| `src/pages/purchasing/purchase-orders/[id]/edit.vue` | Page | Edit draft PO |
| `src/components/purchase-orders/POForm.vue` | Component | PO form with line items |
| `src/components/purchase-orders/POLineItems.vue` | Component | Editable line items table |
| `src/components/purchase-orders/POWorkflowActions.vue` | Component | Submit/Approve/Reject buttons |
| `src/components/purchase-orders/POStatisticsCard.vue` | Component | Stats dashboard card |

**Business Logic Considerations:**
- Workflow: Draft → Submitted → Approved/Rejected → Received → Billed
- Only draft POs can be edited
- Partial receiving supported
- Auto-create Bill from PO with matched quantities

---

### 2.2 Goods Receipt Notes (Surat Penerimaan Barang)

**API Endpoints:**
- `GET /v1/goods-receipt-notes` - List GRNs
- `POST /v1/goods-receipt-notes` - Create GRN
- `GET /v1/goods-receipt-notes/{id}` - Get GRN details
- `PUT /v1/goods-receipt-notes/{id}` - Update GRN
- `DELETE /v1/goods-receipt-notes/{id}` - Delete GRN
- `POST /v1/purchase-orders/{po}/create-grn` - Create from PO
- `PUT /v1/goods-receipt-notes/{id}/items/{item}` - Update item
- `POST /v1/goods-receipt-notes/{id}/start-receiving` - Start receiving
- `POST /v1/goods-receipt-notes/{id}/complete` - Complete GRN
- `POST /v1/goods-receipt-notes/{id}/cancel` - Cancel GRN
- `GET /v1/purchase-orders/{po}/goods-receipt-notes` - Get PO's GRNs

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useGoodsReceiptNotes.ts` | API Hook | TanStack Query hooks |
| `src/types/goods-receipt-note.ts` | Types | GRN, GRNItem interfaces |
| `src/pages/purchasing/grn/index.vue` | Page | GRN list |
| `src/pages/purchasing/grn/create.vue` | Page | Create GRN (standalone) |
| `src/pages/purchasing/grn/[id].vue` | Page | GRN detail with receiving |
| `src/components/grn/GRNForm.vue` | Component | GRN form |
| `src/components/grn/ReceivingTable.vue` | Component | Quantity receiving input |
| `src/components/grn/CreateFromPOModal.vue` | Component | Select PO to receive |

**Business Logic Considerations:**
- GRN created from PO with expected quantities
- Actual received qty can differ (over/under receiving)
- Affects inventory stock levels
- Links to Bill for 3-way matching

---

### 2.3 Purchase Returns (Retur Pembelian)

**API Endpoints:**
- `GET /v1/purchase-returns` - List returns
- `POST /v1/purchase-returns` - Create return
- `GET /v1/purchase-returns/{id}` - Get return details
- `PUT /v1/purchase-returns/{id}` - Update return
- `DELETE /v1/purchase-returns/{id}` - Delete return
- `POST /v1/purchase-returns/{id}/submit` - Submit return
- `POST /v1/purchase-returns/{id}/approve` - Approve return
- `POST /v1/purchase-returns/{id}/reject` - Reject return
- `POST /v1/purchase-returns/{id}/complete` - Complete return
- `POST /v1/purchase-returns/{id}/cancel` - Cancel return
- `POST /v1/bills/{bill}/create-purchase-return` - Create from Bill
- `GET /v1/bills/{bill}/purchase-returns` - Get Bill's returns
- `GET /v1/purchase-returns-statistics` - Statistics

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/usePurchaseReturns.ts` | API Hook | TanStack Query hooks |
| `src/types/purchase-return.ts` | Types | PurchaseReturn interfaces |
| `src/pages/purchasing/returns/index.vue` | Page | Return list |
| `src/pages/purchasing/returns/create.vue` | Page | Create return |
| `src/pages/purchasing/returns/[id].vue` | Page | Return detail |
| `src/components/purchase-returns/ReturnForm.vue` | Component | Return form |
| `src/components/purchase-returns/CreateFromBillModal.vue` | Component | Select Bill items |

---

## Phase 3: Sales Fulfillment

**Goal:** Complete order-to-cash cycle with Down Payments, Delivery Orders, Sales Returns, and Recurring.

### 3.1 Down Payments (Uang Muka)

**API Endpoints:**
- `GET /v1/down-payments` - List down payments
- `POST /v1/down-payments` - Create down payment
- `GET /v1/down-payments/{id}` - Get details
- `PUT /v1/down-payments/{id}` - Update
- `DELETE /v1/down-payments/{id}` - Delete
- `POST /v1/down-payments/{id}/apply-to-invoice/{invoice}` - Apply to invoice
- `POST /v1/down-payments/{id}/apply-to-bill/{bill}` - Apply to bill
- `DELETE /v1/down-payments/{id}/applications/{app}` - Unapply
- `POST /v1/down-payments/{id}/refund` - Refund
- `POST /v1/down-payments/{id}/cancel` - Cancel
- `GET /v1/down-payments/{id}/applications` - Get applications
- `GET /v1/down-payments-available` - Available for application
- `GET /v1/down-payments-statistics` - Statistics

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useDownPayments.ts` | API Hook | TanStack Query hooks |
| `src/types/down-payment.ts` | Types | DownPayment, Application interfaces |
| `src/pages/sales/down-payments/index.vue` | Page | DP list with stats |
| `src/pages/sales/down-payments/create.vue` | Page | Create DP |
| `src/pages/sales/down-payments/[id].vue` | Page | DP detail with applications |
| `src/components/down-payments/DPForm.vue` | Component | DP form |
| `src/components/down-payments/ApplyToInvoiceModal.vue` | Component | Apply DP modal |
| `src/components/down-payments/ApplicationsTable.vue` | Component | Applied invoices list |

**Business Logic Considerations:**
- DP reduces invoice balance when applied
- Can be partially applied to multiple invoices
- Refund creates a payment record
- Balance tracking: Received - Applied - Refunded = Available

---

### 3.2 Delivery Orders (Surat Jalan)

**API Endpoints:**
- `GET /v1/delivery-orders` - List DOs
- `POST /v1/delivery-orders` - Create DO
- `GET /v1/delivery-orders/{id}` - Get DO details
- `PUT /v1/delivery-orders/{id}` - Update DO
- `DELETE /v1/delivery-orders/{id}` - Delete DO
- `POST /v1/delivery-orders/{id}/confirm` - Confirm DO
- `POST /v1/delivery-orders/{id}/ship` - Mark shipped
- `POST /v1/delivery-orders/{id}/deliver` - Mark delivered
- `POST /v1/delivery-orders/{id}/cancel` - Cancel DO
- `POST /v1/delivery-orders/{id}/update-progress` - Update progress
- `POST /v1/delivery-orders/{id}/duplicate` - Duplicate DO
- `POST /v1/invoices/{invoice}/create-delivery-order` - Create from Invoice
- `GET /v1/invoices/{invoice}/delivery-orders` - Get Invoice's DOs
- `GET /v1/delivery-orders-statistics` - Statistics

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useDeliveryOrders.ts` | API Hook | TanStack Query hooks |
| `src/types/delivery-order.ts` | Types | DeliveryOrder interfaces |
| `src/pages/sales/delivery-orders/index.vue` | Page | DO list with Kanban view |
| `src/pages/sales/delivery-orders/create.vue` | Page | Create DO |
| `src/pages/sales/delivery-orders/[id].vue` | Page | DO detail with tracking |
| `src/components/delivery-orders/DOForm.vue` | Component | DO form |
| `src/components/delivery-orders/DOStatusTracker.vue` | Component | Visual status timeline |
| `src/components/delivery-orders/CreateFromInvoiceModal.vue` | Component | Select invoice items |

**Business Logic Considerations:**
- Workflow: Draft → Confirmed → Shipped → Delivered
- Partial delivery supported (multiple DOs per Invoice)
- Affects inventory (reduces stock on ship/deliver)
- Print Surat Jalan document

---

### 3.3 Sales Returns (Retur Penjualan)

**API Endpoints:**
- `GET /v1/sales-returns` - List returns
- `POST /v1/sales-returns` - Create return
- `GET /v1/sales-returns/{id}` - Get details
- `PUT /v1/sales-returns/{id}` - Update
- `DELETE /v1/sales-returns/{id}` - Delete
- `POST /v1/sales-returns/{id}/submit` - Submit
- `POST /v1/sales-returns/{id}/approve` - Approve
- `POST /v1/sales-returns/{id}/reject` - Reject
- `POST /v1/sales-returns/{id}/complete` - Complete
- `POST /v1/sales-returns/{id}/cancel` - Cancel
- `POST /v1/invoices/{invoice}/create-sales-return` - Create from Invoice
- `GET /v1/invoices/{invoice}/sales-returns` - Get Invoice's returns
- `GET /v1/sales-returns-statistics` - Statistics

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useSalesReturns.ts` | API Hook | TanStack Query hooks |
| `src/types/sales-return.ts` | Types | SalesReturn interfaces |
| `src/pages/sales/returns/index.vue` | Page | Return list |
| `src/pages/sales/returns/create.vue` | Page | Create return |
| `src/pages/sales/returns/[id].vue` | Page | Return detail |
| `src/components/sales-returns/ReturnForm.vue` | Component | Return form |
| `src/components/sales-returns/ReturnReasonSelect.vue` | Component | Reason dropdown |

---

### 3.4 Recurring Templates (Template Berulang)

**API Endpoints:**
- `GET /v1/recurring-templates` - List templates
- `POST /v1/recurring-templates` - Create template
- `GET /v1/recurring-templates/{id}` - Get details
- `PUT /v1/recurring-templates/{id}` - Update
- `DELETE /v1/recurring-templates/{id}` - Delete
- `POST /v1/recurring-templates/{id}/generate` - Generate document
- `POST /v1/recurring-templates/{id}/pause` - Pause
- `POST /v1/recurring-templates/{id}/resume` - Resume

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useRecurringTemplates.ts` | API Hook | TanStack Query hooks |
| `src/types/recurring-template.ts` | Types | RecurringTemplate interfaces |
| `src/pages/settings/recurring/index.vue` | Page | Template list |
| `src/pages/settings/recurring/create.vue` | Page | Create template |
| `src/pages/settings/recurring/[id].vue` | Page | Template detail |
| `src/components/recurring/TemplateForm.vue` | Component | Template form |
| `src/components/recurring/FrequencyPicker.vue` | Component | Frequency selector |
| `src/components/recurring/GeneratedHistory.vue` | Component | Generated docs list |

---

## Phase 4: Quotation Pipeline Enhancement

**Goal:** Add CRM-like features to existing quotations - follow-ups, activities, assignments.

### 4.1 Follow-Up & Activities

**API Endpoints:**
- `GET /v1/quotation-follow-up` - List follow-ups
- `GET /v1/quotation-follow-up/statistics` - Statistics
- `GET /v1/quotation-follow-up/summary` - Summary
- `GET /v1/quotations/{id}/activities` - Get activities
- `POST /v1/quotations/{id}/activities` - Add activity
- `POST /v1/quotations/{id}/schedule-follow-up` - Schedule follow-up
- `POST /v1/quotations/{id}/assign` - Assign to user
- `POST /v1/quotations/{id}/priority` - Set priority
- `POST /v1/quotations/{id}/mark-won` - Mark as won
- `POST /v1/quotations/{id}/mark-lost` - Mark as lost

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useQuotationPipeline.ts` | API Hook | Pipeline-specific hooks |
| `src/types/quotation-pipeline.ts` | Types | Activity, FollowUp interfaces |
| `src/pages/sales/pipeline/index.vue` | Page | Pipeline Kanban board |
| `src/pages/sales/pipeline/follow-ups.vue` | Page | Follow-up calendar/list |
| `src/components/pipeline/KanbanBoard.vue` | Component | Drag-drop pipeline |
| `src/components/pipeline/ActivityFeed.vue` | Component | Activity timeline |
| `src/components/pipeline/ScheduleFollowUpModal.vue` | Component | Schedule modal |
| `src/components/pipeline/AssignUserModal.vue` | Component | Assign modal |
| `src/components/pipeline/WonLostModal.vue` | Component | Won/Lost with reason |

---

### 4.2 Variant Comparison

**API Endpoints:**
- `GET /v1/quotations/{id}/variant-options` - Get variant options
- `PUT /v1/quotations/{id}/variant-options` - Sync variants
- `POST /v1/quotations/{id}/select-variant` - Select variant
- `GET /v1/quotations/{id}/variant-comparison` - Compare variants

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/components/quotations/VariantComparison.vue` | Component | Side-by-side comparison |
| `src/components/quotations/VariantSelector.vue` | Component | Variant picker |

---

## Phase 5: Warehouse & Inventory Enhancement

**Goal:** Multi-warehouse support, transfers, and physical inventory counting.

### 5.1 Warehouses (Gudang)

**API Endpoints:**
- `GET /v1/warehouses` - List warehouses
- `POST /v1/warehouses` - Create warehouse
- `GET /v1/warehouses/{id}` - Get details
- `PUT /v1/warehouses/{id}` - Update
- `DELETE /v1/warehouses/{id}` - Delete
- `POST /v1/warehouses/{id}/set-default` - Set default
- `GET /v1/warehouses/{id}/stock-summary` - Stock summary

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useWarehouses.ts` | API Hook | TanStack Query hooks |
| `src/types/warehouse.ts` | Types | Warehouse interfaces |
| `src/pages/inventory/warehouses/index.vue` | Page | Warehouse list |
| `src/pages/inventory/warehouses/[id].vue` | Page | Warehouse detail with stock |
| `src/components/warehouses/WarehouseForm.vue` | Component | Warehouse form |
| `src/components/warehouses/StockSummaryTable.vue` | Component | Stock by product |

---

### 5.2 Inventory Transfer

**API Endpoints:**
- `POST /v1/inventory/transfer` - Transfer between warehouses
- `GET /v1/inventory/summary` - Inventory summary
- `GET /v1/inventory/movement-summary` - Movement summary

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/pages/inventory/transfer/index.vue` | Page | Transfer history |
| `src/pages/inventory/transfer/create.vue` | Page | Create transfer |
| `src/components/inventory/TransferForm.vue` | Component | Transfer form |

---

### 5.3 Stock Opname (Physical Inventory)

**API Endpoints:**
- `GET /v1/stock-opnames` - List opnames
- `POST /v1/stock-opnames` - Create opname
- `GET /v1/stock-opnames/{id}` - Get details
- `PUT /v1/stock-opnames/{id}` - Update
- `DELETE /v1/stock-opnames/{id}` - Delete
- `POST /v1/stock-opnames/{id}/generate-items` - Generate items
- `POST /v1/stock-opnames/{id}/items` - Add item
- `PUT /v1/stock-opnames/{id}/items/{item}` - Update item count
- `DELETE /v1/stock-opnames/{id}/items/{item}` - Remove item
- `POST /v1/stock-opnames/{id}/start-counting` - Start counting
- `POST /v1/stock-opnames/{id}/submit-review` - Submit for review
- `POST /v1/stock-opnames/{id}/approve` - Approve
- `POST /v1/stock-opnames/{id}/reject` - Reject
- `POST /v1/stock-opnames/{id}/cancel` - Cancel
- `GET /v1/stock-opnames/{id}/variance-report` - Variance report

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useStockOpname.ts` | API Hook | TanStack Query hooks |
| `src/types/stock-opname.ts` | Types | StockOpname interfaces |
| `src/pages/inventory/stock-opname/index.vue` | Page | Opname list |
| `src/pages/inventory/stock-opname/create.vue` | Page | Create opname |
| `src/pages/inventory/stock-opname/[id].vue` | Page | Counting interface |
| `src/pages/inventory/stock-opname/[id]/variance.vue` | Page | Variance report |
| `src/components/stock-opname/CountingTable.vue` | Component | Editable count table |
| `src/components/stock-opname/VarianceReport.vue` | Component | Discrepancy display |

---

## Phase 6: Product Management Enhancement

**Goal:** Product categories tree and additional product utilities.

### 6.1 Product Categories

**API Endpoints:**
- `GET /v1/product-categories` - List categories
- `POST /v1/product-categories` - Create category
- `GET /v1/product-categories/{id}` - Get details
- `PUT /v1/product-categories/{id}` - Update
- `DELETE /v1/product-categories/{id}` - Delete
- `GET /v1/product-categories-tree` - Tree structure

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useProductCategories.ts` | API Hook | TanStack Query hooks |
| `src/types/product-category.ts` | Types | Category interfaces |
| `src/pages/products/categories/index.vue` | Page | Category tree manager |
| `src/components/categories/CategoryTree.vue` | Component | Draggable tree |
| `src/components/categories/CategoryForm.vue` | Component | Category form |

---

### 6.2 Product Utilities

**API Endpoints:**
- `POST /v1/products/{id}/adjust-stock` - Adjust stock
- `POST /v1/products/{id}/duplicate` - Duplicate product
- `GET /v1/products-low-stock` - Low stock products
- `GET /v1/products-price-list` - Price list
- `GET /v1/products-lookup` - Quick lookup

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/pages/products/low-stock.vue` | Page | Low stock alert list |
| `src/pages/products/price-list.vue` | Page | Price list export view |
| `src/components/products/StockAdjustModal.vue` | Component | Quick adjust modal |
| `src/components/products/DuplicateProductModal.vue` | Component | Duplicate modal |
| `src/components/products/ProductLookup.vue` | Component | Quick search widget |

---

## Phase 7: Manufacturing Enhancement

**Goal:** Complete manufacturing features - material requisitions, work order tracking, MRP.

### 7.1 Material Requisitions

**API Endpoints:**
- `GET /v1/material-requisitions` - List requisitions
- `POST /v1/work-orders/{wo}/material-requisitions` - Create for WO
- `GET /v1/material-requisitions/{id}` - Get details
- `PUT /v1/material-requisitions/{id}` - Update
- `DELETE /v1/material-requisitions/{id}` - Delete
- `POST /v1/material-requisitions/{id}/approve` - Approve
- `POST /v1/material-requisitions/{id}/issue` - Issue materials
- `POST /v1/material-requisitions/{id}/cancel` - Cancel

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useMaterialRequisitions.ts` | API Hook | TanStack Query hooks |
| `src/types/material-requisition.ts` | Types | Requisition interfaces |
| `src/pages/manufacturing/requisitions/index.vue` | Page | Requisition list |
| `src/pages/manufacturing/requisitions/[id].vue` | Page | Requisition detail |
| `src/components/requisitions/RequisitionForm.vue` | Component | Requisition form |
| `src/components/requisitions/IssueMaterialsModal.vue` | Component | Issue modal |

---

### 7.2 Work Order Extensions

**API Endpoints:**
- `POST /v1/work-orders/{id}/record-output` - Record output
- `POST /v1/work-orders/{id}/record-consumption` - Record consumption
- `GET /v1/work-orders/{id}/cost-summary` - Cost summary
- `GET /v1/work-orders/{id}/material-status` - Material status
- `GET /v1/work-orders/{id}/sub-work-orders` - Sub work orders
- `POST /v1/work-orders/{id}/sub-work-orders` - Create sub WO

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| Enhanced `src/pages/work-orders/[id].vue` | Page | Add production tracking |
| `src/components/work-orders/OutputRecordForm.vue` | Component | Record output form |
| `src/components/work-orders/ConsumptionTable.vue` | Component | Material consumption |
| `src/components/work-orders/CostSummaryCard.vue` | Component | Cost breakdown |
| `src/components/work-orders/SubWorkOrderList.vue` | Component | Sub WO management |

---

### 7.3 MRP (Material Requirements Planning)

**API Endpoints:**
- `GET /v1/mrp-runs` - List MRP runs
- `POST /v1/mrp-runs` - Create MRP run
- `GET /v1/mrp-runs/{id}` - Get details
- `PUT /v1/mrp-runs/{id}` - Update
- `DELETE /v1/mrp-runs/{id}` - Delete
- `POST /v1/mrp-runs/{id}/execute` - Execute MRP
- `GET /v1/mrp-runs/{id}/demands` - Get demands
- `GET /v1/mrp-runs/{id}/suggestions` - Get suggestions
- `POST /v1/mrp-suggestions/{id}/accept` - Accept suggestion
- `POST /v1/mrp-suggestions/{id}/reject` - Reject suggestion
- `PUT /v1/mrp-suggestions/{id}` - Update suggestion
- `POST /v1/mrp-suggestions/{id}/convert-to-po` - Convert to PO
- `POST /v1/mrp-suggestions/{id}/convert-to-wo` - Convert to WO
- `POST /v1/mrp-suggestions/{id}/convert-to-sc-wo` - Convert to Subcontractor WO
- `POST /v1/mrp-suggestions/bulk-accept` - Bulk accept
- `POST /v1/mrp-suggestions/bulk-reject` - Bulk reject
- `GET /v1/mrp/shortage-report` - Shortage report
- `GET /v1/mrp/statistics` - Statistics

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useMRP.ts` | API Hook | TanStack Query hooks |
| `src/types/mrp.ts` | Types | MRP interfaces |
| `src/pages/manufacturing/mrp/index.vue` | Page | MRP dashboard |
| `src/pages/manufacturing/mrp/runs/index.vue` | Page | MRP run list |
| `src/pages/manufacturing/mrp/runs/[id].vue` | Page | MRP run detail |
| `src/pages/manufacturing/mrp/shortage.vue` | Page | Shortage report |
| `src/components/mrp/MRPRunForm.vue` | Component | MRP run config |
| `src/components/mrp/SuggestionsTable.vue` | Component | Suggestions with actions |
| `src/components/mrp/DemandsTable.vue` | Component | Demands breakdown |
| `src/components/mrp/ConvertModal.vue` | Component | Convert suggestion modal |

---

## Phase 8: Subcontracting

**Goal:** Outsourced manufacturing management.

### 8.1 Subcontractor Work Orders

**API Endpoints:**
- `GET /v1/subcontractor-work-orders` - List
- `POST /v1/subcontractor-work-orders` - Create
- `GET /v1/subcontractor-work-orders/{id}` - Get details
- `PUT /v1/subcontractor-work-orders/{id}` - Update
- `DELETE /v1/subcontractor-work-orders/{id}` - Delete
- `POST /v1/subcontractor-work-orders/{id}/assign` - Assign subcontractor
- `POST /v1/subcontractor-work-orders/{id}/start` - Start
- `POST /v1/subcontractor-work-orders/{id}/update-progress` - Update progress
- `POST /v1/subcontractor-work-orders/{id}/complete` - Complete
- `POST /v1/subcontractor-work-orders/{id}/cancel` - Cancel
- `POST /v1/subcontractor-work-orders/{id}/invoices` - Create invoice
- `GET /v1/subcontractor-work-orders/{id}/invoices` - Get invoices
- `GET /v1/subcontractors` - List subcontractors
- `GET /v1/subcontractor-work-orders-statistics` - Statistics

### 8.2 Subcontractor Invoices

**API Endpoints:**
- `GET /v1/subcontractor-invoices` - List
- `GET /v1/subcontractor-invoices/{id}` - Get details
- `PUT /v1/subcontractor-invoices/{id}` - Update
- `POST /v1/subcontractor-invoices/{id}/approve` - Approve
- `POST /v1/subcontractor-invoices/{id}/reject` - Reject
- `POST /v1/subcontractor-invoices/{id}/convert-to-bill` - Convert to Bill

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useSubcontracting.ts` | API Hook | TanStack Query hooks |
| `src/types/subcontracting.ts` | Types | Subcontractor interfaces |
| `src/pages/manufacturing/subcontracting/index.vue` | Page | Subcontractor WO list |
| `src/pages/manufacturing/subcontracting/[id].vue` | Page | WO detail |
| `src/pages/manufacturing/subcontracting/invoices.vue` | Page | Invoice list |
| `src/components/subcontracting/SCWorkOrderForm.vue` | Component | Work order form |
| `src/components/subcontracting/SCInvoiceTable.vue` | Component | Invoice management |

---

## Phase 9: Bank & Reconciliation

**Goal:** Bank transaction management and reconciliation.

### 9.1 Bank Transactions & Reconciliation

**API Endpoints:**
- `GET /v1/bank-transactions` - List transactions
- `POST /v1/bank-transactions` - Create transaction
- `GET /v1/bank-transactions/summary` - Summary
- `POST /v1/bank-transactions/bulk-reconcile` - Bulk reconcile
- `GET /v1/bank-transactions/{id}` - Get details
- `DELETE /v1/bank-transactions/{id}` - Delete
- `POST /v1/bank-transactions/{id}/match-payment/{payment}` - Match to payment
- `POST /v1/bank-transactions/{id}/unmatch` - Unmatch
- `POST /v1/bank-transactions/{id}/reconcile` - Reconcile
- `GET /v1/bank-transactions/{id}/suggest-matches` - Suggest matches

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useBankReconciliation.ts` | API Hook | TanStack Query hooks |
| `src/types/bank-reconciliation.ts` | Types | BankTransaction interfaces |
| `src/pages/banking/reconciliation/index.vue` | Page | Reconciliation dashboard |
| `src/pages/banking/reconciliation/[accountId].vue` | Page | Account reconciliation |
| `src/components/banking/TransactionList.vue` | Component | Transaction table |
| `src/components/banking/MatchingPanel.vue` | Component | Side-by-side matching |
| `src/components/banking/ReconcileSummary.vue` | Component | Reconciliation summary |
| `src/components/banking/ImportTransactionsModal.vue` | Component | Import bank statement |

---

## Phase 10: Reports & Exports

**Goal:** Comprehensive financial reporting and export functionality.

### 10.1 Missing Reports

**API Endpoints:**
- `GET /v1/reports/tax-invoice-list` - Tax invoice list
- `GET /v1/reports/input-tax-list` - Input tax list
- `GET /v1/reports/project-profitability` - Project profitability
- `GET /v1/reports/project-cost-analysis` - Project cost analysis
- `GET /v1/reports/work-order-costs` - Work order costs
- `GET /v1/reports/cost-variance` - Cost variance
- `GET /v1/reports/subcontractor-summary` - Subcontractor summary
- `GET /v1/reports/subcontractor-retention` - Subcontractor retention
- `GET /v1/reports/changes-in-equity` - Changes in equity
- `GET /v1/reports/accounts/{account}/bank-reconciliation` - Bank recon report
- `GET /v1/reports/accounts/{account}/bank-reconciliation/outstanding` - Outstanding
- `GET /v1/reports/cogs-summary` - COGS summary
- `GET /v1/reports/cogs-by-product` - COGS by product
- `GET /v1/reports/cogs-by-category` - COGS by category
- `GET /v1/reports/cogs-monthly-trend` - COGS trend
- `GET /v1/reports/products/{product}/cogs` - Product COGS

### 10.2 Export Endpoints

**API Endpoints:**
- `GET /v1/export/trial-balance` - Export trial balance
- `GET /v1/export/balance-sheet` - Export balance sheet
- `GET /v1/export/income-statement` - Export income statement
- `GET /v1/export/general-ledger` - Export general ledger
- `GET /v1/export/receivable-aging` - Export receivable aging
- `GET /v1/export/payable-aging` - Export payable aging
- `GET /v1/export/invoices` - Export invoices
- `GET /v1/export/bills` - Export bills
- `GET /v1/export/tax-report` - Export tax report

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| Extended `src/api/useReports.ts` | API Hook | Add missing report hooks |
| `src/api/useExports.ts` | API Hook | Export functionality |
| `src/pages/reports/tax/index.vue` | Page | Tax reports dashboard |
| `src/pages/reports/projects/index.vue` | Page | Project reports |
| `src/pages/reports/manufacturing/index.vue` | Page | Manufacturing reports |
| `src/pages/reports/cogs/index.vue` | Page | COGS reports |
| `src/components/reports/ExportButton.vue` | Component | Reusable export button |
| `src/composables/useExportDownload.ts` | Composable | Blob download helper |

---

## Phase 11: Administration

**Goal:** System administration features - roles, permissions, attachments.

### 11.1 Roles & Permissions

**API Endpoints:**
- `GET /v1/roles` - List roles
- `POST /v1/roles` - Create role
- `GET /v1/roles/{id}` - Get role
- `PUT /v1/roles/{id}` - Update role
- `DELETE /v1/roles/{id}` - Delete role
- `POST /v1/roles/{id}/sync-permissions` - Sync permissions
- `GET /v1/roles/{id}/users` - Get role users
- `GET /v1/permissions` - List permissions
- `GET /v1/permissions/grouped` - Grouped permissions
- `GET /v1/permissions/groups` - Permission groups

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useRoles.ts` | API Hook | TanStack Query hooks |
| `src/types/role.ts` | Types | Role, Permission interfaces |
| `src/pages/settings/roles/index.vue` | Page | Role list |
| `src/pages/settings/roles/create.vue` | Page | Create role |
| `src/pages/settings/roles/[id].vue` | Page | Edit role + permissions |
| `src/components/roles/RoleForm.vue` | Component | Role form |
| `src/components/roles/PermissionMatrix.vue` | Component | Permission checkboxes |

---

### 11.2 Attachments

**API Endpoints:**
- `GET /v1/attachments` - List attachments
- `POST /v1/attachments` - Upload attachment
- `GET /v1/attachments/categories` - Categories
- `GET /v1/attachments/{id}` - Get details
- `DELETE /v1/attachments/{id}` - Delete
- `GET /v1/attachments/{id}/download` - Download
- `GET /v1/attachments/for/{type}/{id}` - Get for entity

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useAttachments.ts` | API Hook | TanStack Query hooks |
| `src/types/attachment.ts` | Types | Attachment interfaces |
| `src/components/attachments/AttachmentList.vue` | Component | Reusable attachment list |
| `src/components/attachments/AttachmentUpload.vue` | Component | Drag-drop upload |
| `src/components/attachments/AttachmentPreview.vue` | Component | Preview modal |
| `src/composables/useAttachments.ts` | Composable | Entity attachment helpers |

---

### 11.3 Miscellaneous

**API Endpoints:**
- `GET /v1/features` - Feature flags
- `GET /v1/dashboard/profit-loss` - P&L widget
- `GET /v1/contacts/{id}/balances` - Contact balances
- `GET /v1/contacts/{id}/credit-status` - Credit status

**Frontend Deliverables:**
| Task | Type | Description |
|------|------|-------------|
| `src/api/useFeatures.ts` | API Hook | Feature flag hooks |
| `src/composables/useFeatureFlags.ts` | Composable | Feature gating helper |
| Extended contact detail page | Page | Add balances & credit |
| `src/components/dashboard/ProfitLossWidget.vue` | Component | P&L chart widget |

---

## Implementation Guidelines

### File Naming Conventions
- API hooks: `use{Resource}.ts` (e.g., `useAccounts.ts`)
- Types: `{resource}.ts` (e.g., `account.ts`)
- Pages: `{resource}/index.vue`, `{resource}/[id].vue`
- Components: `{Resource}{Purpose}.vue` (e.g., `AccountForm.vue`)

### Code Patterns
1. **API Hooks**: Use TanStack Query factory pattern (see existing hooks)
2. **Forms**: Use VeeValidate + Zod for validation
3. **Tables**: Use existing DataTable component pattern
4. **Modals**: Use Radix Dialog via Modal component
5. **Filters**: Use FilterBar + FilterGroup components

### Testing Checklist per Feature
- [ ] API hook returns correct data shape
- [ ] List page shows data with pagination
- [ ] Create form validates and submits
- [ ] Edit form pre-fills and updates
- [ ] Delete confirms and removes
- [ ] Workflow actions update status
- [ ] Error states handled gracefully
- [ ] Loading states shown appropriately

---

## Estimated Effort

| Phase | Components | Pages | API Hooks | Estimated Complexity |
|-------|------------|-------|-----------|---------------------|
| 1 | 10 | 7 | 3 | Medium |
| 2 | 12 | 10 | 3 | High |
| 3 | 15 | 12 | 4 | High |
| 4 | 8 | 3 | 1 | Medium |
| 5 | 10 | 8 | 3 | Medium |
| 6 | 6 | 4 | 2 | Low |
| 7 | 15 | 10 | 3 | High |
| 8 | 6 | 4 | 1 | Medium |
| 9 | 6 | 3 | 1 | Medium |
| 10 | 5 | 5 | 2 | Low |
| 11 | 10 | 5 | 3 | Medium |

---

## Completion Summary

All 11 phases have been implemented as of February 2025. Key deliverables:

- **47 API hook files** covering all endpoints
- **173 page components** across all modules
- **76 total components** including shared document patterns
- **8 domain services** with strategy pattern
- **6 infrastructure modules** (DI, events, logging, feature flags, etc.)
- **65 test files** covering services, infrastructure, composables, and UI components

### Remaining Items

| Feature | Phase | Status |
|---------|-------|--------|
| Project profitability reports | 10 | Not started |
| Manufacturing cost reports | 10 | Not started |
| Subcontractor summary reports | 10 | Not started |
| COGS reports | 10 | Not started |
| Changes in equity report | 10 | Not started |

