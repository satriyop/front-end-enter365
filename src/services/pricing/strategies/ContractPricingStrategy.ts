/**
 * Contract Pricing Strategy
 *
 * Applies fixed contract prices for specific customers.
 * Has highest priority as contract prices override other discounts.
 */

import type { PricingStrategy, PricingContext, PricingResult, ContractPrice } from '../types'

export class ContractPricingStrategy implements PricingStrategy {
  readonly name = 'Contract Pricing'
  readonly priority = 10 // Highest priority

  private contracts: ContractPrice[]

  constructor(contracts: ContractPrice[] = []) {
    this.contracts = contracts
  }

  /**
   * Add a contract price
   */
  addContract(contract: ContractPrice): void {
    this.contracts.push(contract)
  }

  /**
   * Remove a contract price
   */
  removeContract(customerId: number, productId: number): void {
    this.contracts = this.contracts.filter(
      (c) => !(c.customerId === customerId && c.productId === productId)
    )
  }

  /**
   * Update contracts (replace all)
   */
  setContracts(contracts: ContractPrice[]): void {
    this.contracts = contracts
  }

  isApplicable(context: PricingContext): boolean {
    if (!context.customerId) {
      return false
    }

    const now = context.date ?? new Date()
    return this.contracts.some(
      (c) =>
        c.customerId === context.customerId &&
        c.productId === context.productId &&
        c.validFrom <= now &&
        c.validUntil >= now
    )
  }

  calculatePrice(context: PricingContext): PricingResult {
    const now = context.date ?? new Date()
    const contract = this.contracts.find(
      (c) =>
        c.customerId === context.customerId &&
        c.productId === context.productId &&
        c.validFrom <= now &&
        c.validUntil >= now
    )

    if (!contract) {
      return {
        finalPrice: context.basePrice,
        discount: 0,
        discountPercent: 0,
        pricingRule: 'Standard',
      }
    }

    const discount = context.basePrice - contract.contractPrice
    const discountPercent =
      context.basePrice > 0 ? (discount / context.basePrice) * 100 : 0

    return {
      finalPrice: contract.contractPrice,
      discount: Math.max(0, discount),
      discountPercent: Math.max(0, discountPercent),
      pricingRule: 'Contract Price',
    }
  }

  /**
   * Get contract for a specific customer and product
   */
  getContract(customerId: number, productId: number): ContractPrice | null {
    const now = new Date()
    return (
      this.contracts.find(
        (c) =>
          c.customerId === customerId &&
          c.productId === productId &&
          c.validFrom <= now &&
          c.validUntil >= now
      ) ?? null
    )
  }
}
