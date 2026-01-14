# Design Tokens

> CSS variables, colors, typography, and spacing

## Color Palette

### Semantic Colors (Use These)

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `bg-background` | `--background` | Page background |
| `bg-card` | `--card` | Card backgrounds |
| `text-foreground` | `--foreground` | Primary text |
| `text-muted-foreground` | `--muted-foreground` | Secondary text |
| `border-border` | `--border` | Borders |
| `bg-primary` | `--primary` | Primary actions (orange) |
| `bg-destructive` | `--destructive` | Danger/delete (red) |
| `bg-success` | `--success` | Success states (green) |
| `bg-warning` | `--warning` | Warning states (amber) |

### CSS Variable Definitions

```css
/* src/styles/style.css */
:root {
  /* Backgrounds */
  --background: 0 0% 100%;
  --foreground: 222 84% 5%;

  /* Card */
  --card: 0 0% 100%;
  --card-foreground: 222 84% 5%;

  /* Primary (Orange) */
  --primary: 32 95% 44%;
  --primary-foreground: 0 0% 100%;

  /* Secondary */
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;

  /* Muted */
  --muted: 210 40% 96%;
  --muted-foreground: 215 20% 65%;

  /* Accent */
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;

  /* Destructive (Red) */
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  /* Success (Green) */
  --success: 120 75% 40%;
  --success-foreground: 0 0% 100%;

  /* Warning (Amber) */
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;

  /* Info (Blue) */
  --info: 200 100% 50%;
  --info-foreground: 0 0% 100%;

  /* Border & Input */
  --border: 210 40% 96%;
  --input: 210 40% 96%;
  --ring: 32 95% 44%;

  /* Radius */
  --radius: 0.5rem;
}
```

---

## Typography

### Font Stack

```css
/* Primary font */
font-family: 'Inter', system-ui, -apple-system, sans-serif;

/* Monospace (code) */
font-family: 'JetBrains Mono', monospace;
```

### Text Sizes

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Labels, badges |
| `text-sm` | 14px | Secondary text, table cells |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Subtitles |
| `text-xl` | 20px | Section headers |
| `text-2xl` | 24px | Page titles |
| `text-3xl` | 30px | Hero text |

### Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, buttons |
| `font-semibold` | 600 | Headings |
| `font-bold` | 700 | Emphasis |

### Text Colors

```vue
<!-- Primary text -->
<p class="text-foreground">Main content</p>

<!-- Secondary text -->
<p class="text-muted-foreground">Description, hints</p>

<!-- Accent colors -->
<p class="text-primary">Links, highlights</p>
<p class="text-destructive">Errors, warnings</p>
<p class="text-success">Success messages</p>
```

---

## Spacing

### Spacing Scale

| Class | Size | Usage |
|-------|------|-------|
| `p-1` / `m-1` | 4px | Tiny gaps |
| `p-2` / `m-2` | 8px | Tight spacing |
| `p-3` / `m-3` | 12px | Compact |
| `p-4` / `m-4` | 16px | Default |
| `p-6` / `m-6` | 24px | Comfortable |
| `p-8` / `m-8` | 32px | Spacious |

### Common Patterns

```vue
<!-- Page content -->
<div class="p-6">Content</div>

<!-- Card padding -->
<Card class="p-4">Content</Card>

<!-- Section gap -->
<div class="space-y-6">
  <Section1 />
  <Section2 />
</div>

<!-- Horizontal gap -->
<div class="flex gap-4">
  <Item1 />
  <Item2 />
</div>

<!-- Bottom margin -->
<h1 class="mb-6">Title</h1>
```

---

## Border Radius

| Class | Size | Usage |
|-------|------|-------|
| `rounded-sm` | 2px | Subtle |
| `rounded` | 4px | Default |
| `rounded-md` | 6px | Cards, buttons |
| `rounded-lg` | 8px | Modals |
| `rounded-xl` | 12px | Large cards |
| `rounded-full` | 50% | Avatars, pills |

---

## Shadows

| Class | Usage |
|-------|-------|
| `shadow-sm` | Subtle elevation |
| `shadow` | Cards, dropdowns |
| `shadow-md` | Modals |
| `shadow-lg` | Popovers |

---

## Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

```vue
<!-- Responsive example -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

---

## Z-Index Scale

| Class | Value | Usage |
|-------|-------|-------|
| `z-10` | 10 | Sticky headers |
| `z-20` | 20 | Dropdowns |
| `z-30` | 30 | Fixed elements |
| `z-40` | 40 | Modals |
| `z-50` | 50 | Toasts |

---

## Usage Examples

### Card with Header

```vue
<Card class="p-6">
  <h2 class="text-lg font-semibold mb-4">Card Title</h2>
  <p class="text-muted-foreground">Card description here.</p>
</Card>
```

### Status Badge

```vue
<Badge status="approved">Approved</Badge>
<Badge status="draft">Draft</Badge>
<Badge status="rejected">Rejected</Badge>
```

### Form Field

```vue
<FormField label="Email" :error="errors.email">
  <Input v-model="form.email" type="email" />
</FormField>
```

---

## DO NOT

```vue
<!-- DON'T: Hardcode colors -->
<div class="bg-white text-slate-500 border-slate-200">Bad</div>

<!-- DO: Use semantic tokens -->
<div class="bg-card text-muted-foreground border-border">Good</div>
```

---

## Related Documentation

- [UI-COMPONENTS.md](UI-COMPONENTS.md) - Component usage
- [LAYOUTS.md](LAYOUTS.md) - Page layout patterns
