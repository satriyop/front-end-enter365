# ADR 0004: Shadcn-Vue Inspired Design System

## Status

**Accepted**

## Date

2024-10-01

## Context

We need a UI component system for Enter365 that:
- Provides consistent styling across 50+ pages
- Is accessible (WCAG compliant)
- Works well with Tailwind CSS
- Is customizable for our brand (orange primary color)
- Doesn't lock us into a specific design

### Options Considered

1. **Shadcn-Vue inspired (Radix Vue + Custom styling)**
2. **Vuetify**
3. **PrimeVue**
4. **Element Plus**
5. **Build from scratch**

## Decision

We chose a **Shadcn-Vue inspired approach**: Radix Vue headless primitives with custom Tailwind styling.

## Rationale

### Comparison

| Factor | Shadcn-Vue Style | Vuetify | PrimeVue |
|--------|------------------|---------|----------|
| Customization | Full control | Limited | Limited |
| Bundle size | Small (only used components) | Large | Medium |
| Accessibility | Radix handles it | Good | Good |
| Learning curve | Moderate | Low | Low |
| Tailwind integration | Native | Awkward | Awkward |

### Why Not Pre-built Libraries

**Vuetify/PrimeVue issues:**
- Opinionated styling hard to override
- Fighting CSS specificity
- Large bundle with unused components
- Design doesn't match our brand

**Our approach advantages:**
- Own the code (no black box)
- Full Tailwind integration
- Only include what we use
- Exact styling we want

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT ARCHITECTURE                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Radix Vue (Headless)                                            │
│  └── Handles accessibility, keyboard navigation, ARIA           │
│      └── No styling, just behavior                               │
│                                                                  │
│  Our Components (src/components/ui/)                             │
│  └── Wrap Radix primitives                                       │
│      └── Add Tailwind styling                                    │
│          └── Use CSS variables for theming                       │
│                                                                  │
│  Result: Accessible + Custom + Maintainable                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Example: Button Component

```vue
<!-- src/components/ui/Button.vue -->
<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface Props extends VariantProps<typeof buttonVariants> {
  as?: 'button' | 'router-link' | 'a'
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})
</script>

<template>
  <component
    :is="as"
    :to="to"
    :class="cn(buttonVariants({ variant, size }), $attrs.class)"
  >
    <slot />
  </component>
</template>
```

### Design Token System

```css
/* CSS Variables for theming */
:root {
  --primary: 32 95% 44%;           /* Orange */
  --primary-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;        /* Red */
  --success: 120 75% 40%;          /* Green */
  --warning: 38 92% 50%;           /* Amber */
  --muted-foreground: 215 20% 65%;
  --border: 210 40% 96%;
  --radius: 0.5rem;
}
```

## Consequences

### Positive

- Full control over styling
- Smaller bundle (tree-shakeable)
- Accessible by default (Radix)
- Native Tailwind integration
- Easy to customize brand colors
- Own the code

### Negative

- More initial setup work
- Need to build each component
- Less "out of the box" features
- Team needs to understand the architecture

### Mitigations

- Document all components in [UI-COMPONENTS.md](../../components/UI-COMPONENTS.md)
- Create consistent patterns
- Use CVA for variant management
- Leverage Radix for complex behaviors (dropdowns, modals)

## Implementation Notes

### Radix Vue Primitives Used

| Component | Radix Primitive |
|-----------|-----------------|
| Select | `SelectRoot`, `SelectTrigger`, `SelectContent` |
| Modal | `DialogRoot`, `DialogContent`, `DialogOverlay` |
| Dropdown | `DropdownMenuRoot`, `DropdownMenuContent` |
| Tabs | `TabsRoot`, `TabsList`, `TabsContent` |
| Checkbox | `CheckboxRoot`, `CheckboxIndicator` |

### CVA (Class Variance Authority)

Used for managing component variants:
```typescript
const buttonVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', destructive: '...' },
    size: { sm: '...', default: '...' },
  },
})
```

## References

- [Radix Vue](https://radix-vue.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Class Variance Authority](https://cva.style/)
