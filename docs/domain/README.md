# Domain Knowledge

> Business logic and domain concepts for Enter365

## Overview

Enter365 is a **Solar ERP system** for Indonesian solar installation companies. It manages the complete business cycle from sales to installation.

---

## Business Domains

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ENTER365 DOMAINS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐            │
│  │ ACCOUNTING  │    │   SALES     │───▶│  PURCHASING  │            │
│  │             │    │             │    │              │            │
│  │ Accounts    │    │ Quotations  │    │ Purchase Ord │            │
│  │ Journal Ent │    │ Invoices    │    │ GRNs         │            │
│  │ Fiscal Per  │    │ Delivery Ord│    │ Bills        │            │
│  │ Budgets     │    │ Sales Ret   │    │ Purch Return │            │
│  │ Bank Recon  │    │ Contacts    │    │ Payments     │            │
│  └──────┬──────┘    └──────┬──────┘    └──────────────┘            │
│         │                  │                                        │
│         │           ┌──────┴──────┐    ┌──────────────┐            │
│         │           │  INVENTORY  │───▶│MANUFACTURING │            │
│         │           │             │    │              │            │
│         │           │ Products    │    │ Work Orders  │            │
│         │           │ BOMs        │    │ Material Req │            │
│         │           │ Warehouses  │    │ MRP          │            │
│         │           │ Stock Opname│    │ Subcontract  │            │
│         │           └──────┬──────┘    └──────────────┘            │
│         │                  │                                        │
│         │           ┌──────┴──────┐    ┌──────────────┐            │
│         └──────────▶│  PROJECTS   │    │    SOLAR     │            │
│                     │             │    │  PROPOSALS   │            │
│                     │ Tasks       │    │              │            │
│                     │ Costs       │    │ Calculations │            │
│                     │ Revenue     │    │ Financing    │            │
│                     └─────────────┘    └──────────────┘            │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐                                │
│  │   FINANCE   │    │   REPORTS   │                                │
│  │             │    │             │                                │
│  │ Down Paymts │    │ Balance Sht │                                │
│  │ Reminders   │    │ Income Stmt │                                │
│  │ Recurring   │    │ Cash Flow   │                                │
│  └─────────────┘    └─────────────┘                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Domain Documentation

| Domain | Description | Documentation |
|--------|-------------|---------------|
| **Solar Proposals** | Solar system sizing, calculations, financing | [SOLAR-PROPOSALS.md](SOLAR-PROPOSALS.md) |
| **Sales Workflow** | Quote → Invoice → Payment | [QUOTATION-WORKFLOW.md](QUOTATION-WORKFLOW.md) |
| **Inventory** | Products, BOMs, stock management | [INVENTORY.md](INVENTORY.md) |
| **Terminology** | Indonesian EPC terms | [GLOSSARY.md](GLOSSARY.md) |

---

## Key Entities

### Accounting

| Entity | Description |
|--------|-------------|
| **Account** | Chart of accounts entry (asset, liability, equity, revenue, expense) |
| **Journal Entry** | Double-entry bookkeeping record |
| **Fiscal Period** | Accounting period (open, locked, closed) |
| **Budget** | Budget plan with line items per account |
| **Bank Transaction** | Bank statement line for reconciliation |
| **Recurring Template** | Auto-generate recurring documents |

### Sales

| Entity | Description |
|--------|-------------|
| **Contact** | Customer or supplier |
| **Quotation** | Sales proposal with line items |
| **Invoice** | Bill to customer (multi-currency supported) |
| **Delivery Order** | Shipment tracking document |
| **Sales Return** | Customer return document |
| **Payment** | Payment received/made |

### Purchasing

| Entity | Description |
|--------|-------------|
| **Purchase Order** | Order to vendor with approval workflow |
| **Goods Receipt Note** | Receiving document for PO items |
| **Bill** | Vendor invoice (multi-currency supported) |
| **Purchase Return** | Return goods to vendor |

### Finance

| Entity | Description |
|--------|-------------|
| **Down Payment** | Advance payment (applies to invoices/bills) |
| **Payment Reminder** | Overdue payment notification |

### Inventory

| Entity | Description |
|--------|-------------|
| **Product** | Item in catalog (materials, labor) |
| **BOM** | Bill of Materials (recipe for a system) |
| **Stock** | Inventory levels by location |
| **Stock Opname** | Physical inventory counting |
| **Warehouse** | Storage location |
| **Variant Group** | Pre-configured BOM options |

### Manufacturing

| Entity | Description |
|--------|-------------|
| **Work Order** | Manufacturing task with material tracking |
| **Material Requisition** | Request materials for production |
| **MRP Run** | Material Requirements Planning analysis |
| **Subcontractor WO** | Outsourced manufacturing task |

### Projects

| Entity | Description |
|--------|-------------|
| **Project** | Installation project with tasks, costs, revenue |
| **Project Task** | Task within a project |
| **Project Cost** | Cost entry for a project |
| **Project Revenue** | Revenue entry for a project |

### Solar

| Entity | Description |
|--------|-------------|
| **Solar Proposal** | Pre-sales document with calculations |
| **Solar Data** | Location-based solar metrics |
| **PLN Tariff** | Indonesian electricity rates |

---

## Common Workflows

### Sales Flow

```
Contact ──▶ Quotation ──▶ Invoice ──▶ Payment
                │              │
                │              ├──▶ Delivery Order
                │              ├──▶ Sales Return
                │              └──▶ Recurring Template
                │
                └──▶ Project ──▶ Work Order ──▶ Material Requisition
```

### Purchase Flow

```
Purchase Order ──▶ Goods Receipt Note
       │                    │
       └──▶ Bill ──▶ Payment
              │
              └──▶ Purchase Return
```

### Accounting Flow

```
Invoice/Bill ──▶ Journal Entry ──▶ Account Ledger
                                        │
Payment ──▶ Bank Transaction ──▶ Bank Reconciliation
                                        │
                              Fiscal Period Close
```

### Solar Proposal Flow

```
Create Proposal
    │
    ├─▶ Enter Site Information
    │     (location, roof, shading)
    │
    ├─▶ Enter Electricity Profile
    │     (consumption, PLN tariff)
    │
    ├─▶ Select System (BOM Variant)
    │     (auto-calculates production)
    │
    ├─▶ Review Financial Analysis
    │     (payback, ROI, savings)
    │
    └─▶ Send to Customer
          (public link or PDF)
```

---

## Indonesian Context

### Currency

All monetary values in **Indonesian Rupiah (IDR)**:
- Format: `Rp 1.500.000` (dot as thousand separator)
- No decimal places (rounded to integer)

### Electricity Provider

**PLN (Perusahaan Listrik Negara)** - State electricity company:
- Tariff categories: R-1/TR, R-2/TR, B-1/TR, etc.
- Rate escalation: ~3% annually

### Solar Data

Location-based values for Indonesia:
- Peak Sun Hours (PSH): 4-5 hours/day
- Solar Irradiance: varies by region
- Performance Ratio: typically 0.75-0.85

---

## Related Documentation

- [SOLAR-PROPOSALS.md](SOLAR-PROPOSALS.md) - Solar calculation details
- [QUOTATION-WORKFLOW.md](QUOTATION-WORKFLOW.md) - Sales process
- [INVENTORY.md](INVENTORY.md) - BOM and stock
- [GLOSSARY.md](GLOSSARY.md) - Terminology
