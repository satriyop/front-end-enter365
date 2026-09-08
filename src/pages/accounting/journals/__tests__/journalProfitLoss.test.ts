import { describe, expect, it } from 'vitest'
import type { CreateJournalData } from '@/api/useJournals'

describe('journal profit/loss accounts', () => {
  it('includes nullable profit and loss account ids on bank/cash payloads', () => {
    const payload: CreateJournalData = {
      name: 'Bank Mandiri',
      type: 'bank',
      sequence_prefix: 'MDR-',
      profit_account_id: 11,
      loss_account_id: 12,
    }

    expect(payload.profit_account_id).toBe(11)
    expect(payload.loss_account_id).toBe(12)
  })

  it('clears profit and loss when the journal is not bank or cash', () => {
    const type = 'sales'
    const bankOrCash = type === 'bank' || type === 'cash'
    const profit_account_id = bankOrCash ? 11 : null
    const loss_account_id = bankOrCash ? 12 : null

    expect(profit_account_id).toBeNull()
    expect(loss_account_id).toBeNull()
  })
})
