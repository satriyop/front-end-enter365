# Layouts

> Page layouts, app shell, and layout patterns

## App Layout

The main application layout (`src/layouts/AppLayout.vue`) provides:
- Sidebar navigation
- Header with user menu
- Main content area
- Breadcrumbs

```
┌─────────────────────────────────────────────────────────────────┐
│  Header (AppHeader)                                    [User]   │
├──────────────┬──────────────────────────────────────────────────┤
│              │  Breadcrumbs                                     │
│   Sidebar    ├──────────────────────────────────────────────────┤
│   (AppSide)  │                                                  │
│              │                                                  │
│   • Dashboard│               Main Content                       │
│   • Sales    │               (router-view)                      │
│   • Inventory│                                                  │
│   • Projects │                                                  │
│   • Reports  │                                                  │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## Page Layout Pattern

### Standard List Page

```vue
<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Page Title</h1>
        <p class="text-muted-foreground">Description text</p>
      </div>
      <Button>Action</Button>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input placeholder="Search..." />
      </FilterGroup>
      <FilterGroup>
        <Select :options="options" />
      </FilterGroup>
    </FilterBar>

    <!-- Content -->
    <Card :padding="false">
      <DataTable :rows="items" :columns="columns" />
      <Pagination />
    </Card>
  </div>
</template>
```

### Detail Page

```vue
<template>
  <div>
    <!-- Header with actions -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Quotation #{{ id }}</h1>
        <Badge :status="quotation.status">{{ quotation.status }}</Badge>
      </div>
      <div class="flex gap-2">
        <Button variant="outline">Edit</Button>
        <Button>Submit</Button>
      </div>
    </div>

    <!-- Content sections -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main content -->
      <div class="lg:col-span-2 space-y-6">
        <Card>
          <h2 class="text-lg font-semibold mb-4">Details</h2>
          <!-- Content -->
        </Card>

        <Card>
          <h2 class="text-lg font-semibold mb-4">Line Items</h2>
          <!-- Table -->
        </Card>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <Card>
          <h2 class="text-lg font-semibold mb-4">Summary</h2>
          <!-- Summary -->
        </Card>
      </div>
    </div>
  </div>
</template>
```

### Form Page

```vue
<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold">Create Quotation</h1>
      <p class="text-muted-foreground">Fill in the details below</p>
    </div>

    <!-- Form -->
    <Card>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Form sections -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium">General Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Contact">
              <Select />
            </FormField>
            <FormField label="Date">
              <Input type="date" />
            </FormField>
          </div>
        </div>

        <div class="space-y-4">
          <h3 class="text-lg font-medium">Line Items</h3>
          <!-- Items table -->
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" type="button">Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Card>
  </div>
</template>
```

---

## Grid Layouts

### Dashboard Stats

```vue
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <StatCard label="Revenue" :value="stats.revenue" />
  <StatCard label="Orders" :value="stats.orders" />
  <StatCard label="Customers" :value="stats.customers" />
  <StatCard label="Conversion" :value="stats.conversion" />
</div>
```

### Two Column

```vue
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <Card>Left content</Card>
  <Card>Right content</Card>
</div>
```

### Main + Sidebar (2:1)

```vue
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div class="lg:col-span-2">
    <Card>Main content</Card>
  </div>
  <div>
    <Card>Sidebar</Card>
  </div>
</div>
```

### Three Column

```vue
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card>Column 1</Card>
  <Card>Column 2</Card>
  <Card>Column 3</Card>
</div>
```

---

## Responsive Patterns

### Stack on Mobile, Side-by-Side on Desktop

```vue
<div class="flex flex-col md:flex-row gap-4">
  <div class="md:w-1/3">Sidebar</div>
  <div class="md:w-2/3">Main</div>
</div>
```

### Hide on Mobile

```vue
<div class="hidden md:block">
  Desktop only content
</div>

<div class="md:hidden">
  Mobile only content
</div>
```

---

## Card Patterns

### Card with Header

```vue
<Card>
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold">Card Title</h2>
    <Button variant="outline" size="sm">Action</Button>
  </div>
  <div>Content</div>
</Card>
```

### Card with Footer

```vue
<Card class="flex flex-col">
  <div class="flex-1">
    Content
  </div>
  <div class="pt-4 mt-4 border-t border-border">
    Footer
  </div>
</Card>
```

### Card without Padding (for tables)

```vue
<Card :padding="false">
  <div class="p-4 border-b border-border">
    <h2 class="text-lg font-semibold">Table Title</h2>
  </div>
  <DataTable :rows="items" />
  <div class="p-4 border-t border-border">
    <Pagination />
  </div>
</Card>
```

---

## Modal Layouts

### Confirmation Modal

```vue
<Modal :open="showConfirm" @close="showConfirm = false" title="Confirm Delete">
  <p>Are you sure you want to delete this item?</p>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button variant="outline" @click="showConfirm = false">
        Cancel
      </Button>
      <Button variant="destructive" @click="handleDelete">
        Delete
      </Button>
    </div>
  </template>
</Modal>
```

### Form Modal

```vue
<Modal :open="showModal" @close="showModal = false" title="Edit Item" size="lg">
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <FormField label="Name">
      <Input v-model="form.name" />
    </FormField>

    <FormField label="Description">
      <Textarea v-model="form.description" />
    </FormField>
  </form>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button variant="outline" @click="showModal = false">
        Cancel
      </Button>
      <Button @click="handleSubmit" :disabled="isPending">
        Save
      </Button>
    </div>
  </template>
</Modal>
```

---

## Spacing Guidelines

| Element | Spacing |
|---------|---------|
| Page sections | `mb-6` |
| Cards | `gap-6` |
| Form fields | `space-y-4` |
| Button groups | `gap-2` |
| Card content | `p-4` or `p-6` |
| Filter bar | `mb-6` |

---

## Related Documentation

- [UI-COMPONENTS.md](UI-COMPONENTS.md) - Component reference
- [DESIGN-TOKENS.md](DESIGN-TOKENS.md) - Spacing, colors
- [DATA-DISPLAY.md](DATA-DISPLAY.md) - Tables, pagination
