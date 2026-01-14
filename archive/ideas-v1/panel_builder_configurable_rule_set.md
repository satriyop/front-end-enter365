# Panel Builder - Configurable Rule Sets & BOM Templates

## Overview

Two interconnected features for NEX (Solar EPC) and Vahana (Panel Maker):
1. **Equivalent Specs Validator** - Validate component swaps against configurable rules
2. **BOM Template Library** - Reusable panel configurations

---

## Problem Statement

### Current Gap in Component Swapping

When swapping brands, the system trusts that all products mapped to the same ComponentStandard are equivalent. In reality:

```
ComponentStandard: "MCB 1P 16A C-Curve"
├── Schneider A9F74116 → 6kA breaking capacity
├── ABB S201-C16     → 10kA breaking capacity  ← Actually BETTER
└── Chint NB1-63     → 4.5kA breaking capacity ← Actually WORSE
```

**Risk**: Swapping Schneider → Chint saves money but **downgrades** breaking capacity from 6kA to 4.5kA. This could be unsafe for certain applications.

---

## Solution: Configurable Rule Sets

Instead of hardcoded validation, allow admins to define rule sets per application context.

### Database Schema

```sql
-- Rule Sets (configurable by admin)
CREATE TABLE spec_validation_rule_sets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,        -- 'standard', 'solar_epc', 'industrial'
    name VARCHAR(100) NOT NULL,              -- 'Solar EPC (NEX)'
    description TEXT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL
);

-- Rules within each set
CREATE TABLE spec_validation_rules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rule_set_id BIGINT UNSIGNED NOT NULL,
    category VARCHAR(50) NOT NULL,           -- 'circuit_breaker', 'cable'
    spec_key VARCHAR(50) NOT NULL,           -- 'breaking_capacity_ka'
    validation_type ENUM(
        'warn_if_lower',      -- Warn if new value < original
        'warn_if_higher',     -- Warn if new value > original
        'must_match',         -- Values must be equal
        'min_value',          -- Must be >= threshold
        'max_value'           -- Must be <= threshold
    ) NOT NULL,
    threshold_value DECIMAL(10,2) NULL,      -- For min_value/max_value
    severity ENUM('warning', 'error') DEFAULT 'warning',
    message TEXT NULL,                       -- Custom message
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (rule_set_id) REFERENCES spec_validation_rule_sets(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    UNIQUE KEY unique_rule (rule_set_id, category, spec_key)
);

-- BOM can optionally specify which rule set to use
ALTER TABLE boms ADD COLUMN spec_rule_set_id BIGINT UNSIGNED NULL;
ALTER TABLE boms ADD FOREIGN KEY (spec_rule_set_id) REFERENCES spec_validation_rule_sets(id);

-- Store actual product specs for validation
-- (variant_specs field already exists on component_brand_mappings)
```

### Example Rule Sets

```
Rule Sets:
├── "Standard" (default)
│   └── circuit_breaker.breaking_capacity_ka: warn_if_lower
│
├── "Solar EPC (NEX)"
│   ├── circuit_breaker.breaking_capacity_ka: min_value 6kA
│   ├── circuit_breaker.poles: must_match
│   └── cable.conductor_size_mm2: warn_if_lower
│
└── "Industrial Panel (Vahana)"
    ├── circuit_breaker.breaking_capacity_ka: min_value 10kA
    ├── contactor.ac_category: must_match
    ├── contactor.coil_voltage: must_match
    └── busbar.current_rating_a: warn_if_lower
```

---

## User Experience

### 1. Admin Configuration (Settings > Spec Validation Rules)

```
┌─────────────────────────────────────────────────────────────┐
│ Spec Validation Rules                                       │
├─────────────────────────────────────────────────────────────┤
│ Rule Set: [Solar EPC (NEX) ▼]  [+ New Rule Set]            │
├─────────────────────────────────────────────────────────────┤
│ Category          │ Spec                │ Rule      │ Value │
│ circuit_breaker   │ breaking_capacity   │ min_value │ 6 kA  │
│ circuit_breaker   │ poles               │ must_match│ -     │
│ cable             │ conductor_size      │ warn_lower│ -     │
│ contactor         │ coil_voltage        │ must_match│ -     │
│                                          [+ Add Rule]       │
└─────────────────────────────────────────────────────────────┘
```

### 2. During BOM Creation

```
Name: Panel Distribusi Gedung A
Product: [Select...]
Rule Set: [Solar EPC (NEX) ▼]  ← Optional, defaults to company default
```

### 3. During Swap (validation kicks in)

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Spec Validation Warning                                  │
├─────────────────────────────────────────────────────────────┤
│ Swapping to Chint NB1-63 has potential issues:             │
│                                                             │
│ ⚠️ Breaking Capacity: 6kA → 4.5kA                          │
│    Rule: Minimum 6kA required for Solar EPC                │
│    Status: BELOW MINIMUM                                    │
│                                                             │
│ ✓ Poles: 1P → 1P (matches)                                 │
│ ✓ Curve: C → C (matches)                                   │
│                                                             │
│ [Cancel] [Find Compliant Alternative] [Override & Proceed] │
└─────────────────────────────────────────────────────────────┘
```

---

## BOM Template Library

### Concept

Save a BOM structure (items without specific quantities) as a reusable template. When creating a new panel quote, start from a template.

### Use Cases

| Template | Description |
|----------|-------------|
| Standard 3-Phase DB | Main breaker, SPD, busbars, 12 MCB slots |
| Solar Inverter Panel | DC breakers, surge protection, inverter connections |
| Motor Control Center | Contactors, thermal relays, pilot lights |
| Lighting Panel | Single-phase, smaller breakers |

### Database Schema

```sql
CREATE TABLE bom_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(50) NULL,           -- 'distribution', 'motor_control', 'solar'
    thumbnail_path VARCHAR(255) NULL,    -- Optional image
    default_rule_set_id BIGINT UNSIGNED NULL,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,

    FOREIGN KEY (default_rule_set_id) REFERENCES spec_validation_rule_sets(id)
);

CREATE TABLE bom_template_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_id BIGINT UNSIGNED NOT NULL,
    type ENUM('material', 'labor', 'overhead') DEFAULT 'material',
    component_standard_id BIGINT UNSIGNED NULL,  -- Preferred: use standard
    product_id BIGINT UNSIGNED NULL,             -- Optional: specific product
    description VARCHAR(255) NOT NULL,
    default_quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'pcs',
    is_required BOOLEAN DEFAULT TRUE,
    is_quantity_variable BOOLEAN DEFAULT FALSE,  -- User can change qty
    sort_order INT DEFAULT 0,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (template_id) REFERENCES bom_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (component_standard_id) REFERENCES component_standards(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### User Experience

#### Template List (Settings > BOM Templates)

```
┌─────────────────────────────────────────────────────────────┐
│ BOM Templates                            [+ New Template]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ Standard 3-Phase DB                             │
│ │  [IMG]  │ Main breaker, SPD, busbars, 12 MCB slots       │
│ │         │ 15 items • Used 47 times • Solar EPC rules     │
│ └─────────┘ [Edit] [Duplicate] [Delete]                     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ Motor Control Center                            │
│ │  [IMG]  │ Contactors, thermal relays, pilot lights       │
│ │         │ 8 items • Used 12 times • Industrial rules     │
│ └─────────┘ [Edit] [Duplicate] [Delete]                     │
└─────────────────────────────────────────────────────────────┘
```

#### Creating BOM from Template

```
┌─────────────────────────────────────────────────────────────┐
│ Create New BOM                                              │
├─────────────────────────────────────────────────────────────┤
│ Start from: ○ Blank  ● Template                            │
│                                                             │
│ Select Template:                                            │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [✓] Standard 3-Phase DB                                 ││
│ │     15 items • Solar EPC rules                          ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ [ ] Motor Control Center                                ││
│ │     8 items • Industrial rules                          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [Cancel]                              [Create from Template]│
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

| Phase | Feature | Effort | Files |
|-------|---------|--------|-------|
| 1 | Rule Set Schema & Models | 1 day | Migrations, Models |
| 2 | Rule Set CRUD API | 1 day | Controller, FormRequest, Resource |
| 3 | Validation Service | 1 day | SpecValidationService |
| 4 | Integrate into Swap | 0.5 day | Update ComponentCrossReferenceService |
| 5 | Admin UI for Rules | 1 day | Vue pages |
| 6 | BOM Template Schema | 0.5 day | Migrations, Models |
| 7 | BOM Template CRUD | 1 day | Controller, API |
| 8 | Template UI | 1 day | Vue pages |
| 9 | Create BOM from Template | 0.5 day | BomService update |

**Total Estimate**: ~8 days

---

## API Endpoints

### Rule Sets

```
GET    /api/v1/spec-rule-sets                    - List all rule sets
POST   /api/v1/spec-rule-sets                    - Create rule set
GET    /api/v1/spec-rule-sets/{id}               - Get with rules
PUT    /api/v1/spec-rule-sets/{id}               - Update
DELETE /api/v1/spec-rule-sets/{id}               - Delete
POST   /api/v1/spec-rule-sets/{id}/rules         - Add rule
PUT    /api/v1/spec-rule-sets/{id}/rules/{ruleId} - Update rule
DELETE /api/v1/spec-rule-sets/{id}/rules/{ruleId} - Delete rule
```

### BOM Templates

```
GET    /api/v1/bom-templates                     - List templates
POST   /api/v1/bom-templates                     - Create template
GET    /api/v1/bom-templates/{id}                - Get with items
PUT    /api/v1/bom-templates/{id}                - Update
DELETE /api/v1/bom-templates/{id}                - Delete
POST   /api/v1/bom-templates/{id}/items          - Add item
PUT    /api/v1/bom-templates/{id}/items/{itemId} - Update item
DELETE /api/v1/bom-templates/{id}/items/{itemId} - Delete item
POST   /api/v1/boms/from-template                - Create BOM from template
```

### Validation

```
POST   /api/v1/validate-swap                     - Validate a swap against rules
GET    /api/v1/boms/{id}/validate-all            - Validate all items in BOM
```

---

## Benefits

| Benefit | NEX (Solar EPC) | Vahana (Panel Maker) |
|---------|-----------------|----------------------|
| **Safety Compliance** | Ensure solar installations meet standards | Industrial panels meet specs |
| **Faster Quotations** | Start from proven templates | Reuse common panel configs |
| **Reduced Errors** | System catches spec downgrades | Automatic validation |
| **Multi-tenant Ready** | Own rule sets per company | Own templates per company |
| **Audit Trail** | Track who approved overrides | Compliance documentation |

---

## Future Enhancements

1. **Template Versioning** - Track changes to templates over time
2. **Template Sharing** - Share templates between companies
3. **Rule Import/Export** - Backup and restore rule sets
4. **Compliance Certificates** - Generate compliance docs based on rules
5. **AI Rule Suggestions** - Suggest rules based on industry standards
