# Data Display

> Tables, cards, pagination, and data visualization

## DataTable

### Import

```typescript
import { DataTable } from '@/components/ui'
```

### Basic Usage

```vue
<script setup lang="ts">
import { DataTable } from '@/components/ui'

interface Quotation {
  id: number
  quotation_number: string
  contact: { company_name: string }
  grand_total: number
  status: string
}

const columns = [
  { key: 'quotation_number', label: 'Number' },
  { key: 'contact.company_name', label: 'Customer' },
  { key: 'grand_total', label: 'Total', align: 'right' },
  { key: 'status', label: 'Status' },
]

const { data, isLoading } = useQuotations(filters)
const rows = computed(() => data.value?.data ?? [])
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="rows"
    :loading="isLoading"
  />
</template>
```

### With Custom Cells

```vue
<template>
  <DataTable :columns="columns" :rows="rows">
    <!-- Custom cell for total -->
    <template #cell-grand_total="{ row }">
      {{ formatCurrency(row.grand_total) }}
    </template>

    <!-- Custom cell for status -->
    <template #cell-status="{ row }">
      <Badge :status="row.status">
        {{ row.status }}
      </Badge>
    </template>

    <!-- Actions column -->
    <template #cell-actions="{ row }">
      <div class="flex gap-1">
        <Button variant="ghost" size="icon-sm" @click="handleView(row)">
          <Eye class="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" @click="handleEdit(row)">
          <Edit class="w-4 h-4" />
        </Button>
      </div>
    </template>
  </DataTable>
</template>
```

### Column Definition

```typescript
interface Column {
  key: string          // Data key (supports dot notation)
  label: string        // Header label
  align?: 'left' | 'center' | 'right'
  sortable?: boolean   // Enable sorting
  width?: string       // Column width
}

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'actions', label: '', width: '100px' },
]
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | Column[] | `[]` | Column definitions |
| `rows` | any[] | `[]` | Data rows |
| `loading` | boolean | `false` | Loading state |
| `emptyText` | string | `'No data'` | Empty state text |

---

## Pagination

### Import

```typescript
import { Pagination } from '@/components/ui'
```

### Usage

```vue
<script setup lang="ts">
const filters = ref({ page: 1, per_page: 10 })
const { data } = useQuotations(filters)

const pagination = computed(() => data.value?.meta)

function changePage(page: number) {
  filters.value.page = page
}
</script>

<template>
  <Card :padding="false">
    <DataTable :rows="data?.data ?? []" :columns="columns" />

    <div class="p-4 border-t border-border">
      <Pagination
        v-if="pagination"
        :current-page="pagination.current_page"
        :total-pages="pagination.last_page"
        :total-items="pagination.total"
        :per-page="pagination.per_page"
        @change="changePage"
      />
    </div>
  </Card>
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | number | `1` | Current page |
| `totalPages` | number | `1` | Total pages |
| `totalItems` | number | `0` | Total items |
| `perPage` | number | `10` | Items per page |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `number` | New page number |

---

## StatCard

### Import

```typescript
import { StatCard } from '@/components/ui'
```

### Usage

```vue
<script setup lang="ts">
import { StatCard } from '@/components/ui'
import { DollarSign, FileText, TrendingUp } from 'lucide-vue-next'
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <StatCard
      :icon="DollarSign"
      label="Revenue"
      :value="formatCurrency(stats.revenue)"
      :trend="{ value: 12.5, isPositive: true }"
    />

    <StatCard
      :icon="FileText"
      label="Quotations"
      :value="stats.quotations"
      description="This month"
    />

    <StatCard
      :icon="TrendingUp"
      label="Conversion Rate"
      :value="`${stats.conversionRate}%`"
      :trend="{ value: 3.2, isPositive: true }"
    />
  </div>
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | Component | - | Lucide icon |
| `label` | string | - | Stat label |
| `value` | string/number | - | Stat value |
| `description` | string | - | Additional text |
| `trend` | object | - | `{ value: number, isPositive: boolean }` |

---

## FilterBar & FilterGroup

### Import

```typescript
import { FilterBar, FilterGroup, Input, Select } from '@/components/ui'
```

### Usage

```vue
<template>
  <FilterBar class="mb-6">
    <!-- Search (grows to fill) -->
    <FilterGroup grow>
      <Input v-model="filters.search" placeholder="Search..." />
    </FilterGroup>

    <!-- Status filter (fixed width) -->
    <FilterGroup min-width="150px">
      <Select v-model="filters.status" :options="statusOptions" />
    </FilterGroup>

    <!-- Date filter -->
    <FilterGroup min-width="140px">
      <Input v-model="filters.date" type="date" />
    </FilterGroup>
  </FilterBar>
</template>
```

### FilterGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `grow` | boolean | `false` | Flex grow |
| `minWidth` | string | - | Minimum width |

---

## EmptyState

### Import

```typescript
import { EmptyState } from '@/components/ui'
```

### Usage

```vue
<script setup lang="ts">
import { EmptyState, Button } from '@/components/ui'
import { FileText, Plus } from 'lucide-vue-next'
</script>

<template>
  <EmptyState
    v-if="rows.length === 0"
    :icon="FileText"
    title="No quotations found"
    description="Get started by creating your first quotation."
  >
    <Button as="router-link" to="/quotations/new">
      <Plus class="w-4 h-4 mr-2" />
      Create Quotation
    </Button>
  </EmptyState>
</template>
```

---

## Complete List Page Pattern

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuotations } from '@/api/useQuotations'
import {
  Button, Card, DataTable, Pagination,
  FilterBar, FilterGroup, Input, Select,
  Badge, EmptyState, LoadingSkeleton
} from '@/components/ui'
import { Plus, Eye, Edit, FileText } from 'lucide-vue-next'
import { formatCurrency, formatDate } from '@/utils/format'

// Filters
const filters = ref({
  page: 1,
  per_page: 10,
  search: '',
  status: '',
})

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
]

// Query
const { data, isLoading, error } = useQuotations(filters)
const rows = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

// Columns
const columns = [
  { key: 'quotation_number', label: 'Number' },
  { key: 'contact.company_name', label: 'Customer' },
  { key: 'grand_total', label: 'Total', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Date' },
  { key: 'actions', label: '', width: '100px' },
]

function changePage(page: number) {
  filters.value.page = page
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Quotations</h1>
        <p class="text-muted-foreground">Manage your quotations</p>
      </div>
      <Button as="router-link" to="/quotations/new">
        <Plus class="w-4 h-4 mr-2" />
        Create
      </Button>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input v-model="filters.search" placeholder="Search..." />
      </FilterGroup>
      <FilterGroup min-width="150px">
        <Select v-model="filters.status" :options="statusOptions" />
      </FilterGroup>
    </FilterBar>

    <!-- Content -->
    <LoadingSkeleton v-if="isLoading" />

    <Card v-else :padding="false">
      <EmptyState
        v-if="rows.length === 0"
        :icon="FileText"
        title="No quotations"
        description="Create your first quotation."
      />

      <template v-else>
        <DataTable :columns="columns" :rows="rows">
          <template #cell-grand_total="{ row }">
            {{ formatCurrency(row.grand_total) }}
          </template>

          <template #cell-status="{ row }">
            <Badge :status="row.status">{{ row.status }}</Badge>
          </template>

          <template #cell-created_at="{ row }">
            {{ formatDate(row.created_at) }}
          </template>

          <template #cell-actions="{ row }">
            <div class="flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                as="router-link"
                :to="`/quotations/${row.id}`"
              >
                <Eye class="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                as="router-link"
                :to="`/quotations/${row.id}/edit`"
              >
                <Edit class="w-4 h-4" />
              </Button>
            </div>
          </template>
        </DataTable>

        <div class="p-4 border-t border-border">
          <Pagination
            :current-page="pagination.current_page"
            :total-pages="pagination.last_page"
            @change="changePage"
          />
        </div>
      </template>
    </Card>
  </div>
</template>
```

---

## Related Documentation

- [UI-COMPONENTS.md](UI-COMPONENTS.md) - Component reference
- [LAYOUTS.md](LAYOUTS.md) - Page layouts
- [HOOKS-PATTERN.md](../api/HOOKS-PATTERN.md) - Data fetching
