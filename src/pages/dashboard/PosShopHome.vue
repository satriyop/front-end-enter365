<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { closePosSession, fetchPosShopHome, type PosShopHome } from '@/api/usePos'
import { getErrorMessage } from '@/api/client'
import { formatCurrency } from '@/utils/format'
import { Card, Badge, Button } from '@/components/ui'
import {
  isShopCaughtUp,
  isStaleOpenSession,
  sessionAgeLabel,
  shopAttentionItems,
  shopContinueLink,
  shopLastSaleCard,
  shopOmzetCard,
} from './shopHome'

type OpenSession = PosShopHome['open_sessions'][number]

const queryClient = useQueryClient()
const { data: home, isLoading } = useQuery({
  queryKey: ['pos', 'shop-home'],
  queryFn: fetchPosShopHome,
})

const pendingClose = ref<OpenSession | null>(null)
const closing = ref(false)
const closeError = ref('')

function askClose(session: OpenSession): void {
  pendingClose.value = session
  closeError.value = ''
}

async function confirmClose(): Promise<void> {
  const session = pendingClose.value
  if (!session || closing.value) {
    return
  }
  closing.value = true
  closeError.value = ''
  try {
    await closePosSession(session.id, session.booked_cash_amount)
    pendingClose.value = null
    await queryClient.invalidateQueries({ queryKey: ['pos', 'shop-home'] })
  } catch (error) {
    closeError.value = getErrorMessage(error, 'Gagal menutup sesi.')
  } finally {
    closing.value = false
  }
}

const attention = computed(() => (home.value ? shopAttentionItems(home.value) : []))
const caughtUp = computed(() => (home.value ? isShopCaughtUp(home.value) : false))

const continueLink = computed(() => (home.value ? shopContinueLink(home.value) : null))

const stats = computed(() => {
  const shop = home.value
  const open = shop?.open_sessions[0]
  const tillLabel = shop && shop.open_sessions.length > 1
    ? `${shop.open_sessions.length} sesi`
    : (open?.session_number ?? 'Tidak ada')
  const omzet = shop ? shopOmzetCard(shop) : { label: 'Omzet hari ini', value: formatCurrency(0), hint: '0 struk' }
  const last = shop ? shopLastSaleCard(shop) : { value: '—', hint: 'Belum ada penjualan' }

  return [
    {
      label: 'Sesi kasir',
      value: tillLabel,
      hint: open ? `${open.cashier_name} · ${sessionAgeLabel(open.opened_at)}`.replace(/ · $/, '') : 'Belum ada yang buka',
      icon: '🖥️',
    },
    {
      label: omzet.label,
      value: omzet.value,
      hint: omzet.hint,
      icon: '💰',
    },
    {
      label: 'Struk terakhir',
      value: last.value,
      hint: last.hint,
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
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Toko</h2>
        </template>
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div v-else class="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <div v-if="home?.open_sessions.length" class="space-y-2">
            <div
              v-for="session in home.open_sessions"
              :key="session.id"
              class="flex flex-wrap items-center gap-2 font-medium text-slate-900 dark:text-slate-100"
            >
              <span>
                {{ session.cashier_name }} ({{ session.session_number }})
                <span class="font-normal text-slate-500">{{ sessionAgeLabel(session.opened_at) }}</span>
              </span>
              <button
                v-if="isStaleOpenSession(session.opened_at)"
                type="button"
                class="text-sm font-semibold text-red-700 dark:text-red-400 hover:underline"
                data-testid="dasbor-tutup-sesi"
                @click="askClose(session)"
              >
                Tutup sesi kemarin
              </button>
            </div>
          </div>
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
          <RouterLink
            v-if="continueLink"
            :to="continueLink.to"
            class="inline-block text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {{ continueLink.label }} →
          </RouterLink>
          <div
            v-if="pendingClose"
            class="mt-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 space-y-2"
            data-testid="dasbor-tutup-confirm"
          >
            <p class="text-slate-800 dark:text-slate-100">
              Tutup {{ pendingClose.session_number }} atas nama {{ pendingClose.cashier_name }}?
              Kas dihitung sesuai pembukuan {{ formatCurrency(pendingClose.booked_cash_amount) }}.
              <span v-if="pendingClose.hold_count > 0">{{ pendingClose.hold_count }} pesanan tertahan akan dihapus.</span>
            </p>
            <p v-if="closeError" class="text-red-700 dark:text-red-400">{{ closeError }}</p>
            <div class="flex gap-2">
              <Button type="button" variant="ghost" :disabled="closing" @click="pendingClose = null">Batal</Button>
              <Button type="button" variant="destructive" :disabled="closing" data-testid="dasbor-tutup-confirm-yes" @click="confirmClose">
                Tutup sesi
              </Button>
            </div>
          </div>
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
