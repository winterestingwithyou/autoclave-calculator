/**
 * Growtopia Surgical Tools - Fixed list of 13 tools
 * Tools are represented as literal union type for type safety
 */

export const TOOL_NAMES = [
  'Surgical Sponge',
  'Surgical Splint',
  'Surgical Antiseptic',
  'Surgical Antibiotics',
  'Surgical Anesthetic',
  'Surgical Scalpel',
  'Surgical Stitches',
  'Surgical Lab Kit',
  'Surgical Clamp',
  'Surgical Pins',
  'Surgical Transfusion',
  'Surgical Ultrasound',
  'Surgical Defibrillator',
] as const;

export type ToolType = (typeof TOOL_NAMES)[number];

export const TOOLS_COUNT = TOOL_NAMES.length;

// Autoclave requires exactly 20 tools of the same type
export const AUTOCLAVE_REQUIREMENT = 20;

// Number of output tools per autoclave (one of each OTHER tool type)
export const AUTOCLAVE_OUTPUT_COUNT = TOOLS_COUNT - 1;

/**
 * Tool metadata for display purposes
 */
export interface ToolMetadata {
  name: ToolType;
  shortName: string;
  color: string;
}

/**
 * Mapping of tools to their display metadata
 * Colors are inspired by Growtopia's pixel aesthetic
 */
export const TOOL_METADATA: Record<ToolType, ToolMetadata> = {
  'Surgical Sponge': {
    name: 'Surgical Sponge',
    shortName: 'Sponge',
    color: '#FFD700',
  },
  'Surgical Splint': {
    name: 'Surgical Splint',
    shortName: 'Splint',
    color: '#8B4513',
  },
  'Surgical Antiseptic': {
    name: 'Surgical Antiseptic',
    shortName: 'Antiseptic',
    color: '#00CED1',
  },
  'Surgical Antibiotics': {
    name: 'Surgical Antibiotics',
    shortName: 'Antibiotics',
    color: '#FF6347',
  },
  'Surgical Anesthetic': {
    name: 'Surgical Anesthetic',
    shortName: 'Anesthetic',
    color: '#9370DB',
  },
  'Surgical Scalpel': {
    name: 'Surgical Scalpel',
    shortName: 'Scalpel',
    color: '#C0C0C0',
  },
  'Surgical Stitches': {
    name: 'Surgical Stitches',
    shortName: 'Stitches',
    color: '#228B22',
  },
  'Surgical Lab Kit': {
    name: 'Surgical Lab Kit',
    shortName: 'Lab Kit',
    color: '#4169E1',
  },
  'Surgical Clamp': {
    name: 'Surgical Clamp',
    shortName: 'Clamp',
    color: '#708090',
  },
  'Surgical Pins': {
    name: 'Surgical Pins',
    shortName: 'Pins',
    color: '#B8860B',
  },
  'Surgical Transfusion': {
    name: 'Surgical Transfusion',
    shortName: 'Transfusion',
    color: '#DC143C',
  },
  'Surgical Ultrasound': {
    name: 'Surgical Ultrasound',
    shortName: 'Ultrasound',
    color: '#00FA9A',
  },
  'Surgical Defibrillator': {
    name: 'Surgical Defibrillator',
    shortName: 'Defib',
    color: '#FF4500',
  },
};

/**
 * Get all tool types as array
 */
export function getAllTools(): ToolType[] {
  return [...TOOL_NAMES];
}

/**
 * Check if a string is a valid tool type
 */
export function isValidTool(tool: string): tool is ToolType {
  return TOOL_NAMES.includes(tool as ToolType);
}
