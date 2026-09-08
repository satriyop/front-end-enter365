import { createCrudHooks } from './factory'

export interface AnalyticAccount {
  id: number
  code: string
  name: string
  is_active: boolean
}

export interface AnalyticAccountFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface CreateAnalyticAccountData {
  code: string
  name: string
  is_active?: boolean
}

export type UpdateAnalyticAccountData = Partial<CreateAnalyticAccountData>

const hooks = createCrudHooks<
  AnalyticAccount,
  AnalyticAccountFilters,
  CreateAnalyticAccountData,
  UpdateAnalyticAccountData
>({
  resourceName: 'analytic-accounts',
  singularName: 'analytic-account',
  lookupParams: { is_active: true, per_page: 200 },
})

export const useAnalyticAccounts = hooks.useList
export const useAnalyticAccount = hooks.useSingle
export const useCreateAnalyticAccount = hooks.useCreate
export const useUpdateAnalyticAccount = hooks.useUpdate
export const useAnalyticAccountsLookup = hooks.useLookup

export interface AnalyticDistributionRow {
  id: string
  percentage: number
}

export function analyticDistributionRows(
  value: { [key: string]: number } | null | undefined,
): AnalyticDistributionRow[] {
  if (!value) {
    return []
  }

  return Object.entries(value).map(([id, percentage]) => ({
    id,
    percentage: Number(percentage),
  }))
}

export function analyticDistributionFromRows(
  rows: AnalyticDistributionRow[],
): { [key: string]: number } | null {
  const map: { [key: string]: number } = {}
  for (const row of rows) {
    if (!row.id) {
      continue
    }
    map[row.id] = Number(row.percentage) || 0
  }

  return Object.keys(map).length === 0 ? null : map
}

export function analyticDistributionPercentTotal(rows: AnalyticDistributionRow[]): number {
  return rows.reduce((sum, row) => sum + (Number(row.percentage) || 0), 0)
}

export function analyticDistributionFromAccountId(
  id: string | number | null | undefined,
): { [key: string]: number } | null {
  if (id === null || id === undefined || id === '') {
    return null
  }
  return { [String(id)]: 100 }
}

export function analyticDistributionPrimaryId(
  value: { [key: string]: number } | null | undefined,
): string {
  if (!value) {
    return ''
  }
  const keys = Object.keys(value)
  return keys[0] ?? ''
}

export function formatAnalyticDistributionLabel(
  value: { [key: string]: number } | null | undefined,
  accounts: AnalyticAccount[] | undefined,
): string {
  if (!value || Object.keys(value).length === 0) {
    return ''
  }

  return Object.entries(value)
    .map(([id, pct]) => {
      const account = accounts?.find((row) => String(row.id) === String(id))
      const label = account ? `${account.code} ${account.name}` : id
      return `${label} ${pct}%`
    })
    .join(', ')
}
