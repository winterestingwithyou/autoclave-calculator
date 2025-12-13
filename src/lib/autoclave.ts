/**
 * Growtopia Autoclave Core Logic
 * 
 * Rules:
 * - 20 tools of the SAME type → 1 of EACH other tool type (12 tools)
 * - Remainder < 20 is NOT processed
 * - All calculations are pure functions
 */

import {
  type ToolType,
  TOOL_NAMES,
  AUTOCLAVE_REQUIREMENT,
} from './tools';

/**
 * Input state for a single tool type
 */
export interface ToolInput {
  tool: ToolType;
  quantity: number;
}

/**
 * Result of autoclaving a single tool type
 */
export interface AutoclaveResult {
  inputTool: ToolType;
  inputQuantity: number;
  autoclaveCount: number;
  remainder: number;
  outputTools: ToolOutput[];
}

/**
 * Single output tool from autoclave
 */
export interface ToolOutput {
  tool: ToolType;
  quantity: number;
}

/**
 * Complete autoclave calculation result
 */
export interface AutoclaveCalculation {
  inputs: ToolInput[];
  results: AutoclaveResult[];
  totalOutput: Map<ToolType, number>;
  summary: ToolSummary[];
}

/**
 * Summary of final tool quantities
 */
export interface ToolSummary {
  tool: ToolType;
  originalQuantity: number;
  remainderAfterAutoclave: number;
  receivedFromAutoclave: number;
  finalQuantity: number;
}

/**
 * Calculate how many times a tool can be autoclaved
 */
export function calculateAutoclaveCount(quantity: number): number {
  return Math.floor(quantity / AUTOCLAVE_REQUIREMENT);
}

/**
 * Calculate remainder after autoclave
 */
export function calculateRemainder(quantity: number): number {
  return quantity % AUTOCLAVE_REQUIREMENT;
}

/**
 * Get all OTHER tool types (excluding the input tool)
 */
export function getOtherTools(excludeTool: ToolType): ToolType[] {
  return TOOL_NAMES.filter((t) => t !== excludeTool);
}

/**
 * Calculate autoclave result for a single tool type
 * Pure function, no side effects
 */
export function calculateSingleAutoclave(input: ToolInput): AutoclaveResult {
  const autoclaveCount = calculateAutoclaveCount(input.quantity);
  const remainder = calculateRemainder(input.quantity);
  
  const otherTools = getOtherTools(input.tool);
  const outputTools: ToolOutput[] = otherTools.map((tool) => ({
    tool,
    quantity: autoclaveCount, // Each autoclave produces 1 of each other tool
  }));

  return {
    inputTool: input.tool,
    inputQuantity: input.quantity,
    autoclaveCount,
    remainder,
    outputTools,
  };
}

/**
 * Calculate complete autoclave for all tool inputs
 * Main calculation function
 */
export function calculateFullAutoclave(inputs: ToolInput[]): AutoclaveCalculation {
  // Filter out zero quantities
  const validInputs = inputs.filter((input) => input.quantity > 0);
  
  // Calculate individual results
  const results = validInputs.map(calculateSingleAutoclave);
  
  // Aggregate total output from all autoclaves
  const totalOutput = new Map<ToolType, number>();
  
  for (const result of results) {
    for (const output of result.outputTools) {
      const current = totalOutput.get(output.tool) || 0;
      totalOutput.set(output.tool, current + output.quantity);
    }
  }
  
  // Create input map for quick lookup
  const inputMap = new Map<ToolType, number>();
  for (const input of inputs) {
    inputMap.set(input.tool, input.quantity);
  }
  
  // Calculate summary for all tools
  const summary: ToolSummary[] = TOOL_NAMES.map((tool) => {
    const originalQuantity = inputMap.get(tool) || 0;
    const result = results.find((r) => r.inputTool === tool);
    const remainderAfterAutoclave = result?.remainder || originalQuantity;
    const receivedFromAutoclave = totalOutput.get(tool) || 0;
    
    return {
      tool,
      originalQuantity,
      remainderAfterAutoclave,
      receivedFromAutoclave,
      finalQuantity: remainderAfterAutoclave + receivedFromAutoclave,
    };
  });

  return {
    inputs,
    results,
    totalOutput,
    summary,
  };
}

/**
 * Quick check if any tools can be autoclaved
 */
export function canAutoclave(inputs: ToolInput[]): boolean {
  return inputs.some((input) => input.quantity >= AUTOCLAVE_REQUIREMENT);
}

/**
 * Get total autoclave operations possible
 */
export function getTotalAutoclaveOperations(inputs: ToolInput[]): number {
  return inputs.reduce((sum, input) => sum + calculateAutoclaveCount(input.quantity), 0);
}
