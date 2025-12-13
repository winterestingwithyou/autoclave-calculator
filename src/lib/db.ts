/**
 * IndexedDB Wrapper for Growtopia Autoclave Calculator
 * 
 * Uses `idb` library for cleaner IndexedDB API
 * Stores tool quantities and prices client-side only
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { ToolType } from './tools';
import { TOOL_NAMES } from './tools';
import type { PriceType } from './pricing';

const DB_NAME = 'autoclave-db';
const DB_VERSION = 2; // Bumped version for new price schema

// Object store names
const STORE_TOOLS = 'tools';
const STORE_PRICES = 'prices';

/**
 * Tool state stored in IndexedDB
 */
export interface StoredToolState {
  tool: ToolType;
  quantity: number;
}

/**
 * Tool price stored in IndexedDB
 * Now supports price type (items-per-wl or wl-each)
 */
export interface StoredToolPrice {
  tool: ToolType;
  priceValue: number;
  priceType: PriceType;
}

/**
 * Database schema type
 */
interface AutoclaveDB {
  tools: {
    key: ToolType;
    value: StoredToolState;
  };
  prices: {
    key: ToolType;
    value: StoredToolPrice;
  };
}

let dbInstance: IDBPDatabase<AutoclaveDB> | null = null;

/**
 * Initialize and get database instance
 */
export async function getDB(): Promise<IDBPDatabase<AutoclaveDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<AutoclaveDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create tools store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_TOOLS)) {
        db.createObjectStore(STORE_TOOLS, { keyPath: 'tool' });
      }

      // Create prices store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_PRICES)) {
        db.createObjectStore(STORE_PRICES, { keyPath: 'tool' });
      }
      
      // Migration: if upgrading from v1, clear prices to reset schema
      if (oldVersion < 2) {
        // Old prices had different schema, clear them
        const tx = db.transaction(STORE_PRICES, 'readwrite');
        tx.objectStore(STORE_PRICES).clear();
      }
    },
  });

  return dbInstance;
}

/**
 * Initialize database with default values if empty
 */
export async function initializeDB(): Promise<void> {
  const db = await getDB();
  
  // Check if tools store is empty
  const toolsCount = await db.count(STORE_TOOLS);
  if (toolsCount === 0) {
    const tx = db.transaction(STORE_TOOLS, 'readwrite');
    for (const tool of TOOL_NAMES) {
      await tx.store.put({ tool, quantity: 0 });
    }
    await tx.done;
  }

  // Check if prices store is empty or needs initialization
  const pricesCount = await db.count(STORE_PRICES);
  if (pricesCount === 0) {
    const tx = db.transaction(STORE_PRICES, 'readwrite');
    for (const tool of TOOL_NAMES) {
      await tx.store.put({ tool, priceValue: 0, priceType: 'wl-each' });
    }
    await tx.done;
  }
}

// ============ TOOL QUANTITY OPERATIONS ============

/**
 * Get all tool quantities
 */
export async function getAllToolQuantities(): Promise<StoredToolState[]> {
  const db = await getDB();
  return db.getAll(STORE_TOOLS);
}

/**
 * Get single tool quantity
 */
export async function getToolQuantity(tool: ToolType): Promise<number> {
  const db = await getDB();
  const state = await db.get(STORE_TOOLS, tool);
  return state?.quantity || 0;
}

/**
 * Set single tool quantity
 */
export async function setToolQuantity(tool: ToolType, quantity: number): Promise<void> {
  const db = await getDB();
  await db.put(STORE_TOOLS, { tool, quantity: Math.max(0, quantity) });
}

/**
 * Set all tool quantities at once
 */
export async function setAllToolQuantities(states: StoredToolState[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_TOOLS, 'readwrite');
  for (const state of states) {
    await tx.store.put({ tool: state.tool, quantity: Math.max(0, state.quantity) });
  }
  await tx.done;
}

/**
 * Reset all tool quantities to zero
 */
export async function resetAllToolQuantities(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_TOOLS, 'readwrite');
  for (const tool of TOOL_NAMES) {
    await tx.store.put({ tool, quantity: 0 });
  }
  await tx.done;
}

// ============ PRICE OPERATIONS ============

/**
 * Get all tool prices
 */
export async function getAllToolPrices(): Promise<StoredToolPrice[]> {
  const db = await getDB();
  const prices = await db.getAll(STORE_PRICES);
  // Ensure all prices have the new schema
  return prices.map((p) => ({
    tool: p.tool,
    priceValue: p.priceValue ?? 0,
    priceType: p.priceType ?? 'wl-each',
  }));
}

/**
 * Get single tool price with type
 */
export async function getToolPrice(tool: ToolType): Promise<StoredToolPrice> {
  const db = await getDB();
  const price = await db.get(STORE_PRICES, tool);
  return {
    tool,
    priceValue: price?.priceValue ?? 0,
    priceType: price?.priceType ?? 'wl-each',
  };
}

/**
 * Set single tool price with type
 */
export async function setToolPrice(
  tool: ToolType, 
  priceValue: number, 
  priceType: PriceType
): Promise<void> {
  const db = await getDB();
  await db.put(STORE_PRICES, { 
    tool, 
    priceValue: Math.max(0, priceValue),
    priceType 
  });
}

/**
 * Set all tool prices at once
 */
export async function setAllToolPrices(prices: StoredToolPrice[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_PRICES, 'readwrite');
  for (const price of prices) {
    await tx.store.put({ 
      tool: price.tool, 
      priceValue: Math.max(0, price.priceValue),
      priceType: price.priceType 
    });
  }
  await tx.done;
}

/**
 * Reset all prices to zero
 */
export async function resetAllToolPrices(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_PRICES, 'readwrite');
  for (const tool of TOOL_NAMES) {
    await tx.store.put({ tool, priceValue: 0, priceType: 'wl-each' });
  }
  await tx.done;
}

// ============ UTILITY ============

/**
 * Clear all data from database
 */
export async function clearAllData(): Promise<void> {
  await resetAllToolQuantities();
  await resetAllToolPrices();
  await resetAllMinRemainders();
}

/**
 * Export all data for backup
 */
export async function exportData(): Promise<{
  tools: StoredToolState[];
  prices: StoredToolPrice[];
  minRemainders: ToolMinRemainders;
}> {
  const tools = await getAllToolQuantities();
  const prices = await getAllToolPrices();
  const minRemainders = await getAllMinRemainders();
  return { tools, prices, minRemainders };
}

// ============ SETTINGS (using localStorage for simplicity) ============

const MIN_REMAINDER_KEY = 'autoclave-min-remainders';

/**
 * Min remainder setting per tool (stored as JSON object)
 */
export interface ToolMinRemainders {
  [tool: string]: number;
}

/**
 * Get all minimum remainder settings (per tool)
 */
export async function getAllMinRemainders(): Promise<ToolMinRemainders> {
  try {
    const stored = localStorage.getItem(MIN_REMAINDER_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      // Validate and sanitize
      const result: ToolMinRemainders = {};
      for (const tool of TOOL_NAMES) {
        const value = parsed[tool];
        result[tool] = typeof value === 'number' && !isNaN(value) ? Math.max(0, value) : 0;
      }
      return result;
    }
  } catch {
    // localStorage might not be available or invalid JSON
  }
  // Return default (all zeros)
  const defaults: ToolMinRemainders = {};
  for (const tool of TOOL_NAMES) {
    defaults[tool] = 0;
  }
  return defaults;
}

/**
 * Get minimum remainder for a specific tool
 */
export async function getMinRemainder(tool: ToolType): Promise<number> {
  const all = await getAllMinRemainders();
  return all[tool] || 0;
}

/**
 * Set minimum remainder for a specific tool
 */
export async function setMinRemainder(tool: ToolType, value: number): Promise<void> {
  try {
    const all = await getAllMinRemainders();
    all[tool] = Math.max(0, value);
    localStorage.setItem(MIN_REMAINDER_KEY, JSON.stringify(all));
  } catch {
    // localStorage might not be available
  }
}

/**
 * Set all minimum remainders at once
 */
export async function setAllMinRemainders(values: ToolMinRemainders): Promise<void> {
  try {
    const sanitized: ToolMinRemainders = {};
    for (const tool of TOOL_NAMES) {
      const value = values[tool];
      sanitized[tool] = typeof value === 'number' && !isNaN(value) ? Math.max(0, value) : 0;
    }
    localStorage.setItem(MIN_REMAINDER_KEY, JSON.stringify(sanitized));
  } catch {
    // localStorage might not be available
  }
}

/**
 * Reset all minimum remainders to zero
 */
export async function resetAllMinRemainders(): Promise<void> {
  const defaults: ToolMinRemainders = {};
  for (const tool of TOOL_NAMES) {
    defaults[tool] = 0;
  }
  await setAllMinRemainders(defaults);
}

/**
 * Import data from backup
 */
export async function importData(data: {
  tools: StoredToolState[];
  prices: StoredToolPrice[];
}): Promise<void> {
  await setAllToolQuantities(data.tools);
  await setAllToolPrices(data.prices);
}
