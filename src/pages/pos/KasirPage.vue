<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  checkoutPosSale,
  closePosSession,
  currentPosSession,
  getPosCatalog,
  getPosSession,
  holdPosCart,
  listPosHolds,
  listPosOutlets,
  openPosSession,
  takePosHold,
  voidPosSale,
  type PosCatalogProduct,
  type PosHold,
  type PosSale,
  type PosSession,
} from '@/api/usePos'
import { getErrorMessage } from '@/api/client'
import { bindOutletId, formatHoldClock, resolveStartWarehouse } from '@/pages/pos/tillSession'
import { tillTileMarks } from '@/pages/pos/tillMarks'
import { printTillReceipt } from '@/pages/pos/tillPrint'
import { onRescue } from '@/utils/clickRescue'
import { tillBill } from './tillBill'
import { typeCashReceived } from './tillCash'
import { shouldShowTillOfflineDialog } from './tillErrors'
import { useAuthStore } from '@/stores/auth'
import { useFeaturesStore } from '@/stores/features'

type Screen = 'open' | 'shop' | 'pay' | 'done' | 'voids' | 'holds' | 'close' | 'closed'
type PayWay = 'cash' | 'qris'
type Dialog =
  | { type: 'void'; saleId: number }
  | { type: 'short'; productId: number }
  | { type: 'netfail' }
  | { type: 'error'; title: string; body: string }
  | null

interface WarehouseOption {
  id: number
  name: string
}

interface CartLine {
  productId: number
  quantity: number
}

const DENOMS = [100_000, 50_000, 20_000, 10_000, 5_000, 2_000, 1_000, 500, 200, 100]
const QUICK = [20_000, 50_000, 100_000, 200_000]
const VOID_REASONS = ['Salah barang', 'Salah jumlah', 'Salah cara bayar', 'Pelanggan batal']
const HUE: Record<string, string> = {
  Minuman: '#2b7fb8',
  Kopi: '#6b4a2b',
  Teh: '#3f8f4e',
  'Milk Based': '#8a5a3a',
  Jus: '#c45c2b',
  Smoothies: '#b84a7a',
  Float: '#2b7fb8',
  Dimsum: '#b1200f',
  Appetizer: '#b8672b',
  Toast: '#c49a2b',
  'Bubur & Sup': '#8a5600',
  Nasi: '#b8672b',
  Mie: '#c45c2b',
  Tofu: '#8a7a4a',
  Pastry: '#c49a2b',
  Extra: '#5d6f7c',
  Makanan: '#b8672b',
  Sembako: '#3f8f4e',
  Jasa: '#6b5aa8',
  Lainnya: '#5d6f7c',
}

const auth = useAuthStore()
const features = useFeaturesStore()
const route = useRoute()
const router = useRouter()

const screen = ref<Screen>('open')
const session = ref<PosSession | null>(null)
const catalog = ref<PosCatalogProduct[]>([])
const cart = ref<CartLine[]>([])
const holds = ref<PosHold[]>([])
const sales = ref<PosSale[]>([])
const warehouses = ref<WarehouseOption[]>([])
const warehouseId = ref<number | null>(null)
const openingCash = ref(200_000)
const category = ref('Semua')
const search = ref('')
const way = ref<PayWay>('cash')
const received = ref(0)
const idempotencyKey = ref<string | null>(null)
const lastSale = ref<PosSale | null>(null)
const voidReason = ref<string | null>(null)
const count = reactive<Record<number, number>>(Object.fromEntries(DENOMS.map((d) => [d, 0])))
const countDone = ref(false)
const dialog = ref<Dialog>(null)
const toast = ref<{ message: string; bad: boolean } | null>(null)
const loading = ref(false)
let checkoutInFlight = false
const periodLocked = ref(false)
const periodMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

const cashierName = computed(() => auth.user?.name ?? 'Kasir')
const categories = computed(() => {
  const names = Array.from(new Set(catalog.value.map((p) => p.category || 'Lainnya')))
  return ['Semua', ...names]
})

const tileMarks = computed(() => tillTileMarks(catalog.value))

const filteredCatalog = computed(() => {
  const q = search.value.trim().toLowerCase()
  return catalog.value.filter((p) => {
    const cat = p.category || 'Lainnya'
    if (category.value !== 'Semua' && cat !== category.value) {
      return false
    }
    if (!q) {
      return true
    }
    return `${p.name}${p.sku ?? ''}${p.barcode ?? ''}`.toLowerCase().includes(q)
  })
})

const subtotal = computed(() =>
  cart.value.reduce((sum, line) => sum + product(line.productId).button_price * line.quantity, 0),
)
const bill = computed(() => tillBill(
  subtotal.value,
  session.value?.pricing_mode,
  session.value?.service_rate,
  session.value?.tax_add_rate,
))
const payable = computed(() => bill.value.payable)
const itemCount = computed(() => cart.value.reduce((sum, line) => sum + line.quantity, 0))
const change = computed(() => received.value - payable.value)
const canCommit = computed(() => way.value === 'qris' || received.value >= payable.value)
const countedCash = computed(() => DENOMS.reduce((sum, d) => sum + d * (count[d] || 0), 0))
const expectedCash = computed(() => {
  const opening = session.value?.opening_cash_amount ?? 0
  const cashSales = sales.value
    .filter((sale) => sale.status === 'completed')
    .reduce((sum, sale) => {
      return sum + (sale.tenders ?? [])
        .filter((tender) => tender.type === 'cash')
        .reduce((inner, tender) => inner + tender.amount, 0)
    }, 0)
  return opening + cashSales
})

function rp(amount: number): string {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID')
}

function product(id: number): PosCatalogProduct {
  return catalog.value.find((p) => p.id === id) ?? {
    id,
    name: 'Produk',
    sku: null,
    barcode: null,
    category: 'Lainnya',
    button_price: 0,
    is_taxable: false,
    track_inventory: false,
    quantity: null,
    image_url: null,
  }
}

function hue(cat: string | null): string {
  return HUE[cat || 'Lainnya'] ?? '#0f6f78'
}

function inCart(id: number): number {
  return cart.value.find((l) => l.productId === id)?.quantity ?? 0
}

function available(id: number): number {
  const p = product(id)
  if (!p.track_inventory) {
    return Number.POSITIVE_INFINITY
  }
  return p.quantity ?? 0
}

function showToast(message: string, bad = false, ms = 2700): void {
  toast.value = { message, bad }
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
  if (ms > 0) {
    toastTimer = setTimeout(() => {
      toast.value = null
    }, ms)
  }
}

function apiMessage(error: unknown): string {
  return getErrorMessage(error, 'Terjadi kesalahan. Coba lagi.')
}

function isPeriodLock(message: string): boolean {
  return /periode fiskal/i.test(message)
}

function newKey(): string {
  return `pos_${Math.random().toString(36).slice(2, 12)}`
}

function addToCart(id: number): void {
  const p = product(id)
  const next = inCart(id) + 1
  if (p.track_inventory && next > available(id)) {
    showToast(
      available(id) === 0 ? `${p.name} habis — tidak bisa dijual.` : `${p.name} tinggal ${available(id)}. Tidak bisa tambah lagi.`,
      true,
    )
    return
  }
  const line = cart.value.find((l) => l.productId === id)
  if (line) {
    line.quantity = next
  } else {
    cart.value.push({ productId: id, quantity: 1 })
  }
}

function bump(id: number, delta: number): void {
  const line = cart.value.find((l) => l.productId === id)
  if (!line) {
    return
  }
  const next = line.quantity + delta
  if (next <= 0) {
    cart.value = cart.value.filter((l) => l.productId !== id)
    return
  }
  if (product(id).track_inventory && next > available(id)) {
    showToast(`${product(id).name} tinggal ${available(id)}.`, true)
    return
  }
  line.quantity = next
}

function typeAmount(key: string): void {
  received.value = typeCashReceived(received.value, key)
}

async function loadCatalog(sessionId: number): Promise<void> {
  catalog.value = await getPosCatalog(sessionId)
}

async function refreshSession(sessionId: number): Promise<void> {
  const fresh = await getPosSession(sessionId)
  session.value = fresh
  sales.value = fresh.sales ?? []
  holds.value = fresh.holds ?? []
}

async function loadWarehouses(): Promise<void> {
  const rows = await listPosOutlets()
  warehouses.value = rows
  warehouseId.value = bindOutletId(rows, warehouseId.value)
}

async function startSession(): Promise<void> {
  if (loading.value) {
    return
  }
  if (periodLocked.value) {
    showToast(periodMessage.value || 'Kasir belum bisa jualan hari ini. Minta bagian akuntansi membuka periode dulu.', true)
    return
  }
  const resolved = resolveStartWarehouse(warehouses.value, warehouseId.value)
  if (resolved.error || resolved.warehouseId == null) {
    showToast(resolved.error || 'Gudang wajib dipilih.', true)
    return
  }
  warehouseId.value = resolved.warehouseId
  loading.value = true
  try {
    session.value = await openPosSession(resolved.warehouseId, Number(openingCash.value) || 0)
    await loadCatalog(session.value.id)
    try {
      await refreshSession(session.value.id)
    } catch {
      sales.value = session.value.sales ?? []
      holds.value = session.value.holds ?? []
    }
    cart.value = []
    screen.value = 'shop'
  } catch (error) {
    const message = apiMessage(error)
    if (isPeriodLock(message)) {
      periodLocked.value = true
      periodMessage.value = message
    }
    showToast(message, true)
  } finally {
    loading.value = false
  }
}

function recordLocalSale(sale: PosSale, sold: CartLine[]): void {
  const others = sales.value.filter((row) => row.id !== sale.id)
  sales.value = [...others, sale]
  for (const line of sold) {
    const sku = catalog.value.find((p) => p.id === line.productId)
    if (sku?.track_inventory && sku.quantity != null) {
      sku.quantity = Math.max(0, sku.quantity - line.quantity)
    }
  }
}

async function commitSale(): Promise<void> {
  if (!session.value || checkoutInFlight) {
    return
  }
  const short = cart.value.find((l) => product(l.productId).track_inventory && l.quantity > available(l.productId))
  if (short) {
    dialog.value = { type: 'short', productId: short.productId }
    return
  }
  if (!idempotencyKey.value) {
    idempotencyKey.value = newKey()
  }
  const sold = cart.value.map((line) => ({ ...line }))
  checkoutInFlight = true
  loading.value = true
  let recorded: PosSale | null = null
  try {
    recorded = await checkoutPosSale(
      session.value.id,
      {
        way: way.value,
        cash_received_amount: way.value === 'cash' ? received.value : undefined,
        lines: sold.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
      },
      idempotencyKey.value,
    )
    lastSale.value = recorded
    dialog.value = null
    screen.value = 'done'
    recordLocalSale(recorded, sold)
    cart.value = []
    idempotencyKey.value = null
  } catch (error) {
    if (shouldShowTillOfflineDialog(error, recorded !== null)) {
      dialog.value = { type: 'netfail' }
      return
    }
    dialog.value = null
    showToast(apiMessage(error), true)
    return
  } finally {
    loading.value = false
    checkoutInFlight = false
  }

  try {
    await loadCatalog(session.value.id)
    await refreshSession(session.value.id)
  } catch {
    // Sale already recorded — keep the lunas screen even if refresh fails.
  }
}

async function saveHold(): Promise<void> {
  if (!session.value || cart.value.length === 0) {
    return
  }
  loading.value = true
  try {
    await holdPosCart(
      session.value.id,
      cart.value.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
    )
    holds.value = await listPosHolds(session.value.id)
    cart.value = []
    showToast('Pesanan disimpan.', false, 12000)
  } catch (error) {
    showToast(apiMessage(error), true)
  } finally {
    loading.value = false
  }
}

async function takeHold(hold: PosHold): Promise<void> {
  if (!session.value) {
    return
  }
  loading.value = true
  try {
    const taken = await takePosHold(session.value.id, hold.id)
    cart.value = taken.lines.map((l) => ({ productId: l.product_id, quantity: l.quantity }))
    holds.value = await listPosHolds(session.value.id)
    screen.value = 'shop'
  } catch (error) {
    showToast(apiMessage(error), true)
  } finally {
    loading.value = false
  }
}

async function confirmVoid(): Promise<void> {
  if (!session.value || dialog.value?.type !== 'void' || !voidReason.value) {
    return
  }
  const saleId = dialog.value.saleId
  const reason = voidReason.value
  loading.value = true
  try {
    const voided = await voidPosSale(session.value.id, saleId, reason)
    sales.value = sales.value.map((sale) => (sale.id === voided.id ? voided : sale))
    dialog.value = null
    voidReason.value = null
    showToast('Penjualan dibatalkan. Stok dikembalikan.')
  } catch (error) {
    showToast(apiMessage(error), true)
    return
  } finally {
    loading.value = false
  }

  try {
    await loadCatalog(session.value.id)
    await refreshSession(session.value.id)
  } catch {
    // Void already recorded — keep the list in sync from the void response.
  }
}

async function reviewCloseCount(): Promise<void> {
  if (session.value) {
    try {
      await refreshSession(session.value.id)
    } catch {
      // Keep the locally computed expected cash if refresh fails.
    }
  }
  countDone.value = true
}

async function finishClose(): Promise<void> {
  if (!session.value) {
    return
  }
  loading.value = true
  try {
    session.value = await closePosSession(session.value.id, countedCash.value)
    screen.value = 'closed'
  } catch (error) {
    showToast(apiMessage(error), true)
  } finally {
    loading.value = false
  }
}

function fixShort(): void {
  if (dialog.value?.type !== 'short') {
    return
  }
  const id = dialog.value.productId
  const left = available(id)
  if (left <= 0) {
    cart.value = cart.value.filter((l) => l.productId !== id)
  } else {
    const line = cart.value.find((l) => l.productId === id)
    if (line) {
      line.quantity = left
    }
  }
  dialog.value = null
  screen.value = cart.value.length ? 'pay' : 'shop'
}

function printStruk(): void {
  if (!lastSale.value) {
    return
  }
  printTillReceipt(lastSale.value, catalog.value, {
    cashier: cashierName.value,
    taxName: session.value?.tax_add_name || 'PBJT',
    serviceRate: session.value?.service_rate,
    taxRate: session.value?.tax_add_rate,
  })
}

function onSearchEnter(): void {
  const hit = catalog.value.find((p) => p.barcode && p.barcode === search.value.trim())
  if (hit) {
    search.value = ''
    addToCart(hit.id)
    return
  }
  showToast('Barcode tidak dikenal.', true)
}

async function leaveTill(): Promise<void> {
  await auth.logout()
}

function resetTill(): void {
  session.value = null
  catalog.value = []
  cart.value = []
  holds.value = []
  sales.value = []
  lastSale.value = null
  received.value = 0
  way.value = 'cash'
  countDone.value = false
  DENOMS.forEach((d) => {
    count[d] = 0
  })
  screen.value = 'open'
}

const stopStartRescue = onRescue('kasir-start', () => {
  void startSession()
})
const stopLeaveRescue = onRescue('kasir-logout', () => {
  void leaveTill()
})
onBeforeUnmount(() => {
  stopStartRescue()
  stopLeaveRescue()
})

onMounted(async () => {
  if (auth.token && !auth.user) {
    await auth.fetchUser()
  }
  if (!features.loaded) {
    await features.fetchFeatures()
  }
  if (!features.enabled('pos') || !auth.hasPermission('pos.sale.checkout')) {
    await router.replace('/')
    return
  }
  try {
    await loadWarehouses()
    const wanted = Number(route.query.session)
    const openHolds = route.query.holds === '1' || route.query.holds === 'true'
    let open = null
    if (Number.isFinite(wanted) && wanted > 0) {
      try {
        open = await getPosSession(wanted)
      } catch {
        open = await currentPosSession()
      }
    } else {
      open = await currentPosSession()
    }
    if (open) {
      session.value = open
      await loadCatalog(open.id)
      sales.value = open.sales ?? []
      holds.value = open.holds ?? await listPosHolds(open.id)
      screen.value = openHolds && holds.value.length > 0 ? 'holds' : 'shop'
    }
  } catch (error) {
    const message = apiMessage(error)
    if (isPeriodLock(message)) {
      periodLocked.value = true
      periodMessage.value = message
    } else {
      showToast(message, true)
    }
  }
})
</script>

<template>
  <div class="kasir">
    <div v-if="screen === 'open'" class="app one">
      <div class="wrap">
        <div class="leave-row">
          <button
            v-if="!auth.isCashierOnly"
            type="button"
            class="leave"
            data-testid="kasir-back-office"
            @click="router.push('/')"
          >Ke back office</button>
          <a href="/login" class="leave" data-testid="kasir-logout" onclick="localStorage.removeItem('token');location.href='/login';return false">Keluar</a>
        </div>
        <div class="card">
          <h2>Buka kasir</h2>
          <p>Hitung uang modal di laci, lalu masukkan jumlahnya.</p>
          <div v-if="periodLocked" class="banner bad">
            <span>✕</span>
            <div>
              <b>Periode fiskal terkunci</b>
              {{ periodMessage || 'Kasir belum bisa jualan hari ini. Minta bagian akuntansi membuka periode dulu.' }}
            </div>
          </div>
          <div class="field">
            <label>Kasir</label>
            <input :value="cashierName" disabled>
          </div>
          <div class="field">
            <label>Outlet / gudang</label>
            <select v-model.number="warehouseId">
              <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>Uang modal di laci</label>
            <input v-model.number="openingCash" inputmode="numeric">
            <div class="hint">{{ rp(Number(openingCash) || 0) }} · akun kas dan QRIS dari setelan perusahaan — kasir tidak memilih akun.</div>
          </div>
          <button type="button" class="bayar" data-testid="kasir-start">Mulai jualan</button>
        </div>
      </div>
    </div>

    <div v-else-if="screen === 'shop'" class="app">
      <div class="top">
        <div class="merch">Kasir<small>{{ session?.session_number }}</small></div>
        <div class="search">
          <input
            v-model="search"
            data-testid="kasir-search"
            placeholder="Cari atau tembak barcode…"
            autocomplete="off"
            @keydown.enter.prevent="onSearchEnter"
          >
          <span class="mg">⌕</span>
        </div>
        <div class="kas"><b>{{ cashierName }}</b>Kasir</div>
        <button
          v-if="!auth.isCashierOnly"
          type="button"
          class="ghost"
          data-testid="kasir-back-office"
          @click="router.push('/')"
        >Ke back office</button>
        <button class="shift" data-testid="kasir-close" @click="screen = 'close'; countDone = false; loading = false">Tutup kasir</button>
        <a href="/login" class="ghost" data-testid="kasir-logout" onclick="localStorage.removeItem('token');location.href='/login';return false">Keluar</a>
      </div>
      <div class="main">
        <div class="rail">
          <button
            v-for="cat in categories"
            :key="cat"
            :class="{ on: category === cat }"
            @click="category = cat"
          >
            <span class="ic">{{ cat === 'Semua' ? '▦' : '•' }}</span>{{ cat }}
          </button>
        </div>
        <div class="grid">
          <button
            v-for="p in filteredCatalog"
            :key="p.id"
            class="sku"
            :class="{ out: p.track_inventory && (p.quantity ?? 0) <= 0 }"
            :data-testid="p.sku ? `kasir-sku-${p.sku}` : undefined"
            @click="addToCart(p.id)"
          >
            <div
              class="thumb"
              :class="{ photo: !!p.image_url }"
              :style="p.image_url ? undefined : { background: hue(p.category) }"
            >
              <img v-if="p.image_url" :src="p.image_url" :alt="p.name">
              <template v-else>{{ tileMarks[p.id] }}</template>
              <span v-if="inCart(p.id)" class="qbadge">{{ inCart(p.id) }}</span>
            </div>
            <div class="meta">
              <div class="n">{{ p.name }}</div>
              <div>
                <div class="p">{{ rp(p.button_price) }}</div>
                <div
                  class="s"
                  :class="{
                    zero: p.track_inventory && (p.quantity ?? 0) <= 0,
                    thin: p.track_inventory && (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= 3,
                  }"
                >
                  {{ !p.track_inventory ? 'tanpa stok' : (p.quantity ?? 0) <= 0 ? 'HABIS' : 'stok ' + p.quantity }}
                </div>
              </div>
            </div>
          </button>
        </div>
        <div class="order">
          <div class="ohead">
            <h3>Pesanan</h3>
            <span class="cnt">{{ itemCount }} item</span>
          </div>
          <div class="obar">
            <button data-testid="kasir-hold" :disabled="!cart.length" @click="saveHold">Simpan</button>
            <button v-if="holds.length" class="held" data-testid="kasir-holds" @click="screen = 'holds'">Ambil ({{ holds.length }})</button>
            <button data-testid="kasir-voids" :disabled="!sales.length" @click="screen = 'voids'">Batalkan</button>
            <button data-testid="kasir-clear" :disabled="!cart.length" @click="cart = []">Kosongkan</button>
          </div>
          <div class="olines">
            <div v-if="!cart.length" class="oempty">
              <div class="i">🧾</div>
              <p>Ketuk barang di kiri, atau tembak barcode di kolom pencarian.</p>
            </div>
            <div v-for="line in cart" :key="line.productId" class="ol">
              <div>
                <div class="n">{{ product(line.productId).name }}</div>
                <div class="u">{{ rp(product(line.productId).button_price) }}</div>
              </div>
              <div class="amt">{{ rp(product(line.productId).button_price * line.quantity) }}</div>
              <div class="qr">
                <button @click="bump(line.productId, -1)">−</button>
                <span class="q">{{ line.quantity }}</span>
                <button @click="bump(line.productId, 1)">+</button>
                <button class="rm" @click="cart = cart.filter((l) => l.productId !== line.productId)">Hapus</button>
              </div>
            </div>
          </div>
          <div class="ofoot">
            <div v-if="bill.service > 0 || bill.tax > 0" class="r" data-testid="kasir-subtotal">
              <span>Subtotal</span><span>{{ rp(bill.subtotal) }}</span>
            </div>
            <div v-if="bill.service > 0" class="r" data-testid="kasir-service">
              <span>Service {{ session?.service_rate }}%</span><span>{{ rp(bill.service) }}</span>
            </div>
            <div v-if="bill.tax > 0" class="r" data-testid="kasir-tax">
              <span>{{ session?.tax_add_name || 'PBJT' }} {{ session?.tax_add_rate }}%</span><span>{{ rp(bill.tax) }}</span>
            </div>
            <div class="t"><span>Total</span><b data-testid="kasir-total">{{ rp(payable) }}</b></div>
            <button class="bayar" data-testid="kasir-pay" :disabled="!cart.length" @click="screen = 'pay'; received = 0; way = 'cash'">Bayar</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="screen === 'pay'" class="sheet">
      <div class="sh">
        <button @click="screen = 'shop'">← Kembali</button>
        <span>Pembayaran · {{ itemCount }} item</span>
      </div>
      <div class="sb">
        <div class="pay">
          <div class="pl">
            <div class="tabs">
              <button data-testid="kasir-tab-cash" :class="{ on: way === 'cash' }" @click="way = 'cash'; received = 0">Tunai</button>
              <button data-testid="kasir-tab-qris" :class="{ on: way === 'qris' }" @click="way = 'qris'; received = 0">QRIS</button>
            </div>
            <div class="slab">
              <div class="l">Total tagihan</div>
              <div class="v">{{ rp(payable) }}</div>
            </div>
            <div v-if="way === 'qris'" class="banner warn" style="margin:0">
              <span>!</span>
              <div>
                <b>Tekan Selesai hanya setelah uang benar-benar masuk</b>
                Cek notifikasi di HP atau mesin QRIS. Sistem belum bisa mengeceknya sendiri.
              </div>
            </div>
            <template v-else>
              <div class="slab" data-testid="kasir-received-slab">
                <div class="l">Uang diterima</div>
                <div class="v" data-testid="kasir-received">{{ rp(received) }}</div>
              </div>
              <div class="slab chg" :class="{ neg: change < 0 }">
                <div class="l">{{ change < 0 ? 'Masih kurang' : 'Kembalian' }}</div>
                <div class="v" data-testid="kasir-change">{{ rp(Math.abs(change)) }}</div>
              </div>
            </template>
          </div>
          <div class="pr">
            <template v-if="way === 'cash'">
              <div class="quick">
                <button class="pas" data-testid="kasir-exact-cash" @click="received = payable">Uang pas · {{ rp(payable) }}</button>
                <button v-for="q in QUICK" :key="q" @click="received = q">{{ rp(q) }}</button>
              </div>
              <div class="keys">
                <button
                  v-for="n in [1,2,3,4,5,6,7,8,9]"
                  :key="n"
                  :data-testid="`kasir-key-${n}`"
                  @click="typeAmount(String(n))"
                >{{ n }}</button>
                <button data-testid="kasir-key-000" @click="typeAmount('000')">000</button>
                <button data-testid="kasir-key-0" @click="typeAmount('0')">0</button>
                <button data-testid="kasir-key-del" style="font-size:20px" @click="typeAmount('del')">⌫</button>
              </div>
            </template>
            <div v-else class="qrbox">
              <div>
                <div style="font-size:82px;line-height:1">▦</div>
                <div style="font-weight:800;font-size:18px;margin-top:12px">Tunjukkan QR ke pelanggan</div>
                <div style="font:800 30px var(--mono);color:var(--brand);margin-top:10px">{{ rp(payable) }}</div>
              </div>
            </div>
            <button class="ok" data-testid="kasir-finish" :disabled="!canCommit || loading" @click="commitSale">
              {{ canCommit ? 'Selesai' : 'Uang belum cukup' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="screen === 'done'" class="app one">
      <div class="done">
        <div class="tick">✓</div>
        <h2 data-testid="kasir-lunas">Pembayaran berhasil</h2>
        <div style="color:var(--ink2);font:700 15px var(--mono);margin-top:6px">{{ lastSale?.sale_number }}</div>
        <template v-if="(lastSale?.change_amount ?? 0) > 0">
          <div class="kl">Kembalian</div>
          <div class="kv">{{ rp(lastSale?.change_amount ?? 0) }}</div>
        </template>
        <div v-else class="kl" style="margin-top:24px">Uang pas — tidak ada kembalian</div>
        <div class="row">
          <button class="sec" data-testid="kasir-print" @click="printStruk">Cetak struk</button>
          <button class="bayar" data-testid="kasir-new-sale" style="width:auto;padding:0 34px" @click="screen = 'shop'; received = 0; way = 'cash'">Transaksi baru</button>
        </div>
      </div>
    </div>

    <div v-else-if="screen === 'voids'" class="sheet">
      <div class="sh">
        <button @click="screen = 'shop'">← Kembali</button>
        <span>Batalkan transaksi · {{ session?.session_number }}</span>
      </div>
      <div class="sb">
        <div class="wrap">
          <div class="banner warn">
            <span>!</span>
            <div>
              <b>Hanya selama sesi ini masih buka</b>
              Setelah tutup kasir tidak bisa dibatalkan. Seluruh struk dibatalkan sekaligus — tidak bisa satu barang saja.
            </div>
          </div>
          <div v-for="sale in [...sales].reverse()" :key="sale.id" class="srow" :class="{ v: sale.status === 'voided' }">
            <div>
              <div class="no">{{ sale.sale_number }}</div>
              <div class="tm">{{ sale.status === 'voided' ? sale.void_reason : (sale.items?.length ?? 0) + ' barang' }}</div>
            </div>
            <div class="tt">{{ rp(sale.payable_amount) }}</div>
            <div v-if="sale.status === 'voided'" class="vd">DIBATALKAN</div>
            <button v-else @click="dialog = { type: 'void', saleId: sale.id }; voidReason = null">Batalkan</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="screen === 'holds'" class="sheet">
      <div class="sh">
        <button @click="screen = 'shop'">← Kembali</button>
        <span>Ambil yang ditahan · {{ holds.length }}</span>
      </div>
      <div class="sb">
        <div class="wrap">
          <div v-for="hold in holds" :key="hold.id" class="srow">
            <div>
              <div class="no">{{ hold.lines.length }} barang</div>
              <div class="tm">{{ formatHoldClock(hold.created_at) }}</div>
            </div>
            <button class="held-take" data-testid="kasir-hold-take" @click="takeHold(hold)">Ambil</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="screen === 'close'" class="sheet">
      <div class="sh">
        <button v-if="!countDone" @click="screen = 'shop'">← Kembali</button>
        <span>{{ countDone ? 'Tutup kasir · hasil' : 'Tutup kasir · hitung uang' }}</span>
      </div>
      <div class="sb">
        <div class="wrap">
          <template v-if="!countDone">
            <div class="card">
              <div class="banner warn">
                <span>!</span>
                <div>
                  <b>Hitung dulu, baru sistem cocokkan</b>
                  Jumlah seharusnya sengaja belum ditampilkan supaya hitunganmu jujur apa adanya.
                </div>
              </div>
              <div v-for="d in DENOMS" :key="d" class="den">
                <div class="dl">{{ rp(d) }}</div>
                <input v-model.number="count[d]" inputmode="numeric" placeholder="0">
                <div class="dt">{{ count[d] ? rp(d * count[d]) : '—' }}</div>
              </div>
              <div class="ctot"><span>Uang yang kamu hitung</span><b>{{ rp(countedCash) }}</b></div>
              <button class="bayar" data-testid="kasir-close-review" @click="reviewCloseCount">Lanjut</button>
            </div>
          </template>
          <template v-else>
            <div class="rr"><span>Modal awal</span><b>{{ rp(session?.opening_cash_amount ?? 0) }}</b></div>
            <div class="rr"><span>Seharusnya ada di laci</span><b>{{ rp(expectedCash) }}</b></div>
            <div class="rr"><span>Kamu hitung</span><b>{{ rp(countedCash) }}</b></div>
            <div
              class="rr"
              :class="{
                plus: countedCash - expectedCash > 0,
                minus: countedCash - expectedCash < 0,
                okk: countedCash === expectedCash,
              }"
            >
              <span>{{ countedCash === expectedCash ? 'Cocok' : countedCash > expectedCash ? 'Lebih' : 'Kurang' }}</span>
              <b>{{ rp(Math.abs(countedCash - expectedCash)) }}</b>
            </div>
            <button class="bayar" data-testid="kasir-close-confirm" style="margin-top:8px" :disabled="loading" @click="finishClose">Tutup sesi sekarang</button>
            <button class="sec full" @click="countDone = false">Hitung ulang</button>
          </template>
        </div>
      </div>
    </div>

    <div v-else-if="screen === 'closed'" class="app one">
      <div class="done">
        <div class="tick">✓</div>
        <h2>Sesi ditutup</h2>
        <div style="color:var(--ink2);font-size:16px;margin-top:8px">{{ session?.session_number }}</div>
        <div class="kl">{{ (session?.cash_difference_amount ?? 0) === 0 ? 'Kas cocok' : (session?.cash_difference_amount ?? 0) > 0 ? 'Lebih' : 'Kurang' }}</div>
        <div class="kv" :style="{ color: session?.cash_difference_amount ? 'var(--bad)' : 'var(--go)' }">
          {{ rp(Math.abs(session?.cash_difference_amount ?? 0)) }}
        </div>
        <div class="row">
          <button class="bayar" data-testid="kasir-reopen" style="width:auto;padding:0 34px" @click="resetTill">Buka sesi baru</button>
        </div>
      </div>
    </div>

    <div v-if="dialog && !(dialog.type === 'netfail' && screen === 'done')" class="scrim">
      <div v-if="dialog.type === 'void'" class="dlg">
        <h2>Batalkan penjualan?</h2>
        <p>Seluruh struk dibatalkan, stok kembali, jurnal dibalik. Pilih alasannya.</p>
        <div class="reasons">
          <button
            v-for="reason in VOID_REASONS"
            :key="reason"
            :class="{ on: voidReason === reason }"
            @click="voidReason = reason"
          >{{ reason }}</button>
        </div>
        <div class="row">
          <button class="sec" @click="dialog = null; voidReason = null">Tidak jadi</button>
          <button class="dang" data-testid="kasir-void-confirm" :disabled="!voidReason || loading" @click="confirmVoid">Ya, batalkan</button>
        </div>
      </div>
      <div v-else-if="dialog.type === 'short'" class="dlg">
        <h2>Stok {{ product(dialog.productId).name }} kurang</h2>
        <p>Tersisa {{ Math.max(available(dialog.productId), 0) }}, di pesanan {{ inCart(dialog.productId) }}. Uang belum diambil — kurangi dulu jumlahnya.</p>
        <div class="row">
          <button class="prim" @click="fixShort">Sesuaikan jadi {{ Math.max(available(dialog.productId), 0) }}</button>
        </div>
      </div>
      <div v-else-if="dialog.type === 'netfail'" class="dlg">
        <h2>Belum terkirim</h2>
        <p>Jaringan putus. Transaksi <b>belum</b> tercatat. Tekan Coba lagi — aman, tidak akan dobel.</p>
        <div class="row">
          <button class="sec" @click="dialog = null">Nanti</button>
          <button class="prim" @click="commitSale">Coba lagi</button>
        </div>
        <div class="idem">Idempotency-Key: {{ idempotencyKey }}</div>
      </div>
    </div>

    <div v-if="toast" class="toast" :class="{ bad: toast.bad }" @click="toast = null">{{ toast.message }}</div>
  </div>
</template>

<style scoped>
.kasir {
  --bg: #eceff1; --panel: #fff; --ink: #17222b; --ink2: #5d6f7c; --ink3: #93a4af;
  --line: #dbe2e6; --brand: #0f6f78; --brand-bg: #e4f2f3;
  --go: #12833f; --go-d: #0d6631; --warn: #8a5600; --warn-bg: #fdf2dc;
  --bad: #b1200f; --bad-bg: #fbe8e5; --tap: 56px;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  height: 100dvh; background: var(--bg); color: var(--ink); font-family: var(--sans);
  overflow: hidden; -webkit-tap-highlight-color: transparent;
}
.kasir button { font: inherit; cursor: pointer; border: 0; }
.kasir button.tut, .kasir button.ghost { color: inherit; }
.kasir a.leave, .kasir a.tut, .kasir a.ghost {
  font: inherit; cursor: pointer; border: 0; text-decoration: none; color: inherit;
  display: inline-flex; align-items: center; box-sizing: border-box;
}
.kasir input, .kasir select { font: inherit; }
.app { height: 100dvh; display: grid; grid-template-rows: 58px 1fr; }
.app.one { grid-template-rows: 1fr; }
.top { background: var(--brand); color: #fff; display: flex; align-items: center; gap: 14px; padding: 0 14px; }
.top .merch { font-weight: 800; font-size: 16px; letter-spacing: -.01em; white-space: nowrap; }
.top .merch small { display: block; font-weight: 500; font-size: 11px; opacity: .8; letter-spacing: .04em; }
.top .search { flex: 1; position: relative; }
.top .search input { width: 100%; height: 40px; border: 0; border-radius: 8px; padding: 0 14px 0 38px; font-size: 15px; background: rgba(255,255,255,.16); color: #fff; }
.top .search input::placeholder { color: rgba(255,255,255,.7); }
.top .search .mg { position: absolute; left: 13px; top: 11px; font-size: 16px; opacity: .85; pointer-events: none; }
.top .kas { text-align: right; font-size: 12px; opacity: .85; white-space: nowrap; }
.top .kas b { display: block; font-size: 14px; opacity: 1; }
.top .tut { height: 40px; padding: 0 14px; border-radius: 8px; background: rgba(255,255,255,.16); font-weight: 700; font-size: 14px; }
.top .shift { height: 40px; padding: 0 16px; border-radius: 8px; background: #fff; color: var(--brand); font-weight: 800; font-size: 14px; }
.top .ghost { height: 40px; padding: 0 10px; border-radius: 8px; background: transparent; color: rgba(255,255,255,.88); font-weight: 600; font-size: 14px; }
.main { display: grid; grid-template-columns: 98px 1fr 384px; min-height: 0; }
.rail { background: var(--panel); border-right: 1px solid var(--line); overflow: auto; }
.rail button { width: 100%; min-height: 82px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; border-left: 4px solid transparent; font-weight: 700; font-size: 11px; color: var(--ink2); padding: 8px 4px; line-height: 1.2; text-align: center; }
.rail button .ic { font-size: 22px; }
.rail button.on { background: var(--brand-bg); border-left-color: var(--brand); color: var(--brand); }
.grid { min-width: 0; padding: 14px; display: grid; grid-template-columns: repeat(auto-fill, minmax(146px, 1fr)); gap: 12px; overflow: auto; align-content: start; }
.sku { background: var(--panel); border-radius: 10px; overflow: hidden; text-align: left; box-shadow: 0 1px 3px rgba(23,34,43,.12); display: flex; flex-direction: column; min-height: 158px; }
.sku .thumb { height: 110px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 26px; color: #fff; letter-spacing: -.02em; position: relative; overflow: hidden; }
.sku .thumb.photo { background: #1c1410; }
.sku .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sku .qbadge { position: absolute; top: 6px; right: 6px; background: #fff; color: var(--brand); min-width: 26px; height: 26px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font: 800 13px var(--sans); box-shadow: 0 1px 4px rgba(0,0,0,.25); }
.sku .meta { padding: 9px 10px 10px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.sku .n { font-weight: 700; font-size: 13px; line-height: 1.3; }
.sku .p { font: 800 15px var(--mono); color: var(--ink); margin-top: 6px; }
.sku .s { font-size: 11px; font-weight: 700; color: var(--ink3); margin-top: 2px; }
.sku .s.thin { color: var(--warn); } .sku .s.zero { color: var(--bad); }
.sku.out { opacity: .45; }
.order { min-width: 0; background: var(--panel); border-left: 1px solid var(--line); display: grid; grid-template-rows: auto auto 1fr auto; min-height: 0; }
.ohead { display: flex; align-items: center; justify-content: space-between; padding: 13px 14px 10px; }
.ohead h3 { margin: 0; font-size: 17px; }
.ohead .cnt { font-size: 13px; color: var(--ink2); font-weight: 600; }
.obar { display: flex; gap: 8px; padding: 0 14px 11px; border-bottom: 1px solid var(--line); }
.obar button { flex: 1; height: 42px; border: 1px solid var(--line); border-radius: 8px; font-weight: 700; font-size: 13px; color: var(--ink2); }
.obar button:disabled { opacity: .35; }
.obar .held { border-color: var(--brand); color: var(--brand); background: var(--brand-bg); }
.olines { overflow-y: auto; overflow-x: hidden; }
.ol { display: grid; grid-template-columns: 1fr auto; gap: 6px; padding: 12px 14px; border-bottom: 1px solid #eef2f4; }
.ol .n { font-weight: 700; font-size: 14px; line-height: 1.3; }
.ol .u { font: 11px var(--mono); color: var(--ink2); margin-top: 3px; }
.ol .amt { font: 800 15px var(--mono); text-align: right; }
.ol .qr { display: flex; align-items: center; gap: 7px; margin-top: 8px; grid-column: 1/-1; }
.ol .qr button { width: 38px; height: 38px; border: 1px solid var(--line); border-radius: 8px; font-weight: 800; font-size: 18px; background: var(--bg); }
.ol .qr .q { font: 800 16px var(--mono); min-width: 30px; text-align: center; }
.ol .qr .rm { width: auto; padding: 0 16px; font-weight: 700; margin-left: auto; color: var(--bad); border-color: #f0cdc7; background: var(--bad-bg); font-size: 15px; }
.oempty { padding: 64px 26px; text-align: center; color: var(--ink3); }
.oempty .i { font-size: 44px; opacity: .5; }
.oempty p { font-size: 15px; line-height: 1.55; margin: 12px 0 0; }
.ofoot { border-top: 1px solid var(--line); padding: 12px 14px 14px; }
.ofoot .r { display: flex; justify-content: space-between; font-size: 13px; color: var(--ink2); padding: 3px 0; }
.ofoot .t { display: flex; justify-content: space-between; align-items: baseline; margin: 9px 0 12px; padding-top: 10px; border-top: 1px dashed var(--line); }
.ofoot .t span { font-size: 15px; font-weight: 800; }
.ofoot .t b { font: 800 30px var(--mono); letter-spacing: -.02em; }
.bayar { width: 100%; height: 70px; border-radius: 10px; background: var(--go); color: #fff; font-weight: 800; font-size: 22px; letter-spacing: .01em; }
.bayar:disabled { background: #c4cdd2; color: #8b979e; }
.sheet { position: fixed; inset: 0; z-index: 40; background: var(--bg); display: grid; grid-template-rows: 58px 1fr; }
.sh { background: var(--brand); color: #fff; display: flex; align-items: center; gap: 14px; padding: 0 14px; font-weight: 800; font-size: 17px; }
.sh button { height: 40px; padding: 0 14px; border-radius: 8px; background: rgba(255,255,255,.18); font-weight: 700; font-size: 14px; }
.sb { overflow: auto; min-height: 0; }
.pay { display: grid; grid-template-columns: 1fr 400px; height: 100%; min-height: 0; }
.pl { padding: 28px 34px; display: flex; flex-direction: column; justify-content: center; gap: 18px; }
.tabs { display: flex; gap: 10px; }
.tabs button { flex: 1; height: 66px; border: 2px solid var(--line); border-radius: 10px; background: var(--panel); font-weight: 800; font-size: 17px; color: var(--ink2); }
.tabs button.on { border-color: var(--brand); background: var(--brand-bg); color: var(--brand); }
.slab { background: var(--panel); border-radius: 12px; padding: 22px 26px; box-shadow: 0 1px 3px rgba(23,34,43,.1); }
.slab .l { font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--ink2); }
.slab .v { font: 800 58px/1 var(--mono); letter-spacing: -.035em; margin-top: 8px; }
.slab.chg { background: #e8f5ec; box-shadow: inset 0 0 0 2px var(--go); }
.slab.chg .l, .slab.chg .v { color: var(--go-d); }
.slab.chg.neg { background: var(--bad-bg); box-shadow: inset 0 0 0 2px var(--bad); }
.slab.chg.neg .l, .slab.chg.neg .v { color: var(--bad); }
.pr { background: var(--panel); border-left: 1px solid var(--line); padding: 14px; display: flex; flex-direction: column; gap: 9px; min-height: 0; }
.quick { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.quick button { height: 54px; border: 1px solid var(--line); border-radius: 9px; background: var(--bg); font: 700 16px var(--mono); }
.quick .pas { grid-column: 1/-1; background: var(--ink); color: #fff; border-color: var(--ink); font-family: var(--sans); font-size: 17px; font-weight: 800; }
.keys { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; flex: 1; min-height: 190px; }
.keys button { border: 1px solid var(--line); border-radius: 9px; background: var(--bg); font: 800 25px var(--mono); }
.qrbox { flex: 1; display: flex; align-items: center; justify-content: center; border: 3px dashed var(--line); border-radius: 12px; text-align: center; padding: 22px; }
.ok { height: 78px; border-radius: 10px; background: var(--go); color: #fff; font-weight: 800; font-size: 21px; }
.ok:disabled { background: #c4cdd2; color: #8b979e; }
.leave-row { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 10px; }
.kasir button.leave {
  font: inherit; cursor: pointer; border: 0; background: transparent; color: inherit;
  display: inline-flex; align-items: center;
}
.leave { height: 40px; padding: 0 14px; border-radius: 8px; background: var(--panel); color: var(--ink2); font-weight: 700; font-size: 14px; box-shadow: 0 1px 3px rgba(23,34,43,.1); }
.wrap { max-width: 660px; margin: 0 auto; padding: 22px; }
.card { background: var(--panel); border-radius: 12px; padding: 22px; box-shadow: 0 1px 3px rgba(23,34,43,.1); }
.card h2 { margin: 0 0 6px; font-size: 22px; }
.card p { margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: var(--ink2); }
.field { margin-bottom: 16px; }
.field label { display: block; font-weight: 800; font-size: 14px; margin-bottom: 6px; }
.field input, .field select { width: 100%; height: var(--tap); border: 1px solid var(--line); border-radius: 9px; padding: 0 14px; font-size: 17px; background: var(--bg); }
.field .hint { font-size: 13px; color: var(--ink3); margin-top: 6px; line-height: 1.5; }
.banner { padding: 13px 16px; border-radius: 9px; font-size: 15px; line-height: 1.5; display: flex; gap: 11px; align-items: flex-start; margin-bottom: 16px; }
.banner.warn { background: var(--warn-bg); box-shadow: inset 0 0 0 2px #e6c079; color: var(--warn); }
.banner.bad { background: var(--bad-bg); box-shadow: inset 0 0 0 2px #e9aaa0; color: var(--bad); }
.banner b { display: block; margin-bottom: 2px; }
.scrim { position: fixed; inset: 0; z-index: 50; background: rgba(23,34,43,.6); display: flex; align-items: center; justify-content: center; padding: 24px; }
.dlg { background: var(--panel); border-radius: 14px; padding: 24px; width: min(560px, 100%); }
.dlg h2 { margin: 0 0 8px; font-size: 22px; }
.dlg p { margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: var(--ink2); }
.dlg .row { display: flex; gap: 10px; }
.dlg .row button { flex: 1; height: 60px; border-radius: 10px; font-weight: 800; font-size: 16px; }
.prim { background: var(--brand); color: #fff; }
.sec { border: 1px solid var(--line); background: var(--bg); }
.sec.full { width: 100%; height: 54px; margin-top: 10px; border-radius: 10px; font-weight: 800; }
.dang { background: var(--bad); color: #fff; }
.reasons { display: grid; gap: 9px; margin-bottom: 18px; }
.reasons button { height: 56px; border: 1px solid var(--line); border-radius: 9px; background: var(--bg); font-weight: 700; font-size: 16px; text-align: left; padding: 0 16px; }
.reasons button.on { background: var(--ink); color: #fff; border-color: var(--ink); }
.srow { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 14px; padding: 15px 16px; background: var(--panel); border-radius: 10px; margin-bottom: 9px; box-shadow: 0 1px 3px rgba(23,34,43,.1); }
.srow .no { font: 800 15px var(--mono); }
.srow .tm { font-size: 13px; color: var(--ink2); margin-top: 3px; }
.srow .tt { font: 800 19px var(--mono); }
.srow button { height: 50px; padding: 0 20px; border-radius: 9px; background: var(--bad-bg); color: var(--bad); font-weight: 800; }
.srow button.held-take { background: var(--brand-bg); color: var(--brand); }
.srow.v { opacity: .5; }
.srow .vd { font-weight: 800; color: var(--bad); font-size: 13px; }
.den { display: grid; grid-template-columns: 150px 1fr 130px; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--line); }
.den .dl { font: 700 16px var(--mono); }
.den input { width: 100%; height: 52px; border: 1px solid var(--line); border-radius: 9px; text-align: center; font: 800 19px var(--mono); background: var(--bg); }
.den .dt { text-align: right; font: 700 16px var(--mono); color: var(--ink2); }
.ctot { display: flex; justify-content: space-between; align-items: baseline; margin: 20px 0; padding: 18px; background: var(--ink); color: #fff; border-radius: 11px; }
.ctot span { font-size: 16px; font-weight: 700; }
.ctot b { font: 800 32px var(--mono); }
.rr { display: flex; justify-content: space-between; padding: 15px 17px; background: var(--panel); border-radius: 10px; font-size: 17px; margin-bottom: 9px; box-shadow: 0 1px 3px rgba(23,34,43,.08); }
.rr b { font: 800 20px var(--mono); }
.rr.plus { background: var(--warn-bg); box-shadow: inset 0 0 0 2px #e6c079; }
.rr.minus { background: var(--bad-bg); box-shadow: inset 0 0 0 2px #e9aaa0; }
.rr.okk { background: #e8f5ec; box-shadow: inset 0 0 0 2px var(--go); }
.done { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; }
.done .tick { width: 96px; height: 96px; border-radius: 48px; background: var(--go); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 50px; margin-bottom: 14px; }
.done h2 { margin: 0; font-size: 28px; }
.done .kl { font-size: 17px; font-weight: 700; color: var(--ink2); margin-top: 20px; }
.done .kv { font: 800 76px/1 var(--mono); color: var(--go); letter-spacing: -.035em; margin-top: 6px; }
.done .row { display: flex; gap: 12px; margin-top: 30px; }
.done .row button { height: 70px; padding: 0 30px; border-radius: 11px; font-weight: 800; font-size: 18px; }
.toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 70; background: var(--ink); color: #fff; padding: 15px 22px; border-radius: 10px; font-size: 16px; font-weight: 600; max-width: 76vw; box-shadow: 0 12px 32px rgba(0,0,0,.32); }
.toast.bad { background: var(--bad); }
.idem { font: 11px var(--mono); color: var(--ink3); margin-top: 10px; word-break: break-all; }
</style>
