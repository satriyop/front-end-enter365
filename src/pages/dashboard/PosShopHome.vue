<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchPosShopHome } from '@/api/usePos'
import { formatCurrency } from '@/utils/format'
import { Card, Badge } from '@/components/ui'
import { isShopCaughtUp, shopAttentionItems } from './shopHome'

const { data: home, isLoading } = useQuery({
  queryKey: ['pos', 'shop-home'],
  queryFn: fetchPosShopHome,
})

const attention = computed(() => (home.value ? shopAttentionItems(home.value) : []))
const caughtUp = computed(() => (home.value ? isShopCaughtUp(home.value) : false))

const stats = computed(() => {
  const shop = home.value
  const open = shop?.open_sessions[0]
  const tillLabel = shop && shop.open_sessions.length > 1
    ? `${shop.open_sessions.length} sesi`
    : (open?.session_number ?? 'Tidak ada')

  return [
    {
      label: 'Sesi kasir',
      value: tillLabel,
      hint: open ? open.cashier_name : 'Belum ada yang buka',
      icon: '🖥️',
    },
    {
      label: 'Omzet hari ini',
      value: formatCurrency(shop?.today.omzet_amount ?? 0),
      hint: `${shop?.today.sale_count ?? 0} struk`,
      icon: '💰',
    },
    {
      label: 'Struk terakhir',
      value: shop?.today.last_sale_number ?? '—',
      hint: shop?.today.last_sold_at ? new Date(shop.today.last_sold_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Belum ada penjualan',
      icon: '🧾',
    },
    {
      label: 'Pastry menipis',
      value: String(shop?.low_stock.length ?? 0),
      hint: shop?.low_stock[0] ? shop.low_stock[0].name : 'Semua aman',
      icon: '🍞',
    },
  ]
})
</script>

<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
      >
        <div class="flex items-center gap-3 mb-3">
          <span class="text-2xl">{{ stat.icon }}</span>
          <span class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ stat.label }}</span>
        </div>
        <div v-if="isLoading" class="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <template v-else>
          <div class="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {{ stat.value }}
          </div>
          <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {{ stat.hint }}
          </div>
        </template>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card class="lg:col-span-2">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Toko hari ini</h2>
        </template>
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div v-else class="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <p v-if="home?.open_sessions.length">
            Kasir buka:
            <span
              v-for="session in home.open_sessions"
              :key="session.id"
              class="font-medium text-slate-900 dark:text-slate-100 mr-2"
            >
              {{ session.cashier_name }} ({{ session.session_number }})
            </span>
          </p>
          <p v-else>Tidak ada sesi kasir yang terbuka.</p>
          <p v-if="home?.low_stock.length">
            Perlu restok:
            <span
              v-for="row in home.low_stock"
              :key="row.product_id"
              class="mr-2 text-slate-900 dark:text-slate-100"
            >
              {{ row.name }} ({{ row.quantity }})
            </span>
          </p>
          <RouterLink to="/kasir" class="inline-block text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Buka kasir →
          </RouterLink>
        </div>
      </Card>

      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Perlu perhatian</h2>
            <Badge v-if="attention.length > 0" variant="destructive">{{ attention.length }}</Badge>
          </div>
        </template>
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div v-else-if="caughtUp" class="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
          Semua beres
        </div>
        <div v-else class="space-y-3">
          <RouterLink
            v-for="item in attention"
            :key="item.label"
            :to="item.link"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            :class="{
              'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800': item.type === 'warning',
              'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800': item.type === 'destructive',
            }"
          >
            <span
              class="font-medium"
              :class="{
                'text-orange-700 dark:text-orange-400': item.type === 'warning',
                'text-red-700 dark:text-red-400': item.type === 'destructive',
              }"
            >
              {{ item.label }}
            </span>
            <Badge :variant="item.type === 'warning' ? 'warning' : 'destructive'">
              {{ item.count }}
            </Badge>
          </RouterLink>
        </div>
      </Card>
    </div>
  </div>
</template>
