/**
 * Pricing Service
 *
 * Manages pricing strategies and calculates prices based on
 * strategy priority and applicability.
 */

import { eventBus } from '@/infrastructure/events'
import { logger } from '@/infrastructure/logger'
import type { PricingStrategy, PricingContext, PricingResult } from './types'

export class PricingService {
  private strategies: PricingStrategy[] = []

  /**
   * Add a pricing strategy
   */
  addStrategy(strategy: PricingStrategy): void {
    this.strategies.push(strategy)
    // Sort by priority (lower = higher priority)
    this.strategies.sort((a, b) => a.priority - b.priority)
    logger.debug('Pricing strategy added', {
      name: strategy.name,
      priority: strategy.priority,
    })
  }

  /**
   * Remove a pricing strategy by name
   */
  removeStrategy(name: string): void {
    this.strategies = this.strategies.filter((s) => s.name !== name)
  }

  /**
   * Get all registered strategies
   */
  getStrategies(): PricingStrategy[] {
    return [...this.strategies]
  }

  /**
   * Calculate price using first applicable strategy
   */
  calculatePrice(context: PricingContext): PricingResult {
    // Find first applicable strategy (strategies are sorted by priority)
    const strategy = this.strategies.find((s) => s.isApplicable(context))

    if (!strategy) {
      // No strategy applicable, return base price
      return {
        finalPrice: context.basePrice,
        discount: 0,
        discountPercent: 0,
        pricingRule: 'No applicable pricing rule',
      }
    }

    const result = strategy.calculatePrice(context)

    logger.debug('Price calculated', {
      strategy: strategy.name,
      basePrice: context.basePrice,
      finalPrice: result.finalPrice,
      discount: result.discount,
    })

    eventBus.emit('user:action', {
      action: 'price-calculated',
      target: `${strategy.name}:${result.pricingRule}`,
    })

    return result
  }

  /**
   * Get all applicable strategies for a context
   */
  getApplicableStrategies(context: PricingContext): PricingStrategy[] {
    return this.strategies.filter((s) => s.isApplicable(context))
  }

  /**
   * Calculate price and show all applicable strategies
   */
  calculateWithAnalysis(context: PricingContext): {
    result: PricingResult
    applicableStrategies: Array<{
      name: string
      priority: number
      result: PricingResult
    }>
  } {
    const applicableStrategies = this.getApplicableStrategies(context).map((s) => ({
      name: s.name,
      priority: s.priority,
      result: s.calculatePrice(context),
    }))

    return {
      result: this.calculatePrice(context),
      applicableStrategies,
    }
  }
}

// Singleton instance
export const pricingService = new PricingService()
