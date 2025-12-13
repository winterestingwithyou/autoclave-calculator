/**
 * Growtopia Autoclave Core Logic
 * 
 * Rules:
 * - 20 tools of the SAME type → 1 of EACH other tool type (12 tools)
 * - Remainder < 20 is NOT processed
 * - All calculations are pure functions
 * - Supports minimum remainder limit per tool (keep X tools minimum)
 */

import {
  type ToolType,
  TOOL_NAMES,
  AUTOCLAVE_REQUIREMENT,
} from './tools';

/**
 * Input state for a single tool type with optional min remainder
 */
export interface ToolInput {
  tool: ToolType;
  quantity: number;
  minRemainder?: number;
}

/**
 * Result of autoclaving a single tool type
 */
export interface AutoclaveResult {
  inputTool: ToolType;
  inputQuantity: number;
  autoclaveCount: number;
  toolsUsed: number;
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
  minRemainder: number;
  toolsUsed: number;
  remainderAfterAutoclave: number;
  receivedFromAutoclave: number;
  finalQuantity: number;
}

/**
 * Calculate how many times a tool can be autoclaved with minimum remainder constraint
 * @param quantity - Total quantity of tools
 * @param minRemainder - Minimum tools to keep (default 0)
 */
export function calculateAutoclaveCount(quantity: number, minRemainder: number = 0): number {
  // Available tools for autoclave = total - minimum to keep
  const availableForAutoclave = Math.max(0, quantity - minRemainder);
  return Math.floor(availableForAutoclave / AUTOCLAVE_REQUIREMENT);
}

/**
 * Calculate remainder after autoclave with minimum remainder constraint
 */
export function calculateRemainder(quantity: number, autoclaveCount: number): number {
  const toolsUsed = autoclaveCount * AUTOCLAVE_REQUIREMENT;
  return quantity - toolsUsed;
}

/**
 * Get all OTHER tool types (excluding the input tool)
 */
export function getOtherTools(excludeTool: ToolType): ToolType[] {
  return TOOL_NAMES.filter((t) => t !== excludeTool);
}

/**
 * Calculate autoclave result for a single tool type
 * @param input - Tool input with quantity and optional minRemainder
 */
export function calculateSingleAutoclave(input: ToolInput): AutoclaveResult {
  const minRemainder = input.minRemainder || 0;
  const autoclaveCount = calculateAutoclaveCount(input.quantity, minRemainder);
  const toolsUsed = autoclaveCount * AUTOCLAVE_REQUIREMENT;
  const remainder = input.quantity - toolsUsed;
  
  const otherTools = getOtherTools(input.tool);
  const outputTools: ToolOutput[] = otherTools.map((tool) => ({
    tool,
    quantity: autoclaveCount, // Each autoclave produces 1 of each other tool
  }));

  return {
    inputTool: input.tool,
    inputQuantity: input.quantity,
    autoclaveCount,
    toolsUsed,
    remainder,
    outputTools,
  };
}

/**
 * Calculate complete autoclave for all tool inputs
 * Each input can have its own minRemainder
 */
export function calculateFullAutoclave(inputs: ToolInput[]): AutoclaveCalculation {
  // Filter out zero quantities
  const validInputs = inputs.filter((input) => input.quantity > 0);
  
  // Calculate individual results (each with its own minRemainder)
  const results = validInputs.map((input) => calculateSingleAutoclave(input));
  
  // Aggregate total output from all autoclaves
  const totalOutput = new Map<ToolType, number>();
  
  for (const result of results) {
    for (const output of result.outputTools) {
      const current = totalOutput.get(output.tool) || 0;
      totalOutput.set(output.tool, current + output.quantity);
    }
  }
  
  // Create input map for quick lookup
  const inputMap = new Map<ToolType, ToolInput>();
  for (const input of inputs) {
    inputMap.set(input.tool, input);
  }
  
  // Create results map for quick lookup
  const resultsMap = new Map<ToolType, AutoclaveResult>();
  for (const result of results) {
    resultsMap.set(result.inputTool, result);
  }
  
  // Calculate summary for all tools
  const summary: ToolSummary[] = TOOL_NAMES.map((tool) => {
    const input = inputMap.get(tool);
    const originalQuantity = input?.quantity || 0;
    const minRemainder = input?.minRemainder || 0;
    const result = resultsMap.get(tool);
    
    // If this tool was autoclaved, use the result
    // Otherwise, remainder = original quantity (nothing was autoclaved)
    const toolsUsed = result?.toolsUsed || 0;
    const remainderAfterAutoclave = result ? result.remainder : originalQuantity;
    const receivedFromAutoclave = totalOutput.get(tool) || 0;
    
    return {
      tool,
      originalQuantity,
      minRemainder,
      toolsUsed,
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
  return inputs.some((input) => 
    calculateAutoclaveCount(input.quantity, input.minRemainder || 0) > 0
  );
}

/**
 * Get total autoclave operations possible
 */
export function getTotalAutoclaveOperations(inputs: ToolInput[]): number {
  return inputs.reduce((sum, input) => 
    sum + calculateAutoclaveCount(input.quantity, input.minRemainder || 0), 0
  );
}
