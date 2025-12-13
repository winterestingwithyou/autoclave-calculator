/**
 * Autoclave Calculator - Main Interactive Component
 * Handles tool input, price management, and result display
 */

import { useState, useEffect, useCallback } from 'react';
import { TOOL_NAMES, type ToolType } from '../lib/tools';
import { calculateFullAutoclave, type ToolInput } from '../lib/autoclave';
import {
  calculateValueDifference,
  getValueBreakdown,
  createPriceMap,
  type PriceType,
} from '../lib/pricing';
import {
  initializeDB,
  getAllToolQuantities,
  getAllToolPrices,
  setToolQuantity,
  setToolPrice,
  resetAllToolQuantities,
  resetAllToolPrices,
  getAllMinRemainders,
  setMinRemainder as saveMinRemainder,
  resetAllMinRemainders,
  type ToolMinRemainders,
} from '../lib/db';
import { ToolInputRow } from './ToolInputRow';
import { ResultTable } from './ResultTable';

interface PriceData {
  value: number;
  type: PriceType;
}

export function AutoclaveCalculator() {
  // State
  const [quantities, setQuantities] = useState<Map<ToolType, number>>(new Map());
  const [prices, setPrices] = useState<Map<ToolType, PriceData>>(new Map());
  const [minRemainders, setMinRemainders] = useState<ToolMinRemainders>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'input' | 'result'>('input');

  // Initialize from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        await initializeDB();
        
        const storedQuantities = await getAllToolQuantities();
        const storedPrices = await getAllToolPrices();
        const storedMinRemainders = await getAllMinRemainders();
        
        const qMap = new Map<ToolType, number>();
        for (const { tool, quantity } of storedQuantities) {
          qMap.set(tool, quantity);
        }
        
        const pMap = new Map<ToolType, PriceData>();
        for (const { tool, priceValue, priceType } of storedPrices) {
          pMap.set(tool, { value: priceValue, type: priceType });
        }
        
        setQuantities(qMap);
        setPrices(pMap);
        setMinRemainders(storedMinRemainders);
      } catch (error) {
        console.error('Failed to load data from IndexedDB:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Handlers
  const handleQuantityChange = useCallback(async (tool: ToolType, quantity: number) => {
    setQuantities((prev) => {
      const next = new Map(prev);
      next.set(tool, quantity);
      return next;
    });
    
    try {
      await setToolQuantity(tool, quantity);
    } catch (error) {
      console.error('Failed to save quantity:', error);
    }
  }, []);

  const handlePriceChange = useCallback(async (tool: ToolType, value: number, type: PriceType) => {
    setPrices((prev) => {
      const next = new Map(prev);
      next.set(tool, { value, type });
      return next;
    });
    
    try {
      await setToolPrice(tool, value, type);
    } catch (error) {
      console.error('Failed to save price:', error);
    }
  }, []);

  const handleMinRemainderChange = useCallback(async (tool: ToolType, value: number) => {
    const newValue = Math.max(0, value);
    setMinRemainders((prev) => ({
      ...prev,
      [tool]: newValue,
    }));
    
    try {
      await saveMinRemainder(tool, newValue);
    } catch (error) {
      console.error('Failed to save min remainder:', error);
    }
  }, []);

  const handleResetQuantities = useCallback(async () => {
    if (!confirm('Reset semua jumlah tools ke 0?')) return;
    
    try {
      await resetAllToolQuantities();
      setQuantities(new Map());
    } catch (error) {
      console.error('Failed to reset quantities:', error);
    }
  }, []);

  const handleResetPrices = useCallback(async () => {
    if (!confirm('Reset semua harga ke 0?')) return;
    
    try {
      await resetAllToolPrices();
      const newPrices = new Map<ToolType, PriceData>();
      TOOL_NAMES.forEach(tool => {
        newPrices.set(tool, { value: 0, type: 'wl-each' });
      });
      setPrices(newPrices);
    } catch (error) {
      console.error('Failed to reset prices:', error);
    }
  }, []);

  const handleResetMinRemainders = useCallback(async () => {
    if (!confirm('Reset semua minimum sisa ke 0?')) return;
    
    try {
      await resetAllMinRemainders();
      const defaults: ToolMinRemainders = {};
      TOOL_NAMES.forEach(tool => {
        defaults[tool] = 0;
      });
      setMinRemainders(defaults);
    } catch (error) {
      console.error('Failed to reset min remainders:', error);
    }
  }, []);

  // Calculate results with per-tool minRemainder
  const inputs: ToolInput[] = TOOL_NAMES.map((tool) => ({
    tool,
    quantity: quantities.get(tool) || 0,
    minRemainder: minRemainders[tool] || 0,
  }));

  const calculation = calculateFullAutoclave(inputs);
  const priceMap = createPriceMap(
    TOOL_NAMES.map((tool) => {
      const p = prices.get(tool) || { value: 0, type: 'wl-each' as PriceType };
      return { tool, priceValue: p.value, priceType: p.type };
    })
  );
  const valueCalc = calculateValueDifference(calculation, priceMap);
  const breakdown = getValueBreakdown(calculation, priceMap);

  const totalTools = inputs.reduce((sum, i) => sum + i.quantity, 0);
  const totalAutoclaves = calculation.results.reduce((sum, r) => sum + r.autoclaveCount, 0);
  
  // Check if all tools have prices set
  const missingPrices = TOOL_NAMES.filter(tool => {
    const p = prices.get(tool);
    return !p || p.value <= 0;
  });
  const allPricesSet = missingPrices.length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-amber-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Price Warning */}
      {!allPricesSet && (
        <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700 rounded-lg">
          <p className="text-amber-400 text-sm">
            ⚠️ <strong>Harga belum lengkap!</strong> Isi harga untuk semua tools agar kalkulasi nilai akurat.
          </p>
          <p className="text-amber-600 text-xs mt-1">
            Missing: {missingPrices.length} tools
          </p>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label="Total Tools" value={totalTools.toString()} />
        <StatBox label="Autoclave" value={`${totalAutoclaves}×`} highlight />
        <StatBox label="Nilai Awal" value={`${valueCalc.beforeValue.toFixed(2)} WL`} />
        <StatBox 
          label="Selisih" 
          value={`${valueCalc.difference >= 0 ? '+' : ''}${valueCalc.difference.toFixed(2)} WL`}
          highlight={valueCalc.difference !== 0}
          positive={valueCalc.difference > 0}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <TabButton 
          active={activeTab === 'input'} 
          onClick={() => setActiveTab('input')}
        >
          📝 Input
        </TabButton>
        <TabButton 
          active={activeTab === 'result'} 
          onClick={() => setActiveTab('result')}
        >
          📊 Hasil
        </TabButton>
      </div>

      {/* Content */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
        {activeTab === 'input' ? (
          <>
            {/* Price Format Info */}
            <div className="mb-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
              <p className="font-medium text-gray-300 mb-1">💡 Format Harga:</p>
              <ul className="space-y-1 ml-4">
                <li><span className="text-amber-400">/WL</span> = items per WL (contoh: 5/WL = 5 item harganya 1 WL)</li>
                <li><span className="text-amber-400">WL</span> = WL per item (contoh: 2 WL = 1 item harganya 2 WL)</li>
              </ul>
            </div>

            {/* Input Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-600 text-gray-400">
                    <th className="py-2 px-3 text-left">Tool</th>
                    <th className="py-2 px-3 text-center">Jumlah</th>
                    <th className="py-2 px-3 text-center">Min Sisa</th>
                    <th className="py-2 px-3 text-center">Harga</th>
                    <th className="py-2 px-3 text-center">WL/Item</th>
                    <th className="py-2 px-3 text-center">Autoclave</th>
                    <th className="py-2 px-3 text-center">Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {TOOL_NAMES.map((tool) => {
                    const priceData = prices.get(tool) || { value: 0, type: 'wl-each' as PriceType };
                    return (
                      <ToolInputRow
                        key={tool}
                        tool={tool}
                        quantity={quantities.get(tool) || 0}
                        priceValue={priceData.value}
                        priceType={priceData.type}
                        minRemainder={minRemainders[tool] || 0}
                        onQuantityChange={handleQuantityChange}
                        onPriceChange={handlePriceChange}
                        onMinRemainderChange={handleMinRemainderChange}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Reset Buttons */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={handleResetQuantities}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 
                           rounded border border-gray-600 transition-colors"
              >
                Reset Jumlah
              </button>
              <button
                onClick={handleResetMinRemainders}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 
                           rounded border border-gray-600 transition-colors"
              >
                Reset Min Sisa
              </button>
              <button
                onClick={handleResetPrices}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 
                           rounded border border-gray-600 transition-colors"
              >
                Reset Harga
              </button>
            </div>
          </>
        ) : (
          <ResultTable
            calculation={calculation}
            valueCalc={valueCalc}
            breakdown={breakdown}
          />
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h4 className="text-amber-400 font-bold mb-2">ℹ️ Cara Kerja Autoclave</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• 20 tools <strong>yang sama</strong> → 1 dari <strong>setiap</strong> tool lain (12 tools)</li>
          <li>• Sisa &lt; 20 tidak diproses</li>
          <li>• 40 tools = 2× autoclave = 24 tools baru</li>
          <li>• Gunakan "Min Sisa" per tool untuk membatasi berapa tools yang ingin disimpan</li>
        </ul>
      </div>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}

function StatBox({ label, value, highlight, positive }: StatBoxProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-bold ${
        highlight 
          ? positive 
            ? 'text-green-400' 
            : positive === false 
              ? 'text-red-400' 
              : 'text-amber-400'
          : 'text-white'
      }`}>
        {value}
      </p>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
        active
          ? 'bg-gray-900 text-amber-400 border border-gray-700 border-b-gray-900'
          : 'bg-gray-800 text-gray-400 hover:text-gray-300 border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}
