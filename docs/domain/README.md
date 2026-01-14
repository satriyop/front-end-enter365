# Domain Knowledge

> Business logic and domain concepts for Enter365

## Overview

Enter365 is a **Solar ERP system** for Indonesian solar installation companies. It manages the complete business cycle from sales to installation.

---

## Business Domains

```
┌─────────────────────────────────────────────────────────────────┐
│                      ENTER365 DOMAINS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   SALES     │───▶│  INVENTORY  │───▶│  PROJECTS   │          │
│  │             │    │             │    │             │          │
│  │ Quotations  │    │ Products    │    │ Projects    │          │
│  │ Invoices    │    │ BOMs        │    │ Work Orders │          │
│  │ Contacts    │    │ Stock       │    │             │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            ▼                                     │
│                   ┌─────────────┐                                │
│                   │   SOLAR     │                                │
│                   │  PROPOSALS  │                                │
│                   │             │                                │
│                   │ Calculations│                                │
│                   │ Financing   │                                │
│                   │ BOM Variants│                                │
│                   └─────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
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

### Sales

| Entity | Description |
|--------|-------------|
| **Contact** | Customer or supplier |
| **Quotation** | Sales proposal with line items |
| **Invoice** | Bill to customer |
| **Payment** | Payment received/made |

### Inventory

| Entity | Description |
|--------|-------------|
| **Product** | Item in catalog (materials, labor) |
| **BOM** | Bill of Materials (recipe for a system) |
| **Stock** | Inventory levels by location |
| **Variant Group** | Pre-configured BOM options |

### Projects

| Entity | Description |
|--------|-------------|
| **Project** | Installation project |
| **Work Order** | Task to be performed |

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
                │
                └──▶ Project ──▶ Work Order
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
