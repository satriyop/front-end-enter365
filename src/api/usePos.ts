import { api } from './client'

export interface PosCatalogProduct {
  id: number
  name: string
  sku: string | null
  barcode: string | null
  category: string | null
  button_price: number
  is_taxable: boolean
  track_inventory: boolean
  quantity: number | null
  image_url: string | null
}

export interface PosSession {
  id: number
  session_number: string
  status: 'open' | 'closed'
  warehouse_id: number
  warehouse_name?: string | null
  pricing_mode?: 'inclusive' | 'add'
  service_rate?: number
  tax_add_rate?: number
  tax_add_name?: string | null
  opening_cash_amount: number
  expected_cash_amount: number | null
  counted_cash_amount: number | null
  cash_difference_amount: number | null
  opened_by: number
  opened_at: string
  closed_at: string | null
  holds?: PosHold[]
  sales?: PosSale[]
}

export interface PosSale {
  id: number
  sale_number: string
  pos_session_id: number
  status: 'completed' | 'voided'
  subtotal_amount?: number
  service_amount?: number
  tax_amount?: number
  payable_amount: number
  cash_received_amount: number
  change_amount: number
  sold_at: string
  void_reason: string | null
  items?: Array<{
    id: number
    product_id: number
    quantity: number
    payable_amount: number
  }>
  tenders?: Array<{
    type: 'cash' | 'qris'
    amount: number
  }>
}

export interface PosHold {
  id: number
  pos_session_id: number
  lines: Array<{ product_id: number; quantity: number }>
  created_at: string
}

export interface PosCartLine {
  product_id: number
  quantity: number
}

function unwrap<T>(payload: { data?: T } | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data as T
  }
  return payload as T
}

export interface PosOutlet {
  id: number
  code: string
  name: string
}

export interface PosShopHome {
  open_sessions: Array<{
    id: number
    session_number: string
    cashier_name: string
    warehouse_name: string
    hold_count: number
    opened_at: string | null
    booked_cash_amount: number
  }>
  open_hold_count: number
  today: {
    sale_count: number
    omzet_amount: number
    last_sale_number: string | null
    last_sold_at: string | null
  }
  recent: {
    yesterday_sale_count: number
    yesterday_omzet_amount: number
    week_sale_count: number
    week_omzet_amount: number
    last_sale_number: string | null
    last_sold_at: string | null
  }
  low_stock: Array<{
    product_id: number
    sku: string
    name: string
    quantity: number
  }>
  draft_journal_count: number
}

export async function listPosOutlets(): Promise<PosOutlet[]> {
  const { data } = await api.get('/pos/outlets')
  return unwrap<PosOutlet[]>(data)
}

export async function fetchPosShopHome(): Promise<PosShopHome> {
  const { data } = await api.get('/pos/shop-home')
  return unwrap<PosShopHome>(data)
}

export async function openPosSession(warehouseId: number, openingCashAmount: number): Promise<PosSession> {
  const { data } = await api.post('/pos/sessions', {
    warehouse_id: warehouseId,
    opening_cash_amount: openingCashAmount,
  })
  return unwrap<PosSession>(data)
}

export async function currentPosSession(): Promise<PosSession | null> {
  try {
    const { data } = await api.get('/pos/sessions/current')
    return unwrap<PosSession>(data)
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status
    if (status === 404) {
      return null
    }
    throw error
  }
}

export async function getPosSession(sessionId: number): Promise<PosSession> {
  const { data } = await api.get(`/pos/sessions/${sessionId}`)
  return unwrap<PosSession>(data)
}

export async function listPosSales(sessionId: number): Promise<PosSale[]> {
  const { data } = await api.get(`/pos/sessions/${sessionId}/sales`, {
    params: { per_page: 100 },
  })
  const payload = unwrap<{ data?: PosSale[] } | PosSale[]>(data)
  return Array.isArray(payload) ? payload : (payload.data ?? [])
}

export async function closePosSession(sessionId: number, countedCashAmount: number): Promise<PosSession> {
  const { data } = await api.post(`/pos/sessions/${sessionId}/close`, {
    counted_cash_amount: countedCashAmount,
  })
  return unwrap<PosSession>(data)
}

export async function getPosCatalog(sessionId: number): Promise<PosCatalogProduct[]> {
  const { data } = await api.get(`/pos/sessions/${sessionId}/catalog`)
  return unwrap<PosCatalogProduct[]>(data)
}

export async function checkoutPosSale(
  sessionId: number,
  payload: { way: 'cash' | 'qris'; cash_received_amount?: number; lines: PosCartLine[] },
  idempotencyKey: string,
): Promise<PosSale> {
  const { data } = await api.post(`/pos/sessions/${sessionId}/checkout`, payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return unwrap<PosSale>(data)
}

export async function voidPosSale(sessionId: number, saleId: number, reason: string): Promise<PosSale> {
  const { data } = await api.post(`/pos/sessions/${sessionId}/sales/${saleId}/void`, { reason })
  return unwrap<PosSale>(data)
}

export async function holdPosCart(sessionId: number, lines: PosCartLine[]): Promise<PosHold> {
  const { data } = await api.post(`/pos/sessions/${sessionId}/holds`, { lines })
  return unwrap<PosHold>(data)
}

export async function listPosHolds(sessionId: number): Promise<PosHold[]> {
  const { data } = await api.get(`/pos/sessions/${sessionId}/holds`)
  return unwrap<PosHold[]>(data)
}

export async function takePosHold(sessionId: number, holdId: number): Promise<PosHold> {
  const { data } = await api.post(`/pos/sessions/${sessionId}/holds/${holdId}/take`)
  return unwrap<PosHold>(data)
}
