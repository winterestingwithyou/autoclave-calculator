/**
 * Growtopia Surgical Tools - Fixed list of 13 tools
 * Tools are represented as literal union type for type safety
 */

export const TOOL_NAMES = [
  "Surgical Sponge",
  "Surgical Splint",
  "Surgical Antiseptic",
  "Surgical Antibiotics",
  "Surgical Anesthetic",
  "Surgical Scalpel",
  "Surgical Stitches",
  "Surgical Lab Kit",
  "Surgical Clamp",
  "Surgical Pins",
  "Surgical Transfusion",
  "Surgical Ultrasound",
  "Surgical Defibrillator",
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
  image: string;
}

/**
 * Mapping of tools to their display metadata
 * Colors are inspired by Growtopia's pixel aesthetic
 */
export const TOOL_METADATA: Record<ToolType, ToolMetadata> = {
  "Surgical Sponge": {
    name: "Surgical Sponge",
    shortName: "Sponge",
    color: "#FFD700",
    image: "/images/surgical/tools/sponge.webp",
  },
  "Surgical Splint": {
    name: "Surgical Splint",
    shortName: "Splint",
    color: "#8B4513",
    image: "/images/surgical/tools/splint.webp",
  },
  "Surgical Antiseptic": {
    name: "Surgical Antiseptic",
    shortName: "Antiseptic",
    color: "#00CED1",
    image: "/images/surgical/tools/antiseptic.webp",
  },
  "Surgical Antibiotics": {
    name: "Surgical Antibiotics",
    shortName: "Antibiotics",
    color: "#FF6347",
    image: "/images/surgical/tools/antibiotics.webp",
  },
  "Surgical Anesthetic": {
    name: "Surgical Anesthetic",
    shortName: "Anesthetic",
    color: "#9370DB",
    image: "/images/surgical/tools/anesthetic.webp",
  },
  "Surgical Scalpel": {
    name: "Surgical Scalpel",
    shortName: "Scalpel",
    color: "#C0C0C0",
    image: "/images/surgical/tools/scalpel.webp",
  },
  "Surgical Stitches": {
    name: "Surgical Stitches",
    shortName: "Stitches",
    color: "#228B22",
    image: "/images/surgical/tools/stitches.webp",
  },
  "Surgical Lab Kit": {
    name: "Surgical Lab Kit",
    shortName: "Lab Kit",
    color: "#4169E1",
    image: "/images/surgical/tools/lab-kit.webp",
  },
  "Surgical Clamp": {
    name: "Surgical Clamp",
    shortName: "Clamp",
    color: "#708090",
    image: "/images/surgical/tools/clamp.webp",
  },
  "Surgical Pins": {
    name: "Surgical Pins",
    shortName: "Pins",
    color: "#B8860B",
    image: "/images/surgical/tools/pins.webp",
  },
  "Surgical Transfusion": {
    name: "Surgical Transfusion",
    shortName: "Transfusion",
    color: "#DC143C",
    image: "/images/surgical/tools/transfusion.webp",
  },
  "Surgical Ultrasound": {
    name: "Surgical Ultrasound",
    shortName: "Ultrasound",
    color: "#00FA9A",
    image: "/images/surgical/tools/ultrasound.webp",
  },
  "Surgical Defibrillator": {
    name: "Surgical Defibrillator",
    shortName: "Defib",
    color: "#FF4500",
    image: "/images/surgical/tools/defibrillator.webp",
  },
};

// Autoclave machine image path
export const AUTOCLAVE_IMAGE = "/images/surgical/autoclave.webp";

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
