/**
 * Growtopia Tool Pricing Logic
 * 
 * Handles WL (World Lock) value calculations
 * Supports two Growtopia price formats:
 * - "X items per WL" (items/wl) - multiple items for 1 WL
 * - "X WLs each" (wl/item) - multiple WLs for 1 item
 */

import type { ToolType } from './tools';
import { TOOL_NAMES } from './tools';
import type { AutoclaveCalculation, ToolInput } from './autoclave';

/**
 * Price type enum for Growtopia pricing formats
 */
export type PriceType = 'items-per-wl' | 'wl-each';

/**
 * Price per tool type with format
 */
export interface ToolPrice {
  tool: ToolType;
  priceValue: number;
  priceType: PriceType;
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
  priceValue: number;
  priceType: PriceType;
  wlPerItem: number;
  beforeQuantity: number;
  afterQuantity: number;
  beforeValue: number;
  afterValue: number;
  valueDifference: number;
}

/**
 * Convert price to WL per item (normalized)
 * This is the key conversion function
 */
export function toWLPerItem(priceValue: number, priceType: PriceType): number {
  if (priceValue <= 0) return 0;
  
  if (priceType === 'items-per-wl') {
    // X items per WL -> 1/X WL per item
    return 1 / priceValue;
  } else {
    // X WL each -> X WL per item
    return priceValue;
  }
}

/**
 * Format price for display based on type
 */
export function formatPrice(priceValue: number, priceType: PriceType): string {
  if (priceValue <= 0) return '-';
  
  if (priceType === 'items-per-wl') {
    return `${priceValue}/WL`;
  } else {
    return `${priceValue} WL`;
  }
}

/**
 * Calculate total WL value for a set of tools
 */
export function calculateTotalValue(
  tools: ToolInput[],
  prices: Map<ToolType, { value: number; type: PriceType }>
): number {
  return tools.reduce((total, { tool, quantity }) => {
    const price = prices.get(tool);
    if (!price || price.value <= 0) return total;
    
    const wlPerItem = toWLPerItem(price.value, price.type);
    return total + quantity * wlPerItem;
  }, 0);
}

/**
 * Calculate value before autoclave
 */
export function calculateBeforeValue(
  inputs: ToolInput[],
  prices: Map<ToolType, { value: number; type: PriceType }>
): number {
  return calculateTotalValue(inputs, prices);
}

/**
 * Calculate value after autoclave
 */
export function calculateAfterValue(
  calculation: AutoclaveCalculation,
  prices: Map<ToolType, { value: number; type: PriceType }>
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
  prices: Map<ToolType, { value: number; type: PriceType }>
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
  prices: Map<ToolType, { value: number; type: PriceType }>
): ToolValueBreakdown[] {
  return calculation.summary.map((s) => {
    const price = prices.get(s.tool) || { value: 0, type: 'wl-each' as PriceType };
    const wlPerItem = toWLPerItem(price.value, price.type);
    const beforeValue = s.originalQuantity * wlPerItem;
    const afterValue = s.finalQuantity * wlPerItem;

    return {
      tool: s.tool,
      priceValue: price.value,
      priceType: price.type,
      wlPerItem,
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
export function createPriceMap(
  prices: ToolPrice[]
): Map<ToolType, { value: number; type: PriceType }> {
  const map = new Map<ToolType, { value: number; type: PriceType }>();
  for (const { tool, priceValue, priceType } of prices) {
    map.set(tool, { value: priceValue, type: priceType });
  }
  return map;
}

/**
 * Get default prices (all zero with wl-each type)
 */
export function getDefaultPrices(): ToolPrice[] {
  return TOOL_NAMES.map((tool) => ({
    tool,
    priceValue: 0,
    priceType: 'wl-each' as PriceType,
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
