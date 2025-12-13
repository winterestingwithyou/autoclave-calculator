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
  autoRepeat?: boolean; // Whether to auto-repeat autoclave on output tools
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
  iterations: number; // How many iterations were performed
  iterationDetails: IterationDetail[]; // Details per iteration
}

/**
 * Detail of a single iteration
 */
export interface IterationDetail {
  iteration: number;
  totalAutoclaves: number;
  toolsProcessed: { tool: ToolType; autoclaveCount: number }[];
}

/**
 * Summary of final tool quantities
 */
export interface ToolSummary {
  tool: ToolType;
  originalQuantity: number;
  minRemainder: number;
  autoRepeat: boolean;
  totalToolsUsed: number; // Total across all iterations
  totalReceived: number; // Total received across all iterations
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
 * Calculate complete autoclave with auto-repeat feature
 * Iteratively autoclaves tools until no more can be processed
 * Each input can have its own minRemainder and autoRepeat setting
 */
export function calculateFullAutoclave(inputs: ToolInput[]): AutoclaveCalculation {
  // Build config maps from inputs
  const configMap = new Map<ToolType, { minRemainder: number; autoRepeat: boolean }>();
  for (const input of inputs) {
    configMap.set(input.tool, {
      minRemainder: input.minRemainder || 0,
      autoRepeat: input.autoRepeat !== false, // Default true
    });
  }
  
  // Current quantities (will be mutated during iterations)
  const currentQuantities = new Map<ToolType, number>();
  for (const tool of TOOL_NAMES) {
    const input = inputs.find(i => i.tool === tool);
    currentQuantities.set(tool, input?.quantity || 0);
  }
  
  // Track totals
  const totalUsed = new Map<ToolType, number>();
  const totalReceived = new Map<ToolType, number>();
  for (const tool of TOOL_NAMES) {
    totalUsed.set(tool, 0);
    totalReceived.set(tool, 0);
  }
  
  const allResults: AutoclaveResult[] = [];
  const iterationDetails: IterationDetail[] = [];
  let iteration = 0;
  const MAX_ITERATIONS = 1000; // Safety limit
  
  // Keep iterating until no more autoclaves can be done
  while (iteration < MAX_ITERATIONS) {
    iteration++;
    
    // Build inputs for this iteration
    const iterInputs: ToolInput[] = TOOL_NAMES.map(tool => {
      const config = configMap.get(tool) || { minRemainder: 0, autoRepeat: true };
      const quantity = currentQuantities.get(tool) || 0;
      
      // Only process if autoRepeat is enabled (or first iteration)
      // First iteration always processes regardless of autoRepeat
      const shouldProcess = iteration === 1 || config.autoRepeat;
      
      return {
        tool,
        quantity: shouldProcess ? quantity : 0,
        minRemainder: config.minRemainder,
      };
    }).filter(i => i.quantity > 0);
    
    // Calculate autoclaves for this iteration
    const iterResults = iterInputs
      .map(input => calculateSingleAutoclave(input))
      .filter(r => r.autoclaveCount > 0);
    
    // If no autoclaves happened, we're done
    if (iterResults.length === 0) {
      break;
    }
    
    // Record iteration detail
    const detail: IterationDetail = {
      iteration,
      totalAutoclaves: iterResults.reduce((sum, r) => sum + r.autoclaveCount, 0),
      toolsProcessed: iterResults.map(r => ({
        tool: r.inputTool,
        autoclaveCount: r.autoclaveCount,
      })),
    };
    iterationDetails.push(detail);
    
    // Apply results
    for (const result of iterResults) {
      allResults.push(result);
      
      // Update current quantity (subtract used)
      const currentQty = currentQuantities.get(result.inputTool) || 0;
      currentQuantities.set(result.inputTool, currentQty - result.toolsUsed);
      
      // Track total used
      const prevUsed = totalUsed.get(result.inputTool) || 0;
      totalUsed.set(result.inputTool, prevUsed + result.toolsUsed);
      
      // Add output tools to current quantities and track received
      for (const output of result.outputTools) {
        const outputQty = currentQuantities.get(output.tool) || 0;
        currentQuantities.set(output.tool, outputQty + output.quantity);
        
        const prevReceived = totalReceived.get(output.tool) || 0;
        totalReceived.set(output.tool, prevReceived + output.quantity);
      }
    }
  }
  
  // Build final summary
  const summary: ToolSummary[] = TOOL_NAMES.map(tool => {
    const input = inputs.find(i => i.tool === tool);
    const config = configMap.get(tool) || { minRemainder: 0, autoRepeat: true };
    
    return {
      tool,
      originalQuantity: input?.quantity || 0,
      minRemainder: config.minRemainder,
      autoRepeat: config.autoRepeat,
      totalToolsUsed: totalUsed.get(tool) || 0,
      totalReceived: totalReceived.get(tool) || 0,
      finalQuantity: currentQuantities.get(tool) || 0,
    };
  });
  
  // Build total output map (final received amounts)
  const totalOutput = new Map<ToolType, number>();
  for (const tool of TOOL_NAMES) {
    totalOutput.set(tool, totalReceived.get(tool) || 0);
  }

  return {
    inputs,
    results: allResults,
    totalOutput,
    summary,
    iterations: iterationDetails.length,
    iterationDetails,
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
