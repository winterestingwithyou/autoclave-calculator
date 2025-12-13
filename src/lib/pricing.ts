/**
 * Growtopia Tool Pricing Logic
 * 
 * Handles WL (World Lock) value calculations
 * - Price is per tool, input by user
 * - Calculates total value before and after autoclave
 */

import type { ToolType } from './tools';
import { TOOL_NAMES } from './tools';
import type { AutoclaveCalculation, ToolInput } from './autoclave';

/**
 * Price per tool type
 */
export interface ToolPrice {
  tool: ToolType;
  pricePerWL: number;
}

/**
 * Value calculation result
 */
export interface ValueCalculation {
  beforeValue: number;
  afterValue: number;
  difference: number;
  profitPercent: number;
  isProfitable: boolean;
}

/**
 * Detailed value breakdown per tool
 */
export interface ToolValueBreakdown {
  tool: ToolType;
  pricePerWL: number;
  beforeQuantity: number;
  afterQuantity: number;
  beforeValue: number;
  afterValue: number;
  valueDifference: number;
}

/**
 * Calculate total WL value for a set of tools
 */
export function calculateTotalValue(
  tools: ToolInput[],
  prices: Map<ToolType, number>
): number {
  return tools.reduce((total, { tool, quantity }) => {
    const price = prices.get(tool) || 0;
    return total + quantity * price;
  }, 0);
}

/**
 * Calculate value before autoclave
 */
export function calculateBeforeValue(
  inputs: ToolInput[],
  prices: Map<ToolType, number>
): number {
  return calculateTotalValue(inputs, prices);
}

/**
 * Calculate value after autoclave
 */
export function calculateAfterValue(
  calculation: AutoclaveCalculation,
  prices: Map<ToolType, number>
): number {
  const afterTools: ToolInput[] = calculation.summary.map((s) => ({
    tool: s.tool,
    quantity: s.finalQuantity,
  }));
  return calculateTotalValue(afterTools, prices);
}

/**
 * Full value calculation with before/after comparison
 */
export function calculateValueDifference(
  calculation: AutoclaveCalculation,
  prices: Map<ToolType, number>
): ValueCalculation {
  const beforeValue = calculateBeforeValue(calculation.inputs, prices);
  const afterValue = calculateAfterValue(calculation, prices);
  const difference = afterValue - beforeValue;
  const profitPercent = beforeValue > 0 ? (difference / beforeValue) * 100 : 0;

  return {
    beforeValue,
    afterValue,
    difference,
    profitPercent,
    isProfitable: difference > 0,
  };
}

/**
 * Get detailed breakdown of value changes per tool
 */
export function getValueBreakdown(
  calculation: AutoclaveCalculation,
  prices: Map<ToolType, number>
): ToolValueBreakdown[] {
  return calculation.summary.map((s) => {
    const pricePerWL = prices.get(s.tool) || 0;
    const beforeValue = s.originalQuantity * pricePerWL;
    const afterValue = s.finalQuantity * pricePerWL;

    return {
      tool: s.tool,
      pricePerWL,
      beforeQuantity: s.originalQuantity,
      afterQuantity: s.finalQuantity,
      beforeValue,
      afterValue,
      valueDifference: afterValue - beforeValue,
    };
  });
}

/**
 * Create a price map from array of prices
 */
export function createPriceMap(prices: ToolPrice[]): Map<ToolType, number> {
  const map = new Map<ToolType, number>();
  for (const { tool, pricePerWL } of prices) {
    map.set(tool, pricePerWL);
  }
  return map;
}

/**
 * Get default prices (all zero)
 */
export function getDefaultPrices(): ToolPrice[] {
  return TOOL_NAMES.map((tool) => ({
    tool,
    pricePerWL: 0,
  }));
}

/**
 * Format WL value for display
 */
export function formatWL(value: number): string {
  if (value >= 100) {
    const dls = value / 100;
    return `${dls.toFixed(2)} DL`;
  }
  return `${value.toFixed(2)} WL`;
}

/**
 * Format difference with +/- sign
 */
export function formatDifference(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatWL(value)}`;
}
