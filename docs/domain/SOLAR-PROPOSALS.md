# Solar Proposals

> Solar system sizing, calculations, and financial projections

## Overview

Solar proposals are pre-sales documents that calculate:
- System sizing (kWp capacity)
- Energy production (kWh/year)
- Financial projections (savings, payback, ROI)
- Environmental impact (CO2 offset)

---

## Data Model

```
SolarProposal
├── Site Information
│   ├── site_name, site_address
│   ├── province, city
│   ├── latitude, longitude
│   ├── roof_area_m2
│   ├── roof_type (flat, tilt)
│   ├── roof_orientation (North, South, etc.)
│   └── shading_percentage
│
├── Electricity Profile
│   ├── monthly_consumption_kwh
│   ├── pln_tariff_category
│   ├── electricity_rate (Rp/kWh)
│   └── tariff_escalation_percent
│
├── Solar Data (from location lookup)
│   ├── peak_sun_hours
│   ├── solar_irradiance
│   └── performance_ratio
│
├── System Selection
│   ├── variant_group_id
│   ├── selected_bom_id
│   └── system_capacity_kwp
│
└── Calculated Values
    ├── annual_energy_production_kwh
    ├── energy_offset_percent
    ├── first_year_savings
    ├── lifetime_savings
    ├── payback_years
    └── roi_percent
```

---

## Wizard Steps

### Step 1: Site Information

| Field | Type | Description |
|-------|------|-------------|
| `site_name` | string | Project name |
| `site_address` | string | Full address |
| `province` | string | Indonesian province |
| `city` | string | City |
| `latitude` | float | GPS latitude |
| `longitude` | float | GPS longitude |
| `roof_area_m2` | float | Available roof space |
| `roof_type` | enum | flat, tilt |
| `roof_orientation` | enum | N, NE, E, SE, S, SW, W, NW |
| `shading_percentage` | float | 0-100% |

### Step 2: Electricity Profile

| Field | Type | Description |
|-------|------|-------------|
| `monthly_consumption_kwh` | float | Average monthly usage |
| `pln_tariff_category` | string | e.g., "R-1/TR 1300" |
| `electricity_rate` | float | Rp per kWh |
| `tariff_escalation_percent` | float | Annual rate increase (default 3%) |

### Step 3: System Selection

Select from pre-configured BOM variant groups:

```
Variant Group: "Standard Rooftop Systems"
├── 3.3 kWp System - Rp 45,000,000
├── 5.5 kWp System - Rp 72,000,000
├── 8.8 kWp System - Rp 110,000,000
└── 11 kWp System - Rp 135,000,000
```

### Step 4: Review & Finalize

Review calculated projections and add terms.

---

## Key Calculations

### Annual Energy Production

```typescript
// From useSolarSettings.ts
const annualProduction =
  systemCapacityKwp *
  peakSunHours *
  365 *
  performanceRatio *
  (1 - shadingFactor)
```

### Energy Offset

```typescript
const energyOffset = (annualProduction / annualConsumption) * 100

// Display format
formatSolarOffset(85)   // { value: '85%', label: 'Kebutuhan Tercukupi' }
formatSolarOffset(250)  // { value: '2.5x', label: 'Surplus Energi' }
```

### First Year Savings

```typescript
const firstYearSavings = Math.min(annualProduction, annualConsumption) * electricityRate
```

### Payback Period

```typescript
const paybackYears = totalSystemCost / firstYearSavings
```

### 25-Year Lifetime Savings

```typescript
// Accounts for tariff escalation
let lifetimeSavings = 0
let currentRate = electricityRate

for (let year = 1; year <= 25; year++) {
  const production = annualProduction * (1 - (year - 1) * degradationRate)
  const savings = Math.min(production, annualConsumption) * currentRate
  lifetimeSavings += savings
  currentRate *= (1 + tariffEscalation)
}
```

---

## Related Components

| Component | Path | Purpose |
|-----------|------|---------|
| `SolarProposalWizard.vue` | `src/pages/solar-proposals/` | Multi-step creation |
| `SolarSettingsPanel.vue` | `src/components/solar/` | Global defaults |
| `CapacityCalculatorModal.vue` | `src/components/solar/` | System sizing |
| `BatteryConfigurator.vue` | `src/components/solar/` | Battery add-on |
| `FinancingCalculator.vue` | `src/components/solar/` | Loan projections |
| `WhatIfScenarios.vue` | `src/components/solar/` | Parameter modeling |

---

## Related Composables

| Composable | Purpose |
|------------|---------|
| `useSolarSettings.ts` | Global/per-proposal settings |
| `useBatteryCalculator.ts` | Battery sizing logic |
| `useFinancingCalculator.ts` | Loan payment projections |
| `useScenarioCalculator.ts` | What-if modeling |

---

## API Hooks

```typescript
import {
  useSolarProposals,         // List with filters
  useSolarProposal,          // Single proposal
  useCreateSolarProposal,    // Create
  useUpdateSolarProposal,    // Update
  useCalculateSolarData,     // Get solar data for location
  usePlnTariffs,             // Get PLN tariff options
  useSolarProposalStats,     // Statistics
} from '@/api/useSolarProposals'
```

---

## Status Flow

```
draft ──▶ sent ──▶ accepted ──▶ converted (to quotation)
            │
            ├──▶ rejected
            │
            └──▶ expired
```

| Status | Description |
|--------|-------------|
| `draft` | Being created/edited |
| `sent` | Sent to customer |
| `accepted` | Customer accepted |
| `rejected` | Customer rejected |
| `expired` | Validity period passed |
| `converted` | Converted to quotation |

---

## Public Sharing

Proposals can be shared via public URL:

```
https://app.enter365.com/p/{token}
```

Features:
- No authentication required
- View financial analysis
- Accept/reject proposal
- Download PDF

---

## Battery Configuration

Optional battery storage analysis:

| Field | Description |
|-------|-------------|
| `battery_capacity_kwh` | Battery size |
| `depth_of_discharge` | Usable capacity (%) |
| `battery_cycles` | Expected lifecycle |
| `battery_cost` | Additional cost |

### Battery Calculation

```typescript
// From useBatteryCalculator.ts
const recommendedCapacity = dailyExcessProduction * autonomyDays / depthOfDischarge
const batteryROI = calculateBatteryPayback(capacity, cost, savedExport)
```

---

## Financing Options

| Option | Description |
|--------|-------------|
| Cash | Full payment upfront |
| Loan | Bank financing |
| Lease | Monthly rental |

### Loan Calculation

```typescript
// From useFinancingCalculator.ts
const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months))
                     / (Math.pow(1 + monthlyRate, months) - 1)
```

---

## Environmental Impact

| Metric | Calculation |
|--------|-------------|
| CO2 Offset | `annualProduction * 0.7` kg/year |
| Trees Equivalent | `co2Offset / 21` trees/year |

---

## Related Documentation

- [INVENTORY.md](INVENTORY.md) - BOM and variant groups
- [QUOTATION-WORKFLOW.md](QUOTATION-WORKFLOW.md) - Converting to quotation
- [GLOSSARY.md](GLOSSARY.md) - PLN tariff categories
