# Glossary

> Indonesian EPC terminology and industry terms

## Solar Industry Terms

| Term | Indonesian | Description |
|------|------------|-------------|
| **kWp** | Kilowatt peak | Peak power output of solar system |
| **kWh** | Kilowatt hour | Unit of energy |
| **PSH** | Peak Sun Hours | Hours of peak sunlight per day |
| **Irradiance** | Iradiasi | Solar radiation intensity (W/m²) |
| **Performance Ratio** | Rasio Performa | Efficiency factor (typically 0.75-0.85) |
| **Degradation** | Degradasi | Annual panel efficiency loss (~0.5%/year) |
| **Payback Period** | Periode Pengembalian | Time to recoup investment |
| **ROI** | Return on Investment | Investment return percentage |

---

## PLN Tariff Categories

**PLN** (Perusahaan Listrik Negara) is Indonesia's state electricity company.

### Residential (R)

| Category | Power Limit | Typical Rate |
|----------|-------------|--------------|
| R-1/TR 450 | 450 VA | Subsidized |
| R-1/TR 900 | 900 VA | Subsidized |
| R-1/TR 1300 | 1,300 VA | Rp 1,444/kWh |
| R-1/TR 2200 | 2,200 VA | Rp 1,444/kWh |
| R-2/TR | 3,500-5,500 VA | Rp 1,444/kWh |
| R-3/TR | 6,600+ VA | Rp 1,444/kWh |

### Business (B)

| Category | Power Limit | Typical Rate |
|----------|-------------|--------------|
| B-1/TR | ≤ 200 kVA | Varies |
| B-2/TR | > 200 kVA | Varies |
| B-3/TM | Medium voltage | Varies |

### Industry (I)

| Category | Description |
|----------|-------------|
| I-1/TR | Small industry |
| I-2/TM | Medium industry |
| I-3/TM | Large industry |
| I-4/TT | Extra large industry |

---

## EPC Terms

**EPC** = Engineering, Procurement, Construction

| Term | Description |
|------|-------------|
| **Site Survey** | Pre-installation assessment |
| **Roof Assessment** | Structural evaluation |
| **String Design** | Panel wiring configuration |
| **Commissioning** | System activation and testing |
| **Grid Tie** | Connection to PLN grid |
| **Net Metering** | Export excess to grid |

---

## BOM Terms

| Term | Description |
|------|-------------|
| **BOM** | Bill of Materials |
| **SKU** | Stock Keeping Unit |
| **Unit Cost** | Per-item purchase price |
| **Waste %** | Material waste allowance |
| **Margin %** | Profit margin |
| **Line Total** | Quantity × Unit Cost × (1 + Waste%) |

---

## Document Status Terms

### Quotation Status

| Status | Indonesian | Description |
|--------|------------|-------------|
| draft | Draf | Being created |
| submitted | Diajukan | Awaiting approval |
| approved | Disetujui | Approved for invoicing |
| rejected | Ditolak | Declined |

### Invoice Status

| Status | Indonesian | Description |
|--------|------------|-------------|
| draft | Draf | Being created |
| posted | Terposting | Finalized, sent |
| paid | Lunas | Fully paid |
| void | Batal | Cancelled |

### Solar Proposal Status

| Status | Indonesian | Description |
|--------|------------|-------------|
| draft | Draf | Being created |
| sent | Terkirim | Sent to customer |
| accepted | Diterima | Customer accepted |
| rejected | Ditolak | Customer rejected |
| expired | Kadaluarsa | Validity passed |
| converted | Dikonversi | Converted to quotation |

---

## Financial Terms

| Term | Indonesian | Description |
|------|------------|-------------|
| **Subtotal** | Subtotal | Sum before tax |
| **PPN** | Pajak Pertambahan Nilai | VAT (11%) |
| **Grand Total** | Total Akhir | Final amount |
| **DP** | Down Payment / Uang Muka | Initial payment |
| **Piutang** | Receivables | Money owed to us |
| **Hutang** | Payables | Money we owe |

---

## Date/Time Formatting

### Indonesian Format

| Type | Format | Example |
|------|--------|---------|
| Date | DD MMM YYYY | 15 Jan 2024 |
| DateTime | DD MMM YYYY HH:mm | 15 Jan 2024 14:30 |
| Relative | X waktu lalu | 2 jam lalu |

### Months (Indonesian)

| English | Indonesian |
|---------|------------|
| January | Januari |
| February | Februari |
| March | Maret |
| April | April |
| May | Mei |
| June | Juni |
| July | Juli |
| August | Agustus |
| September | September |
| October | Oktober |
| November | November |
| December | Desember |

---

## Currency Formatting

### Indonesian Rupiah (IDR)

| Value | Format |
|-------|--------|
| 1,500,000 | Rp 1.500.000 |
| 1,500,000,000 | Rp 1,5 miliar |
| 1,500,000 (compact) | Rp 1,5 jt |

```typescript
// src/utils/format.ts
formatCurrency(1500000)         // "Rp 1.500.000"
formatCurrencyCompact(1500000)  // "Rp 1,5 jt"
```

---

## Product Categories

| Category | Indonesian | Examples |
|----------|------------|----------|
| Solar Panel | Panel Surya | Jinko, LONGi, Canadian Solar |
| Inverter | Inverter | Huawei, Growatt, SMA |
| Mounting | Mounting | Rail, Clamp, Bracket |
| Cable | Kabel | DC Cable, AC Cable |
| Accessory | Aksesoris | MC4, Junction Box |
| Labor | Jasa | Installation, Commissioning |

---

## Roof Types

| Type | Indonesian | Description |
|------|------------|-------------|
| Flat | Datar | Flat concrete roof |
| Tilt | Miring | Sloped tile roof |
| Metal | Metal | Corrugated metal |

---

## Roof Orientations

| Direction | Indonesian | Solar Efficiency |
|-----------|------------|------------------|
| North | Utara | Best (in Indonesia) |
| South | Selatan | Good |
| East | Timur | Moderate |
| West | Barat | Moderate |

---

## Related Documentation

- [SOLAR-PROPOSALS.md](SOLAR-PROPOSALS.md) - Solar calculations
- [QUOTATION-WORKFLOW.md](QUOTATION-WORKFLOW.md) - Sales process
- [INVENTORY.md](INVENTORY.md) - Products and BOMs
