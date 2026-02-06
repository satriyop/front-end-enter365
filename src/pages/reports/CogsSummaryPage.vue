<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <Button
        variant="ghost"
        size="sm"
        @click="router.push('/reports')"
        class="mb-4"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Reports
      </Button>
      <h1 class="text-3xl font-bold text-foreground">COGS Summary</h1>
      <p class="text-muted-foreground">Ringkasan Harga Pokok Penjualan</p>
    </div>

    <!-- Date Range Filter -->
    <Card class="p-4">
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              Start Date
            </label>
            <Input
              v-model="startDate"
              type="date"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              End Date
            </label>
            <Input
              v-model="endDate"
              type="date"
              class="w-full"
            />
          </div>
        </div>

        <!-- Quick Date Buttons -->
        <div class="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="setThisMonth"
          >
            This Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="setThisQuarter"
          >
            This Quarter
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="setThisYear"
          >
            This Year
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="setLastMonth"
          >
            Last Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="setLastQuarter"
          >
            Last Quarter
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="setLastYear"
          >
            Last Year
          </Button>
        </div>
      </div>
    </Card>

    <!-- Loading State -->
    <Card v-if="isLoading" class="p-8">
      <div class="text-center text-muted-foreground">
        Loading report...
      </div>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error" class="p-8">
      <div class="text-center text-destructive">
        Error loading report: {{ error.message }}
      </div>
    </Card>

    <!-- Report Content -->
    <Card v-else-if="data" class="p-6">
      <!-- Report Header -->
      <div class="text-center mb-8 border-b border-border pb-4">
        <h2 class="text-2xl font-bold text-foreground">{{ data.report_name }}</h2>
        <p class="text-muted-foreground mt-2">
          Period: {{ formatDate(data.period.start) }} - {{ formatDate(data.period.end) }}
        </p>
      </div>

      <!-- Financial Statement Layout -->
      <div class="space-y-3">
        <!-- Beginning Inventory -->
        <div class="flex justify-between items-center py-2">
          <span class="text-foreground">Beginning Inventory</span>
          <span class="font-mono text-foreground">{{ formatCurrency(data.beginning_inventory) }}</span>
        </div>

        <!-- Purchases -->
        <div class="flex justify-between items-center py-2 pl-4">
          <span class="text-foreground">(+) Purchases</span>
          <span class="font-mono text-foreground">{{ formatCurrency(data.purchases) }}</span>
        </div>

        <!-- Divider -->
        <div class="border-t border-border my-2"></div>

        <!-- Goods Available for Sale -->
        <div class="flex justify-between items-center py-2 font-semibold">
          <span class="text-foreground">Goods Available for Sale</span>
          <span class="font-mono text-foreground">{{ formatCurrency(data.goods_available) }}</span>
        </div>

        <!-- Ending Inventory -->
        <div class="flex justify-between items-center py-2 pl-4">
          <span class="text-foreground">(-) Ending Inventory</span>
          <span class="font-mono text-foreground">{{ formatCurrency(data.ending_inventory) }}</span>
        </div>

        <!-- Double Divider -->
        <div class="border-t-2 border-double border-border my-2"></div>

        <!-- Cost of Goods Sold (Highlighted) -->
        <div class="flex justify-between items-center py-3 px-4 bg-slate-100 dark:bg-slate-800 rounded-md">
          <span class="text-lg font-bold text-foreground">Cost of Goods Sold</span>
          <span class="text-lg font-bold font-mono text-foreground">{{ formatCurrency(data.cogs) }}</span>
        </div>

        <!-- Comparison Section -->
        <div class="mt-8 pt-6 border-t border-border space-y-3">
          <h3 class="font-semibold text-foreground mb-4">Verification</h3>

          <!-- COGS from Movements -->
          <div class="flex justify-between items-center py-2">
            <span class="text-muted-foreground">COGS from Movements</span>
            <span class="font-mono text-muted-foreground">{{ formatCurrency(data.cogs_from_movements) }}</span>
          </div>

          <!-- Difference -->
          <div class="flex justify-between items-center py-2 font-semibold">
            <span class="text-foreground">Difference</span>
            <span
              :class="[
                'font-mono',
                difference === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              ]"
            >
              {{ formatCurrency(difference) }}
            </span>
          </div>

          <!-- Difference Note -->
          <p
            v-if="difference !== 0"
            class="text-sm text-muted-foreground mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md"
          >
            Note: A non-zero difference may indicate discrepancies between inventory movements and financial records.
            Please review your inventory transactions and journal entries.
          </p>
          <p
            v-else
            class="text-sm text-muted-foreground mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md"
          >
            Inventory movements match financial records.
          </p>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCogsSummary } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

// Date range state
const startDate = ref('')
const endDate = ref('')

// Initialize with current year
const now = new Date()
const currentYear = now.getFullYear()
startDate.value = `${currentYear}-01-01`
endDate.value = `${currentYear}-12-31`

// Computed refs for API
const startDateRef = computed(() => startDate.value)
const endDateRef = computed(() => endDate.value)

// Fetch data
const { data, isLoading, error } = useCogsSummary(startDateRef, endDateRef)

// Computed difference
const difference = computed(() => {
  if (!data.value) return 0
  return data.value.cogs - data.value.cogs_from_movements
})

// Date formatting helper
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Quick date range functions
function setThisMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
  startDate.value = `${year}-${month}-01`
  endDate.value = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
}

function setThisQuarter() {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  const year = now.getFullYear()
  const startMonth = String(quarter * 3 + 1).padStart(2, '0')
  const endMonth = String((quarter + 1) * 3).padStart(2, '0')
  const lastDay = new Date(year, (quarter + 1) * 3, 0).getDate()
  startDate.value = `${year}-${startMonth}-01`
  endDate.value = `${year}-${endMonth}-${String(lastDay).padStart(2, '0')}`
}

function setThisYear() {
  const year = new Date().getFullYear()
  startDate.value = `${year}-01-01`
  endDate.value = `${year}-12-31`
}

function setLastMonth() {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const year = lastMonth.getFullYear()
  const month = String(lastMonth.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(year, lastMonth.getMonth() + 1, 0).getDate()
  startDate.value = `${year}-${month}-01`
  endDate.value = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
}

function setLastQuarter() {
  const now = new Date()
  const currentQuarter = Math.floor(now.getMonth() / 3)
  const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1
  const year = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const startMonth = String(lastQuarter * 3 + 1).padStart(2, '0')
  const endMonth = String((lastQuarter + 1) * 3).padStart(2, '0')
  const lastDay = new Date(year, (lastQuarter + 1) * 3, 0).getDate()
  startDate.value = `${year}-${startMonth}-01`
  endDate.value = `${year}-${endMonth}-${String(lastDay).padStart(2, '0')}`
}

function setLastYear() {
  const year = new Date().getFullYear() - 1
  startDate.value = `${year}-01-01`
  endDate.value = `${year}-12-31`
}
</script>
